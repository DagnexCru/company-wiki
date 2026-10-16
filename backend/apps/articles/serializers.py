from rest_framework import serializers
from django.utils.text import slugify
from apps.accounts.models import CustomUser
from apps.articles.models import Article


class ArticleAuthorSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for embedding author identity inside article payloads.
    """

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
        ]
        read_only_fields = fields


class ArticleListSerializer(serializers.ModelSerializer):
    """
    Compact article serializer tailored for fast list rendering and dashboard feeds.
    """

    author = ArticleAuthorSummarySerializer(read_only=True)
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
            "status",
            "status_display",
            "is_featured",
            "estimated_read_time",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ArticleDetailSerializer(serializers.ModelSerializer):
    """
    Full article serializer containing markdown document content and metadata.
    """

    author = ArticleAuthorSummarySerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    estimated_read_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "author",
            "status",
            "status_display",
            "is_featured",
            "estimated_read_time",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "author",
            "status",
            "status_display",
            "estimated_read_time",
            "published_at",
            "created_at",
            "updated_at",
        ]


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used by Authors and Admins to create and revise knowledge articles.
    Enforces validation and prevents bypassing the publishing workflow via normal CRUD.
    """

    title = serializers.CharField(min_length=3, max_length=255)
    content = serializers.CharField(min_length=10)
    summary = serializers.CharField(required=False, allow_blank=True, default="")
    is_featured = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "is_featured",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Article title cannot be blank or whitespace.")
        return cleaned

    def validate_content(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Article content cannot be blank or whitespace.")
        return cleaned

    def create(self, validated_data):
        # Automatically assign the authenticated author and default status
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        
        if not user:
            raise serializers.ValidationError("An authenticated user is required to author an article.")

        validated_data["author"] = user
        validated_data["status"] = Article.Status.DRAFT
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Check if title changed to regenerate slug
        new_title = validated_data.get("title", instance.title)
        if new_title != instance.title:
            instance.title = new_title
            instance.slug = instance._generate_unique_slug()

        instance.summary = validated_data.get("summary", instance.summary)
        instance.content = validated_data.get("content", instance.content)
        instance.is_featured = validated_data.get("is_featured", instance.is_featured)
        
        instance.save()
        return instance

# Validation Rule: Titles under 3 characters are rejected to prevent low-quality records.
