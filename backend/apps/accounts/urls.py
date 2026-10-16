from django.urls import path
from apps.accounts.views import (
    RegisterView,
    CustomLoginView,
    CustomTokenRefreshView,
    LogoutView,
    CurrentUserProfileView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", CustomLoginView.as_view(), name="auth-login"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", CurrentUserProfileView.as_view(), name="auth-me"),
]
