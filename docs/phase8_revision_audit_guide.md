# Phase 8: Article Revision History and System Audit Trail Documentation

## 1. Executive Architecture Overview
Phase 8 introduces comprehensive, enterprise-grade traceability and immutability controls to the **Internal Knowledge Base & Company Wiki**:
1. **Article Revision History (`apps.articles.models.ArticleRevision`)**:
   - Preserves immutable sequential snapshots of knowledge articles across content modifications, draft updates, and restorations.
   - Captures article title, slug, summary, document markdown content, category snapshot, tags snapshot, author identity, change summary, and timestamps.
   - Guarantees **Non-Destructive Linear History**: Restoring an older revision $R$ creates a brand-new revision $N$ with `is_restoration=True` and `restored_from_revision=R`. All intermediate revisions $R+1 \dots N-1$ remain completely intact.
2. **System Audit Trail (`apps.audit.models.AuditEvent`)**:
   - Centralized, tamper-evident log capturing critical security, identity, taxonomy, and content lifecycle transitions.
   - Automatically records actor username, role, client IP address, action code, resource type, resource identifier, and structured metadata.
   - **Zero Secret Exposure Invariant**: All audit entries pass through `sanitize_audit_details()`, recursively redacting passwords, session tokens, JWTs, and authorization headers.
   - Strictly restricted to **Administrator** access via the API and frontend UI.

---

## 2. Database Schema & Models

### 2.1 `ArticleRevision` Model
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default=uuid4 | Unique immutable revision identifier |
| `article` | ForeignKey (`Article`) | on_delete=CASCADE, related_name="revisions" | The parent knowledge article |
| `revision_number` | PositiveIntegerField | db_index=True | Sequential integer starting from 1 |
| `title` | CharField(255) | | Snapshot of article title |
| `slug` | SlugField(280) | | Slug at the time of revision |
| `summary` | TextField | blank=True | Executive summary / excerpt snapshot |
| `content` | TextField | | Complete document markdown/rich-text content |
| `tags_snapshot` | JSONField | default=list | Array of tag names attached to article |
| `category_name` | CharField(150) | blank=True | Category name at the time of revision |
| `author` | ForeignKey (`CustomUser`) | on_delete=SET_NULL, null=True | User responsible for authoring this revision |
| `change_summary` | CharField(255) | blank=True | User-provided or auto-generated change note |
| `is_restoration` | BooleanField | default=False | Indicates if revision was created via restore |
| `restored_from_revision` | PositiveIntegerField | null=True, blank=True | Prior revision number restored |
| `created_at` | DateTimeField | default=timezone.now, db_index=True | Snapshot creation timestamp |

**Table Constraints & Indexes:**
- Unique Together: `("article", "revision_number")`
- Default Ordering: `["-revision_number"]`
- Indexes:
  - `["article", "-revision_number"]`
  - `["article", "-created_at"]`
  - `["author", "-created_at"]`

### 2.2 `AuditEvent` Model
| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default=uuid4 | Unique audit record identifier |
| `actor` | ForeignKey (`CustomUser`) | on_delete=SET_NULL, null=True | Authenticated actor triggering the event |
| `action` | CharField(50) | db_index=True | Standardized action enum |
| `resource_type` | CharField(50) | db_index=True | Entity category (`article`, `user`, etc.) |
| `resource_id` | CharField(100) | blank=True, db_index=True | Identifier of resource |
| `resource_name` | CharField(255) | blank=True | Human-readable title or label |
| `details` | JSONField | default=dict, blank=True | Sanitized structured event metadata |
| `ip_address` | GenericIPAddressField | null=True, blank=True | Client IP address from request META |
| `created_at` | DateTimeField | default=timezone.now, db_index=True | Timestamp of event occurrence |

**Table Constraints & Indexes:**
- Default Ordering: `["-created_at"]`
- Indexes:
  - `["-created_at"]`
  - `["action", "-created_at"]`
  - `["resource_type", "resource_id"]`
  - `["actor", "-created_at"]`

---

## 3. Role-Based Permission Matrix

