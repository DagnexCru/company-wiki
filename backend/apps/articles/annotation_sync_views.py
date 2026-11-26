import time
import uuid
from typing import Dict, List
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.articles.models import Article, ArticleInlineAnnotation
from apps.articles.serializers import ArticleInlineAnnotationSerializer
from apps.articles.annotation_views import get_article_by_slug_or_id

# Ephemeral in-memory typing registry: article_id -> Dict[session_key, typist_dict]
TYPING_REGISTRY: Dict[str, Dict[str, dict]] = {}


def clean_and_get_typists(article_id: str) -> List[dict]:
    """
    Purge typists whose keystroke beacon has expired (> 4.0s) and return active list.
    """
    now = time.time()
    room_typists = TYPING_REGISTRY.setdefault(article_id, {})
    # Filter expired
    expired_keys = [k for k, v in room_typists.items() if v.get("expires_at", 0) < now]
    for k in expired_keys:
        room_typists.pop(k, None)

    return list(room_typists.values())


class ArticleAnnotationTypingBeaconView(APIView):
    """
    Heartbeat beacon endpoint broadcasting or clearing a user's typing presence
    on a specific inline discussion thread.
    URL: POST /api/v1/articles/<slug_or_id>/annotations/typing/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)
        article_key = str(article.id)

        annotation_id = request.data.get("annotation_id")
        raw_is_typing = request.data.get("is_typing", True)
        if isinstance(raw_is_typing, str):
            is_typing = raw_is_typing.lower() in ("true", "1", "t", "yes")
        else:
            is_typing = bool(raw_is_typing)

        if not annotation_id:
            return Response(
                {"detail": "annotation_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_key = f"{request.user.id}_{annotation_id}"
        room_typists = TYPING_REGISTRY.setdefault(article_key, {})

        if is_typing:
            room_typists[session_key] = {
                "annotation_id": str(annotation_id),
                "user_id": str(request.user.id),
                "username": request.user.username,
                "full_name": request.user.full_name or request.user.username,
                "expires_at": time.time() + 4.0,
            }
        else:
            room_typists.pop(session_key, None)

        active = clean_and_get_typists(article_key)
        return Response({
            "status": "ok",
            "active_typists": active,
        }, status=status.HTTP_200_OK)


class ArticleAnnotationLiveSyncView(APIView):
    """
    High-efficiency synchronization polling endpoint returning delta updates
    (new/updated annotations and active typing presence) since a given timestamp.
    URL: GET /api/v1/articles/<slug_or_id>/annotations/sync/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug_or_id):
        article = get_article_by_slug_or_id(slug_or_id)
        article_key = str(article.id)

        since_str = request.query_params.get("since")
        annotations_qs = ArticleInlineAnnotation.objects.filter(article=article)

        if since_str:
            try:
                since_dt = timezone.datetime.fromisoformat(since_str.replace("Z", "+00:00"))
                annotations_qs = annotations_qs.filter(updated_at__gt=since_dt)
            except Exception:
                pass

        serialized_annotations = ArticleInlineAnnotationSerializer(
            annotations_qs.select_related("author", "resolved_by").order_by("created_at"),
            many=True,
            context={"request": request},
        ).data

        active_typists = clean_and_get_typists(article_key)

        return Response({
            "server_time": timezone.now().isoformat(),
            "active_typists": active_typists,
            "annotations": serialized_annotations,
        }, status=status.HTTP_200_OK)
