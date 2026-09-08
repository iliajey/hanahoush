"""Serializers for the authentication & authorization API."""
import re

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, password_validation
from django.utils.http import urlsafe_base64_decode

from rest_framework import serializers

from apps.accounts.models import Permission, Role

User = get_user_model()


class RoleBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "codename"]


class PermissionBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "module"]


class UserSerializer(serializers.ModelSerializer):
    """Public user payload (also embedded in login/me responses)."""

    role = RoleBriefSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "preferred_language",
            "is_active",
            "is_staff",
            "is_superuser",
            "role",
            "permissions",
            "date_joined",
        ]
        read_only_fields = fields

    def get_permissions(self, obj) -> list[str]:
        if obj.is_superuser:
            return list(Permission.objects.values_list("codename", flat=True))
        if obj.role:
            return list(obj.role.permissions.values_list("codename", flat=True))
        return []


class LoginSerializer(serializers.Serializer):
    """Validates username/password and returns the authenticated user."""

    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    remember_me = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if user is None or not user.is_active:
            raise serializers.ValidationError({"detail": "Invalid credentials."})
        attrs["user"] = user
        return attrs


class RegisterSerializer(serializers.Serializer):
    """Creates a new public account with the safest default role.

    The backend — never the client — decides the initial role (normally
    VIEWER, see ``REGISTRATION_DEFAULT_ROLE``). New registrations are never
    granted staff/superuser status or any privileged role.
    """

    USERNAME_RE = re.compile(r"^[A-Za-z0-9._-]{3,150}$")

    username = serializers.CharField(max_length=150, write_only=True)
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False, write_only=True)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False, write_only=True)
    email = serializers.EmailField(write_only=True)
    phone = serializers.CharField(max_length=20, allow_blank=True, required=False, write_only=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    default_error_messages = {"detail": "Registration failed."}

    def validate_username(self, value):
        username = value.strip()
        if not self.USERNAME_RE.fullmatch(username):
            raise serializers.ValidationError(
                "Use 3-150 letters, numbers, or . _ - characters."
            )
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

    def validate_phone(self, value):
        if value and not re.fullmatch(r"\+?[0-9]{10,15}", value):
            raise serializers.ValidationError(
                "Enter a valid mobile number (digits only, 10-15, optional leading +)."
            )
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        role_codename = getattr(settings, "REGISTRATION_DEFAULT_ROLE", "VIEWER")
        role = Role.objects.filter(codename=role_codename).first()

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            # Never auto-grant staff or superuser to public registrations.
            is_staff=False,
        )
        if role is not None:
            user.role = role
            user.save(update_fields=["role"])
        return user


class LogoutSerializer(serializers.Serializer):
    """Validates the refresh token to be blacklisted on logout."""

    refresh = serializers.CharField()

    def validate_refresh(self, value):
        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import RefreshToken

        try:
            token = RefreshToken(value)
        except TokenError as exc:
            raise serializers.ValidationError("Invalid or expired refresh token.") from exc
        return token


class RefreshInSerializer(serializers.Serializer):
    """Validates the refresh token used to rotate access/refresh tokens."""

    refresh = serializers.CharField()

    def validate_refresh(self, value):
        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import RefreshToken

        try:
            return RefreshToken(value)
        except TokenError as exc:
            raise serializers.ValidationError("Invalid or expired refresh token.") from exc


class ProfileSerializer(serializers.ModelSerializer):
    """Updates the authenticated user's profile fields."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone", "preferred_language"]

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk if self.instance else None)
        if qs.exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Your current password is incorrect."})
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        password_validation.validate_password(attrs["new_password"], user)
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        try:
            uid = urlsafe_base64_decode(attrs["uid"]).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as exc:
            raise serializers.ValidationError({"uid": "Invalid reset link."}) from exc

        from django.contrib.auth.tokens import default_token_generator

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})
        password_validation.validate_password(attrs["new_password"], user)
        attrs["user"] = user
        return attrs


class RoleSerializer(serializers.ModelSerializer):
    permission_count = serializers.IntegerField(source="permissions.count", read_only=True)

    class Meta:
        model = Role
        fields = ["id", "name", "codename", "description", "is_system", "permission_count"]


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "module", "description"]
