from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleInlineAnnotation
from apps.taxonomy.models import Category


class ArticleInlineAnnotationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.author = CustomUser.objects.create_user(
            username="author_annotator",
            email="author_annotator@company.com",
            password="Password123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.peer_reviewer = CustomUser.objects.create_user(
            username="peer_reviewer",
            email="reviewer@company.com",
            password="Password123!",
            role=CustomUser.Role.REVIEWER,
        )
        self.reader = CustomUser.objects.create_user(
            username="reader_user",
            email="reader@company.com",
            password="Password123!",
            role=CustomUser.Role.READER,
        )
        self.admin = CustomUser.objects.create_user(
            username="admin_user",
            email="admin@company.com",
            password="Password123!",
            role=CustomUser.Role.ADMIN,
        )

        self.category = Category.objects.create(name="DevOps", slug="devops")

        self.published_article = Article.objects.create(
            title="Production Incident Postmortem Best Practices",
            slug="production-incident-postmortem-best-practices",
            summary="A comprehensive guide to blameless postmortems.",
            content=(
                "# Postmortem Guidelines\n\n"
                "Blameless postmortems foster high psychological safety across teams.\n\n"
                "Ensure action items have clear assignees and strict deadlines."
            ),
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

        self.draft_article = Article.objects.create(
            title="Confidential Zero-Trust Network Roadmap",
            slug="confidential-zero-trust-network-roadmap",
            summary="Upcoming security initiatives.",
            content="Internal planning document for enterprise perimeter.",
            author=self.author,
            category=self.category,
            status=Article.Status.DRAFT,
        )

    def test_unauthenticated_cannot_access_annotations(self):
        url = f"/api/v1/articles/{self.published_article.slug}/annotations/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_list_inline_annotation(self):
        self.client.force_authenticate(user=self.peer_reviewer)
        url = f"/api/v1/articles/{self.published_article.slug}/annotations/"

        payload = {
            "highlighted_text": "Blameless postmortems",
            "start_offset": 24,
            "end_offset": 45,
            "anchor_context_before": "# Postmortem Guidelines\n\n",
            "anchor_context_after": " foster high psychological",
            "content": "Can we cite Etsy's original blameless postmortem philosophy here?",
        }

        res_create = self.client.post(url, payload, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        ann_data = res_create.json()
        self.assertEqual(ann_data["highlighted_text"], payload["highlighted_text"])
        self.assertEqual(ann_data["author"]["username"], self.peer_reviewer.username)
        self.assertEqual(ann_data["status"], "open")
        self.assertTrue(ann_data["is_own"])

        ann_id = ann_data["id"]

        # List annotations
        res_list = self.client.get(url)
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        items = res_list.json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], ann_id)

    def test_filter_annotations_by_status(self):
        self.client.force_authenticate(user=self.author)

        # Create 2 annotations: 1 open, 1 resolved
        ann_open = ArticleInlineAnnotation.objects.create(
            article=self.published_article,
            author=self.peer_reviewer,
            highlighted_text="psychological safety",
            start_offset=58,
            end_offset=78,
            content="Great emphasis on psychological safety.",
            status=ArticleInlineAnnotation.Status.OPEN,
        )

        ann_resolved = ArticleInlineAnnotation.objects.create(
            article=self.published_article,
            author=self.peer_reviewer,
            highlighted_text="strict deadlines",
            start_offset=128,
            end_offset=144,
            content="Fixed typo in deadline guidance.",
            status=ArticleInlineAnnotation.Status.RESOLVED,
            resolved_by=self.author,
        )

        url = f"/api/v1/articles/{self.published_article.slug}/annotations/"

        # All
        res_all = self.client.get(f"{url}?status=all")
        self.assertEqual(res_all.status_code, 200)
        self.assertEqual(len(res_all.json()), 2)

        # Open only
        res_open = self.client.get(f"{url}?status=open")
        self.assertEqual(res_open.status_code, 200)
        self.assertEqual(len(res_open.json()), 1)
        self.assertEqual(res_open.json()[0]["id"], str(ann_open.id))

        # Resolved only
        res_res = self.client.get(f"{url}?status=resolved")
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(len(res_res.json()), 1)
        self.assertEqual(res_res.json()[0]["id"], str(ann_resolved.id))

    def test_resolve_and_reopen_annotation(self):
        self.client.force_authenticate(user=self.author)

        ann = ArticleInlineAnnotation.objects.create(
            article=self.published_article,
            author=self.peer_reviewer,
            highlighted_text="action items",
            start_offset=90,
            end_offset=102,
            content="Should action items link directly to Jira tickets?",
            status=ArticleInlineAnnotation.Status.OPEN,
        )

        resolve_url = f"/api/v1/articles/{self.published_article.slug}/annotations/{ann.id}/resolve/"
        res_resolve = self.client.post(resolve_url)
        self.assertEqual(res_resolve.status_code, 200)
        self.assertEqual(res_resolve.json()["status"], "resolved")
        self.assertEqual(res_resolve.json()["resolved_by"]["username"], self.author.username)

        # Reopen
        reopen_url = f"/api/v1/articles/{self.published_article.slug}/annotations/{ann.id}/reopen/"
        res_reopen = self.client.post(reopen_url)
        self.assertEqual(res_reopen.status_code, 200)
        self.assertEqual(res_reopen.json()["status"], "open")
        self.assertIsNone(res_reopen.json()["resolved_by"])

    def test_edit_and_delete_annotation_permissions(self):
        # Peer reviewer creates annotation
        ann = ArticleInlineAnnotation.objects.create(
            article=self.published_article,
            author=self.peer_reviewer,
            highlighted_text="clear assignees",
            content="Who owns unassigned items?",
        )

        detail_url = f"/api/v1/articles/{self.published_article.slug}/annotations/{ann.id}/"

        # Reader trying to edit -> 403 Forbidden
        self.client.force_authenticate(user=self.reader)
        res_edit_forbidden = self.client.patch(detail_url, {"content": "Hacked content"})
        self.assertEqual(res_edit_forbidden.status_code, 403)

        # Peer reviewer edits own annotation -> 200 OK
        self.client.force_authenticate(user=self.peer_reviewer)
        res_edit_ok = self.client.patch(detail_url, {"content": "Updated: Who owns unassigned items during escalations?"})
        self.assertEqual(res_edit_ok.status_code, 200)
        self.assertIn("escalations", res_edit_ok.json()["content"])

        # Delete annotation
        res_del = self.client.delete(detail_url)
        self.assertEqual(res_del.status_code, 204)
        self.assertFalse(ArticleInlineAnnotation.objects.filter(id=ann.id).exists())

    def test_draft_article_annotation_access(self):
        url = f"/api/v1/articles/{self.draft_article.slug}/annotations/"

        # Reader trying to view draft annotations -> 403 Forbidden
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get(url)
        self.assertEqual(res_reader.status_code, 403)

        # Author can access draft annotations -> 200 OK
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get(url)
        self.assertEqual(res_author.status_code, 200)
