import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class AuditEvent(models.Model):
    """
    Centralized system audit event recording security, administrative, and content actions.
    Maintains a tamper-evident log of changes without storing confidential credentials.
    """

    class Action(models.TextChoices):
        # Content Lifecycle Actions
        ARTICLE_CREATE = "ARTICLE_CREATE", "Article Created"
        ARTICLE_UPDATE = "ARTICLE_UPDATE", "Article Updated"
        ARTICLE_DELETE = "ARTICLE_DELETE", "Article Deleted"
        ARTICLE_ARCHIVE = "ARTICLE_ARCHIVE", "Article Archived"
        ARTICLE_SUBMIT = "ARTICLE_SUBMIT", "Article Submitted for Review"
        ARTICLE_APPROVE = "ARTICLE_APPROVE", "Article Approved and Published"
        ARTICLE_REJECT = "ARTICLE_REJECT", "Article Rejected with Feedback"
        ARTICLE_RESTORE = "ARTICLE_RESTORE", "Article Restored from Revision"

        # Identity & Security Actions
        AUTH_LOGIN = "AUTH_LOGIN", "User Login"
        AUTH_LOGOUT = "AUTH_LOGOUT", "User Logout"
        USER_REGISTER = "USER_REGISTER", "User Registered"
        USER_ROLE_CHANGE = "USER_ROLE_CHANGE", "User Role Modified"
        USER_STATUS_CHANGE = "USER_STATUS_CHANGE", "User Account Status Modified"

        # Taxonomy Actions
        CATEGORY_CREATE = "CATEGORY_CREATE", "Category Created"
        CATEGORY_UPDATE = "CATEGORY_UPDATE", "Category Updated"
        CATEGORY_DELETE = "CATEGORY_DELETE", "Category Deleted"
        TAG_CREATE = "TAG_CREATE", "Tag Created"
        TAG_UPDATE = "TAG_UPDATE", "Tag Updated"
        TAG_DELETE = "TAG_DELETE", "Tag Deleted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
        help_text="The authenticated user who triggered this event (or null for system/anonymous).",
    )
    action = models.CharField(
        max_length=50,
        choices=Action.choices,
        db_index=True,
        help_text="Type of action performed.",
    )
    resource_type = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Entity type acted upon (e.g., article, user, category, tag).",
    )
    resource_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Identifier of the resource (UUID, slug, or ID).",
    )
    resource_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human-readable title or label of the resource.",
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured event metadata (sanitized to exclude secrets, passwords, or tokens).",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address where the request originated.",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "audit_events"
        verbose_name = "Audit Event"
        verbose_name_plural = "Audit Events"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"], name="audit_created_idx"),
            models.Index(fields=["action", "-created_at"], name="audit_action_created_idx"),
            models.Index(fields=["resource_type", "resource_id"], name="audit_resource_idx"),
            models.Index(fields=["actor", "-created_at"], name="audit_actor_created_idx"),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {actor_name} performed {self.action} on {self.resource_type}:{self.resource_name}"
