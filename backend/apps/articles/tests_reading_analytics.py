from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleFeedback
from apps.taxonomy.models import Category


class ReadingAnalyticsAndFeedbackTests(TestCase):
    """
    Automated test coverage for Article View Counting,
    Helpful/Unhelpful feedback scoring, Reader Notes, and AI Summarization safety.
    """

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="DevOps Architecture", slug="devops-architecture")
        
        self.author = CustomUser.objects.create_user(
            email="author_analytics@company.com",
            username="author_analytics",
            password="Password123!",
            role=CustomUser.Role.AUTHOR,
            full_name="Sarah Author",
        )
        self.reader = CustomUser.objects.create_user(
            email="reader_analytics@company.com",
            username="reader_analytics",
            password="Password123!",
            role=CustomUser.Role.READER,
            full_name="David Reader",
        )
        self.admin = CustomUser.objects.create_user(
            email="admin_analytics@company.com",
            username="admin_analytics",
            password="Password123!",
            role=CustomUser.Role.ADMIN,
            full_name="Alex Admin",
        )

        self.article = Article.objects.create(
            title="Kubernetes Cluster Maintenance Runbook",
            slug="kubernetes-cluster-maintenance-runbook",
            summary="Production guide for draining and upgrading Kubernetes worker nodes safely.",
            content="## Overview\n\nFollow these zero-downtime drain steps carefully.\n\n- Drain node\n- Upgrade kubelet\n- Uncordon node",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
            view_count=10,
        )

    def test_record_view_increments_counter(self):
        self.client.force_authenticate(user=self.reader)
        url = reverse("article-record-view", kwargs={"slug": self.article.slug})
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["view_count"], 11)

        self.article.refresh_from_db()
        self.assertEqual(self.article.view_count, 11)

    def test_submit_helpful_feedback(self):
        self.client.force_authenticate(user=self.reader)
        url = reverse("article-feedback", kwargs={"slug": self.article.slug})
        payload = {
            "is_helpful": True,
            "note": "Clear instructions, saved 30 minutes on node drain.",
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["helpful_count"], 1)
        self.assertEqual(resp.data["unhelpful_count"], 0)
        self.assertEqual(resp.data["helpfulness_score"], 100)

        # Update feedback to unhelpful
        resp_update = self.client.post(url, {"is_helpful": False, "note": "Node version 1.29 changed syntax."}, format="json")
        self.assertEqual(resp_update.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_update.data["helpful_count"], 0)
        self.assertEqual(resp_update.data["unhelpful_count"], 1)
        self.assertEqual(resp_update.data["helpfulness_score"], 0)

    def test_feedbacks_listing_permission(self):
        # Create a feedback note
        ArticleFeedback.objects.create(
            article=self.article,
            user=self.reader,
            is_helpful=True,
            note="Helpful and concise.",
        )

        url = reverse("article-feedbacks", kwargs={"slug": self.article.slug})

        # Reader cannot view all feedback notes
        self.client.force_authenticate(user=self.reader)
        resp_forbidden = self.client.get(url)
        self.assertEqual(resp_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Author can inspect reader notes
        self.client.force_authenticate(user=self.author)
        resp_author = self.client.get(url)
        self.assertEqual(resp_author.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_author.data["count"], 1)
        self.assertEqual(resp_author.data["results"][0]["note"], "Helpful and concise.")

    def test_ai_summary_safe_lookup(self):
        self.client.force_authenticate(user=self.reader)
        url = reverse("article-ai-summary", kwargs={"slug_or_id": self.article.slug})
        resp = self.client.post(url, {})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("key_takeaways", resp.data)
        self.assertIn("tldr", resp.data)
