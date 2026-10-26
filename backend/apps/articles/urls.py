from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.articles.views import (
    ArticleViewSet,
    ArticleMediaUploadView,
    ArticleAttachmentsListView,
)
from apps.articles.dashboard_views import DashboardView

router = DefaultRouter()
router.register(r"", ArticleViewSet, basename="article")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="article-dashboard"),
    path("upload/", ArticleMediaUploadView.as_view(), name="article-media-upload"),
    path("<uuid:article_id>/attachments/", ArticleAttachmentsListView.as_view(), name="article-attachments-list"),
    path("", include(router.urls)),
]
