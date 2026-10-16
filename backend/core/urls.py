from django.contrib import admin
from django.urls import path, include
from core.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Versioned API routes under /api/v1/
    path("api/v1/health/", HealthCheckView.as_view(), name="api-health-check"),
    path("api/v1/auth/", include("apps.accounts.urls")),
]
