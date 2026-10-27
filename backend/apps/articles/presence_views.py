from datetime import timedelta
import uuid
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.articles.models import Article, ArticlePresence
from apps.articles.serializers import ArticlePresenceSerializer


def get_article_by_slug_or_id(slug_or_id):
    """
    Helper to look up article by either UUID primary key or unique URL slug.
    """
    try:
        val = uuid.UUID(str(slug_or_id))
        return Article.objects.get(id=val)
    except (ValueError, AttributeError):
        return get_object_or_404(Article, slug=slug_or_id)


def get_presence_payload(article, current_user, current_session_id=None):
    """
    Build structured presence response including active viewers and soft edit lock state.
    """
    timeout = timezone.now() - timedelta(seconds=30)
    # Purge stale presences older than 5 minutes to keep table lightweight
    ArticlePresence.objects.filter(last_heartbeat__lt=timezone.now() - timedelta(minutes=5)).delete()

    active_presences = (
        ArticlePresence.objects.filter(article=article, last_heartbeat__gte=timeout)
        .select_related("user")
        .order_by("-last_heartbeat")
    )

    # Detect active edit lock (someone modifying the draft)
    active_editor = active_presences.filter(status=ArticlePresence.Status.EDITING).first()
    
    edit_lock_data = {
        "is_locked": False,
        "locked_by": None,
        "is_current_user_lock": False,
        "expires_in_seconds": 0,
        "warning_message": None,
    }

    if active_editor:
        is_current_user = current_user and current_user.is_authenticated and active_editor.user.id == current_user.id
        seconds_left = max(0, 30 - int((timezone.now() - active_editor.last_heartbeat).total_seconds()))
        editor_name = active_editor.user.full_name or active_editor.user.username

        edit_lock_data = {
            "is_locked": True,
            "locked_by": {
                "id": str(active_editor.user.id),
                "username": active_editor.user.username,
                "full_name": editor_name,
                "role": active_editor.user.role,
            },
            "is_current_user_lock": is_current_user,
            "expires_in_seconds": seconds_left,
            "warning_message": f"{editor_name} is currently modifying this draft. Your changes may conflict.",
        }

    return {
        "article_id": str(article.id),
        "article_slug": article.slug,
        "viewers": ArticlePresenceSerializer(active_presences, many=True).data,
        "active_count": active_presences.count(),
        "edit_lock": edit_lock_data,
    }


class ArticlePresenceHeartbeatView(APIView):
    """
    Heartbeat beacon endpoint updating client presence and active edit locks.
    URL: POST /api/v1/articles/<slug_or_id>/presence/heartbeat/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id, *args, **kwargs):
        article = get_article_by_slug_or_id(slug_or_id)
        client_session_id = request.data.get("client_session_id") or str(uuid.uuid4())
        status_mode = request.data.get("status") or ArticlePresence.Status.VIEWING

        if status_mode not in ArticlePresence.Status.values:
            status_mode = ArticlePresence.Status.VIEWING

        # Upsert user presence session
        ArticlePresence.objects.update_or_create(
            article=article,
            user=request.user,
            client_session_id=client_session_id,
            defaults={
                "status": status_mode,
                "last_heartbeat": timezone.now(),
            },
        )

        payload = get_presence_payload(article, request.user, client_session_id)
        return Response(payload, status=status.HTTP_200_OK)


class ArticlePresenceLeaveView(APIView):
    """
    Explicit departure endpoint removing presence session upon tab close or route transition.
    URL: POST /api/v1/articles/<slug_or_id>/presence/leave/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id, *args, **kwargs):
        article = get_article_by_slug_or_id(slug_or_id)
        client_session_id = request.data.get("client_session_id")
        
        query = ArticlePresence.objects.filter(article=article, user=request.user)
        if client_session_id:
            query = query.filter(client_session_id=client_session_id)
        query.delete()

        payload = get_presence_payload(article, request.user)
        return Response(payload, status=status.HTTP_200_OK)


class ArticlePresenceLockView(APIView):
    """
    Endpoint for acquiring, refreshing, or taking over a soft edit lock.
    URL: POST /api/v1/articles/<slug_or_id>/presence/acquire-lock/
    URL: POST /api/v1/articles/<slug_or_id>/presence/release-lock/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug_or_id, action=None, *args, **kwargs):
        article = get_article_by_slug_or_id(slug_or_id)
        client_session_id = request.data.get("client_session_id") or str(uuid.uuid4())
        force = bool(request.data.get("force", False))

        if action == "release":
            ArticlePresence.objects.filter(
                article=article,
                user=request.user,
                client_session_id=client_session_id,
            ).update(status=ArticlePresence.Status.VIEWING, last_heartbeat=timezone.now())
            return Response(get_presence_payload(article, request.user, client_session_id), status=status.HTTP_200_OK)

        # Acquire lock action
        timeout = timezone.now() - timedelta(seconds=30)
        existing_editor = (
            ArticlePresence.objects.filter(article=article, status=ArticlePresence.Status.EDITING, last_heartbeat__gte=timeout)
            .exclude(user=request.user)
            .first()
        )

        if existing_editor and not force:
            editor_name = existing_editor.user.full_name or existing_editor.user.username
            return Response(
                {
                    "error": f"Article is currently locked by {editor_name}.",
                    "edit_lock": {
                        "is_locked": True,
                        "locked_by": {
                            "id": str(existing_editor.user.id),
                            "username": existing_editor.user.username,
                            "full_name": editor_name,
                            "role": existing_editor.user.role,
                        },
                        "is_current_user_lock": False,
                        "can_take_over": True,
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Take over or establish edit lock
        if existing_editor and force:
            existing_editor.status = ArticlePresence.Status.VIEWING
            existing_editor.save(update_fields=["status"])

        ArticlePresence.objects.update_or_create(
            article=article,
            user=request.user,
            client_session_id=client_session_id,
            defaults={
                "status": ArticlePresence.Status.EDITING,
                "last_heartbeat": timezone.now(),
            },
        )

        return Response(get_presence_payload(article, request.user, client_session_id), status=status.HTTP_200_OK)


class ArticlePresenceListView(APIView):
    """
    Read-only endpoint returning active presence and edit lock info without updating heartbeat.
    URL: GET /api/v1/articles/<slug_or_id>/presence/
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, slug_or_id, *args, **kwargs):
        article = get_article_by_slug_or_id(slug_or_id)
        user = request.user if request.user.is_authenticated else None
        return Response(get_presence_payload(article, user), status=status.HTTP_200_OK)
