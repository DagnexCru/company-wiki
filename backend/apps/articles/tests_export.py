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

    def test_export_pdf_with_watermark_and_confidential(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=pdf&watermark=true&watermark_text=CONFIDENTIAL+RUNBOOK&classification=CONFIDENTIAL"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("application/pdf", res["Content-Type"])
        self.assertTrue(res.content.startswith(b"%PDF-"))
        # PDF with watermark & cover sheet is larger
        self.assertGreater(len(res.content), 2500)

    def test_export_pdf_minimal_no_cover(self):
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=pdf&include_cover=false&include_toc=false&classification=PUBLIC"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("application/pdf", res["Content-Type"])
        self.assertTrue(res.content.startswith(b"%PDF-"))

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

    def test_export_pdf_high_fidelity_elements(self):
        """
        Verify that high-fidelity elements (syntax-highlighted code, callouts, tables, images)
        are compiled without errors into a valid enterprise branded PDF.
        """
        hf_content = (
            "# Production Cluster Runbook\n\n"
            "This document outlines rollout procedures.\n\n"
            "> [!NOTE]\n"
            "> Ensure node draining finishes completely before performing OS updates.\n\n"
            "> [!WARNING]\n"
            "> Forcing pod evictions without pdb check may cause service disruption.\n\n"
            "## 1. Workload Specifications\n\n"
            "| Deployment | Replicas | CPU Limit | Memory Limit |\n"
            "| --- | --- | --- | --- |\n"
            "| `api-server` | 5 | 1000m | 2Gi |\n"
            "| `worker-daemon` | 3 | 500m | 1Gi |\n\n"
            "## 2. Rolling Update Snippet\n\n"
            "```bash\n"
            "kubectl set image deployment/api-server api=registry.internal/api:v2.4.0\n"
            "kubectl rollout status deployment/api-server\n"
            "```\n\n"
            "![Architecture Diagram](/media/diagrams/k8s_architecture.png)\n\n"
            "- Step 1: Verify health metrics\n"
            "- Step 2: Validate ingress traffic routing\n"
        )
        hf_article = Article.objects.create(
            title="High-Fidelity Enterprise Infrastructure Runbook",
            slug="hf-enterprise-infrastructure-runbook",
            summary="Mission-critical runbook featuring code blocks, callouts, and data tables.",
            content=hf_content,
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{hf_article.slug}/export/?format=pdf&classification=RESTRICTED&watermark=true"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("application/pdf", res["Content-Type"])
        self.assertTrue(res.content.startswith(b"%PDF-"))
        self.assertGreater(len(res.content), 3000)

    def test_export_pdf_preview_endpoint(self):
        """
        Verify that the PDF preview metadata endpoint returns document outline,
        estimated page counts, and high-fidelity element statistics.
        """
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/preview/?classification=CONFIDENTIAL&watermark=true"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["slug"], self.published_article.slug)
        self.assertEqual(data["classification"], "CONFIDENTIAL")
        self.assertTrue(data["watermark_enabled"])
        self.assertGreaterEqual(data["total_estimated_pages"], 2)
        self.assertIn("element_counts", data)
        self.assertIn("code_blocks", data["element_counts"])
        self.assertIn("pages", data)
        self.assertGreaterEqual(len(data["pages"]), 2)

    def test_export_preview_via_format_param(self):
        """
        Verify that passing format=preview to the unified export endpoint returns preview JSON.
        """
        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{self.published_article.slug}/export/?format=preview"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertIn("application/json", res["Content-Type"])
        data = res.json()
        self.assertEqual(data["title"], self.published_article.title)
        self.assertIn("total_estimated_pages", data)

    def test_export_standalone_html_interactive_features(self):
        """
        Verify that standalone HTML contains offline assets: theme switcher,
        governance matrix, callout cards, copy buttons, and print-to-paper CSS.
        """
        hf_content = (
            "# Standalone Offline Architecture\n\n"
            "> [!NOTE]\n"
            "> Offline standalone HTML works 100% air-gapped without CDN.\n\n"
            "> [!WARNING]\n"
            "> Ensure sensitive exports are not distributed outside technical boundaries.\n\n"
            "```python\n"
            "def offline_deploy():\n"
            "    return True\n"
            "```\n"
        )
        article = Article.objects.create(
            title="Air-Gapped Standalone HTML Architecture",
            slug="air-gapped-standalone-html-architecture",
            summary="Technical specifications for self-contained zero-dependency documents.",
            content=hf_content,
            author=self.author,
            category=self.category,
            status=Article.Status.PUBLISHED,
        )

        self.client.force_authenticate(user=self.reader)
        url = f"/api/v1/articles/{article.slug}/export/?format=html&classification=CONFIDENTIAL"
        res = self.client.get(url)

        self.assertEqual(res.status_code, 200)
        self.assertIn("text/html", res["Content-Type"])
        html_str = res.content.decode("utf-8")

        # 1. Zero external dependencies & DOCTYPE
        self.assertIn("<!DOCTYPE html>", html_str)
        self.assertNotIn("https://cdn.", html_str)
        self.assertNotIn("http://cdn.", html_str)

        # 2. Document Governance Matrix & Classification
        self.assertIn('meta name="classification" content="CONFIDENTIAL"', html_str)
        self.assertIn("matrix-table", html_str)
        self.assertIn("CONFIDENTIAL", html_str)
        self.assertIn("SECURITY & COMPLIANCE GOVERNANCE NOTICE", html_str)

        # 3. Interactive Theme Switcher
        self.assertIn("toggleTheme()", html_str)
        self.assertIn("company_wiki_html_theme", html_str)
        self.assertIn("prefers-color-scheme", html_str)

        # 4. GitHub-style Callouts
        self.assertIn("callout-card callout-note", html_str)
        self.assertIn("callout-card callout-warning", html_str)

        # 5. Code block copy-to-clipboard enhancements
        self.assertIn("code-block-wrapper", html_str)
        self.assertIn("copy-btn", html_str)

        # 6. Print-to-paper @media print styles
        self.assertIn("@media print", html_str)
