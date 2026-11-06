import uuid
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleBookmark
from apps.taxonomy.models import Category


class ArticleBookmarkAPITests(APITestCase):
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
        self.category = Category.objects.create(name="Engineering", slug="engineering")
        self.article = Article.objects.create(
            title="Clean Architecture Best Practices",
            slug="clean-architecture-best-practices",
            summary="A deep dive into clean architecture in Python and React.",
            content="Full content of the article...",
            author=self.user1,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )
        self.article2 = Article.objects.create(
            title="Microservices Patterns",
            slug="microservices-patterns",
            summary="Understanding distributed systems.",
            content="Microservices content...",
            author=self.user1,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

    def test_unauthenticated_bookmark_fails(self):
        url = f"/api/v1/articles/{self.article.slug}/bookmark/"
        res = self.client.post(url, {})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_bookmark_lifecycle(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/articles/{self.article.slug}/bookmark/"

        # 1. Add Bookmark
        res1 = self.client.post(url, {"collection_name": "Architecture", "personal_note": "Crucial for Q4 refactor"})
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data["bookmarked"])
        self.assertEqual(res1.data["bookmark"]["collection_name"], "Architecture")
        self.assertEqual(res1.data["bookmark"]["personal_note"], "Crucial for Q4 refactor")
        self.assertTrue(ArticleBookmark.objects.filter(user=self.user1, article=self.article).exists())

        # 2. Check Bookmark Status
        status_url = f"/api/v1/articles/{self.article.slug}/bookmark-status/"
        res_status = self.client.get(status_url)
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        self.assertTrue(res_status.data["bookmarked"])

        # 3. Toggle Bookmark Off
        res2 = self.client.post(url, {})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data["bookmarked"])
        self.assertFalse(ArticleBookmark.objects.filter(user=self.user1, article=self.article).exists())

        # 4. Check Status Again
        res_status2 = self.client.get(status_url)
        self.assertEqual(res_status2.status_code, status.HTTP_200_OK)
        self.assertFalse(res_status2.data["bookmarked"])

    def test_bookmarks_list_and_user_isolation(self):
        # User 1 bookmarks article 1
        ArticleBookmark.objects.create(
            user=self.user1,
            article=self.article,
            collection_name="Favorites",
            personal_note="Note by user1",
        )
        # User 2 bookmarks article 2
        ArticleBookmark.objects.create(
            user=self.user2,
            article=self.article2,
            collection_name="Must Read",
            personal_note="Note by user2",
        )

        self.client.force_authenticate(user=self.user1)
        list_url = "/api/v1/articles/bookmarks/"
        res = self.client.get(list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["article_slug"], self.article.slug)

        # Filter by collection
        res_filtered = self.client.get(list_url, {"collection": "Architecture"})
        self.assertEqual(res_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(res_filtered.data["count"], 0)

        res_fav = self.client.get(list_url, {"collection": "Favorites"})
        self.assertEqual(res_fav.status_code, status.HTTP_200_OK)
        self.assertEqual(res_fav.data["count"], 1)
