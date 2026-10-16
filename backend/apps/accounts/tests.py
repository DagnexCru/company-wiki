from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser


class AccountsAuthenticationTests(TestCase):
    """
    Automated test suite covering:
    - User registration and validation
    - Login and JWT issuance
    - Profile retrieval and route protection
    - Token refresh and logout blacklisting
    """

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.refresh_url = reverse("auth-refresh")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-me")

        self.user_password = "SecurePassword123!"
        self.user = CustomUser.objects.create_user(
            email="author@company.com",
            username="author_user",
            full_name="Sarah Author",
            role=CustomUser.Role.AUTHOR,
            password=self.user_password,
        )

    def test_user_registration_success(self):
        """Verify successful user registration returns 201 with JWT tokens."""
        payload = {
            "email": "newuser@company.com",
            "username": "newuser",
            "full_name": "New Employee",
            "role": CustomUser.Role.READER,
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@company.com")
        self.assertEqual(response.data["user"]["role"], CustomUser.Role.READER)

    def test_user_registration_duplicate_email_fails(self):
        """Verify registration with already registered email returns 400."""
        payload = {
            "email": "author@company.com",  # Duplicate
            "username": "different_username",
            "full_name": "Duplicate Tester",
            "password": "AnotherPassword123!",
            "confirm_password": "AnotherPassword123!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_user_registration_password_mismatch_fails(self):
        """Verify mismatched passwords return 400 validation error."""
        payload = {
            "email": "mismatch@company.com",
            "username": "mismatch_user",
            "password": "PasswordOne123!",
            "confirm_password": "PasswordTwo123!",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_login_success_with_jwt_tokens(self):
        """Verify valid login returns access, refresh tokens, and user metadata."""
        payload = {
            "email": "author@company.com",
            "password": self.user_password,
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "author@company.com")
        self.assertEqual(response.data["user"]["role"], CustomUser.Role.AUTHOR)

    def test_login_invalid_password_fails(self):
        """Verify invalid credentials return 401 Unauthorized."""
        payload = {
            "email": "author@company.com",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_retrieval_authenticated(self):
        """Verify authenticated request with Bearer token retrieves profile."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "author@company.com")
        self.assertEqual(response.data["full_name"], "Sarah Author")
        self.assertEqual(response.data["role"], CustomUser.Role.AUTHOR)

    def test_profile_retrieval_unauthenticated_rejected(self):
        """Verify unauthenticated request without token returns 401 Unauthorized."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_lifecycle(self):
        """Verify refresh token issues a new access token."""
        login_res = self.client.post(
            self.login_url,
            {"email": "author@company.com", "password": self.user_password},
            format="json",
        )
        refresh_token = login_res.data["refresh"]

        refresh_res = self.client.post(
            self.refresh_url, {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)

    def test_logout_blacklists_refresh_token(self):
        """Verify logout blacklists refresh token and blocks subsequent refresh."""
        login_res = self.client.post(
            self.login_url,
            {"email": "author@company.com", "password": self.user_password},
            format="json",
        )
        refresh_token = login_res.data["refresh"]
        access_token = login_res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_res = self.client.post(
            self.logout_url, {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Attempt to refresh with the blacklisted token must fail
        subsequent_refresh = self.client.post(
            self.refresh_url, {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(subsequent_refresh.status_code, status.HTTP_401_UNAUTHORIZED)
