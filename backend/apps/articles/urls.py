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
from apps.articles.ai_views import (
    ArticleAiSummaryView,
    AskWikiAiView,
)
from apps.articles.graph_views import KnowledgeGraphView, ArticleNeighborhoodGraphView
from apps.articles.analytics_views import AuthorAnalyticsOverviewView
from apps.articles.annotation_views import (
    ArticleInlineAnnotationListView,
    ArticleInlineAnnotationDetailView,
    ArticleInlineAnnotationResolveView,
    ArticleInlineAnnotationRealignView,
)

router = DefaultRouter()
router.register(r"", ArticleViewSet, basename="article")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="article-dashboard"),
    path("analytics/author-overview/", AuthorAnalyticsOverviewView.as_view(), name="article-author-analytics-overview"),
    path("upload/", ArticleMediaUploadView.as_view(), name="article-media-upload"),
    path("<uuid:article_id>/attachments/", ArticleAttachmentsListView.as_view(), name="article-attachments-list"),
    # Real-Time Collaborative Presence & Edit Lock Routes
    path("<str:slug_or_id>/presence/", ArticlePresenceListView.as_view(), name="article-presence-list"),
    path("<str:slug_or_id>/presence/heartbeat/", ArticlePresenceHeartbeatView.as_view(), name="article-presence-heartbeat"),
    path("<str:slug_or_id>/presence/leave/", ArticlePresenceLeaveView.as_view(), name="article-presence-leave"),
    path("<str:slug_or_id>/presence/acquire-lock/", ArticlePresenceLockView.as_view(), {"action": "acquire"}, name="article-presence-acquire-lock"),
    path("<str:slug_or_id>/presence/release-lock/", ArticlePresenceLockView.as_view(), {"action": "release"}, name="article-presence-release-lock"),
    # AI-Powered 'Ask Wiki' & Article Summary Routes
    path("ask-ai/", AskWikiAiView.as_view(), name="article-ask-ai"),
    path("<str:slug_or_id>/ai-summary/", ArticleAiSummaryView.as_view(), name="article-ai-summary"),
    path("<str:slug_or_id>/graph-neighborhood/", ArticleNeighborhoodGraphView.as_view(), name="article-graph-neighborhood"),
    # Interactive Knowledge Graph Network Route
    path("graph/", KnowledgeGraphView.as_view(), name="article-graph"),
    # In-Line Text Annotations & Collaborative Discussions (Phase 30)
    path("<str:slug_or_id>/annotations/", ArticleInlineAnnotationListView.as_view(), name="article-annotations-list"),
    path("<str:slug_or_id>/annotations/realign/", ArticleInlineAnnotationRealignView.as_view(), name="article-annotations-realign"),
    path("<str:slug_or_id>/annotations/<uuid:annotation_id>/", ArticleInlineAnnotationDetailView.as_view(), name="article-annotation-detail"),
    path("<str:slug_or_id>/annotations/<uuid:annotation_id>/<str:action>/", ArticleInlineAnnotationResolveView.as_view(), name="article-annotation-action"),
    path("", include(router.urls)),
]

