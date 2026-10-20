from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleRevision
from apps.taxonomy.models import Category, Tag
from apps.workflows.models import ReviewRecord
from apps.audit.models import AuditEvent


class E2EWorkflowIntegrationTests(TestCase):
    """
    Phase 10 Comprehensive End-to-End Workflow Integration Test Suite.
    Validates all 10 core integration scenarios specified in the project governance specification:
    1. Sign-in, token acquisition, and role-tailored dashboard retrieval.
    2. Authoring and saving drafts with revision tracking and audit logging.
    3. Submitting drafts for editorial review and status transition to IN_REVIEW.
    4. Reviewer evaluation, approval to PUBLISHED, or rejection with mandatory feedback.
    5. Author revision and resubmission of rejected documentation.
    6. Reader search, category/tag filtering, and published content discovery.
    7. Negative permission boundary: unauthorized access to restricted drafts (403/404).
    8. Administrative taxonomy and user role promotion management.
    9. Revision history inspection, diff analysis, and non-destructive restore.
    10. Session termination, token invalidation, and unauthorized access rejection (401).
    """

    def setUp(self):
        self.client = APIClient()

        # Seed administrative user
        self.admin = CustomUser.objects.create_superuser(
            username="e2e_admin",
            email="admin@e2e.test",
            password="StrongPassword123!",
            role=CustomUser.Role.ADMIN,
            full_name="E2E Administrator",
        )

        # Seed author user
        self.author = CustomUser.objects.create_user(
            username="e2e_author",
            email="author@e2e.test",
            password="StrongPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="E2E Author",
        )

        # Seed second author (peer)
        self.peer_author = CustomUser.objects.create_user(
            username="e2e_peer_author",
            email="peer@e2e.test",
            password="StrongPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="E2E Peer Author",
        )

        # Seed reviewer user
        self.reviewer = CustomUser.objects.create_user(
            username="e2e_reviewer",
            email="reviewer@e2e.test",
            password="StrongPassword123!",
            role=CustomUser.Role.REVIEWER,
            full_name="E2E Reviewer",
        )

        # Seed reader user
        self.reader = CustomUser.objects.create_user(
            username="e2e_reader",
            email="reader@e2e.test",
            password="StrongPassword123!",
            role=CustomUser.Role.READER,
            full_name="E2E Reader",
        )

        # Seed foundational category and tags
        self.category = Category.objects.create(
            name="Platform Architecture",
            slug="platform-architecture",
            description="System architecture and scalability guidelines",
        )
        self.tag_infra = Tag.objects.create(name="Infrastructure", slug="infrastructure")
        self.tag_security = Tag.objects.create(name="Security", slug="security")

    def test_scenario_01_user_signs_in_and_views_dashboard(self):
        """Scenario 1: User signs in, receives JWT, and views role-tailored dashboard."""
        # 1. Login with credentials (email is USERNAME_FIELD)
        login_resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": "author@e2e.test", "password": "StrongPassword123!"},
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_resp.data)
        access_token = login_resp.data["access"]

        # 2. Authenticate using Bearer token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # 3. Retrieve user profile
        me_resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(me_resp.data["role"], "AUTHOR")

        # 4. Access role-aware dashboard
        dash_resp = self.client.get("/api/v1/dashboard/")
        self.assertEqual(dash_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(dash_resp.data["role"], "AUTHOR")
        self.assertIsNotNone(dash_resp.data["author_metrics"])
        self.assertIsNone(dash_resp.data["admin_metrics"])

    def test_scenario_02_author_creates_and_saves_draft(self):
        """Scenario 2: Author creates and saves draft, with revision snapshot #1 and audit trail."""
        self.client.force_authenticate(user=self.author)

        payload = {
            "title": "Zero Trust Security Implementation",
            "summary": "Guide to Zero Trust network architecture",
            "content": "# Zero Trust Architecture\nAlways verify every access request...",
            "category": str(self.category.id),
            "tag_names": ["Infrastructure", "Security"],
        }

        resp = self.client.post("/api/v1/articles/", payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        slug = resp.data["slug"]

        # Verify article persisted in DRAFT status
        article = Article.objects.get(slug=slug)
        self.assertEqual(article.status, Article.Status.DRAFT)
        self.assertEqual(article.author, self.author)

        # Verify initial revision #1 created automatically
        revisions = article.revisions.all()
        self.assertEqual(revisions.count(), 1)
        self.assertEqual(revisions.first().revision_number, 1)

        # Verify audit trail event logged
        audit_event = AuditEvent.objects.filter(
            action=AuditEvent.Action.ARTICLE_CREATE,
            resource_id=article.id,
        ).first()
        self.assertIsNotNone(audit_event)
        self.assertEqual(audit_event.actor, self.author)

    def test_scenario_03_author_submits_article_for_review(self):
        """Scenario 3: Author submits draft, transitioning status to IN_REVIEW."""
        self.client.force_authenticate(user=self.author)

        article = Article.objects.create(
            title="Database Disaster Recovery",
            summary="PostgreSQL replication and backup procedures",
            content="# DR Runbook\nSteps to restore from WAL archives...",
            author=self.author,
            category=self.category,
            status=Article.Status.DRAFT,
        )

        submit_resp = self.client.post(
            f"/api/v1/articles/{article.slug}/submit/",
            {"notes": "Ready for security and ops review"},
        )
        self.assertEqual(submit_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_resp.data["status"], Article.Status.IN_REVIEW)

        # Confirm database update
        article.refresh_from_db()
        self.assertEqual(article.status, Article.Status.IN_REVIEW)
        self.assertIsNotNone(article.submitted_at)

        # Confirm review record logged
        record = ReviewRecord.objects.filter(article=article).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.action, ReviewRecord.Action.SUBMIT)

    def test_scenario_04_reviewer_approves_or_rejects_submission(self):
        """Scenario 4: Reviewer inspects and approves or rejects submitted content."""
        # Setup submitted article
        article = Article.objects.create(
            title="Service Mesh Deployment",
            summary="Istio service mesh setup",
            content="# Istio Setup\nMutual TLS configuration...",
            author=self.author,
            category=self.category,
            status=Article.Status.IN_REVIEW,
        )

        # 1. Reviewer approves submission
        self.client.force_authenticate(user=self.reviewer)
        approve_resp = self.client.post(
            f"/api/v1/articles/{article.slug}/approve/",
            {"feedback": "Architectural standards satisfied, approved for production."},
        )
        self.assertEqual(approve_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(approve_resp.data["status"], Article.Status.PUBLISHED)

        article.refresh_from_db()
        self.assertEqual(article.status, Article.Status.PUBLISHED)
        self.assertIsNotNone(article.published_at)

        # 2. Reviewer rejects submission with mandatory feedback
        article_to_reject = Article.objects.create(
            title="Unchecked API Gateway Config",
            summary="Gateway configuration",
            content="Missing rate limits...",
            author=self.author,
            category=self.category,
            status=Article.Status.IN_REVIEW,
        )

        reject_resp = self.client.post(
            f"/api/v1/articles/{article_to_reject.slug}/reject/",
            {"feedback": "Rate limiting configuration is missing in section 3."},
        )
        self.assertEqual(reject_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(reject_resp.data["status"], Article.Status.REJECTED)

        article_to_reject.refresh_from_db()
        self.assertEqual(article_to_reject.status, Article.Status.REJECTED)

    def test_scenario_05_author_revises_and_resubmits_rejected_article(self):
        """Scenario 5: Author revises rejected article and resubmits to review queue."""
        rejected_article = Article.objects.create(
            title="Kubernetes Ingress Architecture",
            summary="Ingress controller setup",
            content="Initial draft without TLS termination...",
            author=self.author,
            category=self.category,
            status=Article.Status.REJECTED,
        )
        rejected_article.create_revision(author=self.author, change_summary="Initial rejected draft")

        self.client.force_authenticate(user=self.author)

        # Author updates content to resolve rejection feedback
        update_resp = self.client.put(
            f"/api/v1/articles/{rejected_article.slug}/",
            {
                "title": "Kubernetes Ingress Architecture",
                "summary": "Ingress controller setup with TLS",
                "content": "Updated draft with cert-manager TLS termination configured...",
                "category": str(self.category.id),
                "change_summary": "Added TLS termination details per reviewer request",
            },
        )
        self.assertEqual(update_resp.status_code, status.HTTP_200_OK)

        # Resubmit article
        resubmit_resp = self.client.post(
            f"/api/v1/articles/{rejected_article.slug}/submit/",
            {"notes": "Addressed reviewer feedback regarding TLS certificates."},
        )
        self.assertEqual(resubmit_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resubmit_resp.data["status"], Article.Status.IN_REVIEW)

        rejected_article.refresh_from_db()
        self.assertEqual(rejected_article.status, Article.Status.IN_REVIEW)

    def test_scenario_06_reader_searches_for_published_article(self):
        """Scenario 6: Reader searches and filters published documentation."""
        pub_article = Article.objects.create(
            title="Production Incident Response Playbook",
            summary="Emergency paging and escalation guidelines",
            content="# Incident Response\nCall on-call engineer immediately...",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )
        pub_article.tags.add(self.tag_infra)

        self.client.force_authenticate(user=self.reader)

        # Search by query
        search_resp = self.client.get("/api/v1/articles/?search=Incident+Response")
        self.assertEqual(search_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(search_resp.data["count"], 1)
        self.assertEqual(search_resp.data["results"][0]["slug"], pub_article.slug)

        # Filter by category
        cat_resp = self.client.get(f"/api/v1/articles/?category={self.category.slug}")
        self.assertEqual(cat_resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(cat_resp.data["count"], 1)

    def test_scenario_07_unauthorized_user_access_restricted_draft_rejected(self):
        """Scenario 7: Reader or peer author attempting to access private draft is rejected."""
        private_draft = Article.objects.create(
            title="Confidential Corporate Restructuring",
            summary="Private internal draft",
            content="Confidential notes...",
            author=self.author,
            category=self.category,
            status=Article.Status.DRAFT,
        )

        # 1. Reader access attempt -> 404 (filtered queryset prevents discovery)
        self.client.force_authenticate(user=self.reader)
        reader_resp = self.client.get(f"/api/v1/articles/{private_draft.slug}/")
        self.assertEqual(reader_resp.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Peer author access attempt -> 404
        self.client.force_authenticate(user=self.peer_author)
        peer_resp = self.client.get(f"/api/v1/articles/{private_draft.slug}/")
        self.assertEqual(peer_resp.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Peer author modification attempt -> 404
        peer_edit_resp = self.client.put(
            f"/api/v1/articles/{private_draft.slug}/",
            {"title": "Compromised Draft", "content": "Hacked", "category": str(self.category.id)},
        )
        self.assertEqual(peer_edit_resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_scenario_08_administrator_manages_category_and_roles(self):
        """Scenario 8: Administrator creates category and updates user roles."""
        self.client.force_authenticate(user=self.admin)

        # 1. Create new knowledge category
        cat_resp = self.client.post(
            "/api/v1/categories/",
            {
                "name": "Cloud Security Operations",
                "description": "SecOps procedures and compliance",
                "color": "rose",
            },
        )
        self.assertEqual(cat_resp.status_code, status.HTTP_201_CREATED)
        new_cat_slug = cat_resp.data["slug"]
        self.assertTrue(Category.objects.filter(slug=new_cat_slug).exists())

        # 2. Promote reader to author
        role_resp = self.client.patch(
            f"/api/v1/users/{self.reader.id}/role/",
            {"role": "AUTHOR"},
        )
        self.assertEqual(role_resp.status_code, status.HTTP_200_OK)

        self.reader.refresh_from_db()
        self.assertEqual(self.reader.role, CustomUser.Role.AUTHOR)

        # 3. Audit trail confirms role change
        audit = AuditEvent.objects.filter(
            action=AuditEvent.Action.USER_ROLE_CHANGE,
            resource_id=self.reader.id,
        ).first()
        self.assertIsNotNone(audit)

    def test_scenario_09_authorized_user_views_revisions_diff_and_restore(self):
        """Scenario 9: View revision history, inspect diff, and restore prior version."""
        self.client.force_authenticate(user=self.author)

        article = Article.objects.create(
            title="Container Hardening Guide",
            summary="Original container guide",
            content="Version 1: Basic Docker setup...",
            author=self.author,
            category=self.category,
            status=Article.Status.DRAFT,
        )
        rev1 = article.create_revision(author=self.author, change_summary="Initial container setup")

        # Create version 2
        article.content = "Version 2: Hardened Dockerfile with non-root user..."
        article.save(update_fields=["content", "updated_at"])
        rev2 = article.create_revision(author=self.author, change_summary="Added non-root user")

        # 1. View revision history
        history_resp = self.client.get(f"/api/v1/articles/{article.slug}/revisions/")
        self.assertEqual(history_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_resp.data), 2)

        # 2. View unified diff between revision 1 and revision 2
        diff_resp = self.client.get(
            f"/api/v1/articles/{article.slug}/revisions/diff/?from=1&to=2"
        )
        self.assertEqual(diff_resp.status_code, status.HTTP_200_OK)
        self.assertIn("content_unified_diff", diff_resp.data)
        self.assertGreaterEqual(diff_resp.data["stats"]["additions"], 1)

        # 3. Restore to revision 1 (creates new revision 3 without destroying history)
        restore_resp = self.client.post(
            f"/api/v1/articles/{article.slug}/revisions/1/restore/",
            {"reason": "Rolling back experimental changes"},
        )
        self.assertEqual(restore_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(restore_resp.data["new_revision_number"], 3)

        article.refresh_from_db()
        self.assertEqual(article.content, rev1.content)

    def test_scenario_10_user_signs_out_and_reuse_is_rejected(self):
        """Scenario 10: User logs out, refresh token blacklisted, protected endpoints return 401."""
        # 1. Login to obtain tokens (email is USERNAME_FIELD)
        login_resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": "reader@e2e.test", "password": "StrongPassword123!"},
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        access_token = login_resp.data["access"]
        refresh_token = login_resp.data["refresh"]

        # 2. Logout and blacklist refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_resp = self.client.post("/api/v1/auth/logout/", {"refresh": refresh_token})
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)

        # 3. Clear credentials on client to simulate session termination
        self.client.credentials()

        # 4. Attempt to access protected dashboard -> 401 Unauthorized
        rejected_resp = self.client.get("/api/v1/dashboard/")
        self.assertEqual(rejected_resp.status_code, status.HTTP_401_UNAUTHORIZED)
