from django.urls import path
from apps.workflows.views import ReviewQueueView, WorkflowHistoryView

urlpatterns = [
    path("queue/", ReviewQueueView.as_view(), name="review-queue"),
    path("history/", WorkflowHistoryView.as_view(), name="workflow-history"),
]
