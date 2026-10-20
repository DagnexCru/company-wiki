from rest_framework import serializers
from apps.articles.serializers import ArticleListSerializer
from apps.audit.serializers import AuditEventListSerializer


class CategoryDistributionItemSerializer(serializers.Serializer):
    """
    Lightweight serializer for category breakdown on the dashboard.
    """
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    article_count = serializers.IntegerField()


class AuthorMetricsSerializer(serializers.Serializer):
    """
    Author-specific metrics tracking drafting, submission, and revision workloads.
    """
    my_drafts_count = serializers.IntegerField()
    my_in_review_count = serializers.IntegerField()
    my_rejected_count = serializers.IntegerField()
    my_published_count = serializers.IntegerField()


class ReviewerMetricsSerializer(serializers.Serializer):
    """
    Reviewer-specific metrics tracking pending review queue volume.
    """
    pending_reviews_count = serializers.IntegerField()


class AdminMetricsSerializer(serializers.Serializer):
    """
    System-wide statistics accessible exclusively to administrators.
    """
    total_articles = serializers.IntegerField()
    published_count = serializers.IntegerField()
    draft_count = serializers.IntegerField()
    in_review_count = serializers.IntegerField()
    rejected_count = serializers.IntegerField()
    archived_count = serializers.IntegerField()
    total_users_count = serializers.IntegerField()
    total_categories_count = serializers.IntegerField()
    total_tags_count = serializers.IntegerField()
    audit_events_24h_count = serializers.IntegerField()
    recent_activity = AuditEventListSerializer(many=True, required=False)


class DashboardResponseSerializer(serializers.Serializer):
    """
    Master role-aware dashboard payload.
    Enforces strict data scoping so unauthorized roles never receive internal or administrative metrics.
    """
    role = serializers.CharField()
    total_published_articles = serializers.IntegerField()
    recent_published_articles = ArticleListSerializer(many=True)
    category_distribution = CategoryDistributionItemSerializer(many=True)

    # Scoped author fields
    author_metrics = AuthorMetricsSerializer(required=False, allow_null=True)
    my_recent_drafts = ArticleListSerializer(many=True, required=False, allow_null=True)

    # Scoped reviewer fields
    reviewer_metrics = ReviewerMetricsSerializer(required=False, allow_null=True)
    pending_review_articles = ArticleListSerializer(many=True, required=False, allow_null=True)

    # Scoped administrator fields
    admin_metrics = AdminMetricsSerializer(required=False, allow_null=True)
