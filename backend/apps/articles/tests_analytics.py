import datetime
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleViewLog, ArticleFeedback, ArticleEngagementSession
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

    def test_ping_engagement_unauthenticated_and_authenticated(self):
        url = f"/api/v1/articles/{self.article.slug}/analytics/ping-engagement/"
        session_id = "sess_reader_test_123"

        # Ping 1: 30 active seconds, 35% depth (unauthenticated)
        res1 = self.client.post(
            url,
            {"session_id": session_id, "active_seconds": 30, "scroll_percentage": 35},
            format="json",
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data["status"], "success")
        self.assertEqual(res1.data["active_seconds"], 30)
        self.assertEqual(res1.data["scroll_depth_percent"], 35)
        self.assertFalse(res1.data["reached_100"])

        eng = ArticleEngagementSession.objects.get(article=self.article, session_id=session_id)
        self.assertEqual(eng.active_seconds, 30)
        self.assertEqual(eng.scroll_depth_percent, 35)
        self.assertTrue(eng.reached_25)
        self.assertFalse(eng.reached_50)
        self.assertIsNone(eng.user)

        # Ping 2: user logs in and continues to 95% depth (authenticated)
        self.client.force_authenticate(user=self.reader)
        res2 = self.client.post(
            url,
            {"session_id": session_id, "active_seconds": 150, "scroll_percentage": 95},
            format="json",
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.data["active_seconds"], 150)
        self.assertEqual(res2.data["scroll_depth_percent"], 95)
        self.assertTrue(res2.data["reached_100"])

        eng.refresh_from_db()
        self.assertEqual(eng.active_seconds, 150)
        self.assertEqual(eng.scroll_depth_percent, 95)
        self.assertTrue(eng.reached_25)
        self.assertTrue(eng.reached_50)
        self.assertTrue(eng.reached_75)
        self.assertTrue(eng.reached_100)
        self.assertEqual(eng.user, self.reader)

    def test_ping_engagement_validation(self):
        url = f"/api/v1/articles/{self.article.slug}/analytics/ping-engagement/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("detail", res.data)

    def test_engagement_metrics_permissions(self):
        url = f"/api/v1/articles/{self.article.slug}/analytics/engagement/"

        # Unauthenticated -> 401
        res_unauth = self.client.get(url)
        self.assertEqual(res_unauth.status_code, 401)

        # Reader -> 403
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get(url)
        self.assertEqual(res_reader.status_code, 403)

        # Author -> 200
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get(url)
        self.assertEqual(res_author.status_code, 200)

        # Reviewer -> 200
        self.client.force_authenticate(user=self.reviewer)
        res_reviewer = self.client.get(url)
        self.assertEqual(res_reviewer.status_code, 200)

        # Admin -> 200
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(url)
        self.assertEqual(res_admin.status_code, 200)

    def test_engagement_metrics_calculations(self):
        # Create 4 specific engagement sessions
        ArticleEngagementSession.objects.create(
            article=self.article,
            session_id="s1",
            active_seconds=20,
            scroll_depth_percent=20,
            reached_25=False,
            reached_50=False,
            reached_75=False,
            reached_100=False,
        )
        ArticleEngagementSession.objects.create(
            article=self.article,
            session_id="s2",
            active_seconds=60,
            scroll_depth_percent=40,
            reached_25=True,
            reached_50=False,
            reached_75=False,
            reached_100=False,
        )
        ArticleEngagementSession.objects.create(
            article=self.article,
            session_id="s3",
            active_seconds=180,
            scroll_depth_percent=80,
            reached_25=True,
            reached_50=True,
            reached_75=True,
            reached_100=False,
        )
        ArticleEngagementSession.objects.create(
            article=self.article,
            session_id="s4",
            active_seconds=360,
            scroll_depth_percent=100,
            reached_25=True,
            reached_50=True,
            reached_75=True,
            reached_100=True,
        )

        self.client.force_authenticate(user=self.author)
        url = f"/api/v1/articles/{self.article.slug}/analytics/engagement/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        data = res.data

        self.assertIn("summary", data)
        self.assertEqual(data["summary"]["total_readers"], 4)
        # Average: (20 + 60 + 180 + 360) / 4 = 620 / 4 = 155s
        self.assertEqual(data["summary"]["avg_read_seconds"], 155)
        self.assertEqual(data["summary"]["avg_read_formatted"], "2m 35s")
        self.assertEqual(data["summary"]["completion_rate_percentage"], 25.0)

        # Funnel stages verification
        self.assertEqual(len(data["funnel"]), 5)
        # Started: 4
        self.assertEqual(data["funnel"][0]["readers"], 4)
        self.assertEqual(data["funnel"][0]["percentage"], 100.0)
        # 25%: s2, s3, s4 = 3
        self.assertEqual(data["funnel"][1]["readers"], 3)
        self.assertEqual(data["funnel"][1]["percentage"], 75.0)
        # 50%: s3, s4 = 2
        self.assertEqual(data["funnel"][2]["readers"], 2)
        self.assertEqual(data["funnel"][2]["percentage"], 50.0)
        # 75%: s3, s4 = 2
        self.assertEqual(data["funnel"][3]["readers"], 2)
        self.assertEqual(data["funnel"][3]["percentage"], 50.0)
        # 100%: s4 = 1
        self.assertEqual(data["funnel"][4]["readers"], 1)
        self.assertEqual(data["funnel"][4]["percentage"], 25.0)

        # Distribution verification
        self.assertEqual(len(data["distribution"]), 4)
        self.assertIn("recommendations", data)

    def test_engagement_metrics_empty_article(self):
        empty_article = Article.objects.create(
            title="Empty Article",
            slug="empty-article-eng",
            content="Just a summary paragraph.",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )
        self.client.force_authenticate(user=self.author)
        url = f"/api/v1/articles/{empty_article.slug}/analytics/engagement/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["summary"]["total_readers"], 0)
        self.assertEqual(res.data["summary"]["avg_read_seconds"], 0)
        self.assertEqual(res.data["summary"]["engagement_level"], "No Data Yet")

    def test_author_analytics_overview_unauthenticated_returns_401(self):
        url = "/api/v1/analytics/author-overview/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 401)

    def test_author_analytics_overview_author_success(self):
        # Create second article for author to test leaderboard
        art2 = Article.objects.create(
            title="Advanced Microservices Observability",
            slug="microservices-observability",
            content="Tracing and telemetry runbook.",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
            view_count=120,
        )
        ArticleFeedback.objects.create(
            article=art2,
            user=self.reader,
            is_helpful=True,
            note="Great observability guide!",
        )
        ArticleEngagementSession.objects.create(
            article=art2,
            session_id="obs_sess_1",
            active_seconds=300,
            scroll_depth_percent=100,
            reached_25=True,
            reached_50=True,
            reached_75=True,
            reached_100=True,
        )

        self.client.force_authenticate(user=self.author)
        url = "/api/v1/analytics/author-overview/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        data = res.data

        self.assertIn("author", data)
        self.assertEqual(data["author"]["username"], self.author.username)
        self.assertIn("summary", data)
        self.assertEqual(data["summary"]["total_articles"], 2)
        self.assertEqual(data["summary"]["published_articles"], 2)
        # 50 views on art1 + 120 on art2 = 170
        self.assertEqual(data["summary"]["total_portfolio_views"], 170)
        self.assertGreater(data["summary"]["total_reading_seconds"], 0)

        # Leaderboard
        self.assertIn("top_articles", data)
        self.assertEqual(len(data["top_articles"]), 2)
        # Default sort by views -> art2 (120 views) should be rank 1
        self.assertEqual(data["top_articles"][0]["slug"], art2.slug)
        self.assertEqual(data["top_articles"][0]["rank"], 1)

    def test_author_analytics_overview_sorting(self):
        # Give self.article unhelpful feedback so score drops to 0%
        ArticleFeedback.objects.create(article=self.article, user=self.reader, is_helpful=False)

        art2 = Article.objects.create(
            title="Cloud Architecture",
            slug="cloud-architecture",
            content="AWS architecture.",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
            view_count=5,
        )
        # Give art2 100% helpfulness score
        ArticleFeedback.objects.create(article=art2, user=self.reader, is_helpful=True)

        self.client.force_authenticate(user=self.author)
        # Sort by views
        res_views = self.client.get("/api/v1/analytics/author-overview/?sort_by=views")
        self.assertEqual(res_views.status_code, 200)
        self.assertEqual(res_views.data["top_articles"][0]["slug"], self.article.slug)

        # Sort by rating
        res_rating = self.client.get("/api/v1/analytics/author-overview/?sort_by=rating")
        self.assertEqual(res_rating.status_code, 200)
        self.assertEqual(res_rating.data["top_articles"][0]["slug"], art2.slug)

    def test_author_analytics_overview_admin_filter(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/api/v1/analytics/author-overview/?author_id={self.author.id}"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["author"]["id"], str(self.author.id))

    def test_author_analytics_overview_empty_author(self):
        new_author = CustomUser.objects.create_user(
            username="new_author_zero",
            email="new_author_zero@company.com",
            password="Password123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.client.force_authenticate(user=new_author)
        res = self.client.get("/api/v1/analytics/author-overview/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["summary"]["total_articles"], 0)
        self.assertEqual(res.data["summary"]["total_portfolio_views"], 0)
        self.assertEqual(len(res.data["top_articles"]), 0)




