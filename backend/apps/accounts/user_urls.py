from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.accounts.views import UserManagementViewSet, MentionSuggestionsView

router = DefaultRouter()
router.register(r"", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("mention-suggestions/", MentionSuggestionsView.as_view(), name="user-mention-suggestions"),
    path("", include(router.urls)),
]
