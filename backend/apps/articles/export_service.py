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
        Export article as a Branded PDF document using ReportLab (or fallback to clean print stream).
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch

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

            # Custom styles
            title_style = ParagraphStyle(
                "DocTitle",
                parent=styles["Heading1"],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor("#1e1b4b"),
                spaceAfter=10,
                fontName="Helvetica-Bold",
            )
            meta_style = ParagraphStyle(
                "DocMeta",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.HexColor("#64748b"),
                spaceAfter=6,
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
                "DocSummary",
                parent=styles["Normal"],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#312e81"),
                backColor=colors.HexColor("#eef2ff"),
                borderPadding=10,
                spaceAfter=15,
            )

            elements = []

            # Corporate Header Banner
            header_table = Table(
                [[
                    Paragraph("<b>COMPANY WIKI</b> &bull; Knowledge Base", ParagraphStyle("H1", fontSize=9, textColor=colors.HexColor("#4f46e5"))),
                    Paragraph("<b>CLASSIFICATION: INTERNAL</b>", ParagraphStyle("H2", fontSize=9, alignment=2, textColor=colors.HexColor("#dc2626"))),
                ]],
                colWidths=[3.5 * inch, 3.5 * inch],
            )
            header_table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            elements.append(header_table)
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=15))

            # Article Title
            elements.append(Paragraph(article.title, title_style))

            # Metadata Strip
            author_name = getattr(article.author, "full_name", "") or (article.author.username if article.author else "Unknown")
            cat_name = article.category.name if article.category else "General"
            now_str = timezone.now().strftime("%Y-%m-%d %H:%M UTC")

            meta_text = f"<b>Author:</b> {author_name} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Category:</b> {cat_name} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Status:</b> {article.status.upper()} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Exported:</b> {now_str}"
            elements.append(Paragraph(meta_text, meta_style))
            elements.append(Spacer(1, 12))

            # Summary Box
            if article.summary:
                elements.append(Paragraph(f"<b>Summary:</b> {article.summary}", summary_style))

            # Body Paragraphs
            content_text = article.content or ""
            # Break paragraphs by double newlines
            paragraphs = content_text.split("\n\n")
            for p in paragraphs:
                clean_p = p.strip()
                if not clean_p:
                    continue
                if clean_p.startswith("# "):
                    elements.append(Paragraph(clean_p[2:], ParagraphStyle("H1_body", parent=title_style, fontSize=16, leading=20, spaceBefore=14)))
                elif clean_p.startswith("## "):
                    elements.append(Paragraph(clean_p[3:], ParagraphStyle("H2_body", parent=title_style, fontSize=13, leading=17, spaceBefore=10)))
                elif clean_p.startswith("### "):
                    elements.append(Paragraph(clean_p[4:], ParagraphStyle("H3_body", parent=title_style, fontSize=11, leading=15, spaceBefore=8)))
                else:
                    # Clean markdown bold/italic basic markers
                    formatted_p = clean_p.replace("**", "<b>").replace("__", "<b>")
                    formatted_p = formatted_p.replace("\n", "<br/>")
                    elements.append(Paragraph(formatted_p, body_style))

            elements.append(Spacer(1, 20))
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=15, spaceAfter=8))
            elements.append(Paragraph("CompanyWiki Enterprise Edition &bull; Confidential &bull; Generated for Authorized Personnel Only", ParagraphStyle("Ftr", fontSize=8, textColor=colors.HexColor("#94a3b8"), alignment=1)))

            doc.build(elements)
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
