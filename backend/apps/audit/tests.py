from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.audit.models import AuditEvent
from apps.audit.services import log_audit_event, sanitize_audit_details

User = get_user_model()


class AuditTrailTests(TestCase):
    """
    Automated integration tests for the System Audit Trail,
    event logging, credential sanitization, and administrative endpoints.
    """

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email="admin_audit@company.internal",
            username="admin_audit",
            password="SecurePassword123!",
            role=CustomUser.Role.ADMIN,
        )
        self.author = User.objects.create_user(
            email="author_audit@company.internal",
            username="author_audit",
            password="SecurePassword123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.reader = User.objects.create_user(
            email="reader_audit@company.internal",
            username="reader_audit",
            password="SecurePassword123!",
            role=CustomUser.Role.READER,
        )

    def test_sanitize_audit_details_strips_sensitive_keys(self):
        """Sanitization utility strips passwords, tokens, and secrets."""
        raw_details = {
            "username": "jdoe",
            "password": "SuperSecretPassword123!",
            "password_confirm": "SuperSecretPassword123!",
            "token": "jwt-token-string",
            "nested": {
                "refresh": "refresh-token-here",
                "safe_field": "visible_metadata",
            },
        }
        sanitized = sanitize_audit_details(raw_details)
        self.assertEqual(sanitized["username"], "jdoe")
        self.assertEqual(sanitized["password"], "[REDACTED]")
        self.assertEqual(sanitized["password_confirm"], "[REDACTED]")
        self.assertEqual(sanitized["token"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["refresh"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["safe_field"], "visible_metadata")

    def test_log_audit_event_creates_record(self):
        """log_audit_event utility creates persistent AuditEvent record in database."""
        event = log_audit_event(
            action=AuditEvent.Action.ARTICLE_CREATE,
            resource_type="article",
            actor=self.author,
            resource_id="12345",
            resource_name="Test Doc",
            details={"tags": ["django", "test"]},
            ip_address="127.0.0.1",
        )
        self.assertIsNotNone(event)
        self.assertEqual(AuditEvent.objects.count(), 1)
        db_event = AuditEvent.objects.first()
        self.assertEqual(db_event.action, AuditEvent.Action.ARTICLE_CREATE)
        self.assertEqual(db_event.actor, self.author)
        self.assertEqual(db_event.ip_address, "127.0.0.1")

    def test_audit_list_endpoint_restricted_to_admins(self):
        """Only administrators can query the audit trail API."""
        log_audit_event(
            action=AuditEvent.Action.USER_ROLE_CHANGE,
            resource_type="user",
            actor=self.admin,
            resource_name="target_user",
        )

        # Reader forbidden
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get("/api/v1/audit/events/")
        self.assertEqual(res_reader.status_code, status.HTTP_403_FORBIDDEN)

        # Author forbidden
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get("/api/v1/audit/events/")
        self.assertEqual(res_author.status_code, status.HTTP_403_FORBIDDEN)

        # Admin authorized
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get("/api/v1/audit/events/")
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res_admin.data["count"], 1)

    def test_audit_filtering_by_action_and_resource(self):
        """Admin can filter audit events by action and resource type."""
        log_audit_event(action=AuditEvent.Action.ARTICLE_CREATE, resource_type="article", actor=self.author)
        log_audit_event(action=AuditEvent.Action.CATEGORY_CREATE, resource_type="category", actor=self.admin)

        self.client.force_authenticate(user=self.admin)

        # Filter by action
        res_action = self.client.get(f"/api/v1/audit/events/?action={AuditEvent.Action.ARTICLE_CREATE}")
        self.assertEqual(res_action.status_code, status.HTTP_200_OK)
        for item in res_action.data["results"]:
            self.assertEqual(item["action"], AuditEvent.Action.ARTICLE_CREATE)

        # Filter by resource_type
        res_res = self.client.get("/api/v1/audit/events/?resource_type=category")
        self.assertEqual(res_res.status_code, status.HTTP_200_OK)
        for item in res_res.data["results"]:
            self.assertEqual(item["resource_type"], "category")

    def test_audit_summary_endpoint(self):
        """Summary endpoint aggregates audit statistics for the dashboard."""
        log_audit_event(action=AuditEvent.Action.ARTICLE_CREATE, resource_type="article", actor=self.author)
        log_audit_event(action=AuditEvent.Action.ARTICLE_APPROVE, resource_type="article", actor=self.admin)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/audit/events/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn("total_events", data)
        self.assertIn("events_last_24h", data)
        self.assertIn("action_distribution", data)
        self.assertIn("top_actors", data)
        self.assertGreaterEqual(data["total_events"], 2)
