import uuid
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    """
    Primary taxonomy hierarchy for organizing knowledge articles by department or domain.
    Examples: Engineering, IT Support, Human Resources, Operations, Onboarding, Policies.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True, blank=True)
    description = models.TextField(
        blank=True,
        default="",
        help_text="Clear explanation of the scope and purpose of this knowledge category.",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        default="folder",
        help_text="Lucide icon identifier for UI badge and card rendering.",
    )
    color = models.CharField(
        max_length=30,
        blank=True,
        default="indigo",
        help_text="Design token color identifier (e.g. indigo, emerald, amber, rose, sky).",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name) or "category"
        unique_slug = base_slug
        counter = 1
        while Category.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1
        return unique_slug

    @property
    def article_count(self):
        """Returns the total number of published articles currently assigned to this category."""
        return self.articles.filter(status="published").count()


class Tag(models.Model):
    """
    Flexible cross-cutting labels for granular article indexing and discovery.
    Examples: Django, PostgreSQL, Networking, Troubleshooting, Security, Deployment.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "tags"
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["name"]

    def __str__(self):
        return f"#{self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        super().save(*args, **kwargs)

    def _generate_unique_slug(self):
        base_slug = slugify(self.name) or "tag"
        unique_slug = base_slug
        counter = 1
        while Tag.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1
        return unique_slug

    @property
    def article_count(self):
        """Returns the total number of published articles tagged with this label."""
        return self.articles.filter(status="published").count()

# Deletion Policy: Category deletion triggers SET_NULL to prevent cascade deletion of articles.
