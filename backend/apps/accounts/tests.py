from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
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

    def test_registration_prevents_role_escalation(self):
        """Verify an attacker cannot elevate their role to ADMIN during registration."""
        payload = {
            "email": "hacker@company.com",
            "username": "hacker_user",
            "full_name": "Rogue Actor",
            "role": CustomUser.Role.ADMIN,  # Escalation attempt
            "password": "Password123!",
            "confirm_password": "Password123!",
        }
        res = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Verify database persisted role is forced to READER
        created_user = CustomUser.objects.get(email="hacker@company.com")
        self.assertEqual(created_user.role, CustomUser.Role.READER)
        self.assertEqual(res.data["user"]["role"], CustomUser.Role.READER)

    def test_profile_update_prevents_role_escalation(self):
        """Verify regular user cannot elevate their role via PATCH /api/v1/auth/me/."""
        self.client.force_authenticate(user=self.user)
        res = self.client.patch(
            self.me_url,
            {"role": CustomUser.Role.ADMIN, "full_name": "Updated Name"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, CustomUser.Role.AUTHOR)
        self.assertEqual(self.user.full_name, "Updated Name")


class UserManagementRoleTests(TestCase):
    """
    Automated test suite for administrative user governance:
    - Admin-only listing and filtering of users
    - Role changes and self-demotion prevention
    - Account activation/deactivation and self-deactivation prevention
    - Negative permission enforcement for Readers, Authors, and Reviewers
    """

    def setUp(self):
        self.client = APIClient()

        self.admin = CustomUser.objects.create_superuser(
            email="admin@company.com",
            username="admin_lead",
            full_name="Alex Admin",
            role=CustomUser.Role.ADMIN,
            password="AdminPassword123!",
        )

        self.author = CustomUser.objects.create_user(
            email="author@company.com",
            username="sarah_author",
            full_name="Sarah Author",
            role=CustomUser.Role.AUTHOR,
            password="AuthorPassword123!",
        )

        self.reviewer = CustomUser.objects.create_user(
            email="reviewer@company.com",
            username="david_reviewer",
            full_name="David Reviewer",
            role=CustomUser.Role.REVIEWER,
            password="ReviewerPassword123!",
        )

        self.reader = CustomUser.objects.create_user(
            email="reader@company.com",
            username="rachel_reader",
            full_name="Rachel Reader",
            role=CustomUser.Role.READER,
            password="ReaderPassword123!",
        )

        self.users_list_url = "/api/v1/users/"

    def test_reader_cannot_list_users(self):
        """Readers must receive 403 Forbidden when requesting user administration list."""
        self.client.force_authenticate(user=self.reader)
        res = self.client.get(self.users_list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_cannot_list_users(self):
        """Authors must receive 403 Forbidden when requesting user administration list."""
        self.client.force_authenticate(user=self.author)
        res = self.client.get(self.users_list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_cannot_list_users(self):
        """Reviewers must receive 403 Forbidden when requesting user administration list."""
        self.client.force_authenticate(user=self.reviewer)
        res = self.client.get(self.users_list_url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_search_users(self):
        """Administrators can list all users and filter by search query."""
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(self.users_list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        users = res.data.get("results", res.data)
        self.assertEqual(len(users), 4)

        # Test search filter
        search_res = self.client.get(f"{self.users_list_url}?search=sarah")
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        search_users = search_res.data.get("results", search_res.data)
        self.assertEqual(len(search_users), 1)
        self.assertEqual(search_users[0]["email"], "author@company.com")

        # Test role filter
        role_res = self.client.get(f"{self.users_list_url}?role=READER")
        self.assertEqual(role_res.status_code, status.HTTP_200_OK)
        role_users = role_res.data.get("results", role_res.data)
        self.assertEqual(len(role_users), 1)
        self.assertEqual(role_users[0]["email"], "reader@company.com")

    def test_admin_can_update_user_role(self):
        """Administrator can promote Reader to Author via PATCH /api/v1/users/{id}/role/."""
        self.client.force_authenticate(user=self.admin)
        url = f"{self.users_list_url}{self.reader.id}/role/"
        res = self.client.patch(url, {"role": CustomUser.Role.AUTHOR}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.reader.refresh_from_db()
        self.assertEqual(self.reader.role, CustomUser.Role.AUTHOR)

    def test_non_admin_cannot_update_user_role(self):
        """Author cannot change roles of other users."""
        self.client.force_authenticate(user=self.author)
        url = f"{self.users_list_url}{self.reader.id}/role/"
        res = self.client.patch(url, {"role": CustomUser.Role.ADMIN}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.reader.refresh_from_db()
        self.assertEqual(self.reader.role, CustomUser.Role.READER)

    def test_admin_cannot_demote_themselves(self):
        """Administrator cannot demote their own account to prevent lockout."""
        self.client.force_authenticate(user=self.admin)
        url = f"{self.users_list_url}{self.admin.id}/role/"
        res = self.client.patch(url, {"role": CustomUser.Role.READER}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("demote", res.data["error"])
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, CustomUser.Role.ADMIN)

    def test_admin_can_toggle_user_status(self):
        """Administrator can deactivate and reactivate a user account."""
        self.client.force_authenticate(user=self.admin)
        url = f"{self.users_list_url}{self.reader.id}/status/"
        # Deactivate
        res = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.reader.refresh_from_db()
        self.assertFalse(self.reader.is_active)

        # Reactivate
        res_re = self.client.patch(url, {"is_active": True}, format="json")
        self.assertEqual(res_re.status_code, status.HTTP_200_OK)
        self.reader.refresh_from_db()
        self.assertTrue(self.reader.is_active)

    def test_admin_cannot_deactivate_themselves(self):
        """Administrator cannot deactivate their own active account."""
        self.client.force_authenticate(user=self.admin)
        url = f"{self.users_list_url}{self.admin.id}/status/"
        res = self.client.patch(url, {"is_active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deactivate", res.data["error"])
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)


class GoogleAuthTests(APITestCase):
    """
    Test suite for Google OAuth 2.0 authentication and user auto-provisioning.
    """

    def setUp(self):
        self.google_auth_url = reverse("auth-google")
        self.existing_user = CustomUser.objects.create_user(
            email="existing@company.com",
            username="existing_emp",
            full_name="Existing Employee",
            role=CustomUser.Role.AUTHOR,
        )

    def test_google_auth_missing_token(self):
        """Missing token in request returns HTTP 400 Bad Request."""
        res = self.client.post(self.google_auth_url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.accounts.views.verify_google_token")
    def test_google_auth_new_user_provisioning(self, mock_verify):
        """New Google account automatically provisions as READER and returns JWT tokens."""
        mock_verify.return_value = {
            "email": "new.hire@company.com",
            "name": "New Hire",
            "sub": "google-sub-12345",
            "email_verified": True,
        }
        res = self.client.post(
            self.google_auth_url,
            {"credential": "mock-valid-google-id-token"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["is_new_user"])
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["email"], "new.hire@company.com")
        self.assertEqual(res.data["user"]["role"], CustomUser.Role.READER)

        # Verify DB entry
        user = CustomUser.objects.get(email="new.hire@company.com")
        self.assertEqual(user.role, CustomUser.Role.READER)
        self.assertEqual(user.full_name, "New Hire")
        self.assertTrue(user.is_active)

    @patch("apps.accounts.views.verify_google_token")
    def test_google_auth_existing_user_login(self, mock_verify):
        """Existing Google account logs in without altering assigned role."""
        mock_verify.return_value = {
            "email": "existing@company.com",
            "name": "Existing Employee",
            "sub": "google-sub-99999",
            "email_verified": True,
        }
        res = self.client.post(
            self.google_auth_url,
            {"id_token": "mock-valid-google-id-token"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["is_new_user"])
        self.assertEqual(res.data["user"]["role"], CustomUser.Role.AUTHOR)

    @patch("apps.accounts.views.verify_google_token")
    def test_google_auth_deactivated_user_blocked(self, mock_verify):
        """Deactivated accounts are rejected with HTTP 403 Forbidden."""
        self.existing_user.is_active = False
        self.existing_user.save()

        mock_verify.return_value = {
            "email": "existing@company.com",
            "name": "Existing Employee",
            "sub": "google-sub-99999",
            "email_verified": True,
        }
        res = self.client.post(
            self.google_auth_url,
            {"credential": "mock-valid-google-id-token"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("deactivated", res.data["detail"].lower())

    @patch("apps.accounts.views.verify_google_token")
    def test_google_auth_invalid_token_rejected(self, mock_verify):
        """Invalid or expired Google tokens raise HTTP 401 AuthenticationFailed."""
        from rest_framework.exceptions import AuthenticationFailed
        mock_verify.side_effect = AuthenticationFailed("Google token verification failed.")

        res = self.client.post(
            self.google_auth_url,
            {"credential": "mock-invalid-token"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

