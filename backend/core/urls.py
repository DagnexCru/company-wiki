from django.contrib import admin
from django.urls import path, include
from core.views import HealthCheckView
from apps.articles.dashboard_views import DashboardView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Versioned API routes under /api/v1/
    path("api/v1/health/", HealthCheckView.as_view(), name="api-health-check"),
    path("api/v1/dashboard/", DashboardView.as_view(), name="api-dashboard"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/users/", include("apps.accounts.user_urls")),
    path("api/v1/articles/", include("apps.articles.urls")),
    path("api/v1/workflows/", include("apps.workflows.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/", include("apps.taxonomy.urls")),
]

