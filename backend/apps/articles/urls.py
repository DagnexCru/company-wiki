from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.articles.views import (
    ArticleViewSet,
    ArticleMediaUploadView,
    ArticleAttachmentsListView,
)
from apps.articles.dashboard_views import DashboardView
from apps.articles.presence_views import (
    ArticlePresenceHeartbeatView,
    ArticlePresenceLeaveView,
    ArticlePresenceLockView,
    ArticlePresenceListView,
)

router = DefaultRouter()
router.register(r"", ArticleViewSet, basename="article")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="article-dashboard"),
    path("upload/", ArticleMediaUploadView.as_view(), name="article-media-upload"),
    path("<uuid:article_id>/attachments/", ArticleAttachmentsListView.as_view(), name="article-attachments-list"),
    # Real-Time Collaborative Presence & Edit Lock Routes
    path("<str:slug_or_id>/presence/", ArticlePresenceListView.as_view(), name="article-presence-list"),
    path("<str:slug_or_id>/presence/heartbeat/", ArticlePresenceHeartbeatView.as_view(), name="article-presence-heartbeat"),
    path("<str:slug_or_id>/presence/leave/", ArticlePresenceLeaveView.as_view(), name="article-presence-leave"),
    path("<str:slug_or_id>/presence/acquire-lock/", ArticlePresenceLockView.as_view(), {"action": "acquire"}, name="article-presence-acquire-lock"),
    path("<str:slug_or_id>/presence/release-lock/", ArticlePresenceLockView.as_view(), {"action": "release"}, name="article-presence-release-lock"),
    path("", include(router.urls)),
]

