# Complete REST API Documentation (v1)

Base URL: `http://localhost:8000/api/v1/`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <ACCESS_TOKEN>`)

---

## 1. Authentication Endpoints (`/api/v1/auth/`)

### 1.1 Login & Obtain Tokens
* **Endpoint**: `POST /api/v1/auth/login/`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "author@company.com",
    "password": "StrongPassword123!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "author@company.com",
      "username": "author_user",
      "full_name": "Alice Author",
      "role": "AUTHOR",
      "is_active": true
    }
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "detail": "No active account found with the given credentials"
  }
  ```

### 1.2 Refresh Access Token
* **Endpoint**: `POST /api/v1/auth/refresh/`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 1.3 User Logout & Token Blacklist
* **Endpoint**: `POST /api/v1/auth/logout/`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "detail": "Successfully logged out."
  }
  ```

### 1.4 Get Current User Profile
* **Endpoint**: `GET /api/v1/auth/me/`
* **Access**: Authenticated
* **Success Response (200 OK)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "author@company.com",
    "username": "author_user",
    "full_name": "Alice Author",
    "role": "AUTHOR",
    "is_active": true,
    "created_at": "2026-10-18T10:00:00Z",
    "updated_at": "2026-10-18T10:00:00Z"
  }
  ```

---

## 2. Dashboard Endpoints (`/api/v1/dashboard/`)

### 2.1 Get Role-Aware Dashboard Telemetry
* **Endpoint**: `GET /api/v1/dashboard/` (or `/api/v1/articles/dashboard/`)
* **Access**: Authenticated (Role-scoped data filtering)
* **Success Response (200 OK - Administrator)**:
  ```json
  {
    "role": "ADMIN",
    "total_published_articles": 18,
    "recent_published_articles": [ ... ],
    "category_distribution": [
      {
        "id": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
        "name": "Engineering Systems",
        "slug": "engineering-systems",
        "article_count": 10
      }
    ],
    "author_metrics": {
      "my_drafts_count": 2,
      "my_in_review_count": 1,
      "my_rejected_count": 0,
      "my_published_count": 6
    },
    "my_recent_drafts": [ ... ],
    "reviewer_metrics": {
      "pending_reviews_count": 3
    },
    "pending_review_articles": [ ... ],
    "admin_metrics": {
      "total_articles": 25,
      "published_count": 18,
      "draft_count": 3,
      "in_review_count": 3,
      "rejected_count": 0,
      "archived_count": 1,
      "total_users_count": 15,
      "total_categories_count": 5,
      "total_tags_count": 22,
      "audit_events_24h_count": 38,
      "recent_activity": [ ... ]
    }
  }
  ```

---

## 3. Article Management Endpoints (`/api/v1/articles/`)

### 3.1 List Knowledge Articles
* **Endpoint**: `GET /api/v1/articles/`
* **Access**: Authenticated (Queryset scoped by role)
* **Query Parameters**:
  - `search` (string): Text search across title, summary, content, category, tags.
  - `category` (string): Filter by category slug or UUID.
  - `tag` (string): Comma-separated tag slugs.
  - `status` (string): Filter by status (`draft`, `in_review`, `published`, `rejected`, `archived`).
  - `ordering` (string): Safe sorting (`updated_at`, `-updated_at`, `title`, `-title`, `published_at`, `-published_at`).
  - `page` (integer): Page number (default: 1).
  - `page_size` (integer): Page size limit (default: 9, max: 100).
* **Success Response (200 OK)**:
  ```json
  {
    "count": 42,
    "total_pages": 5,
    "current_page": 1,
    "page_size": 9,
    "next": "http://localhost:8000/api/v1/articles/?page=2",
    "previous": null,
    "results": [ ... ]
  }
  ```

### 3.2 Create Article Draft
* **Endpoint**: `POST /api/v1/articles/`
* **Access**: Authors and Administrators
* **Request Body**:
  ```json
  {
    "title": "PostgreSQL High Availability Setup",
    "summary": "Streaming replication and Patroni clustering guide",
    "content": "# PostgreSQL HA Architecture\nStep-by-step setup...",
    "category": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
    "tag_names": ["PostgreSQL", "Database", "High Availability"]
  }
  ```
* **Success Response (201 Created)**: Returns created article detail object with `status: "draft"`.

### 3.3 Get Article Detail
* **Endpoint**: `GET /api/v1/articles/{slug}/`
* **Access**: Authenticated (Subject to object-level permissions)
* **Success Response (200 OK)**: Complete article payload with rendered content, author, category, and tags.

### 3.4 Update Article
* **Endpoint**: `PUT /api/v1/articles/{slug}/`
* **Access**: Article Author or Administrator
* **Request Body**: Accepts updated fields and optional `change_summary`.
* **Success Response (200 OK)**: Returns updated article detail. Creates new revision snapshot automatically.

### 3.5 Delete or Archive Article
* **Endpoint**: `DELETE /api/v1/articles/{slug}/`
* **Access**: Article Author or Administrator
* **Query Parameters**: `permanent=true` (Admin only hard-delete).
* **Success Response (204 No Content or 200 OK)**: Drafts are purged; active content is soft-archived.

---

## 4. Editorial Workflow Endpoints

### 4.1 Submit for Review
* **Endpoint**: `POST /api/v1/articles/{slug}/submit/`
* **Access**: Article Author or Administrator
* **Request Body**:
  ```json
  {
    "notes": "Ready for editorial review."
  }
  ```
* **Success Response (200 OK)**: Status transitions to `in_review`.

### 4.2 Approve Article
* **Endpoint**: `POST /api/v1/articles/{slug}/approve/`
* **Access**: Reviewer or Administrator (Independent review enforced)
* **Request Body**:
  ```json
  {
    "feedback": "Approved for general publication."
  }
  ```
* **Success Response (200 OK)**: Status transitions to `published`.

### 4.3 Reject Article
* **Endpoint**: `POST /api/v1/articles/{slug}/reject/`
* **Access**: Reviewer or Administrator
* **Request Body**:
  ```json
  {
    "feedback": "Please add troubleshooting section before publishing (min 5 chars)."
  }
  ```
* **Success Response (200 OK)**: Status transitions to `rejected`.

---

## 5. Revision History & Diff Endpoints

### 5.1 List Article Revisions
* **Endpoint**: `GET /api/v1/articles/{slug}/revisions/`
* **Access**: Article Author, Reviewer (for in_review), or Administrator

### 5.2 Compare Revisions (Unified Diff)
* **Endpoint**: `GET /api/v1/articles/{slug}/revisions/diff/?from=1&to=2`
* **Access**: Authorized revision viewers
* **Success Response (200 OK)**:
  ```json
  {
    "article_slug": "postgres-ha",
    "from_revision": 1,
    "to_revision": 2,
    "title_changed": false,
    "summary_changed": true,
    "content_unified_diff": "--- Rev #1\n+++ Rev #2\n@@ -1,3 +1,4 @@\n...",
    "stats": {
      "additions": 14,
      "deletions": 2
    }
  }
  ```

### 5.3 Restore Prior Revision
* **Endpoint**: `POST /api/v1/articles/{slug}/revisions/{num}/restore/`
* **Access**: Administrator or Author (if draft/rejected)
* **Success Response (200 OK)**: Safely restores content creating new revision #N without erasing past history.
