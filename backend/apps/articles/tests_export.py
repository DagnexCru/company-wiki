import io
import zipfile
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleExportLog
from apps.taxonomy.models import Category


class MultiFormatExportSuiteTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.author = CustomUser.objects.create_user(
            username="author_export",
            email="author_export@company.com",
            password="Password123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.reader = CustomUser.objects.create_user(
            username="reader_export",
            email="reader_export@company.com",
            password="Password123!",
            role=CustomUser.Role.READER,
        )
        self.admin = CustomUser.objects.create_user(
            username="admin_export",
            email="admin_export@company.com",
            password="Password123!",
            role=CustomUser.Role.ADMIN,
        )

        self.category = Category.objects.create(name="Engineering", slug="engineering")

        self.published_article = Article.objects.create(
            title="Kubernetes Zero-Downtime Deployment Runbook",
            slug="k8s-zero-downtime-deployment-runbook",
            summary="Step-by-step procedures for zero-downtime rolling deployments.",
            content="# Kubernetes Deployment\n\nFollow these guidelines:\n- Step 1: Drain node\n- Step 2: Rollout\n\n```bash\nkubectl rollout status\n```",
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
            view_count=42,
        )

        self.draft_article = Article.objects.create(
            title="Internal Secret Architecture Proposal",
            slug="internal-secret-architecture-proposal",
            summary="Confidential architecture draft.",
            content="# Draft Secret\n\nUnder active development.",
            author=self.author,
            category=self.category,
            status=Article.Status.DRAFT,
            view_count=0,
        )

    def test_export_unauthenticated_returns_401(self):
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=markdown"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 401)

    def test_export_markdown_published_article(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=markdown"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("text/markdown", res["Content-Type"])
        self.assertIn(f"{self.published_article.slug}.md", res["Content-Disposition"])

        content = res.content.decode("utf-8")
        self.assertIn(f'title: "{self.published_article.title}"', content)
        self.assertIn(f'author: "{self.author.username}"', content)
        self.assertIn(f'category: "{self.category.name}"', content)
        self.assertIn("# Kubernetes Deployment", content)
        self.assertIn("kubectl rollout status", content)

        # Check export log was created
        log = ArticleExportLog.objects.filter(article=self.published_article, export_format="markdown").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.reader)
        self.assertGreater(log.file_size_bytes, 0)

    def test_export_standalone_html(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=html"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res["Content-Type"])
        self.assertIn(f"{self.published_article.slug}.html", res["Content-Disposition"])

        html_text = res.content.decode("utf-8")
        self.assertIn("<!DOCTYPE html>", html_text)
        self.assertIn("CompanyWiki Knowledge Base", html_text)
        self.assertIn(self.published_article.title, html_text)
        self.assertIn(self.published_article.summary, html_text)

        log = ArticleExportLog.objects.filter(article=self.published_article, export_format="html").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.reader)

    def test_export_zip_bundle(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=zip"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("application/zip", res["Content-Type"])
        self.assertIn(f"{self.published_article.slug}_bundle.zip", res["Content-Disposition"])

        # Validate ZIP contents
        zip_buf = io.BytesIO(res.content)
        with zipfile.ZipFile(zip_buf, "r") as zf:
            file_names = zf.namelist()
            slug = self.published_article.slug
            self.assertIn(f"{slug}/content.md", file_names)
            self.assertIn(f"{slug}/metadata.json", file_names)
            self.assertIn(f"{slug}/README.txt", file_names)

            # Check metadata.json parsing
            meta_bytes = zf.read(f"{slug}/metadata.json")
            import json
            meta_json = json.loads(meta_bytes.decode("utf-8"))
            self.assertEqual(meta_json["slug"], slug)
            self.assertEqual(meta_json["title"], self.published_article.title)

        log = ArticleExportLog.objects.filter(article=self.published_article, export_format="zip").first()
        self.assertIsNotNone(log)

    def test_export_branded_pdf(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=pdf"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("application/pdf", res["Content-Type"])
        self.assertIn(f"{self.published_article.slug}.pdf", res["Content-Disposition"])
        # Standard PDF files start with %PDF-
        self.assertTrue(res.content.startswith(b"%PDF-"))

        log = ArticleExportLog.objects.filter(article=self.published_article, export_format="pdf").first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.reader)

    def test_draft_export_permissions(self):
        url = f"/api/v1/articles/{self.draft_article.slug}/export/?format=markdown"

        # Reader trying to export draft -> 403 Forbidden
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.get(url)
        self.assertEqual(res_reader.status_code, 403)

        # Author exporting their own draft -> 200 OK
        self.client.force_authenticate(user=self.author)
        res_author = self.client.get(url)
        self.assertEqual(res_author.status_code, 200)

        # Admin exporting draft -> 200 OK
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(url)
        self.assertEqual(res_admin.status_code, 200)
