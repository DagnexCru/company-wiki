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

    category = models.ForeignKey(
        "taxonomy.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
        help_text="Primary taxonomy category organizing this knowledge article.",
    )
    tags = models.ManyToManyField(
        "taxonomy.Tag",
        blank=True,
        related_name="articles",
        help_text="Flexible labels associated with this article.",
    )

    is_featured = models.BooleanField(default=False)
    rejection_reason = models.TextField(
        blank=True,
        default="",
        help_text="Feedback or instructions for revision if article was rejected.",
    )
    submitted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    last_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_articles",
        help_text="The reviewer or administrator who made the latest review decision.",
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ArticleManager()

    class Meta:
        db_table = "articles"
        verbose_name = "Article"
        verbose_name_plural = "Articles"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["-updated_at"], name="article_updated_at_idx"),
            models.Index(fields=["status", "-created_at"], name="article_status_created_idx"),
            models.Index(fields=["category", "status"], name="article_cat_status_idx"),
        ]

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

    def create_revision(
        self,
        author=None,
        change_summary="",
        is_restoration=False,
        restored_from_revision=None,
    ):
        """
        Creates an immutable historical snapshot of the article's state.
        Sequentially increments revision_number for this article starting from 1.
        Captures tags and category snapshots.
        """
        last_rev = self.revisions.order_by("-revision_number").first()
        next_rev_num = (last_rev.revision_number + 1) if last_rev else 1

        tag_names = list(self.tags.values_list("name", flat=True)) if self.pk else []
        cat_name = self.category.name if self.category else ""

        revision = ArticleRevision.objects.create(
            article=self,
            revision_number=next_rev_num,
            title=self.title,
            slug=self.slug,
            summary=self.summary,
            content=self.content,
            tags_snapshot=tag_names,
            category_name=cat_name,
            author=author or self.author,
            change_summary=change_summary,
            is_restoration=is_restoration,
            restored_from_revision=restored_from_revision,
        )
        return revision


class ArticleRevision(models.Model):
    """
    Immutable historical snapshot of an article at a specific point in time.
    Preserves document title, content, summary, tags, and category snapshot.
    Supports linear versioning, restoration tracking, and diff inspection.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="revisions",
        help_text="The article this revision belongs to.",
    )
    revision_number = models.PositiveIntegerField(
        db_index=True,
        help_text="Sequential version number for this article starting from 1.",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280)
    summary = models.TextField(blank=True)
    content = models.TextField(help_text="Snapshot of document markdown/rich-text content.")
    tags_snapshot = models.JSONField(
        default=list,
        blank=True,
        help_text="List of tag names attached to the article at the time of this revision.",
    )
    category_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Category name at the time of this revision.",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="article_revisions",
        help_text="User who authored this revision.",
    )
    change_summary = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Brief description of the changes made in this revision.",
    )
    is_restoration = models.BooleanField(
        default=False,
        help_text="Indicates if this revision was created by restoring an older revision.",
    )
    restored_from_revision = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Revision number from which this content was restored.",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "article_revisions"
        verbose_name = "Article Revision"
        verbose_name_plural = "Article Revisions"
        unique_together = ("article", "revision_number")
        ordering = ["-revision_number"]
        indexes = [
            models.Index(fields=["article", "-revision_number"], name="art_rev_art_num_idx"),
            models.Index(fields=["article", "-created_at"], name="art_rev_art_created_idx"),
            models.Index(fields=["author", "-created_at"], name="art_rev_author_created_idx"),
        ]

    def __str__(self):
        author_name = self.author.username if self.author else "System"
        return f"{self.article.title} - Rev #{self.revision_number} by {author_name}"


# Note: ArticleQuerySet ensures unauthenticated users receive an empty queryset.

# Reading speed benchmark: Standard adult reading velocity is calibrated at 200 words per minute.

# Slug Collision Handling: Uses progressive numeric suffix incrementing.
