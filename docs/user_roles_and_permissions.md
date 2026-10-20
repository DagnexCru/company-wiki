# User Roles, Permissions, and Security Governance

This document describes the Role-Based Access Control (RBAC) model implemented in the Internal Knowledge Base & Company Wiki.

---

## 1. Role Definitions

The system defines four distinct organizational roles:
1. **Administrator (`ADMIN`)**:
   - Executive and systems management staff.
   - Authority to govern employee accounts, reassign roles, manage taxonomy, inspect full audit history, and moderate content.
2. **Author (`AUTHOR`)**:
   - Content creators, developers, and team leads.
   - Authority to create knowledge articles, edit personal drafts, and submit drafts for editorial review.
3. **Reviewer (`REVIEWER`)**:
   - Technical reviewers, quality assurance, and department editors.
   - Authority to inspect articles awaiting review, approve for publication, or reject with required revision feedback.
4. **Reader (`READER`)**:
   - Standard internal employees and cross-departmental staff.
   - Read-only access to published articles, categories, and tags. Cannot view drafts or review queues.

---

## 2. Server-Side Permission Classes

Permissions are enforced strictly in the Django REST Framework layer using specialized permission classes:
- `IsAdminUser`: Requires `user.role == 'ADMIN'` or `user.is_staff`.
- `CanCreateArticle`: Verifies user has `role in ['ADMIN', 'AUTHOR']`.
- `IsAuthorOrAdmin`: Object-level permission checking `article.author == user` or `user.role == 'ADMIN'`.
- `IsReviewerOrAdmin`: Verifies user has `role in ['ADMIN', 'REVIEWER']`.
- `IsAuthenticated`: Ensures all protected routes reject anonymous access.

---

## 3. Independent Review Policy
To maintain high document quality and compliance:
- **Rule**: Authors cannot approve their own submitted articles.
- **Enforcement**: In `ArticleViewSet.approve()`, if `article.author == request.user and not request.user.is_admin`, the request is rejected with `HTTP 403 Forbidden`.

---

## 4. Queryset Visibility Rules

The backend dynamically filters querysets via `Article.objects.for_user(user)`:
- **Reader**: Strictly filtered to `status='published'`.
- **Author**: Filtered to `status='published' OR author=user`.
- **Reviewer**: Filtered to `status='published' OR status='in_review' OR author=user`.
- **Administrator**: Unrestricted access across all statuses (`draft`, `in_review`, `published`, `rejected`, `archived`).
