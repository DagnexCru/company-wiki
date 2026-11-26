"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

django_http_application = get_asgi_application()

async def application(scope, receive, send):
    """
    Main ASGI entrypoint routing HTTP requests to Django HTTP handler
    and WebSocket requests to real-time collaboration consumers.
    """
    if scope.get("type") == "websocket":
        from apps.articles.websocket_consumer import annotation_websocket_consumer
        await annotation_websocket_consumer(scope, receive, send)
    else:
        await django_http_application(scope, receive, send)
