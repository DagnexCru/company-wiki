from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article
from apps.taxonomy.models import Category, Tag
from apps.audit.models import AuditEvent
from apps.audit.services import log_audit_event


class DashboardAPITests(TestCase):
    """
    Automated test suite for Phase 9: Role-Aware Dashboard & Content Discovery.
    Validates accurate telemetry calculations, role-scoping invariants,
    and strict negative security boundaries preventing unauthorized data disclosure.
    """

    def setUp(self):
        self.client = APIClient()

        # Create user accounts for each role
        self.admin_user = CustomUser.objects.create_superuser(
            username="dash_admin",
            email="admin@dashboard.test",
            password="TestPassword123!",
            role=CustomUser.Role.ADMIN,
            full_name="Admin Director",
        )

        self.author_alice = CustomUser.objects.create_user(
            username="dash_alice",
            email="alice@dashboard.test",
            password="TestPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="Alice Author",
        )

        self.author_bob = CustomUser.objects.create_user(
            username="dash_bob",
            email="bob@dashboard.test",
            password="TestPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="Bob Author",
        )

        self.reviewer_user = CustomUser.objects.create_user(
            username="dash_reviewer",
            email="reviewer@dashboard.test",
            password="TestPassword123!",
            role=CustomUser.Role.REVIEWER,
            full_name="Rachel Reviewer",
        )

        self.reader_user = CustomUser.objects.create_user(
            username="dash_reader",
            email="reader@dashboard.test",
            password="TestPassword123!",
            role=CustomUser.Role.READER,
            full_name="Ron Reader",
        )

        # Create categories
        self.eng_category = Category.objects.create(
            name="Engineering Systems",
            slug="engineering-systems",
            description="Core engineering guides",
        )
        self.ops_category = Category.objects.create(
            name="DevOps & Infrastructure",
            slug="devops-infra",
            description="Deployment and cloud operations",
        )
        self.empty_category = Category.objects.create(
            name="Archived Policies",
            slug="archived-policies",
            description="Categories without published articles",
        )

        # Create articles across various statuses
        self.pub_article_1 = Article.objects.create(
            title="Kubernetes Architecture Guide",
            summary="Production cluster configuration",
            content="Detailed k8s setup...",
            author=self.author_alice,
            category=self.ops_category,
            status=Article.Status.PUBLISHED,
            is_featured=True,
        )

        self.pub_article_2 = Article.objects.create(
            title="PostgreSQL Indexing Best Practices",
            summary="Optimizing query performance",
            content="Indexing strategies for high throughput...",
            author=self.author_bob,
            category=self.eng_category,
            status=Article.Status.PUBLISHED,
            is_featured=True,
        )

        self.alice_draft = Article.objects.create(
            title="Alice Private Work-in-Progress",
            summary="Unpublished technical notes",
            content="Confidential WIP notes...",
            author=self.author_alice,
            category=self.eng_category,
            status=Article.Status.DRAFT,
        )

        self.bob_draft = Article.objects.create(
            title="Bob Private Draft",
            summary="Secret draft notes",
            content="Not ready for review...",
            author=self.author_bob,
            category=self.ops_category,
            status=Article.Status.DRAFT,
        )

        self.in_review_article_1 = Article.objects.create(
            title="Microservices Security Checklist",
            summary="Submitted for review",
            content="Security checklist...",
            author=self.author_alice,
            category=self.eng_category,
            status=Article.Status.IN_REVIEW,
        )

        self.in_review_article_2 = Article.objects.create(
            title="OAuth2 Token Refresh Lifecycle",
            summary="Pending editorial review",
            content="Token flow breakdown...",
            author=self.author_bob,
            category=self.ops_category,
            status=Article.Status.IN_REVIEW,
        )

        self.rejected_article = Article.objects.create(
            title="Legacy Monolith Deprecation",
            summary="Rejected submission needing updates",
            content="Deprecation proposal...",
            author=self.author_alice,
            category=self.eng_category,
            status=Article.Status.REJECTED,
        )

        self.archived_article = Article.objects.create(
            title="Old Python 2 Migration Plan",
            summary="Historical archive",
            content="Completed years ago...",
            author=self.admin_user,
            category=self.eng_category,
            status=Article.Status.ARCHIVED,
        )

        # Log sample audit event
        log_audit_event(
            action=AuditEvent.Action.ARTICLE_CREATE,
            resource_type="article",
            actor=self.author_alice,
            resource_id=self.alice_draft.id,
            resource_name=self.alice_draft.title,
            details={"status": "draft"},
        )

        self.dashboard_url = "/api/v1/dashboard/"
        self.article_dashboard_url = "/api/v1/articles/dashboard/"

    def test_unauthenticated_request_rejected(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reader_dashboard_scoping_and_privacy(self):
        """
        Reader receives public published documentation metrics, but is strictly
        prevented from receiving author drafts, review queue, or administrative telemetry.
        """
        self.client.force_authenticate(user=self.reader_user)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["role"], CustomUser.Role.READER)
        self.assertEqual(data["total_published_articles"], 2)
        self.assertEqual(len(data["recent_published_articles"]), 2)

        # Only categories with published articles appear in distribution
        cat_slugs = [c["slug"] for c in data["category_distribution"]]
        self.assertIn("engineering-systems", cat_slugs)
        self.assertIn("devops-infra", cat_slugs)
        self.assertNotIn("archived-policies", cat_slugs)

        # Strict security boundaries: Reader must NOT see internal workload fields
        self.assertIsNone(data["author_metrics"])
        self.assertIsNone(data["my_recent_drafts"])
        self.assertIsNone(data["reviewer_metrics"])
        self.assertIsNone(data["pending_review_articles"])
        self.assertIsNone(data["admin_metrics"])

    def test_author_dashboard_personal_workload_scoping(self):
        """
        Author receives personal draft/review metrics, but cannot see other authors'
        drafts, review queue, or admin stats.
        """
        self.client.force_authenticate(user=self.author_alice)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["role"], CustomUser.Role.AUTHOR)
        self.assertEqual(data["total_published_articles"], 2)

        # Author metrics scoped specifically to Alice
        self.assertIsNotNone(data["author_metrics"])
        self.assertEqual(data["author_metrics"]["my_drafts_count"], 1)  # alice_draft
        self.assertEqual(data["author_metrics"]["my_in_review_count"], 1)  # in_review_article_1
        self.assertEqual(data["author_metrics"]["my_rejected_count"], 1)  # rejected_article
        self.assertEqual(data["author_metrics"]["my_published_count"], 1)  # pub_article_1

        # Recent drafts must only include Alice's items (draft and rejected)
        draft_titles = [d["title"] for d in data["my_recent_drafts"]]
        self.assertIn("Alice Private Work-in-Progress", draft_titles)
        self.assertIn("Legacy Monolith Deprecation", draft_titles)
        self.assertNotIn("Bob Private Draft", draft_titles)

        # Author cannot access reviewer or admin stats
        self.assertIsNone(data["reviewer_metrics"])
        self.assertIsNone(data["pending_review_articles"])
        self.assertIsNone(data["admin_metrics"])

    def test_reviewer_dashboard_queue_scoping(self):
        """
        Reviewer receives review queue counts and pending submissions, but not admin metrics.
        """
        self.client.force_authenticate(user=self.reviewer_user)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["role"], CustomUser.Role.REVIEWER)
        self.assertEqual(data["total_published_articles"], 2)

        # Reviewer metrics
        self.assertIsNotNone(data["reviewer_metrics"])
        self.assertEqual(data["reviewer_metrics"]["pending_reviews_count"], 2)

        # Pending review articles
        pending_titles = [a["title"] for a in data["pending_review_articles"]]
        self.assertEqual(len(pending_titles), 2)
        self.assertIn("Microservices Security Checklist", pending_titles)
        self.assertIn("OAuth2 Token Refresh Lifecycle", pending_titles)

        # Reviewer cannot access system admin metrics
        self.assertIsNone(data["admin_metrics"])

    def test_administrator_dashboard_full_telemetry(self):
        """
        Administrator receives comprehensive organization-wide telemetry across all models.
        """
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.dashboard_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["role"], CustomUser.Role.ADMIN)

        # Admin metrics populated
        admin_stats = data["admin_metrics"]
        self.assertIsNotNone(admin_stats)
        self.assertEqual(admin_stats["total_articles"], 8)
        self.assertEqual(admin_stats["published_count"], 2)
        self.assertEqual(admin_stats["draft_count"], 2)
        self.assertEqual(admin_stats["in_review_count"], 2)
        self.assertEqual(admin_stats["rejected_count"], 1)
        self.assertEqual(admin_stats["archived_count"], 1)

        self.assertGreaterEqual(admin_stats["total_users_count"], 5)
        self.assertEqual(admin_stats["total_categories_count"], 3)
        self.assertGreaterEqual(admin_stats["audit_events_24h_count"], 1)
        self.assertGreaterEqual(len(admin_stats["recent_activity"]), 1)

        # Admin also has access to author and reviewer queues
        self.assertIsNotNone(data["reviewer_metrics"])
        self.assertEqual(data["reviewer_metrics"]["pending_reviews_count"], 2)
        self.assertIsNotNone(data["author_metrics"])

    def test_articles_dashboard_alias_endpoint(self):
        """Verify GET /api/v1/articles/dashboard/ serves the identical dashboard payload."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.article_dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], CustomUser.Role.ADMIN)
        self.assertIsNotNone(response.data["admin_metrics"])
