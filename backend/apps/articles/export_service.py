import os
import io
import json
import zipfile
import datetime
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from apps.articles.models import Article, ArticleExportLog

try:
    import markdown
except ImportError:
    markdown = None


class BrandedNumberedCanvas:
    pass  # Placeholder, defined below


try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle,
        PageBreak,
        HRFlowable,
        KeepTogether,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch

    class BrandedNumberedCanvas(canvas.Canvas):
        """
        Two-pass canvas that computes dynamic total page count (Page X of Y),
        draws corporate running headers & footers, and applies diagonal watermarks.
        """
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self.draw_page_decorations(num_pages)
                super().showPage()
            super().save()

        def draw_page_decorations(self, total_pages):
            page_num = self._pageNumber
            width, height = self._pagesize

            # 1. Diagonal Watermark (if enabled)
            if getattr(self, "watermark_enabled", False):
                self.saveState()
                self.setFont("Helvetica-Bold", 36)
                self.setFillColor(colors.Color(0.82, 0.82, 0.85, alpha=0.30))
                self.translate(width / 2.0, height / 2.0)
                self.rotate(45)
                wm_text = getattr(self, "watermark_text", "CONFIDENTIAL")
                self.drawCentredString(0, 0, wm_text)
                self.restoreState()

            # 2. Skip running header and footer on cover page (page 1 when has_cover is True)
            if getattr(self, "has_cover", True) and page_num == 1:
                return

            # 3. Running Header on Content Pages
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#4f46e5"))
            self.drawString(54, height - 36, "COMPANY WIKI")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(130, height - 36, "|   Enterprise Knowledge Base")

            doc_cls = getattr(self, "classification", "INTERNAL")
            cls_colors = {
                "CONFIDENTIAL": "#dc2626",
                "RESTRICTED": "#d97706",
                "INTERNAL": "#4f46e5",
                "PUBLIC": "#059669",
            }
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor(cls_colors.get(doc_cls, "#4f46e5")))
            self.drawRightString(width - 54, height - 36, f"• {doc_cls}")

            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.75)
            self.line(54, height - 42, width - 54, height - 42)
            self.restoreState()

            # 4. Running Footer on Content Pages
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#94a3b8"))
            self.drawString(54, 34, "CompanyWiki Enterprise Edition  •  Confidential & Proprietary")

            page_str = f"Page {page_num} of {total_pages}"
            self.drawRightString(width - 54, 34, page_str)

            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.75)
            self.line(54, 46, width - 54, 46)
            self.restoreState()

except ImportError:
    pass


