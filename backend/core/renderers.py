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
