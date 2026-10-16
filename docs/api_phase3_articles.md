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