class ArticleExportService:
    """
    Unified Export Engine supporting multi-format transformations:
    - Markdown (.md) with structured YAML frontmatter
    - Standalone Offline HTML (.html) with embedded styles and metadata
    - ZIP Archive Bundle (.zip) with markdown, metadata manifest, attachments & readme
    - Branded PDF (.pdf) with corporate header, classification, and styling
    """

    @classmethod
    def export(cls, article: Article, export_format: str, request) -> HttpResponse:
        export_format = (export_format or "markdown").lower().strip()

        if export_format in ["md", "markdown"]:
            content, filename, content_type = cls.build_markdown(article, request)
            file_bytes = content.encode("utf-8")
        elif export_format == "html":
            content, filename, content_type = cls.build_standalone_html(article, request)
            file_bytes = content.encode("utf-8")
        elif export_format == "zip":
            file_bytes, filename, content_type = cls.build_zip_bundle(article, request)
        elif export_format == "pdf":
            file_bytes, filename, content_type = cls.build_branded_pdf(article, request)
        else:
            # Fallback to markdown
            export_format = "markdown"
            content, filename, content_type = cls.build_markdown(article, request)
            file_bytes = content.encode("utf-8")

        # Record audit log
        cls.log_export(
            article=article,
            user=request.user if request and request.user.is_authenticated else None,
            export_format=export_format,
            file_size_bytes=len(file_bytes),
            request=request,
        )

        response = HttpResponse(file_bytes, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["X-Export-Format"] = export_format
        response["X-Export-Size"] = str(len(file_bytes))
        return response

    @classmethod
    def build_markdown(cls, article: Article, request) -> tuple[str, str, str]:
        """
        Export article as clean, standard Markdown with rich YAML metadata frontmatter.
        """
        now = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        author_name = getattr(article.author, "full_name", "") or (article.author.username if article.author else "Unknown")
        category_name = article.category.name if article.category else "General"
        tags = [t.name for t in article.tags.all()] if hasattr(article, "tags") else []
        tags_str = ", ".join(f'"{t}"' for t in tags)

        frontmatter = (
            f"---\n"
            f"title: \"{article.title}\"\n"
            f"slug: \"{article.slug}\"\n"
            f"author: \"{author_name}\"\n"
            f"category: \"{category_name}\"\n"
            f"status: \"{article.status}\"\n"
            f"version: {getattr(article, 'current_version', 1)}\n"
            f"created_at: \"{article.created_at.strftime('%Y-%m-%d %H:%M:%S') if article.created_at else ''}\"\n"
            f"updated_at: \"{article.updated_at.strftime('%Y-%m-%d %H:%M:%S') if article.updated_at else ''}\"\n"
            f"exported_at: \"{now}\"\n"
            f"tags: [{tags_str}]\n"
            f"---\n\n"
        )

        body_parts = [frontmatter]
        body_parts.append(f"# {article.title}\n\n")

        if article.summary:
            body_parts.append(f"> **Document Summary**: {article.summary}\n\n")

        body_parts.append(article.content or "")
        body_parts.append("\n\n---\n*Exported from CompanyWiki Enterprise Knowledge Base*\n")

        full_md = "".join(body_parts)
        filename = f"{article.slug}.md"
        return full_md, filename, "text/markdown; charset=utf-8"

    @classmethod
    def build_standalone_html(cls, article: Article, request) -> tuple[str, str, str]:
        """
        Export article as a self-contained offline HTML document with inline typography.
        """
        author_name = getattr(article.author, "full_name", "") or (article.author.username if article.author else "Unknown")
        category_name = article.category.name if article.category else "General"
        now = timezone.now().strftime("%B %d, %Y at %H:%M UTC")

        # Convert markdown content to HTML
        raw_content = article.content or ""
        if markdown:
            rendered_body = markdown.markdown(
                raw_content,
                extensions=["extra", "codehilite", "toc", "tables"],
            )
        else:
            # Basic fallback HTML escape
            rendered_body = f"<pre style='white-space: pre-wrap;'>{raw_content}</pre>"

        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{article.title} - CompanyWiki</title>
  <style>
    :root {{
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --brand-color: #4f46e5;
      --brand-light: #eef2ff;
    }}
    @media (prefers-color-scheme: dark) {{
      :root {{
        --bg-color: #0b0f19;
        --card-bg: #111827;
        --text-main: #f3f4f6;
        --text-muted: #9ca3af;
        --border-color: #1f2937;
        --brand-color: #6366f1;
        --brand-light: #1e1b4b;
      }}
    }}
    body {{
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--text-main);
      margin: 0;
      padding: 24px;
      line-height: 1.6;
    }}
    .document-container {{
      max-width: 860px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }}
    .header-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }}
    .brand-pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--brand-light);
      color: var(--brand-color);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .doc-meta {{
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 12px;
      flex-wrap: wrap;
    }}
    .doc-title {{
      font-size: 2rem;
      font-weight: 800;
      margin: 16px 0 8px 0;
      line-height: 1.25;
      letter-spacing: -0.025em;
    }}
    .doc-summary {{
      background: var(--brand-light);
      border-left: 4px solid var(--brand-color);
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 14px;
      color: var(--text-main);
      margin: 20px 0;
    }}
    .content-body {{
      margin-top: 32px;
    }}
    .content-body h1, .content-body h2, .content-body h3 {{
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-top: 28px;
      margin-bottom: 12px;
    }}
    .content-body pre {{
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 12px;
      overflow-x: auto;
      font-size: 13px;
    }}
    .content-body code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: rgba(148, 163, 184, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
    }}
    .content-body pre code {{
      background: transparent;
      padding: 0;
    }}
    .content-body table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }}
    .content-body th, .content-body td {{
      border: 1px solid var(--border-color);
      padding: 10px 14px;
      text-align: left;
    }}
    .content-body th {{
      background: rgba(148, 163, 184, 0.1);
      font-weight: 600;
    }}
    .footer-bar {{
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
  </style>
</head>
<body>
  <div class="document-container">
    <div class="header-bar">
      <div class="brand-pill">
        <span>CompanyWiki Knowledge Base</span>
      </div>
      <div style="font-size: 11px; color: var(--text-muted);">
        Classification: <strong>INTERNAL DOCUMENT</strong>
      </div>
    </div>

    <h1 class="doc-title">{article.title}</h1>

    <div class="doc-meta">
      <span><strong>Category:</strong> {category_name}</span>
      <span><strong>Author:</strong> {author_name}</span>
      <span><strong>Status:</strong> {article.status.upper()}</span>
      <span><strong>Exported:</strong> {now}</span>
    </div>

    {f'<div class="doc-summary"><strong>Summary:</strong> {article.summary}</div>' if article.summary else ''}

    <div class="content-body">
      {rendered_body}
    </div>

    <div class="footer-bar">
      <span>CompanyWiki Enterprise Edition &bull; Confidential & Internal Use Only</span>
      <span>Generated offline &bull; {now}</span>
    </div>
  </div>
</body>
</html>"""

        filename = f"{article.slug}.html"
        return html_template, filename, "text/html; charset=utf-8"

    @classmethod
    def build_zip_bundle(cls, article: Article, request) -> tuple[bytes, str, str]:
        """
        Export article as an offline ZIP Archive Bundle containing:
        - content.md (clean markdown)
        - metadata.json (rich structured manifest)
        - README.txt (citation notice and license)
        - attachments/ (associated media & uploaded files)
        """
        now = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        author_name = getattr(article.author, "full_name", "") or (article.author.username if article.author else "Unknown")
        category_name = article.category.name if article.category else "General"
        tags = [t.name for t in article.tags.all()] if hasattr(article, "tags") else []

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # 1. content.md
            md_content, _, _ = cls.build_markdown(article, request)
            zip_file.writestr(f"{article.slug}/content.md", md_content)

            # 2. metadata.json
            manifest = {
                "title": article.title,
                "slug": article.slug,
                "author": {
                    "username": article.author.username if article.author else "",
                    "full_name": author_name,
                    "email": article.author.email if article.author else "",
                },
                "category": category_name,
                "status": article.status,
                "tags": tags,
                "view_count": article.view_count,
                "created_at": article.created_at.isoformat() if article.created_at else None,
                "updated_at": article.updated_at.isoformat() if article.updated_at else None,
                "exported_at": now,
                "bundle_version": "1.0",
                "format": "company_wiki_archive_bundle",
            }
            zip_file.writestr(
                f"{article.slug}/metadata.json",
                json.dumps(manifest, indent=2, ensure_ascii=False),
            )

            # 3. README.txt
            readme = (
                f"CompanyWiki Document Archive Bundle\n"
                f"===================================\n\n"
                f"Document: {article.title}\n"
                f"Slug: {article.slug}\n"
                f"Category: {category_name}\n"
                f"Exported At: {now}\n\n"
                f"Contents of this archive:\n"
                f"- content.md: Complete document body formatted in GitHub-compatible Markdown.\n"
                f"- metadata.json: Structured document attributes, ownership and tags.\n"
                f"- attachments/: Extracted attachments and assets.\n\n"
                f"Notice: This document contains internal proprietary information.\n"
                f"Distribution outside the enterprise workspace requires security clearance.\n"
            )
            zip_file.writestr(f"{article.slug}/README.txt", readme)

            # 4. Attachments (if any exist)
            if hasattr(article, "attachments"):
                for att in article.attachments.all():
                    if att.file and os.path.exists(att.file.path):
                        zip_file.write(
                            att.file.path,
                            arcname=f"{article.slug}/attachments/{os.path.basename(att.file.name)}",
                        )

        zip_bytes = buffer.getvalue()
        filename = f"{article.slug}_bundle.zip"
        return zip_bytes, filename, "application/zip"

    @classmethod
    def build_branded_pdf(cls, article: Article, request) -> tuple[bytes, str, str]:
        """
        Enterprise Branded PDF Engine:
        - Executive Cover Page with corporate header, metadata matrix & compliance notice
        - Two-pass NumberedCanvas calculating 'Page X of Y' total page counts
        - Dynamic running headers, footers & diagonal watermark
        - Automated Table of Contents with section hierarchy
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate,
                Paragraph,
                Spacer,
                Table,
                TableStyle,
                HRFlowable,
                PageBreak,
            )
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch

            # 1. Parse Query Options
            include_cover = True
            watermark_enabled = False
            watermark_text = "CONFIDENTIAL - INTERNAL"
            classification = "INTERNAL"
            include_toc = True

            if request and hasattr(request, "query_params"):
                qp = request.query_params
                include_cover = qp.get("include_cover", "true").lower() in ["true", "1", "yes"]
                watermark_enabled = qp.get("watermark", "false").lower() in ["true", "1", "yes"]
                wm_val = qp.get("watermark_text", "").strip()
                if wm_val:
                    watermark_text = wm_val
                cls_val = qp.get("classification", "INTERNAL").upper().strip()
                if cls_val in ["CONFIDENTIAL", "INTERNAL", "RESTRICTED", "PUBLIC"]:
                    classification = cls_val
                include_toc = qp.get("include_toc", "true").lower() in ["true", "1", "yes"]

            cls_theme = {
                "CONFIDENTIAL": {"color": "#dc2626", "bg": "#fef2f2", "border": "#fca5a5"},
                "RESTRICTED": {"color": "#d97706", "bg": "#fffbeb", "border": "#fcd34d"},
                "INTERNAL": {"color": "#4f46e5", "bg": "#eef2ff", "border": "#c7d2fe"},
                "PUBLIC": {"color": "#059669", "bg": "#ecfdf5", "border": "#a7f3d0"},
            }.get(classification, {"color": "#4f46e5", "bg": "#eef2ff", "border": "#c7d2fe"})

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=54,
                leftMargin=54,
                topMargin=54,
                bottomMargin=54,
            )

            styles = getSampleStyleSheet()

            cover_title_style = ParagraphStyle(
                "CoverTitle",
                parent=styles["Heading1"],
                fontSize=26,
                leading=32,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=12,
                fontName="Helvetica-Bold",
            )
            body_style = ParagraphStyle(
                "DocBody",
                parent=styles["Normal"],
                fontSize=10,
                leading=15,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=10,
            )
            summary_style = ParagraphStyle(
                "CoverSummary",
                parent=styles["Normal"],
                fontSize=10,
                leading=15,
                textColor=colors.HexColor("#1e1b4b"),
                backColor=colors.HexColor("#f8fafc"),
                borderPadding=12,
                spaceAfter=16,
            )
            toc_heading_style = ParagraphStyle(
                "TocHeading",
                parent=styles["Heading2"],
                fontSize=14,
                leading=18,
                textColor=colors.HexColor("#1e1b4b"),
                fontName="Helvetica-Bold",
                spaceBefore=14,
                spaceAfter=10,
            )
            toc_item_style = ParagraphStyle(
                "TocItem",
                parent=styles["Normal"],
                fontSize=9,
                leading=14,
                textColor=colors.HexColor("#334155"),
            )

            elements = []

            now_str = timezone.now().strftime("%Y-%m-%d %H:%M UTC")
            author_name = getattr(article.author, "full_name", "") or (article.author.username if article.author else "Unknown")
            author_email = getattr(article.author, "email", "N/A") if article.author else "N/A"
            cat_name = article.category.name if article.category else "General"
            created_str = article.created_at.strftime("%Y-%m-%d") if article.created_at else "N/A"
            updated_str = article.updated_at.strftime("%Y-%m-%d") if article.updated_at else "N/A"
            version_str = f"v{getattr(article, 'current_version', 1)}.0"

            # ==========================================
            # 1. EXECUTIVE COVER SHEET (If Enabled)
            # ==========================================
            if include_cover:
                # Top Branding & Security Badge Header
                top_badge_table = Table(
                    [[
                        Paragraph("<b>COMPANY WIKI</b><br/><font size='8' color='#64748b'>ENTERPRISE STANDARD OPERATING PROCEDURE</font>", ParagraphStyle("TopL", fontSize=11, leading=14, textColor=colors.HexColor("#4f46e5"), fontName="Helvetica-Bold")),
                        Paragraph(f"<b><font color='{cls_theme['color']}'>[ • {classification} ]</font></b>", ParagraphStyle("TopR", fontSize=10, alignment=2, fontName="Helvetica-Bold")),
                    ]],
                    colWidths=[4.2 * inch, 2.8 * inch],
                )
                top_badge_table.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]))
                elements.append(top_badge_table)
                elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor(cls_theme["color"]), spaceAfter=24))

                # Large Cover Document Title
                elements.append(Paragraph(article.title, cover_title_style))

                # Executive Summary Box
                if article.summary:
                    elements.append(Paragraph(f"<b>Executive Summary & Scope:</b><br/>{article.summary}", summary_style))

                elements.append(Spacer(1, 10))

                # Document Governance & Metadata Matrix Table
                meta_rows = [
                    [
                        Paragraph("<b>Document Identifier:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"SOP-{article.slug.upper()[:20]}", ParagraphStyle("MR", fontSize=8, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))),
                        Paragraph("<b>Classification:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"<b><font color='{cls_theme['color']}'>{classification}</font></b>", ParagraphStyle("MR", fontSize=8)),
                    ],
                    [
                        Paragraph("<b>Primary Author:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{author_name}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                        Paragraph("<b>Author Contact:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{author_email}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                    ],
                    [
                        Paragraph("<b>Department Domain:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{cat_name}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                        Paragraph("<b>Document Lifecycle:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{article.status.upper()}", ParagraphStyle("MR", fontSize=8, fontName="Helvetica-Bold", textColor=colors.HexColor("#0f172a"))),
                    ],
                    [
                        Paragraph("<b>Release Version:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{version_str}", ParagraphStyle("MR", fontSize=8, fontName="Helvetica-Bold", textColor=colors.HexColor("#4f46e5"))),
                        Paragraph("<b>Effective Date:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{updated_str}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                    ],
                    [
                        Paragraph("<b>Published Date:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{created_str}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                        Paragraph("<b>Export Timestamp:</b>", ParagraphStyle("ML", fontSize=8, textColor=colors.HexColor("#64748b"))),
                        Paragraph(f"{now_str}", ParagraphStyle("MR", fontSize=8, textColor=colors.HexColor("#0f172a"))),
                    ],
                ]

                meta_table = Table(meta_rows, colWidths=[1.8 * inch, 2.0 * inch, 1.6 * inch, 1.6 * inch])
                meta_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]))
                elements.append(meta_table)

                elements.append(Spacer(1, 40))

                # Legal & Security Compliance Notice
                compliance_notice = (
                    "<b>SECURITY & COMPLIANCE GOVERNANCE NOTICE:</b><br/>"
                    "This document contains proprietary operational knowledge and trade secrets of CompanyWiki. "
                    "Authorized access is restricted to verified enterprise personnel. Any unauthorized printing, "
                    "copying, distribution, or external sharing without approval from the Technical Governance Board "
                    "is strictly prohibited and may result in disciplinary action under information security policies."
                )
                elements.append(Paragraph(
                    compliance_notice,
                    ParagraphStyle("Notice", fontSize=7.5, leading=11, textColor=colors.HexColor("#64748b"), backColor=colors.HexColor("#f1f5f9"), borderPadding=8)
                ))

                # End of Cover Page
                elements.append(PageBreak())

            # ==========================================
            # 2. TABLE OF CONTENTS (If Enabled)
            # ==========================================
            raw_content = article.content or ""
            headings = []
            for line in raw_content.split("\n"):
                s = line.strip()
                if s.startswith("# "):
                    headings.append((1, s[2:].strip()))
                elif s.startswith("## "):
                    headings.append((2, s[3:].strip()))
                elif s.startswith("### "):
                    headings.append((3, s[4:].strip()))

            if include_toc and headings:
                elements.append(Paragraph("Table of Contents", toc_heading_style))
                elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

                toc_table_data = []
                for idx, (level, title) in enumerate(headings, 1):
                    indent = "&nbsp;" * (level - 1) * 4
                    prefix = f"{idx}." if level == 1 else "&bull;"
                    row_text = f"{indent}<b>{prefix}</b> {title}"
                    toc_table_data.append([
                        Paragraph(row_text, toc_item_style),
                        Paragraph(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .", ParagraphStyle("Dots", fontSize=8, textColor=colors.HexColor("#cbd5e1"), alignment=2)),
                        Paragraph(f"Section {level}", ParagraphStyle("Sec", fontSize=8, textColor=colors.HexColor("#94a3b8"), alignment=2)),
                    ])

                toc_table = Table(toc_table_data, colWidths=[4.2 * inch, 2.0 * inch, 0.8 * inch])
                toc_table.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]))
                elements.append(toc_table)
                elements.append(Spacer(1, 20))
                elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=18))

            # ==========================================
            # 3. BODY CONTENT SECTIONS
            # ==========================================
            # If no cover sheet, add header title at top of content
            if not include_cover:
                elements.append(Paragraph(article.title, cover_title_style))
                elements.append(Paragraph(f"<b>Author:</b> {author_name} | <b>Category:</b> {cat_name} | <b>Classification:</b> {classification}", ParagraphStyle("HdrMeta", fontSize=9, textColor=colors.HexColor("#64748b"), spaceAfter=12)))
                if article.summary:
                    elements.append(Paragraph(f"<b>Summary:</b> {article.summary}", summary_style))

            paragraphs = raw_content.split("\n\n")
            for p in paragraphs:
                clean_p = p.strip()
                if not clean_p:
                    continue
                if clean_p.startswith("# "):
                    elements.append(Paragraph(clean_p[2:], ParagraphStyle("H1_body", fontSize=16, leading=20, textColor=colors.HexColor("#0f172a"), fontName="Helvetica-Bold", spaceBefore=16, spaceAfter=8)))
                elif clean_p.startswith("## "):
                    elements.append(Paragraph(clean_p[3:], ParagraphStyle("H2_body", fontSize=13, leading=17, textColor=colors.HexColor("#1e293b"), fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=6)))
                elif clean_p.startswith("### "):
                    elements.append(Paragraph(clean_p[4:], ParagraphStyle("H3_body", fontSize=11, leading=15, textColor=colors.HexColor("#334155"), fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4)))
                elif clean_p.startswith("> "):
                    # Blockquote / Callout
                    quote_text = clean_p[2:].replace("\n", " ")
                    elements.append(Paragraph(f"<b>Note:</b> {quote_text}", ParagraphStyle("Quote", fontSize=9.5, leading=14, textColor=colors.HexColor("#1e293b"), backColor=colors.HexColor("#f8fafc"), borderPadding=8, spaceBefore=8, spaceAfter=8)))
                elif clean_p.startswith("```"):
                    # Monospace Code Block
                    lines = clean_p.split("\n")
                    code_body = "<br/>".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                    elements.append(Paragraph(f"<font face='Courier' color='#f8fafc'>{code_body}</font>", ParagraphStyle("CodeBlock", fontSize=8.5, leading=12, backColor=colors.HexColor("#0f172a"), borderPadding=10, spaceBefore=8, spaceAfter=8)))
                else:
                    formatted_p = clean_p.replace("**", "<b>").replace("__", "<b>")
                    formatted_p = formatted_p.replace("\n", "<br/>")
                    elements.append(Paragraph(formatted_p, body_style))

            elements.append(Spacer(1, 24))
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=15, spaceAfter=8))
            elements.append(Paragraph(f"CompanyWiki Enterprise Edition • {classification} • End of Document", ParagraphStyle("Ftr", fontSize=8, textColor=colors.HexColor("#94a3b8"), alignment=1)))

            # Canvasmaker closure to pass dynamic config
            def make_canvas(*args, **kwargs):
                c = BrandedNumberedCanvas(*args, **kwargs)
                c.has_cover = include_cover
                c.watermark_enabled = watermark_enabled
                c.watermark_text = watermark_text
                c.classification = classification
                return c

            doc.build(elements, canvasmaker=make_canvas)
            pdf_bytes = buffer.getvalue()
            filename = f"{article.slug}.pdf"
            return pdf_bytes, filename, "application/pdf"

        except Exception as e:
            # Fallback to standalone HTML if ReportLab fails
            html_content, _, _ = cls.build_standalone_html(article, request)
            filename = f"{article.slug}.html"
            return html_content.encode("utf-8"), filename, "text/html; charset=utf-8"

    @classmethod
    def log_export(cls, article: Article, user, export_format: str, file_size_bytes: int, request) -> None:
        """
        Record export action into ArticleExportLog.
        """
        try:
            ip_addr = None
            if request:
                x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                if x_forwarded_for:
                    ip_addr = x_forwarded_for.split(",")[0].strip()
                else:
                    ip_addr = request.META.get("REMOTE_ADDR")

            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""

            ArticleExportLog.objects.create(
                article=article,
                user=user,
                export_format=export_format,
                file_size_bytes=file_size_bytes,
                ip_address=ip_addr,
                user_agent=user_agent,
            )
        except Exception:
            pass
