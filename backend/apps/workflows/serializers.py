from rest_framework import serializers
from apps.workflows.models import ReviewRecord
from apps.articles.models import Article
from apps.articles.serializers import ArticleAuthorSummarySerializer
from apps.taxonomy.serializers import CategorySerializer, TagSerializer


class ReviewRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for historical review and workflow transition logs.
    """

    actor = ArticleAuthorSummarySerializer(read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    article_title = serializers.CharField(source="article.title", read_only=True)
    article_slug = serializers.CharField(source="article.slug", read_only=True)

    class Meta:
        model = ReviewRecord
        fields = [
            "id",
            "article_title",
            "article_slug",
            "actor",
            "action",
            "action_display",
            "from_status",
            "to_status",
            "feedback",
            "created_at",
        ]
        read_only_fields = fields


class SubmitArticleSerializer(serializers.Serializer):
    """
    Input serializer for submitting an article for editorial review.
    """

    notes = serializers.CharField(required=False, allow_blank=True, default="")


class ReviewDecisionSerializer(serializers.Serializer):
    """
    Input serializer for approving or rejecting an article.
    """

    feedback = serializers.CharField(required=False, allow_blank=True, default="")


class ReviewQueueArticleSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for articles awaiting editorial review in the queue.
    """

    author = ArticleAuthorSummarySerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    estimated_read_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "author",
            "category",
            "tags",
            "status",
            "status_display",
            "is_featured",
            "estimated_read_time",
            "submitted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
