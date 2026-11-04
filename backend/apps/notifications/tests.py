import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.articles.models import Article, ArticleComment
from apps.taxonomy.models import Category
from apps.notifications.models import Notification
from apps.notifications.services import extract_mentions, parse_and_notify_mentions, notify_review_action

User = get_user_model()


class NotificationAndMentionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create test users
        self.admin = User.objects.create_user(
            email="admin_test@company.com",
            username="admin_test",
            password="Password123!",
            role=User.Role.ADMIN,
            full_name="Admin Test",
        )
        self.author = User.objects.create_user(
            email="author_test@company.com",
            username="author_test",
            password="Password123!",
            role=User.Role.AUTHOR,
            full_name="Author Test",
        )
        self.reviewer = User.objects.create_user(
            email="reviewer_test@company.com",
            username="reviewer_test",
            password="Password123!",
            role=User.Role.REVIEWER,
            full_name="Reviewer Test",
        )

        self.category = Category.objects.create(name="Engineering", slug="engineering")

        self.article = Article.objects.create(
            title="Notification Architecture Guide",
            slug="notification-architecture-guide",
            content="Initial architecture content with details.",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

    def test_extract_mentions_utility(self):
        text = "Hello @admin_test and @author_test! Please review with @david_none."
        mentions = extract_mentions(text)
        self.assertIn("admin_test", mentions)
        self.assertIn("author_test", mentions)
        self.assertIn("david_none", mentions)

    def test_parse_and_notify_mentions_creates_notifications(self):
        text = "Please review this architectural change @reviewer_test and @admin_test!"
        notifs = parse_and_notify_mentions(
            text=text,
            actor=self.author,
            link=f"/articles/{self.article.slug}",
            article=self.article,
        )
        self.assertEqual(len(notifs), 2)
        recipients = [n.recipient.username for n in notifs]
        self.assertIn("reviewer_test", recipients)
        self.assertIn("admin_test", recipients)
        for n in notifs:
            self.assertEqual(n.notification_type, Notification.NotificationType.MENTION)
            self.assertFalse(n.is_read)

    def test_mentioning_self_does_not_create_notification(self):
        text = "Note to self @author_test remember to add diagrams."
        notifs = parse_and_notify_mentions(
            text=text,
            actor=self.author,
            link=f"/articles/{self.article.slug}",
            article=self.article,
        )
        self.assertEqual(len(notifs), 0)

    def test_notify_review_action_submit(self):
        notifs = notify_review_action(self.article, self.author, "SUBMIT", feedback="Ready for review")
        # Reviewer and Admin should receive REVIEW_REQUESTED notification
        recipients = [n.recipient.username for n in notifs]
        self.assertIn("reviewer_test", recipients)
        self.assertIn("admin_test", recipients)

    def test_notify_review_action_approve(self):
        notifs = notify_review_action(self.article, self.reviewer, "APPROVE", feedback="LGTM!")
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].recipient, self.author)
        self.assertEqual(notifs[0].notification_type, Notification.NotificationType.REVIEW_APPROVED)

    def test_notify_review_action_reject(self):
        notifs = notify_review_action(self.article, self.reviewer, "REJECT", feedback="Needs more test coverage")
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0].recipient, self.author)
        self.assertEqual(notifs[0].notification_type, Notification.NotificationType.REVIEW_REJECTED)

    def test_notifications_api_list_and_unread_count(self):
        # Create unread notification for author
        Notification.objects.create(
            recipient=self.author,
            sender=self.reviewer,
            notification_type=Notification.NotificationType.MENTION,
            title="Mention alert",
            message="Check this out",
            link="/articles/test",
            article=self.article,
        )

        self.client.force_authenticate(user=self.author)

        # Unread count
        res_cnt = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(res_cnt.status_code, status.HTTP_200_OK)
        self.assertEqual(res_cnt.data["unread_count"], 1)

        # List
        res_list = self.client.get("/api/v1/notifications/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data["count"], 1)
        self.assertEqual(res_list.data["results"][0]["title"], "Mention alert")

    def test_notification_mark_as_read_and_mark_all_read(self):
        n1 = Notification.objects.create(
            recipient=self.author,
            sender=self.admin,
            notification_type=Notification.NotificationType.ARTICLE_UPDATED,
            title="Update 1",
            message="Message 1",
            article=self.article,
        )
        n2 = Notification.objects.create(
            recipient=self.author,
            sender=self.reviewer,
            notification_type=Notification.NotificationType.COMMENT,
            title="Comment 1",
            message="Message 2",
            article=self.article,
        )

        self.client.force_authenticate(user=self.author)

        # Mark single notification as read
        res_read = self.client.post(f"/api/v1/notifications/{n1.id}/read/")
        self.assertEqual(res_read.status_code, status.HTTP_200_OK)
        self.assertTrue(res_read.data["is_read"])
        self.assertEqual(res_read.data["unread_count"], 1)

        # Mark all as read
        res_all = self.client.post("/api/v1/notifications/mark-all-read/")
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertEqual(res_all.data["unread_count"], 0)

        # Verify in DB
        n2.refresh_from_db()
        self.assertTrue(n2.is_read)

    def test_article_comments_endpoint_and_mentions_trigger(self):
        self.client.force_authenticate(user=self.reviewer)

        # Post comment with mention of author
        comment_payload = {
            "content": "Please verify section 2 @author_test before we proceed.",
        }
        res_post = self.client.post(f"/api/v1/articles/{self.article.slug}/comments/", data=comment_payload)
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_post.data["author"]["username"], "reviewer_test")

        # Verify comment was created
        self.assertEqual(ArticleComment.objects.filter(article=self.article).count(), 1)

        # Verify mention notification created for author
        notif = Notification.objects.filter(recipient=self.author, notification_type=Notification.NotificationType.MENTION).first()
        self.assertIsNotNone(notif)
        self.assertIn("mentioned you", notif.title)

        # Get comments list
        res_get = self.client.get(f"/api/v1/articles/{self.article.slug}/comments/")
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_get.data), 1)

    def test_mention_suggestions_api(self):
        self.client.force_authenticate(user=self.author)
        res = self.client.get("/api/v1/auth/mention-suggestions/?q=admin")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        usernames = [u["username"] for u in res.data]
        self.assertIn("admin_test", usernames)
