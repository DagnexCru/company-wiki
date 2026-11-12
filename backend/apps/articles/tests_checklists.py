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

    def test_unauthenticated_my_checklists_fails(self):
        url = "/api/v1/articles/my-checklists/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_my_checklists_lifecycle_and_filtering(self):
        self.client.force_authenticate(user=self.user1)

        # 1. Initially user1 has no checklists
        url = "/api/v1/articles/my-checklists/"
        res1 = self.client.get(url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["count"], 0)

        # 2. Progress on article 1 (in-progress)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 4})

        res2 = self.client.get(url)
        self.assertEqual(res2.data["count"], 1)
        item = res2.data["results"][0]
        self.assertEqual(item["article_slug"], self.article.slug)
        self.assertEqual(item["completed_count"], 1)
        self.assertEqual(item["total_items"], 4)
        self.assertEqual(item["remaining_items"], 3)
        self.assertEqual(item["completion_percentage"], 25.0)
        self.assertFalse(item["is_completed"])

        # Test filter=in_progress
        res_in_prog = self.client.get(f"{url}?filter=in_progress")
        self.assertEqual(res_in_prog.data["count"], 1)

        # Test filter=completed (should be 0)
        res_comp = self.client.get(f"{url}?filter=completed")
        self.assertEqual(res_comp.data["count"], 0)

    def test_my_checklists_user_isolation(self):
        # user1 starts checklist
        self.client.force_authenticate(user=self.user1)
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 4})

        # user2 checks my-checklists - must be empty
        self.client.force_authenticate(user=self.user2)
        res_user2 = self.client.get("/api/v1/articles/my-checklists/")
        self.assertEqual(res_user2.data["count"], 0)

    def test_team_checklist_status_permissions_and_stats(self):
        url = f"/api/v1/articles/{self.article.slug}/team-checklist-status/"

        # 1. Reader (user2) is forbidden
        self.client.force_authenticate(user=self.user2)
        res_forbidden = self.client.get(url)
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Author (user1) is allowed
        self.client.force_authenticate(user=self.user1)
        res_allowed = self.client.get(url)
        self.assertEqual(res_allowed.status_code, status.HTTP_200_OK)
        self.assertIn("stats", res_allowed.data)
        self.assertIn("members", res_allowed.data)
        self.assertIn("compliance_rate", res_allowed.data["stats"])

    def test_checklist_certificate_generation(self):
        url_cert = f"/api/v1/articles/{self.article.slug}/checklist-certificate/"
        self.client.force_authenticate(user=self.user1)

        # 1. Incomplete runbook cannot generate certificate (400)
        res_bad = self.client.get(url_cert)
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Complete all items
        url_toggle = f"/api/v1/articles/{self.article.slug}/checklist-toggle/"
        self.client.post(url_toggle, {"item_key": "step-1", "is_checked": True, "total_items": 1})

        # 3. Valid certificate generated
        res_valid = self.client.get(url_cert)
        self.assertEqual(res_valid.status_code, status.HTTP_200_OK)
        self.assertIn("certificate_id", res_valid.data)
        self.assertIn("verification_code", res_valid.data)
        self.assertEqual(res_valid.data["status"], "VALID")
        self.assertEqual(res_valid.data["recipient_name"], self.user1.full_name)
