# Phase 3: Knowledge Articles API Reference

Complete specification for all /api/v1/articles/ endpoints.

## Authentication Requirements
All article endpoints require Bearer JWT tokens in the Authorization header.

## Endpoints
- `GET /api/v1/articles/`: List articles (role-filtered)
- `POST /api/v1/articles/`: Create draft (author/admin)
- `GET /api/v1/articles/{slug}/`: Retrieve article details
- `PUT /api/v1/articles/{slug}/`: Update article
- `DELETE /api/v1/articles/{slug}/`: Delete draft or archive active

## Query Parameters
- `search`: Filter by keywords in title, summary, content
- `status`: Filter by article status (`draft`, `published`, `in_review`, `archived`)
- `author`: Filter by author username or UUID
- `page`: Page index (default: 1)
- `page_size`: Page size (default: 10, max: 100)

## Error Responses
- `401 Unauthorized`: Token missing, invalid, or expired
- `403 Forbidden`: Insufficient role permissions
- `404 Not Found`: Article does not exist or user lacks access