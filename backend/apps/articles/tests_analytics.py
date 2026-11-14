import datetime
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleViewLog, ArticleFeedback
from apps.taxonomy.models import Category


class ArticleAnalyticsViewsTimelineTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = CustomUser.objects.create_user(
            username="admin_analytics",
            email="admin_analytics@company.com",
            password="Password123!",
            role=CustomUser.Role.ADMIN,
        )
        self.reviewer = CustomUser.objects.create_user(
            username="reviewer_analytics",
            email="reviewer_analytics@company.com",
            password="Password123!",
            role=CustomUser.Role.REVIEWER,
        )
        self.author = CustomUser.objects.create_user(
            username="author_analytics",
            email="author_analytics@company.com",
            password="Password123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.reader = CustomUser.objects.create_user(
            username="reader_analytics",
            email="reader_analytics@company.com",
            password="Password123!",
            role=CustomUser.Role.READER,
        )

        self.category = Category.objects.create(name="Engineering", slug="engineering")
        self.article = Article.objects.create(
            title="Kubernetes Migration Architecture Guide",
            slug="k8s-migration-guide",
            content="# Kubernetes Migration\n\nDeployment procedures and rollouts.",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
            view_count=50,
        )

        # Seed view logs for 7 days
        now = timezone.now()
        for i in range(7):
            d = now - datetime.timedelta(days=i)
            ArticleViewLog.objects.create(
                article=self.article,
                user=self.reader,
                viewed_at=d,
            )
            ArticleViewLog.objects.create(
                article=self.article,
                user=None,
                session_key=f"sess_{i}",
                viewed_at=d,
            )

    def test_analytics_views_timeline_requires_authentication(self):
        url = f"/api/v1/articles/{self.article.slug}/analytics/views-timeline/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 401)

    def test_analytics_views_timeline_reader_forbidden(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.article.slug}/analytics/views-timeline/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)
        self.assertIn("detail", res.data)

    def test_analytics_views_timeline_author_allowed(self):
        self.client.force_authenticate(user=self.author)
        url = f"/api/v1/articles/{self.article.slug}/analytics/views-timeline/?range=7d"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["article_slug"], self.article.slug)
        self.assertEqual(res.data["range"], "7d")
        self.assertEqual(res.data["days_count"], 7)
        self.assertEqual(len(res.data["timeline"]), 7)
        self.assertIn("summary", res.data)
        self.assertGreater(res.data["summary"]["period_total_views"], 0)

    def test_analytics_views_timeline_admin_allowed(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/v1/articles/{self.article.slug}/analytics/views-timeline/?range=30d"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["range"], "30d")
        self.assertEqual(res.data["days_count"], 30)
        self.assertEqual(len(res.data["timeline"]), 30)

    def test_analytics_views_timeline_reviewer_allowed(self):
        self.client.force_authenticate(user=self.reviewer)
        url = f"/api/v1/articles/{self.article.slug}/analytics/views-timeline/?range=90d"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["range"], "90d")
        self.assertEqual(res.data["days_count"], 90)
        self.assertEqual(len(res.data["timeline"]), 90)

    def test_record_view_creates_view_log(self):
        self.client.force_authenticate(user=self.reader)
        initial_log_count = ArticleViewLog.objects.filter(article=self.article).count()
        initial_views = self.article.view_count

        url = f"/api/v1/articles/{self.article.slug}/record-view/"
        res = self.client.post(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["view_count"], initial_views + 1)

        new_log_count = ArticleViewLog.objects.filter(article=self.article).count()
        self.assertEqual(new_log_count, initial_log_count + 1)
        latest_log = ArticleViewLog.objects.filter(article=self.article).latest("viewed_at")
        self.assertEqual(latest_log.user, self.reader)

    def test_analytics_sentiment_requires_authentication(self):
        url = f"/api/v1/articles/{self.article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 401)

    def test_analytics_sentiment_reader_forbidden(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)
        self.assertIn("detail", res.data)

    def test_analytics_sentiment_author_allowed_with_data(self):
        # Create sample feedbacks
        ArticleFeedback.objects.create(
            article=self.article,
            user=self.reader,
            is_helpful=True,
            note="Clear & Actionable guide! Easy to follow.",
        )
        ArticleFeedback.objects.create(
            article=self.article,
            user=self.admin,
            is_helpful=False,
            note="Outdated syntax in step 2.",
        )

        self.client.force_authenticate(user=self.author)
        url = f"/api/v1/articles/{self.article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["article_slug"], self.article.slug)
        self.assertIn("summary", res.data)
        summary = res.data["summary"]
        self.assertEqual(summary["total_feedback_count"], 2)
        self.assertEqual(summary["helpful_count"], 1)
        self.assertEqual(summary["unhelpful_count"], 1)
        self.assertEqual(summary["helpfulness_score"], 50)
        self.assertEqual(summary["health_status"], "NEEDS_REVIEW")
        self.assertIn("categories_breakdown", res.data)
        self.assertIn("recent_feedbacks", res.data)
        self.assertEqual(len(res.data["recent_feedbacks"]), 2)

    def test_analytics_sentiment_admin_allowed(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/v1/articles/{self.article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertIn("summary", res.data)

    def test_analytics_sentiment_reviewer_allowed(self):
        self.client.force_authenticate(user=self.reviewer)
        url = f"/api/v1/articles/{self.article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertIn("summary", res.data)

    def test_analytics_sentiment_empty_state(self):
        # Fresh article with no feedbacks
        empty_article = Article.objects.create(
            title="Fresh Article",
            slug="fresh-article",
            content="Empty",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )
        self.client.force_authenticate(user=self.author)
        url = f"/api/v1/articles/{empty_article.slug}/analytics/sentiment/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["summary"]["health_status"], "NO_DATA")
        self.assertEqual(res.data["summary"]["total_feedback_count"], 0)
        self.assertEqual(len(res.data["categories_breakdown"]), 0)


