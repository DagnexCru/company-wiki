from django.db.models import Count, Q
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdminUser
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    AdminUserSerializer,
    UserRoleUpdateSerializer,
    UserStatusUpdateSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
)
from apps.audit.models import AuditEvent
from apps.audit.services import log_audit_event


class RegisterView(generics.CreateAPIView):
    """
    Register a new internal user account.
    POST /api/v1/auth/register/
    """

    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens immediately upon registration
        refresh = RefreshToken.for_user(user)
        refresh["email"] = user.email
        refresh["username"] = user.username
        refresh["role"] = user.role
        refresh["full_name"] = user.full_name

        user_data = UserSerializer(user).data

        log_audit_event(
            action=AuditEvent.Action.USER_REGISTER,
            resource_type="user",
            actor=user,
            resource_id=user.id,
            resource_name=user.username,
            details={"email": user.email, "role": user.role},
            request=request,
        )

        return Response(
            {
                "message": "User account registered successfully.",
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class CustomLoginView(TokenObtainPairView):
    """
    Authenticate user with email and password, returning JWT access & refresh tokens.
    POST /api/v1/auth/login/
    """

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user = CustomUser.objects.filter(email=request.data.get("email")).first()
            if user:
                log_audit_event(
                    action=AuditEvent.Action.AUTH_LOGIN,
                    resource_type="auth",
                    actor=user,
                    resource_id=user.id,
                    resource_name=user.username,
                    details={"email": user.email, "role": user.role},
                    request=request,
                )
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh an expired access token using a valid refresh token.
    POST /api/v1/auth/refresh/
    """

    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    Blacklist the submitted refresh token to securely terminate the session.
    POST /api/v1/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh_token = serializer.validated_data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_audit_event(
                action=AuditEvent.Action.AUTH_LOGOUT,
                resource_type="auth",
                actor=request.user,
                resource_id=request.user.id,
                resource_name=request.user.username,
                details={},
                request=request,
            )
            return Response(
                {"message": "Logged out successfully. Token has been blacklisted."},
                status=status.HTTP_200_OK,
            )
        except TokenError as e:
            return Response(
                {"error": "Invalid or expired token.", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's profile.
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Administrative API ViewSet for inspecting and governing user accounts,
    roles, and activation statuses. Strictly restricted to Administrators.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminUserSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = CustomUser.objects.annotate(article_count=Count("articles")).order_by(
            "-created_at"
        )

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(username__icontains=search)
                | Q(full_name__icontains=search)
            )

        role = self.request.query_params.get("role", "").strip()
        if role and role in CustomUser.Role.values:
            queryset = queryset.filter(role=role)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            if str(is_active).lower() in ["true", "1"]:
                queryset = queryset.filter(is_active=True)
            elif str(is_active).lower() in ["false", "0"]:
                queryset = queryset.filter(is_active=False)

        return queryset

    @action(detail=True, methods=["patch"], url_path="role")
    def update_role(self, request, id=None):
        """
        Assign a new role to a user.
        PATCH /api/v1/users/{id}/role/
        Payload: {"role": "AUTHOR"}
        """
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_role = serializer.validated_data["role"]

        # Prevent Administrator from demoting themselves to prevent accidental lockout
        if user == request.user and new_role != CustomUser.Role.ADMIN:
            return Response(
                {"error": "Administrators cannot demote their own account to prevent lockout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_role = user.role
        user.role = new_role
        user.save(update_fields=["role", "updated_at"])

        log_audit_event(
            action=AuditEvent.Action.USER_ROLE_CHANGE,
            resource_type="user",
            actor=request.user,
            resource_id=user.id,
            resource_name=user.username,
            details={"old_role": old_role, "new_role": new_role},
            request=request,
        )

        return Response(
            {
                "message": f"Successfully updated role for {user.email} to {user.role}.",
                "user": AdminUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, id=None):
        """
        Activate or deactivate a user account.
        PATCH /api/v1/users/{id}/status/
        Payload: {"is_active": false}
        """
        user = self.get_object()
        serializer = UserStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        is_active = serializer.validated_data["is_active"]

        # Prevent Administrator from deactivating their own account
        if user == request.user and not is_active:
            return Response(
                {"error": "Administrators cannot deactivate their own active account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = is_active
        user.save(update_fields=["is_active", "updated_at"])

        log_audit_event(
            action=AuditEvent.Action.USER_STATUS_CHANGE,
            resource_type="user",
            actor=request.user,
            resource_id=user.id,
            resource_name=user.username,
            details={"is_active": is_active},
            request=request,
        )

        status_text = "activated" if is_active else "deactivated"
        return Response(
            {
                "message": f"Successfully {status_text} account for {user.email}.",
                "user": AdminUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

