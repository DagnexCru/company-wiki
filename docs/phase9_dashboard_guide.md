# Phase 9: Role-Aware Dashboard & Content Discovery Specification

## 1. Overview
Phase 9 delivers a centralized, role-aware dashboard for the Internal Knowledge Base & Company Wiki.
The dashboard transforms raw PostgreSQL data into actionable telemetry and rapid shortcuts tailored
specifically to each user role (Reader, Author, Reviewer, Administrator).

## 2. Role-Gated Telemetry Matrix

| Role | Accessible Metrics | Interactive Queues & Discovery | Restricted Metrics (Strictly Hidden) |
| :--- | :--- | :--- | :--- |
| **Reader** | Total Published Articles, Category Distribution | Recently Published Documentation, Knowledge by Category Grid | Drafts, In-Review Queue, User Totals, Audit Activity |
| **Author** | Total Published, Category Distribution, My Drafts, My In-Review, My Rejected, My Published | Recently Published, My Active Drafts & Revisions Queue | Review Queue from Other Authors, System Admin Metrics |
| **Reviewer** | Total Published, Category Distribution, Pending Reviews Count | Recently Published, Editorial Review Queue (1-Click Inspect) | Private System Audit Activity, User Role Administration |
| **Administrator** | Total Articles (All Statuses), Published, Draft, In-Review, Rejected, Archived, Total Users, Categories, Tags, 24h Audit Volume | All Queues (Editorial, Drafts, Published), Category Grid, Live System Audit Stream | None (Full Operational Visibility) |

## 3. Endpoints
- `GET /api/v1/dashboard/`: Primary role-aware dashboard telemetry endpoint.
- `GET /api/v1/articles/dashboard/`: Backward-compatible alias endpoint.
