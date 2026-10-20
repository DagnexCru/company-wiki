# Article Editorial Workflow & Lifecycle Guide

This guide details the complete content lifecycle for knowledge articles from draft creation to publication, revision tracking, and archival.

---

## 1. Lifecycle Statuses

An article progresses through five distinct states:
1. `draft`: Work-in-progress content visible only to the author and administrators.
2. `in_review`: Submitted article awaiting review by editorial staff.
3. `published`: Approved documentation visible across the entire company.
4. `rejected`: Returned to the author with mandatory revision feedback.
5. `archived`: Historical documentation retained for citation without appearing in active discovery.

---

## 2. Permitted State Transitions

| From Status | To Status | Trigger / Action | Authorized Actors |
| :--- | :--- | :--- | :--- |
| `draft` | `in_review` | `POST /api/v1/articles/{slug}/submit/` | Author, Admin |
| `in_review` | `published` | `POST /api/v1/articles/{slug}/approve/` | Reviewer, Admin (Independent) |
| `in_review` | `rejected` | `POST /api/v1/articles/{slug}/reject/` | Reviewer, Admin |
| `rejected` | `in_review` | `POST /api/v1/articles/{slug}/submit/` | Author, Admin |
| `published` | `archived` | `POST /api/v1/articles/{slug}/archive/` | Author, Admin |
| `in_review` | `archived` | `POST /api/v1/articles/{slug}/archive/` | Admin |

---

## 3. Revisions & Diff Engine
- Every edit creates an immutable `ArticleRevision` snapshot.
- The diff engine uses Python's standard `difflib.unified_diff` to calculate exact addition and deletion counts.
- Restoring an older revision creates a new revision #N, preserving intermediate history without data loss.

---

## 4. Audit Trail Logging
All state transitions log an `AuditEvent` with:
- `actor`: Authenticated user UUID and role.
- `action`: Specific action code (e.g., `ARTICLE_SUBMIT`, `ARTICLE_APPROVE`, `ARTICLE_REJECT`).
- `resource_id`: Target article UUID.
- `details`: Metadata capturing `from_status` and `to_status`.
- `created_at`: UTC timestamp.
