import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify


class ArticleQuerySet(models.QuerySet):
    """
    Custom QuerySet providing role-aware filtering and lifecycle helpers.
    """

    def published(self):
        return self.filter(status=Article.Status.PUBLISHED)

    def drafts(self):
        return self.filter(status=Article.Status.DRAFT)

    def in_review(self):
        return self.filter(status=Article.Status.IN_REVIEW)

    def for_user(self, user):
        """
        Enforce server-side role and ownership visibility:
        - Unauthenticated: No articles (internal wiki).
        - Admin: All articles across all statuses.
        - Reviewer: All published articles + all articles awaiting review.
        - Author: All published articles + all articles authored by this user.
        - Reader: Only published articles.
        """
        if not user or not user.is_authenticated:
            return self.none()

        if user.is_admin:
            return self.all()

        if user.role == "REVIEWER":
            return self.filter(
                models.Q(status=Article.Status.PUBLISHED)
                | models.Q(status=Article.Status.IN_REVIEW)
                | models.Q(author=user)
            )

        if user.role == "AUTHOR":
            return self.filter(
                models.Q(status=Article.Status.PUBLISHED)
                | models.Q(author=user)
            )

        # Reader default: only published articles
        return self.filter(status=Article.Status.PUBLISHED)


class ArticleManager(models.Manager):
    def get_queryset(self):
        return ArticleQuerySet(self.model, using=self._db)

    def published(self):
        return self.get_queryset().published()

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Article(models.Model):
    """
    Core Knowledge Article representing an internal documentation record.
    Supports versioning, draft editing, editorial review, and role-based retrieval.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        IN_REVIEW = "in_review", "In Review"
        PUBLISHED = "published", "Published"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, db_index=True, blank=True)
    content = models.TextField(help_text="Markdown or rich-text document content.")
    summary = models.TextField(
        blank=True,
        help_text="Brief executive summary or excerpt of the article.",
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="articles",
        help_text="Author responsible for writing and maintaining this article.",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ArticleManager()

    class Meta:
        db_table = "articles"
        verbose_name = "Article"
        verbose_name_plural = "Articles"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Auto-generate unique slug if not present or on title change
        if not self.slug:
            self.slug = self._generate_unique_slug()

        # Update published_at timestamp automatically on transition to published
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.title) or "article"
        unique_slug = base_slug
        counter = 1

        while Article.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1

        return unique_slug

    @property
    def estimated_read_time(self):
        """Estimate reading time in minutes assuming 200 words per minute."""
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))
