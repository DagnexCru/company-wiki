import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """
    In-App Notification model tracking real-time collaboration alerts,
    @username mentions, review queue transitions, and article lifecycle events.
    """

    class NotificationType(models.TextChoices):
        MENTION = "MENTION", "Mention (@username)"
        COMMENT = "COMMENT", "Article Comment"
        ARTICLE_UPDATED = "ARTICLE_UPDATED", "Article Updated"
        REVIEW_REQUESTED = "REVIEW_REQUESTED", "Review Requested"
        REVIEW_APPROVED = "REVIEW_APPROVED", "Review Approved"
        REVIEW_REJECTED = "REVIEW_REJECTED", "Changes Requested"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="Target user receiving this notification alert.",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
        help_text="User who triggered this notification event (null for system notifications).",
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.MENTION,
        db_index=True,
        help_text="Categorical type of the collaboration alert.",
    )
    title = models.CharField(max_length=255, help_text="Short headline summary.")
    message = models.TextField(help_text="Detailed explanatory notification message.")
    link = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Relative frontend route (e.g. /articles/slug or /reviews/id).",
    )
    article = models.ForeignKey(
        "articles.Article",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="Related article reference if applicable.",
    )
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"], name="notif_recip_read_created_idx"),
            models.Index(fields=["recipient", "-created_at"], name="notif_recip_created_idx"),
        ]

    def __str__(self):
        return f"[{self.notification_type}] To: {self.recipient.username} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read with timestamp."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