| Operation | Admin | Author | Reviewer | Reader |
|---|:---:|:---:|:---:|:---:|
| View Article Revision History | Allowed | Own Articles Only | Accessible Articles | Denied (403) |
| Retrieve Revision Snapshot | Allowed | Own Articles Only | Accessible Articles | Denied (403) |
| Compare Revisions (Diff) | Allowed | Own Articles Only | Accessible Articles | Denied (403) |
| Restore Revision (Draft/Rejected) | Allowed | Allowed (Own Drafts) | Denied (403) | Denied (403) |
| Restore Revision (Published) | Allowed | Denied (403) | Denied (403) | Denied (403) |
| Query System Audit Trail API | Allowed | Denied (403) | Denied (403) | Denied (403) |
| View System Audit Summary | Allowed | Denied (403) | Denied (403) | Denied (403) |

---

## 4. API Endpoints Reference

### 4.1 Article Revisions Endpoints
- `GET /api/v1/articles/{slug}/revisions/`: Lists chronological revision summaries for the article.
- `GET /api/v1/articles/{slug}/revisions/{rev_num}/`: Retrieves full snapshot data of a specific revision.
- `GET /api/v1/articles/{slug}/revisions/diff/?from={rev1}&to={rev2}`: Generates unified line-by-line diff and metadata diff between two revisions.
- `POST /api/v1/articles/{slug}/revisions/{rev_num}/restore/`: Safely restores the article to a prior revision snapshot.

### 4.2 System Audit Trail Endpoints
- `GET /api/v1/audit/events/`: Paginated audit events log with server-side filters (`action`, `resource_type`, `actor`, `search`, `date_from`, `date_to`).
- `GET /api/v1/audit/events/{id}/`: Retrieve individual audit record with sanitized details.
- `GET /api/v1/audit/events/summary/`: Summary metrics, event volume in past 24 hours, and top action/actor distributions.

---

## 5. Postman Testing Guide

### Request 1: List Article Revisions
- **Method:** `GET`
- **URL:** `http://localhost:8000/api/v1/articles/architecture-overview/revisions/`
- **Headers:** `Authorization: Bearer <access_token>`
- **Expected Status:** `200 OK`
- **Expected Shape:** Array of revision items with `revision_number`, `title`, `author_username`, `change_summary`, `created_at`.

### Request 2: Compare Two Revisions (Diff)
- **Method:** `GET`
- **URL:** `http://localhost:8000/api/v1/articles/architecture-overview/revisions/diff/?from=1&to=2`
- **Headers:** `Authorization: Bearer <access_token>`
- **Expected Status:** `200 OK`
- **Expected Shape:**
```json
{
  "article_slug": "architecture-overview",
  "article_title": "Architecture Overview",
  "from_revision": 1,
  "to_revision": 2,
  "title_changed": false,
  "summary_changed": true,
  "category_changed": false,
  "tags_added": ["PostgreSQL"],
  "tags_removed": [],
  "content_unified_diff": "--- Revision #1\n+++ Revision #2\n@@ -1,2 +1,3 @@\n...",
  "stats": {
    "additions": 4,
    "deletions": 1
  }
}
```

### Request 3: Restore Prior Revision
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/articles/architecture-overview/revisions/1/restore/`
- **Headers:**
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "reason": "Reverting accidental section deletion"
}
```
- **Expected Status:** `200 OK`
- **Expected Shape:**
```json
{
  "detail": "Article 'Architecture Overview' successfully restored from Revision #1.",
  "restored_from_revision": 1,
  "new_revision_number": 3,
  "article": { "slug": "architecture-overview", "title": "Architecture Overview", ... }
}
```

### Request 4: Query System Audit Trail (Admin Only)
- **Method:** `GET`
- **URL:** `http://localhost:8000/api/v1/audit/events/?action=ARTICLE_RESTORE`
- **Headers:** `Authorization: Bearer <admin_access_token>`
- **Expected Status:** `200 OK`
- **Expected Shape:** Paginated list containing `results`, `count`, `total_pages`, `current_page`.
