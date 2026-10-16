from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class HealthCheckAPITests(TestCase):
    """
    Automated test suite for the /api/v1/health/ endpoint.
    Verifies response structure, non-disclosure of secrets, and public accessibility.
    """

    def setUp(self):
        self.client = APIClient()
        self.health_url = reverse("api-health-check")

    def test_health_check_url_resolves_and_responds(self):
        """Verify GET /api/v1/health/ returns a valid HTTP response."""
        response = self.client.get(self.health_url)
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE],
        )

    def test_health_check_payload_structure(self):
        """Verify response contains required status and service indicators."""
        response = self.client.get(self.health_url)
        data = response.json()

        self.assertIn("status", data)
        self.assertIn(data["status"], ["healthy", "degraded"])
        self.assertIn("timestamp", data)
        self.assertEqual(data.get("version"), "1.0.0")
        self.assertEqual(data.get("environment"), "development")
        self.assertIn("services", data)
        self.assertIn("api", data["services"])
        self.assertEqual(data["services"]["api"], "operational")
        self.assertIn("database", data["services"])

    def test_health_check_does_not_leak_secrets(self):
        """Verify sensitive credentials are never exposed in the health response."""
        response = self.client.get(self.health_url)
        content_str = response.content.decode("utf-8").lower()

        forbidden_keys = [
            "password",
            "secret_key",
            "postgres",
            "localhost",
            "token",
            "credential",
        ]
        for key in forbidden_keys:
            self.assertNotIn(
                key,
                content_str,
                f"Health check must not expose internal sensitive value: {key}",
            )
