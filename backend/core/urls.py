from django.contrib import admin
from django.urls import path
from core.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Master versioned API routes under /api/v1/
    path("api/v1/health/", HealthCheckView.as_view(), name="api-health-check"),
]
