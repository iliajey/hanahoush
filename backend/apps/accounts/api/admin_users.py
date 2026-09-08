"""Super Admin user management API (Phase 11.5).

Security model:
- Every operation requires ``IsSuperAdmin`` (Django superuser OR the
  ``SUPER_ADMIN`` role). No other role may call these endpoints, regardless
  of any other permission it holds.
- Passwords are accepted as write-only input and stored exclusively through
  Django's password hashing (``set_password``). No serializer ever returns a
  password or password hash.
- ``is_superuser`` is never writable through this API.
- No DELETE endpoint exists: deactivation (``is_active``) is the only
  off-boarding mechanism, so accounts cannot be accidentally destroyed.
- Self-lockout protection (see ``AdminUserViewSet``): an administrator cannot
  deactivate themselves, remove their own staff status, or demote their own
  SUPER_ADMIN role; the last active superuser cannot be deactivated either.
"""
import re

from django.contrib.auth import get_user_model, password_validation
from django.db.models import Q
from django.utils import timezone

from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter

from config.api.base.pagination import DefaultPagination
from config.api.base.responses import build_error, build_response

from apps.accounts.models import Permission, Role

from .permissions import IsSuperAdmin
from .serializers import RoleBriefSerializer
from .services import audit
from .throttles import UserRateThrottle

User = get_user_model()

USERNAME_RE = re.compile(r"^[A-Za-z0-9._-]{3,150}$")
USERNAME_ERROR = "Use 3-150 letters, numbers, or . _ - characters."


class AdminRoleSerializer(serializers.ModelSerializer):
    """Role with its full permission list (read-only, Super Admin only)."""

    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["id", "name", "codename", "description", "is_system", "permissions"]

    def get_permissions(self, obj) -> list[dict]:
        return list(
            obj.permissions.order_by("module", "name").values("codename", "name", "module")
        )


class AdminUserSerializer(serializers.ModelSerializer):
    """Read payload for the user-management list/detail.

    Never contains password material of any kind. ``permissions`` mirrors
    the resolution rule used by ``/auth/me/`` (superuser → all codenames).
    """

    role = RoleBriefSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "permissions",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = fields

    def get_permissions(self, obj) -> list[str]:
        if obj.is_superuser:
            return list(Permission.objects.values_list("codename", flat=True))
        if obj.role:
            return list(obj.role.permissions.values_list("codename", flat=True))
        return []


