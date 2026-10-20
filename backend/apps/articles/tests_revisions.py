import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleRevision
from apps.taxonomy.models import Category, Tag

User = get_user_model()


class ArticleRevisionTests(TestCase):
    """
    Automated integration test suite verifying Article Revision History,
    diff calculations, non-destructive linear restoration, and role permissions.
    """

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email="admin@company.internal",
            username="admin_user",
            password="SecurePassword123!",
            role=CustomUser.Role.ADMIN,
        )
        self.author = User.objects.create_user(
            email="author@company.internal",
            username="author_user",
            password="SecurePassword123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.other_author = User.objects.create_user(
            email="other@company.internal",
            username="other_author",
            password="SecurePassword123!",
            role=CustomUser.Role.AUTHOR,
        )
        self.reviewer = User.objects.create_user(
            email="reviewer@company.internal",
            username="reviewer_user",
            password="SecurePassword123!",
            role=CustomUser.Role.REVIEWER,
        )
        self.reader = User.objects.create_user(
            email="reader@company.internal",
            username="reader_user",
            password="SecurePassword123!",
            role=CustomUser.Role.READER,
        )

        self.category = Category.objects.create(name="Engineering", description="Tech docs")
        self.tag1 = Tag.objects.create(name="Django")
        self.tag2 = Tag.objects.create(name="PostgreSQL")

    def test_revision_created_on_article_creation(self):
        """Creating an article automatically generates Revision #1."""
        self.client.force_authenticate(user=self.author)
        payload = {
            "title": "Architecture Overview",
            "summary": "High level architecture",
            "content": "Line 1: Django REST Framework backend\nLine 2: PostgreSQL database",
            "category": str(self.category.id),
            "tags": [str(self.tag1.id), str(self.tag2.id)],
        }
        response = self.client.post("/api/v1/articles/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        slug = response.data["slug"]
        article = Article.objects.get(slug=slug)
        self.assertEqual(article.revisions.count(), 1)

        rev1 = article.revisions.first()
        self.assertEqual(rev1.revision_number, 1)
        self.assertEqual(rev1.title, "Architecture Overview")
        self.assertEqual(rev1.content, payload["content"])
        self.assertEqual(rev1.author, self.author)
        self.assertFalse(rev1.is_restoration)

    def test_revision_increments_on_content_update(self):
        """Updating title, summary, or content increments revision to #2 with linear ordering."""
        self.client.force_authenticate(user=self.author)
        article = Article.objects.create(
            title="Initial Title",
            summary="Initial Summary",
            content="Initial Content line 1\nInitial Content line 2",
            author=self.author,
            category=self.category,
        )
        article.tags.add(self.tag1)
        article.create_revision(author=self.author, change_summary="Rev 1 initial")

        update_payload = {
            "title": "Updated Title",
            "summary": "Updated Summary",
            "content": "Initial Content line 1\nModified Content line 2\nAdded line 3",
            "change_summary": "Expanded section 2",
        }
        response = self.client.patch(f"/api/v1/articles/{article.slug}/", update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertEqual(article.revisions.count(), 2)

        rev2 = article.revisions.order_by("-revision_number").first()
        self.assertEqual(rev2.revision_number, 2)
        self.assertEqual(rev2.title, "Updated Title")
        self.assertEqual(rev2.change_summary, "Expanded section 2")

    def test_revision_list_permission_author_can_view(self):
        """Author can list revisions of their own article."""
        article = Article.objects.create(
            title="Author Article",
            content="Content",
            author=self.author,
        )
        article.create_revision(author=self.author)

        self.client.force_authenticate(user=self.author)
        response = self.client.get(f"/api/v1/articles/{article.slug}/revisions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_revision_list_permission_reviewer_and_admin_can_view(self):
        """Reviewers and Admins can view article revisions."""
        article = Article.objects.create(
            title="Shared Article",
            content="Content",
            author=self.author,
            status=Article.Status.IN_REVIEW,
        )
        article.create_revision(author=self.author)

        # Reviewer check
        self.client.force_authenticate(user=self.reviewer)
        res_rev = self.client.get(f"/api/v1/articles/{article.slug}/revisions/")
        self.assertEqual(res_rev.status_code, status.HTTP_200_OK)

        # Admin check
        self.client.force_authenticate(user=self.admin)
        res_adm = self.client.get(f"/api/v1/articles/{article.slug}/revisions/")
        self.assertEqual(res_adm.status_code, status.HTTP_200_OK)

    def test_revision_list_permission_reader_forbidden(self):
        """Readers cannot view revision history (HTTP 403 Forbidden)."""
        article = Article.objects.create(
            title="Public Article",
            content="Content",
            author=self.author,
            status=Article.Status.PUBLISHED,
        )
        article.create_revision(author=self.author)

        self.client.force_authenticate(user=self.reader)
        response = self.client.get(f"/api/v1/articles/{article.slug}/revisions/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_revision_detail_retrieval(self):
        """Authorized user can retrieve full snapshot of a specific revision."""
        article = Article.objects.create(
            title="Detailed Article",
            content="Snapshot content",
            author=self.author,
        )
        rev = article.create_revision(author=self.author, change_summary="Snapshot 1")

        self.client.force_authenticate(user=self.author)
        response = self.client.get(f"/api/v1/articles/{article.slug}/revisions/{rev.revision_number}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["revision_number"], 1)
        self.assertEqual(response.data["content"], "Snapshot content")

    def test_revision_diff_calculation(self):
        """Diff endpoint correctly computes unified diff and line additions/deletions."""
        article = Article.objects.create(
            title="Diff Doc",
            summary="Original Summary",
            content="Line A\nLine B\nLine C\n",
            author=self.author,
        )
        rev1 = article.create_revision(author=self.author)

        article.summary = "Updated Summary"
        article.content = "Line A\nLine B modified\nLine C\nLine D added\n"
        article.save()
        rev2 = article.create_revision(author=self.author)

        self.client.force_authenticate(user=self.author)
        response = self.client.get(
            f"/api/v1/articles/{article.slug}/revisions/diff/?from={rev1.revision_number}&to={rev2.revision_number}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["from_revision"], 1)
        self.assertEqual(data["to_revision"], 2)
        self.assertTrue(data["summary_changed"])
        self.assertFalse(data["title_changed"])
        self.assertIn("Line B modified", data["content_unified_diff"])
        self.assertGreater(data["stats"]["additions"], 0)

    def test_revision_diff_missing_params(self):
        """Diff endpoint returns 400 when from or to parameters are omitted."""
        article = Article.objects.create(title="Diff Doc", content="Content", author=self.author)
        article.create_revision(author=self.author)

        self.client.force_authenticate(user=self.author)
        response = self.client.get(f"/api/v1/articles/{article.slug}/revisions/diff/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_restore_revision_creates_new_revision_preserving_linear_history(self):
        """
        Restoring Revision #1 on an article with Revision #2 creates Revision #3,
        leaving Revision #1 and #2 completely untouched in the database.
        """
        article = Article.objects.create(
            title="Version 1 Title",
            summary="Version 1 Summary",
            content="Version 1 Content",
            author=self.author,
            status=Article.Status.DRAFT,
        )
        rev1 = article.create_revision(author=self.author, change_summary="Rev 1")

        article.title = "Version 2 Title"
        article.content = "Version 2 Content"
        article.save()
        rev2 = article.create_revision(author=self.author, change_summary="Rev 2")

        self.assertEqual(article.revisions.count(), 2)

        # Restore Revision 1
        self.client.force_authenticate(user=self.author)
        restore_payload = {"reason": "Accidental deletion in V2"}
        response = self.client.post(
            f"/api/v1/articles/{article.slug}/revisions/1/restore/",
            restore_payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        article.refresh_from_db()
        self.assertEqual(article.title, "Version 1 Title")
        self.assertEqual(article.content, "Version 1 Content")

        # Total revisions is now 3
        self.assertEqual(article.revisions.count(), 3)
        rev3 = article.revisions.order_by("-revision_number").first()
        self.assertEqual(rev3.revision_number, 3)
        self.assertTrue(rev3.is_restoration)
        self.assertEqual(rev3.restored_from_revision, 1)
        self.assertIn("Restored from Revision #1", rev3.change_summary)

        # Invariant: Prior revisions 1 and 2 still exist and are unaltered
        self.assertTrue(ArticleRevision.objects.filter(article=article, revision_number=1).exists())
        self.assertTrue(ArticleRevision.objects.filter(article=article, revision_number=2).exists())

    def test_restore_revision_forbidden_for_reader_and_reviewer(self):
        """Readers and Reviewers cannot restore revisions (HTTP 403 Forbidden)."""
        article = Article.objects.create(
            title="Review Article",
            content="Content",
            author=self.author,
            status=Article.Status.DRAFT,
        )
        article.create_revision(author=self.author)

        # Reader forbidden
        self.client.force_authenticate(user=self.reader)
        res_reader = self.client.post(f"/api/v1/articles/{article.slug}/revisions/1/restore/")
        self.assertEqual(res_reader.status_code, status.HTTP_403_FORBIDDEN)

        # Reviewer forbidden
        self.client.force_authenticate(user=self.reviewer)
        res_reviewer = self.client.post(f"/api/v1/articles/{article.slug}/revisions/1/restore/")
        self.assertEqual(res_reviewer.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_cannot_restore_published_article_but_admin_can(self):
        """Authors cannot restore published articles directly without review; Admins can."""
        article = Article.objects.create(
            title="Live Published Article",
            content="V1 live content",
            author=self.author,
            status=Article.Status.PUBLISHED,
        )
        article.create_revision(author=self.author)

        # Author forbidden on published status
        self.client.force_authenticate(user=self.author)
        res_author = self.client.post(f"/api/v1/articles/{article.slug}/revisions/1/restore/")
        self.assertEqual(res_author.status_code, status.HTTP_403_FORBIDDEN)

        # Admin authorized on published status
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.post(f"/api/v1/articles/{article.slug}/revisions/1/restore/")
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
