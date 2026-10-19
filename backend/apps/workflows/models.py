import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class ReviewRecord(models.Model):
    """
    Records an auditable editorial review event for an article.
    Tracks state transitions (submit, approve, reject, archive), responsible reviewer,
    and required rejection feedback or submission notes.
    """

    class Action(models.TextChoices):
        SUBMIT = "SUBMIT", "Submitted for Review"
        APPROVE = "APPROVE", "Approved and Published"
        REJECT = "REJECT", "Rejected with Feedback"
        ARCHIVE = "ARCHIVE", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(
        "articles.Article",
        on_delete=models.CASCADE,
        related_name="review_records",
        help_text="The article undergoing this workflow transition.",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workflow_actions",
        help_text="User who performed this workflow action.",
    )
    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        help_text="The workflow action executed.",
    )
    from_status = models.CharField(max_length=20, help_text="Status prior to this transition.")
    to_status = models.CharField(max_length=20, help_text="Status resulting from this transition.")
    feedback = models.TextField(
        blank=True,
        default="",
        help_text="Detailed feedback or justification provided by the actor.",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "review_records"
        verbose_name = "Review Record"
        verbose_name_plural = "Review Records"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["article", "-created_at"], name="review_article_created_idx"),
            models.Index(fields=["actor", "-created_at"], name="review_actor_created_idx"),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"{self.article.title} - {self.get_action_display()} by {actor_name} ({self.created_at:%Y-%m-%d %H:%M})"
