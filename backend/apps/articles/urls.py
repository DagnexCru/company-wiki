from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.articles.views import ArticleViewSet
from apps.articles.dashboard_views import DashboardView

router = DefaultRouter()
router.register(r"", ArticleViewSet, basename="article")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="article-dashboard"),
    path("", include(router.urls)),
]
