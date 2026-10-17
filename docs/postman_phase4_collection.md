# Phase 4: Postman Testing Guide

Verification scenarios for Category and Tag taxonomy.

### Scenario 1: Reader Taxonomy Access
Authenticate as `reader@company.com` and verify GET `/api/v1/categories/` returns 200 OK.

### Scenario 2: Admin Category Creation
Authenticate as `admin@company.com` and POST `/api/v1/categories/` with name, description, icon, and color.