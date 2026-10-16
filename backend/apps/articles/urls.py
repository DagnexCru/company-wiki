from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.articles.views import ArticleViewSet

router = DefaultRouter()
router.register(r"", ArticleViewSet, basename="article")

urlpatterns = [
    path("", include(router.urls)),
]
