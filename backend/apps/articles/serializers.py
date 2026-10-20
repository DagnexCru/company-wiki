from rest_framework import serializers
from django.utils.text import slugify
from apps.accounts.models import CustomUser
from apps.articles.models import Article
from apps.taxonomy.models import Category, Tag
from apps.taxonomy.serializers import CategorySerializer, TagSerializer


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
    Includes category and tag metadata.
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
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    last_reviewer = ArticleAuthorSummarySerializer(read_only=True)
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
            "last_reviewer",
            "category",
            "tags",
            "status",
            "status_display",
            "rejection_reason",
            "is_featured",
            "estimated_read_time",
            "submitted_at",
            "reviewed_at",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used by Authors and Admins to create and revise knowledge articles.
    Supports category assignment and multi-tag association.
    """

    title = serializers.CharField(min_length=3, max_length=255)
    content = serializers.CharField(min_length=10)
    summary = serializers.CharField(required=False, allow_blank=True, default="")
    is_featured = serializers.BooleanField(required=False, default=False)

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=False,
        allow_null=True,
        write_only=True,
    )

    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        source="tags",
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "category",
            "category_id",
            "tags",
            "tag_ids",
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
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        
        if not user:
            raise serializers.ValidationError("An authenticated user is required to author an article.")

        validated_data["author"] = user
        validated_data["status"] = Article.Status.DRAFT
        
        tags = validated_data.pop("tags", [])
        article = super().create(validated_data)
        if tags:
            article.tags.set(tags)
        return article

    def update(self, instance, validated_data):
        new_title = validated_data.get("title", instance.title)
        if new_title != instance.title:
            instance.title = new_title
            instance.slug = instance._generate_unique_slug()

        instance.summary = validated_data.get("summary", instance.summary)
        instance.content = validated_data.get("content", instance.content)
        instance.is_featured = validated_data.get("is_featured", instance.is_featured)

        if "category" in validated_data:
            instance.category = validated_data.get("category")

        if "tags" in validated_data:
            instance.tags.set(validated_data.get("tags"))

        instance.save()
        return instance


class ArticleRevisionSerializer(serializers.ModelSerializer):
    """
    Detailed serializer representing a specific immutable historical version of an article.
    """
    author = ArticleAuthorSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True, default="Unknown")
    author_role = serializers.CharField(source="author.role", read_only=True, default="")
    article_title = serializers.CharField(source="article.title", read_only=True)
    article_slug = serializers.CharField(source="article.slug", read_only=True)

    class Meta:
        from apps.articles.models import ArticleRevision
        model = ArticleRevision
        fields = [
            "id",
            "article",
            "article_title",
            "article_slug",
            "revision_number",
            "title",
            "slug",
            "summary",
            "content",
            "tags_snapshot",
            "category_name",
            "author",
            "author_username",
            "author_role",
            "change_summary",
            "is_restoration",
            "restored_from_revision",
            "created_at",
        ]
        read_only_fields = fields


class ArticleRevisionListSerializer(serializers.ModelSerializer):
    """
    Compact revision serializer for revision history list/timeline presentation.
    """
    author_username = serializers.CharField(source="author.username", read_only=True, default="Unknown")
    author_role = serializers.CharField(source="author.role", read_only=True, default="")

    class Meta:
        from apps.articles.models import ArticleRevision
        model = ArticleRevision
        fields = [
            "id",
            "revision_number",
            "title",
            "summary",
            "tags_snapshot",
            "category_name",
            "author_username",
            "author_role",
            "change_summary",
            "is_restoration",
            "restored_from_revision",
            "created_at",
        ]
        read_only_fields = fields

