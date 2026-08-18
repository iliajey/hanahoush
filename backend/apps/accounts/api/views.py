"""Authentication & authorization views."""
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from config.api.base.responses import build_error, build_response

from apps.accounts.models import Permission, Role

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PermissionSerializer,
    ProfileSerializer,
    RefreshInSerializer,
    RoleSerializer,
    UserSerializer,
)
from .services import (
    audit,
    clear_login_attempts,
    create_session,
    is_account_locked,
    record_login_attempt,
    revoke_session,
    touch_session,
)
from .throttles import (
    LoginRateThrottle,
    PasswordResetRateThrottle,
    RefreshRateThrottle,
    UserRateThrottle,
)

User = get_user_model()


class AuthAPIView(APIView):
    """Base view for the auth API.

    Versioning is expressed in the URL path (/api/v1/...); disabling DRF's
    NamespaceVersioning keeps drf-spectacular schema generation working.
    """

    versioning_class = None


def _short_lifetime() -> timedelta:
    """Refresh lifetime used when "remember me" is off."""
    return timedelta(days=settings.AUTH_SHORT_SESSION_DAYS)


@extend_schema(
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(description="Access + refresh tokens and user payload"),
        401: OpenApiResponse(description="Invalid credentials"),
        429: OpenApiResponse(description="Account temporarily locked (rate limit)"),
    },
)
class LoginView(AuthAPIView):
    """POST /auth/login — authenticate and issue access + refresh tokens."""

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        username = (request.data.get("username") or "").strip()

        remaining = is_account_locked(username, request)
        if remaining:
            audit("login_failed", request, username, success=False, detail="account_locked")
            return build_error(
                f"Too many failed attempts. Try again in {remaining} seconds.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                request=request,
            )

        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            record_login_attempt(username, request, success=False)
            audit("login_failed", request, username, success=False, detail="bad_credentials")
            return build_error(
                "Invalid credentials.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                errors=serializer.errors,
                request=request,
            )

        user = serializer.validated_data["user"]
        remember_me = serializer.validated_data.get("remember_me", False)
        clear_login_attempts(username)

        refresh = RefreshToken.for_user(user)
        if not remember_me:
            refresh.set_exp(lifetime=_short_lifetime())

        create_session(user, refresh, request, remember_me=remember_me)
        audit("login", request, user.username, user=user, success=True)

        return build_response(
            data={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            message="Login successful",
            status_code=status.HTTP_200_OK,
            request=request,
        )


@extend_schema(
    request=RefreshInSerializer,
    responses={200: OpenApiResponse(description="Rotated access (+ refresh) tokens")},
)
class RefreshView(TokenRefreshView):
    """POST /auth/refresh — rotate access/refresh tokens (blacklists old)."""

    versioning_class = None

    permission_classes = [AllowAny]
    throttle_classes = [RefreshRateThrottle]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.data.get("refresh")
        user = None
        incoming_jti = None
        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                incoming_jti = token.payload.get("jti")
                user_id = token.payload.get("user_id")
                user = User.objects.filter(pk=user_id).first() if user_id else None
            except Exception:
                pass

        response = super().post(request, *args, **kwargs)
        if response.status_code not in (200, 201):
            return build_error(
                "Refresh token is invalid or expired.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                request=request,
            )

        if user and incoming_jti:
            touch_session(incoming_jti, user)
            audit("refresh", request, user.username, user=user, success=True)

        return build_response(data=response.data, message="Token refreshed", request=request)


@extend_schema(
    request=LogoutSerializer,
    responses={200: OpenApiResponse(description="Logout successful")},
)
class LogoutView(AuthAPIView):
    """POST /auth/logout — blacklist the refresh token and revoke the session."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if not serializer.is_valid():
            return build_error(
                "Invalid refresh token.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )

        token = serializer.validated_data["refresh"]
        try:
            token.blacklist()
        except Exception:
            pass  # token may already be blacklisted — idempotent logout

        revoke_session(token)
        audit("logout", request, request.user.username, user=request.user, success=True)
        return build_response(message="Logged out successfully", request=request)


@extend_schema(responses={200: UserSerializer})
class MeView(AuthAPIView):
    """GET /auth/me — current user with role and permissions."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        return build_response(data=UserSerializer(request.user).data, request=request)


@extend_schema(
    responses={200: UserSerializer},
    request=ProfileSerializer,
)
class ProfileView(AuthAPIView):
    """GET/PATCH /auth/profile — read and update own profile."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        return build_response(data=UserSerializer(request.user).data, request=request)

    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return build_error(
                "Profile validation failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )
        serializer.save()
        return build_response(
            data=UserSerializer(request.user).data,
            message="Profile updated",
            request=request,
        )


@extend_schema(
    request=ChangePasswordSerializer,
    responses={200: OpenApiResponse(description="Password changed successfully")},
)
class ChangePasswordView(AuthAPIView):
    """POST /auth/change-password — change the current user's password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return build_error(
                "Password change failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        # Invalidate the user's other sessions after a password change.
        user.sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        audit("password_change", request, user.username, user=user, success=True)
        return build_response(message="Password changed successfully", request=request)


@extend_schema(
    request=PasswordResetRequestSerializer,
    responses={200: OpenApiResponse(description="Reset link sent (if account exists)")},
)
class PasswordResetRequestView(AuthAPIView):
    """POST /auth/password-reset — send a reset link (never reveals existence)."""

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return build_error(
                "Invalid email.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )

        email = serializer.validated_data["email"].lower()
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            user = None

        if user is not None:
            from django.contrib.auth.tokens import default_token_generator

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                "Password reset",
                f"Reset your password: {reset_url}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True,
            )
            audit("password_reset", request, user.username, user=user, success=True)

        # Always return the same response to avoid user enumeration.
        return build_response(
            message="If an account exists with that email, a reset link has been sent.",
            request=request,
        )


@extend_schema(
    request=PasswordResetConfirmSerializer,
    responses={200: OpenApiResponse(description="Password reset successfully")},
)
class PasswordResetConfirmView(AuthAPIView):
    """POST /auth/password-reset/confirm — set a new password with a token."""

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return build_error(
                "Password reset failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )

        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        user.sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        audit("password_reset", request, user.username, user=user, success=True)
        return build_response(message="Password reset successfully", request=request)


class RoleViewSet(ReadOnlyModelViewSet):
    """GET /auth/roles — list available roles."""

    versioning_class = None

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    filterset_fields = ["is_system"]


class PermissionViewSet(ReadOnlyModelViewSet):
    """GET /auth/permissions — list available permissions."""

    versioning_class = None

    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    filterset_fields = ["module"]
