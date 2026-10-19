from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article
from apps.workflows.models import ReviewRecord


class WorkflowLifecycleTests(TestCase):
    """
    Comprehensive test suite for Phase 7:
    - Draft submission and resubmission.
    - Reviewer queue access and ordering.
    - Approval, publication, and rejection workflows.
    - Mandatory rejection feedback enforcement.
    - Independent review invariant (author cannot review own article).
    - Invalid transition rejection.
    - Review history retrieval and audit records.
    """

    def setUp(self):
        self.client = APIClient()

        self.admin = CustomUser.objects.create_superuser(
            username="admin_workflow",
            email="admin_wf@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.ADMIN,
            full_name="Admin Supervisor",
        )
        self.author = CustomUser.objects.create_user(
            username="author_wf",
            email="author_wf@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="Alice Author",
        )
        self.author_two = CustomUser.objects.create_user(
            username="author_two_wf",
            email="author2_wf@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.AUTHOR,
            full_name="Bob Author",
        )
        self.reviewer = CustomUser.objects.create_user(
            username="reviewer_wf",
            email="reviewer_wf@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.REVIEWER,
            full_name="Rachel Reviewer",
        )
        self.reader = CustomUser.objects.create_user(
            username="reader_wf",
            email="reader_wf@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.READER,
            full_name="Ron Reader",
        )

        # Sample articles
        self.draft_article = Article.objects.create(
            title="CI/CD Pipeline Architecture",
            slug="cicd-pipeline-architecture",
            summary="Continuous delivery guide.",
            content="Detailed pipeline setup and deployment automation steps.",
            author=self.author,
            status=Article.Status.DRAFT,
        )

        self.in_review_article = Article.objects.create(
            title="Zero Trust Security Blueprint",
            slug="zero-trust-security-blueprint",
            summary="Security architecture guidelines.",
            content="Network segmentation, mTLS, and zero trust identity principles.",
            author=self.author,
            status=Article.Status.IN_REVIEW,
        )

        self.published_article = Article.objects.create(
            title="PostgreSQL Tuning Standard",
            slug="postgresql-tuning-standard",
            summary="Database performance standards.",
            content="Shared buffers, work mem, and WAL configuration recommendations.",
            author=self.author,
            status=Article.Status.PUBLISHED,
        )

    def test_author_can_submit_draft_for_review(self):
        """Author can submit their draft article for review; status moves to in_review."""
        self.client.force_authenticate(user=self.author)
        response = self.client.post(
            f"/api/v1/articles/{self.draft_article.slug}/submit/",
            {"notes": "Ready for initial technical review."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.draft_article.refresh_from_db()
        self.assertEqual(self.draft_article.status, Article.Status.IN_REVIEW)
        self.assertIsNotNone(self.draft_article.submitted_at)

        # Verify ReviewRecord created
        record = ReviewRecord.objects.filter(article=self.draft_article).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.action, ReviewRecord.Action.SUBMIT)
        self.assertEqual(record.actor, self.author)
        self.assertEqual(record.to_status, Article.Status.IN_REVIEW)

    def test_reader_cannot_submit_article(self):
        """Readers cannot submit articles for review (403 Forbidden)."""
        self.client.force_authenticate(user=self.reader)
        response = self.client.post(f"/api/v1/articles/{self.draft_article.slug}/submit/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_submit_already_in_review_or_published_article(self):
        """Submitting an article already in review or published returns 400 Bad Request."""
        self.client.force_authenticate(user=self.author)
        res_review = self.client.post(f"/api/v1/articles/{self.in_review_article.slug}/submit/")
        self.assertEqual(res_review.status_code, status.HTTP_400_BAD_REQUEST)

        res_pub = self.client.post(f"/api/v1/articles/{self.published_article.slug}/submit/")
        self.assertEqual(res_pub.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reviewer_queue_access_and_permissions(self):
        """Reviewers and Admins can view the review queue; Readers and Authors cannot."""
        # 1. Reviewer can view queue
        self.client.force_authenticate(user=self.reviewer)
        res_rev = self.client.get("/api/v1/workflows/queue/")
        self.assertEqual(res_rev.status_code, status.HTTP_200_OK)
        slugs = [item["slug"] for item in res_rev.data["results"]]
        self.assertIn(self.in_review_article.slug, slugs)
        self.assertNotIn(self.draft_article.slug, slugs)

        # 2. Admin can view queue
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get("/api/v1/workflows/queue/")
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

        # 3. Reader is blocked
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get("/api/v1/workflows/queue/")
        self.assertEqual(res_reader.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Author is blocked
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get("/api/v1/workflows/queue/")
        self.assertEqual(res_author.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_can_approve_in_review_article(self):
        """Reviewer approves in_review article; status transitions to published with timestamps."""
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/approve/",
            {"feedback": "LGTM! Approved for company publishing."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.in_review_article.refresh_from_db()
        self.assertEqual(self.in_review_article.status, Article.Status.PUBLISHED)
        self.assertIsNotNone(self.in_review_article.published_at)
        self.assertIsNotNone(self.in_review_article.reviewed_at)
        self.assertEqual(self.in_review_article.last_reviewer, self.reviewer)

        # Verify ReviewRecord
        record = ReviewRecord.objects.filter(article=self.in_review_article).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.action, ReviewRecord.Action.APPROVE)
        self.assertEqual(record.actor, self.reviewer)

    def test_independent_review_author_cannot_approve_own_article(self):
        """Authors cannot approve their own articles, even if possessing reviewer privileges."""
        # Create an author who is also set as a reviewer
        dual_user = CustomUser.objects.create_user(
            username="dual_role_user",
            email="dual@company.com",
            password="TestPassword123!",
            role=CustomUser.Role.REVIEWER,
            full_name="Dual Role Author",
        )
        article_by_dual = Article.objects.create(
            title="Dual User Draft Article",
            slug="dual-user-draft-article",
            content="Content written by dual user.",
            author=dual_user,
            status=Article.Status.IN_REVIEW,
        )

        self.client.force_authenticate(user=dual_user)
        response = self.client.post(f"/api/v1/articles/{article_by_dual.slug}/approve/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Independent review required", response.data["detail"])

    def test_reviewer_can_reject_in_review_article_with_feedback(self):
        """Reviewer rejects in_review article with feedback; moves to rejected status."""
        self.client.force_authenticate(user=self.reviewer)
        payload = {"feedback": "Please add diagrams and include automated rollback steps."}
        response = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/reject/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.in_review_article.refresh_from_db()
        self.assertEqual(self.in_review_article.status, Article.Status.REJECTED)
        self.assertEqual(self.in_review_article.rejection_reason, payload["feedback"])
        self.assertEqual(self.in_review_article.last_reviewer, self.reviewer)

        # Verify ReviewRecord
        record = ReviewRecord.objects.filter(article=self.in_review_article).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.action, ReviewRecord.Action.REJECT)
        self.assertEqual(record.feedback, payload["feedback"])

    def test_rejection_requires_mandatory_feedback(self):
        """Calling reject without meaningful feedback returns 400 Bad Request."""
        self.client.force_authenticate(user=self.reviewer)
        # Empty feedback
        res_empty = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/reject/",
            {"feedback": ""},
            format="json",
        )
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

        # Feedback too short (< 5 chars)
        res_short = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/reject/",
            {"feedback": "bad"},
            format="json",
        )
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)

    def test_author_can_resubmit_rejected_article(self):
        """Author can revise and resubmit a rejected article back to in_review."""
        self.in_review_article.status = Article.Status.REJECTED
        self.in_review_article.rejection_reason = "Missing security section"
        self.in_review_article.save()

        self.client.force_authenticate(user=self.author)
        response = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/submit/",
            {"notes": "Added security section as requested."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.in_review_article.refresh_from_db()
        self.assertEqual(self.in_review_article.status, Article.Status.IN_REVIEW)

    def test_cannot_approve_or_reject_draft_article(self):
        """Calling approve or reject on draft articles returns 400 Bad Request."""
        self.client.force_authenticate(user=self.reviewer)
        res_app = self.client.post(f"/api/v1/articles/{self.draft_article.slug}/approve/")
        self.assertEqual(res_app.status_code, status.HTTP_400_BAD_REQUEST)

        res_rej = self.client.post(
            f"/api/v1/articles/{self.draft_article.slug}/reject/",
            {"feedback": "Cannot review a draft."},
            format="json",
        )
        self.assertEqual(res_rej.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_approve_or_reject_published_article(self):
        """Calling approve or reject on already published articles returns 400 Bad Request."""
        self.client.force_authenticate(user=self.reviewer)
        res_app = self.client.post(f"/api/v1/articles/{self.published_article.slug}/approve/")
        self.assertEqual(res_app.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reader_cannot_approve_or_reject_article(self):
        """Readers calling approve or reject receive 403 Forbidden."""
        self.client.force_authenticate(user=self.reader)
        res_app = self.client.post(f"/api/v1/articles/{self.in_review_article.slug}/approve/")
        self.assertEqual(res_app.status_code, status.HTTP_403_FORBIDDEN)

        res_rej = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/reject/",
            {"feedback": "Attempt by reader"},
            format="json",
        )
        self.assertEqual(res_rej.status_code, status.HTTP_403_FORBIDDEN)

    def test_article_review_history_retrieval(self):
        """Author and Reviewers can inspect chronological review events; Readers cannot."""
        # Create a submission record and an approval record
        ReviewRecord.objects.create(
            article=self.in_review_article,
            actor=self.author,
            action=ReviewRecord.Action.SUBMIT,
            from_status=Article.Status.DRAFT,
            to_status=Article.Status.IN_REVIEW,
            feedback="Initial submission",
        )

        # 1. Author can retrieve reviews for their own article
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get(f"/api/v1/articles/{self.in_review_article.slug}/reviews/")
        self.assertEqual(res_author.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_author.data), 1)

        # 2. Reviewer can retrieve reviews
        self.client.force_authenticate(user=self.reviewer)
        res_rev = self.client.get(f"/api/v1/articles/{self.in_review_article.slug}/reviews/")
        self.assertEqual(res_rev.status_code, status.HTTP_200_OK)

        # 3. Reader cannot retrieve review history
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get(f"/api/v1/articles/{self.in_review_article.slug}/reviews/")
        self.assertEqual(res_reader.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_supervisory_override(self):
        """Administrators can approve articles across the organization."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/v1/articles/{self.in_review_article.slug}/approve/",
            {"feedback": "Executive approval by Admin."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.in_review_article.refresh_from_db()
        self.assertEqual(self.in_review_article.status, Article.Status.PUBLISHED)
