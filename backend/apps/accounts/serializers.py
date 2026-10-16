from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """
    Public and internal serialization of user profile data.
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
        read_only_fields = ["id", "is_active", "created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer handling user registration with strict validation.
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
        read_only_fields = ["id"]

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
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


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
