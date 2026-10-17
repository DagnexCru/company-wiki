from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.taxonomy.views import CategoryViewSet, TagViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"tags", TagViewSet, basename="tag")

urlpatterns = [
    path("", include(router.urls)),
]
