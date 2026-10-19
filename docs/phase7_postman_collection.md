# Phase 7 — Postman API Testing Collection & Guide

## Workflow Endpoints Overview

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/articles/{slug}/submit/` | Author / Admin | Submit draft or rejected article for peer review |
| `POST` | `/api/v1/articles/{slug}/approve/` | Reviewer / Admin | Approve article and transition to published status |
| `POST` | `/api/v1/articles/{slug}/reject/` | Reviewer / Admin | Reject article with mandatory revision feedback |
| `GET` | `/api/v1/articles/{slug}/reviews/` | Author / Reviewer / Admin | Chronological review event audit log for article |
| `GET` | `/api/v1/workflows/queue/` | Reviewer / Admin | FIFO Review queue of articles in review |
| `GET` | `/api/v1/workflows/history/` | Reviewer / Admin | Recent company-wide review events |

---

### 1. Submit Article for Review
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/articles/{slug}/submit/`
- **Auth:** Bearer Token (Author or Admin)
- **Header:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "notes": "Ready for initial editorial and technical accuracy review."
}
```
- **Success Response (200 OK):**
```json
{
  "detail": "Article submitted for review successfully.",
  "status": "in_review",
  "status_display": "In Review",
  "submitted_at": "2026-10-20T02:00:00Z"
}
```

---

### 2. Inspect Review Queue
- **Method:** `GET`
- **URL:** `http://localhost:8000/api/v1/workflows/queue/?search=Security&page=1`
- **Auth:** Bearer Token (Reviewer or Admin)
- **Success Response (200 OK):**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "7b89f2a4-...",
      "title": "Zero Trust Architecture Guide",
      "slug": "zero-trust-architecture-guide",
      "summary": "Implementation specifications.",
      "author": { "username": "author_alice", "role": "AUTHOR" },
      "category": { "name": "Security", "slug": "security" },
      "status": "in_review",
      "status_display": "In Review",
      "submitted_at": "2026-10-20T02:00:00Z"
    }
  ]
}
```

---

### 3. Approve Article
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/articles/{slug}/approve/`
- **Auth:** Bearer Token (Reviewer or Admin; author != reviewer unless Admin)
- **Header:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "feedback": "Technical commands and security diagrams verified. Approved for publication."
}
```
- **Success Response (200 OK):**
```json
{
  "detail": "Article approved and published.",
  "status": "published",
  "status_display": "Published",
  "published_at": "2026-10-20T02:05:00Z"
}
```

---

### 4. Reject Article with Mandatory Feedback
- **Method:** `POST`
- **URL:** `http://localhost:8000/api/v1/articles/{slug}/reject/`
- **Auth:** Bearer Token (Reviewer or Admin)
- **Header:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "feedback": "Please add step-by-step rollback procedures and cite internal policy #42."
}
```
- **Success Response (200 OK):**
```json
{
  "detail": "Article rejected with feedback.",
  "status": "rejected",
  "status_display": "Changes Requested",
  "rejection_reason": "Please add step-by-step rollback procedures and cite internal policy #42."
}
```

---

### 5. Inspect Article Review Audit History
- **Method:** `GET`
- **URL:** `http://localhost:8000/api/v1/articles/{slug}/reviews/`
- **Auth:** Bearer Token (Author, Reviewer, or Admin)
- **Success Response (200 OK):**
```json
[
  {
    "id": "c1a2b3...",
    "article_slug": "zero-trust-architecture-guide",
    "article_title": "Zero Trust Architecture Guide",
    "actor": { "username": "reviewer_rachel", "role": "REVIEWER" },
    "action": "reject",
    "action_display": "Changes Requested",
    "from_status": "in_review",
    "to_status": "rejected",
    "feedback": "Please add step-by-step rollback procedures and cite internal policy #42.",
    "created_at": "2026-10-20T02:03:00Z"
  }
]
```
