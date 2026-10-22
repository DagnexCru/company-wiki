from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """
    Public and internal serialization of user profile data.
    Role and active status are strictly read-only to prevent privilege escalation.
    """

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "full_name",
            "role",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "role", "is_active", "created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer handling user registration with strict validation.
    Prevents role escalation: all public registrations are assigned READER role.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "full_name",
            "role",
            "password",
            "confirm_password",
        ]
        read_only_fields = ["id", "role"]

    def validate_email(self, value):
        normalized = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_username(self, value):
        trimmed = value.strip()
        if len(trimmed) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if CustomUser.objects.filter(username__iexact=trimmed).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return trimmed

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Password fields do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        # Enforce Reader role to prevent role escalation attacks
        validated_data["role"] = CustomUser.Role.READER
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Comprehensive user representation for administrative user governance.
    Includes article counts and administrative flags.
    """

    article_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "full_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "article_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_staff",
            "is_superuser",
            "article_count",
            "created_at",
            "updated_at",
        ]


class UserRoleUpdateSerializer(serializers.Serializer):
    """
    Serializer to safely validate role assignments by administrators.
    """

    role = serializers.ChoiceField(
        choices=CustomUser.Role.choices,
        required=True,
        help_text="The new organizational role to assign (ADMIN, AUTHOR, REVIEWER, READER).",
    )


class UserStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer to toggle user active status (activation/deactivation).
    """

    is_active = serializers.BooleanField(
        required=True,
        help_text="Active status of the user account.",
    )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that enriches token response with user profile metadata.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims embedded in token payload
        token["email"] = user.email
        token["username"] = user.username
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user profile data directly to response body
        user_serializer = UserSerializer(self.user)
        data["user"] = user_serializer.data
        return data


class LogoutSerializer(serializers.Serializer):
    """
    Serializer to validate refresh token on logout for blacklisting.
    """

    refresh = serializers.CharField(required=True)


class GoogleAuthSerializer(serializers.Serializer):
    """
    Serializer to validate incoming Google ID token or credential payload.
    Supports either 'credential' (Google Identity Services GIS) or 'id_token'.
    """

    credential = serializers.CharField(required=False, allow_blank=True)
    id_token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        token = attrs.get("credential") or attrs.get("id_token")
        if not token or not token.strip():
            raise serializers.ValidationError("Either 'credential' or 'id_token' is required.")
        attrs["token"] = token.strip()
        return attrs

