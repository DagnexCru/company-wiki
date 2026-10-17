# Phase 4: Taxonomy & Content Organization API Reference

Complete specification for Categories and Tags endpoints.

## Endpoints
- `GET /api/v1/categories/`: List all categories (public/authenticated)
- `POST /api/v1/categories/`: Create category (Admin only)
- `GET /api/v1/categories/{slug}/`: Retrieve category detail
- `PATCH /api/v1/categories/{slug}/`: Update category (Admin only)
- `DELETE /api/v1/categories/{slug}/`: Delete category (Admin only)

## Tags Endpoints
- `GET /api/v1/tags/`: List all tags with article counts
- `POST /api/v1/tags/`: Create new tag (Admin only)
- `DELETE /api/v1/tags/{slug}/`: Delete tag (Admin only)