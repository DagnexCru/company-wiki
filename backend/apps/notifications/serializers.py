from rest_framework import serializers
from apps.notifications.models import Notification
from apps.accounts.models import CustomUser
from apps.articles.models import Article


class NotificationSenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "full_name", "role"]


class NotificationArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "slug", "status"]


class NotificationSerializer(serializers.ModelSerializer):
    sender = NotificationSenderSerializer(read_only=True)
    article = NotificationArticleSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender",
            "notification_type",
            "title",
            "message",
            "link",
            "article",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields
