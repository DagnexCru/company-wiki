# Phase 3: Postman Testing Guide

Step-by-step instructions for verifying Article CRUD operations.

### Step 1: Obtain Author Token
`POST /api/v1/auth/login/` with `author@company.com` credentials.

### Step 2: List Articles
`GET /api/v1/articles/` with Authorization Bearer token.

### Step 3: Create Article Draft
`POST /api/v1/articles/` with title, summary, and content in JSON payload.

### Step 4: Validate Workflow Protection
Verify that submitting `status: 'published'` retains `draft` status.