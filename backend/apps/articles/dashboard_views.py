import datetime
from django.db import models
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.accounts.models import CustomUser
from apps.articles.models import Article
from apps.taxonomy.models import Category, Tag
from apps.audit.models import AuditEvent
from apps.articles.dashboard_serializers import DashboardResponseSerializer


class DashboardView(APIView):
    """
    Role-Aware Dashboard & Content Discovery API endpoint.
    GET /api/v1/dashboard/ and /api/v1/articles/dashboard/

    Security & Privacy Rules:
    - Reader: Receives only public published documentation metrics and category distribution.
    - Author: Receives personal draft, in-review, rejected, and published counts, plus recent personal drafts.
    - Reviewer: Receives editorial review queue counts and top pending review items.
    - Administrator: Receives complete organization-wide telemetry (all status counts, user totals, taxonomy totals, 24h audit volume, recent activity).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", CustomUser.Role.READER)
        is_admin = bool(user.is_admin or role == CustomUser.Role.ADMIN or user.is_superuser)
        is_reviewer = bool(is_admin or role == CustomUser.Role.REVIEWER)
        is_author = bool(is_admin or role == CustomUser.Role.AUTHOR or role == CustomUser.Role.REVIEWER)

        # 1. Base Metrics: Published documentation accessible across the company
        published_qs = Article.objects.filter(status=Article.Status.PUBLISHED)
        total_published_articles = published_qs.count()

        recent_published_articles = (
            published_qs.filter(is_featured=True)
            .select_related("author", "category")
            .prefetch_related("tags")
            .order_by("-published_at", "-created_at")[:6]
        )

        # Optimized category distribution: published articles grouped by category
        category_distribution_qs = (
            Category.objects.annotate(
                published_count=models.Count(
                    "articles",
                    filter=models.Q(articles__status=Article.Status.PUBLISHED),
                )
            )
            .filter(published_count__gt=0)
            .order_by("-published_count", "name")
        )

        category_distribution = [
            {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "article_count": cat.published_count,
            }
            for cat in category_distribution_qs
        ]

        # 2. Author Metrics (Scoped to requesting user)
        author_metrics = None
        my_recent_drafts = None

        if is_author:
            # Conditional aggregation in a single query
            author_counts = Article.objects.filter(author=user).aggregate(
                draft_count=models.Count("id", filter=models.Q(status=Article.Status.DRAFT)),
                in_review_count=models.Count("id", filter=models.Q(status=Article.Status.IN_REVIEW)),
                rejected_count=models.Count("id", filter=models.Q(status=Article.Status.REJECTED)),
                published_count=models.Count("id", filter=models.Q(status=Article.Status.PUBLISHED)),
            )
            author_metrics = {
                "my_drafts_count": author_counts["draft_count"] or 0,
                "my_in_review_count": author_counts["in_review_count"] or 0,
                "my_rejected_count": author_counts["rejected_count"] or 0,
                "my_published_count": author_counts["published_count"] or 0,
            }

            my_recent_drafts = (
                Article.objects.filter(
                    author=user,
                    status__in=[Article.Status.DRAFT, Article.Status.REJECTED],
                )
                .select_related("author", "category")
                .prefetch_related("tags")
                .order_by("-updated_at")[:5]
            )

        # 3. Reviewer Metrics (Scoped to editorial staff)
        reviewer_metrics = None
        pending_review_articles = None

        if is_reviewer:
            in_review_qs = Article.objects.filter(status=Article.Status.IN_REVIEW)
            pending_reviews_count = in_review_qs.count()
            reviewer_metrics = {
                "pending_reviews_count": pending_reviews_count,
            }

            pending_review_articles = (
                in_review_qs.select_related("author", "category")
                .prefetch_related("tags")
                .order_by("-submitted_at", "-updated_at")[:5]
            )

        # 4. Administrator Metrics (Scoped exclusively to system administrators)
        admin_metrics = None

        if is_admin:
            # Single aggregated query for all article lifecycle statuses
            status_counts = Article.objects.aggregate(
                total=models.Count("id"),
                published=models.Count("id", filter=models.Q(status=Article.Status.PUBLISHED)),
                draft=models.Count("id", filter=models.Q(status=Article.Status.DRAFT)),
                in_review=models.Count("id", filter=models.Q(status=Article.Status.IN_REVIEW)),
                rejected=models.Count("id", filter=models.Q(status=Article.Status.REJECTED)),
                archived=models.Count("id", filter=models.Q(status=Article.Status.ARCHIVED)),
            )

            total_users = CustomUser.objects.filter(is_active=True).count()
            total_categories = Category.objects.count()
            total_tags = Tag.objects.count()

            since_24h = timezone.now() - datetime.timedelta(hours=24)
            audit_24h_count = AuditEvent.objects.filter(created_at__gte=since_24h).count()

            recent_activity = (
                AuditEvent.objects.select_related("actor")
                .order_by("-created_at")[:6]
            )

            admin_metrics = {
                "total_articles": status_counts["total"] or 0,
                "published_count": status_counts["published"] or 0,
                "draft_count": status_counts["draft"] or 0,
                "in_review_count": status_counts["in_review"] or 0,
                "rejected_count": status_counts["rejected"] or 0,
                "archived_count": status_counts["archived"] or 0,
                "total_users_count": total_users,
                "total_categories_count": total_categories,
                "total_tags_count": total_tags,
                "audit_events_24h_count": audit_24h_count,
                "recent_activity": recent_activity,
            }

        payload = {
            "role": role,
            "total_published_articles": total_published_articles,
            "recent_published_articles": recent_published_articles,
            "category_distribution": category_distribution,
            "author_metrics": author_metrics,
            "my_recent_drafts": my_recent_drafts,
            "reviewer_metrics": reviewer_metrics,
            "pending_review_articles": pending_review_articles,
            "admin_metrics": admin_metrics,
        }

        serializer = DashboardResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)
