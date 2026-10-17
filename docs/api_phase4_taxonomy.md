# Phase 4: Taxonomy & Content Organization API Reference

Complete specification for Categories and Tags endpoints.

## Endpoints
- `GET /api/v1/categories/`: List all categories (public/authenticated)
- `POST /api/v1/categories/`: Create category (Admin only)
- `GET /api/v1/categories/{slug}/`: Retrieve category detail
- `PATCH /api/v1/categories/{slug}/`: Update category (Admin only)
- `DELETE /api/v1/categories/{slug}/`: Delete category (Admin only)