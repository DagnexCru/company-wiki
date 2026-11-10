import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleChecklistProgress
from apps.taxonomy.models import Category


class ArticleChecklistAPITests(APITestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(
            email="user1@example.com",
            username="user1",
            password="password123",
            full_name="User One",
            role=CustomUser.Role.AUTHOR,
        )
        self.user2 = CustomUser.objects.create_user(
            email="user2@example.com",
            username="user2",
            password="password123",
            full_name="User Two",
            role=CustomUser.Role.READER,
        )
        self.category = Category.objects.create(name="Operations", slug="operations")
        self.article = Article.objects.create(
            title="SOP: Production Deployment Runbook",
            slug="sop-production-deployment-runbook",
            summary="Standard checklist for production release verification.",
            content="""# Production Deployment Checklist
- [ ] 1. Run migrations in staging
- [ ] 2. Backup production PostgreSQL database
- [ ] 3. Deploy backend services
- [ ] 4. Verify healthcheck endpoints
""",
            author=self.user1,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

    def test_unauthenticated_requests_fail(self):
        url_progress = f"/api/v1/articles/{self.article.slug}/checklist-progress/"
        res = self.client.get(url_progress)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        res = self.client.post(url_toggle, {"item_key": "step-1"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_initial_checklist_progress(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/articles/{self.article.slug}/checklist-progress/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["checked_items"], [])
        self.assertEqual(res.data["completed_count"], 0)
        self.assertEqual(res.data["remaining_items"], 0)
        self.assertFalse(res.data["is_completed"])
        self.assertEqual(res.data["completion_percentage"], 0.0)

    def test_toggle_checklist_lifecycle(self):
        self.client.force_authenticate(user=self.user1)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"

        # 1. Toggle Item 1 ON
        res1 = self.client.post(url_toggle, {
            "item_key": "step-1",
            "is_checked": True,
            "total_items": 4,
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["checked_items"], ["step-1"])
        self.assertEqual(res1.data["completed_count"], 1)
        self.assertEqual(res1.data["remaining_items"], 3)
        self.assertEqual(res1.data["total_items"], 4)
        self.assertEqual(res1.data["completion_percentage"], 25.0)
        self.assertFalse(res1.data["is_completed"])

        # 2. Toggle Item 2 ON
        res2 = self.client.post(url_toggle, {
            "item_key": "step-2",
            "is_checked": True,
            "total_items": 4,
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["completed_count"], 2)
        self.assertEqual(res2.data["remaining_items"], 2)
        self.assertEqual(res2.data["completion_percentage"], 50.0)

        # 3. Toggle Item 1 OFF
        res3 = self.client.post(url_toggle, {
            "item_key": "step-1",
            "is_checked": False,
            "total_items": 4,
        })
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data["checked_items"], ["step-2"])
        self.assertEqual(res3.data["completed_count"], 1)
        self.assertEqual(res3.data["remaining_items"], 3)
        self.assertEqual(res3.data["completion_percentage"], 25.0)

    def test_completion_detection(self):
        self.client.force_authenticate(user=self.user1)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"

        # Check step-1 and step-2 with total_items=2
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 2})
        res = self.client.post(url_toggle, {"item_key": "step-2", "is_checked": True, "total_items": 2})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["completed_count"], 2)
        self.assertEqual(res.data["remaining_items"], 0)
        self.assertEqual(res.data["total_items"], 2)
        self.assertTrue(res.data["is_completed"])
        self.assertEqual(res.data["completion_percentage"], 100.0)
        self.assertIsNotNone(res.data["completed_at"])

    def test_reset_checklist_progress(self):
        self.client.force_authenticate(user=self.user1)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 2})

        url_reset = f"/api/v1/articles/{self.article.slug}/checklist-reset/"
        res_reset = self.client.post(url_reset, {})
        self.assertEqual(res_reset.status_code, status.HTTP_200_OK)
        self.assertEqual(res_reset.data["checked_items"], [])
        self.assertEqual(res_reset.data["completed_count"], 0)
        self.assertEqual(res_reset.data["remaining_items"], 2)
        self.assertFalse(res_reset.data["is_completed"])

    def test_user_isolation(self):
        # User 1 completes step-1
        self.client.force_authenticate(user=self.user1)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 3})

        # User 2 checks progress - should be empty
        self.client.force_authenticate(user=self.user2)
        url_progress = f"/api/v1/articles/{self.article.slug}/checklist-progress/"
        res_user2 = self.client.get(url_progress)
        self.assertEqual(res_user2.data["checked_items"], [])
        self.assertEqual(res_user2.data["completed_count"], 0)
