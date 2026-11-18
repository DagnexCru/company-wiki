from rest_framework.renderers import BaseRenderer


class CSVRenderer(BaseRenderer):
    """
    Renderer for comma-separated values (CSV) export payloads.
    Allows DRF content negotiation to gracefully accept ?format=csv.
    """
    media_type = "text/csv"
    format = "csv"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, str):
            return data.encode(self.charset)
        return str(data).encode(self.charset)


class MarkdownRenderer(BaseRenderer):
    """
    Renderer for Markdown (.md) documents.
    Allows DRF content negotiation to gracefully accept ?format=markdown or ?format=md.
    """
    media_type = "text/markdown"
    format = "markdown"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, str):
            return data.encode(self.charset)
        return str(data).encode(self.charset)


class HTMLRenderer(BaseRenderer):
    """
    Renderer for Standalone Offline HTML documents.
    Allows DRF content negotiation to gracefully accept ?format=html.
    """
    media_type = "text/html"
    format = "html"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, str):
            return data.encode(self.charset)
        return str(data).encode(self.charset)


class PDFRenderer(BaseRenderer):
    """
    Renderer for Branded PDF binary documents.
    Allows DRF content negotiation to gracefully accept ?format=pdf.
    """
    media_type = "application/pdf"
    format = "pdf"
    charset = None

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, str):
            return data.encode("utf-8")
        return bytes(data)


class ZIPRenderer(BaseRenderer):
    """
    Renderer for ZIP Archive Bundles.
    Allows DRF content negotiation to gracefully accept ?format=zip.
    """
    media_type = "application/zip"
    format = "zip"
    charset = None

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, str):
            return data.encode("utf-8")
        return bytes(data)
