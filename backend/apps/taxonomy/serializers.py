from rest_framework import serializers
from apps.taxonomy.models import Category, Tag


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for knowledge base Categories.
    Includes live published article count and UI styling metadata.
    """

    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "color",
            "article_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "article_count", "created_at", "updated_at"]

    def validate_name(self, value):
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise serializers.ValidationError("Category name must be at least 2 characters long.")

        existing = Category.objects.filter(name__iexact=trimmed)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("A category with this name already exists.")

        return trimmed


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for cross-cutting Tag labels.
    """

    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = [
            "id",
            "name",
            "slug",
            "article_count",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "article_count", "created_at"]

    def validate_name(self, value):
        trimmed = value.strip().lstrip("#")
        if len(trimmed) < 2:
            raise serializers.ValidationError("Tag name must be at least 2 characters long.")

        existing = Tag.objects.filter(name__iexact=trimmed)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("A tag with this name already exists.")

        return trimmed

# Validation: Names are stripped of whitespace and leading '#' symbols before persistence.
