"""Serializers for the authentication & authorization API."""
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