class AdminUserWriteSerializer(serializers.ModelSerializer):
    """Create/update payload for user management.

    ``role`` is assigned by codename from the backend role catalog; clients
    can never invent roles or mutate permission sets directly.
    ``is_superuser`` is intentionally absent — it is never writable here.
    """

    role = serializers.SlugRelatedField(
        slug_field="codename",
        queryset=Role.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "is_active",
            "is_staff",
        ]
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
        }

    def validate_username(self, value):
        username = value.strip()
        if not USERNAME_RE.fullmatch(username):
            raise serializers.ValidationError(USERNAME_ERROR)
        qs = User.objects.filter(username__iexact=username)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        qs = User.objects.filter(email__iexact=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email is already in use.")
        return email

    def validate_phone(self, value):
        if value and not re.fullmatch(r"\+?[0-9]{10,15}", value):
            raise serializers.ValidationError(
                "Enter a valid mobile number (digits only, 10-15, optional leading +)."
            )
        return value


class AdminUserCreateSerializer(AdminUserWriteSerializer):
    """Create payload: adds the write-only password pair."""

    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta(AdminUserWriteSerializer.Meta):
        fields = AdminUserWriteSerializer.Meta.fields + ["password", "confirm_password"]

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("confirm_password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AdminSetPasswordSerializer(serializers.Serializer):
    """Controlled password reset for a managed account (write-only input)."""

    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        password_validation.validate_password(value, getattr(self, "target_user", None))
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


def _is_last_active_superuser(user: User) -> bool:
    return bool(
        user.is_superuser
        and User.objects.filter(is_superuser=True, is_active=True).count() <= 1
    )


class AdminUserViewSet(viewsets.ModelViewSet):
    """Super Admin user management: ``/api/v1/admin/users/``.

    List supports ``?search=`` (username/email/name), ``?role=``,
    ``?is_active=``, ``?is_staff=``, ``?ordering=`` and pagination.

    Extra actions:
    - ``POST {id}/set-password/`` — controlled password reset;
    - ``POST {id}/activate/`` and ``POST {id}/deactivate/``;
    - ``GET roles/`` — role catalog with permissions (permission viewer).

    Self-protection (enforced backend-side, see ``_self_protection_errors``):
    an administrator cannot deactivate themselves, drop their own staff
    status, or demote their own SUPER_ADMIN role; the last active superuser
    cannot be deactivated; ``DELETE`` is disabled entirely.
    """

    permission_classes = [IsSuperAdmin]
    throttle_classes = [UserRateThrottle]
    pagination_class = DefaultPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ["username", "date_joined", "last_login"]
    ordering = ["username"]
    # No DELETE: deactivation is the only off-boarding path.
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    queryset = User.objects.select_related("role").prefetch_related("role__permissions")

    def get_serializer_class(self):
        if self.action == "create":
            return AdminUserCreateSerializer
        if self.action in {"update", "partial_update"}:
            return AdminUserWriteSerializer
        return AdminUserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        search = (params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        role = (params.get("role") or "").strip()
        if role:
            qs = qs.filter(role__codename=role)
        is_active = (params.get("is_active") or "").strip().lower()
        if is_active in {"true", "false"}:
            qs = qs.filter(is_active=(is_active == "true"))
        is_staff = (params.get("is_staff") or "").strip().lower()
        if is_staff in {"true", "false"}:
            qs = qs.filter(is_staff=(is_staff == "true"))
        return qs

    # -- response envelope ---------------------------------------------------
    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.filter_queryset(self.get_queryset()))
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return build_response(
            data=self.get_serializer(self.get_object()).data, request=request
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return build_error(
                "User validation failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )
        user = serializer.save()
        audit("register", request, user.username, user=user, success=True, detail="admin_created")
        return build_response(
            data=AdminUserSerializer(user).data,
            message="User created successfully",
            status_code=status.HTTP_201_CREATED,
            request=request,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return build_error(
                "User validation failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )
        guard_errors = self._self_protection_errors(instance, serializer.validated_data)
        if guard_errors:
            return build_error(
                "Refusing an unsafe self-modification.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=guard_errors,
                request=request,
            )
        user = serializer.save()
        return build_response(
            data=AdminUserSerializer(user).data,
            message="User updated successfully",
            request=request,
        )

    def _self_protection_errors(self, target: User, validated_data: dict) -> dict:
        """Lockout guards for self-modification (empty dict = allowed)."""
        actor = self.request.user
        if target.pk != actor.pk:
            return {}
        errors: dict[str, list[str]] = {}
        if "is_active" in validated_data and not validated_data["is_active"]:
            errors["is_active"] = ["You cannot deactivate your own account."]
        if (
            "is_staff" in validated_data
            and actor.is_staff
            and not validated_data["is_staff"]
        ):
            errors["is_staff"] = ["You cannot remove your own staff status."]
        if actor.is_superuser and "role" in validated_data:
            new_role = validated_data["role"]
            if new_role is None or new_role.codename != "SUPER_ADMIN":
                errors["role"] = ["You cannot demote your own SUPER_ADMIN role."]
        return errors

    # -- extra actions ---------------------------------------------------------
    @extend_schema(request=AdminSetPasswordSerializer)
    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        target = self.get_object()
        serializer = AdminSetPasswordSerializer(data=request.data)
        serializer.target_user = target
        if not serializer.is_valid():
            return build_error(
                "Password validation failed.",
                status_code=status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
                request=request,
            )
        target.set_password(serializer.validated_data["new_password"])
        target.save(update_fields=["password"])
        # Invalidate the target's active sessions after a password reset.
        target.sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        audit(
            "password_change",
            request,
            target.username,
            user=target,
            success=True,
            detail="admin_reset",
        )
        return build_response(message="Password updated successfully", request=request)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        target = self.get_object()
        target.is_active = True
        target.save(update_fields=["is_active"])
        return build_response(
            data=AdminUserSerializer(target).data, message="User activated", request=request
        )

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        target = self.get_object()
        if target.pk == request.user.pk:
            return build_error(
                "You cannot deactivate your own account.",
                status_code=status.HTTP_400_BAD_REQUEST,
                request=request,
            )
        if _is_last_active_superuser(target):
            return build_error(
                "Cannot deactivate the last active superuser.",
                status_code=status.HTTP_400_BAD_REQUEST,
                request=request,
            )
        target.is_active = False
        target.save(update_fields=["is_active"])
        # End the deactivated user's sessions immediately.
        target.sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        return build_response(
            data=AdminUserSerializer(target).data, message="User deactivated", request=request
        )

    @extend_schema(responses={200: AdminRoleSerializer(many=True)})
    @action(detail=False, methods=["get"], url_path="roles")
    def roles(self, request):
        """Role catalog with permissions, for the read-only permission viewer."""
        roles = Role.objects.prefetch_related("permissions").order_by("name")
        return build_response(data=AdminRoleSerializer(roles, many=True).data, request=request)
