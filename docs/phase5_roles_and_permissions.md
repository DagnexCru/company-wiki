## 1. Role Hierarchy Specification
Details on ADMIN, AUTHOR, REVIEWER, and READER roles and capabilities.

## 2. Least Privilege Security Philosophy
Enforcing strict authorization on every read and write query.

## 3. Defense in Depth: Server vs Frontend
Frontend hides actions for UX; backend enforces invariants strictly.

## 4. Object-Level Article Ownership
Verifying request.user == article.author or request.user.is_admin.

## 5. Draft Content Isolation
Preventing Insecure Direct Object References (IDOR) on unpublished drafts.

## 6. Reviewer Workflow Permissions
Reviewers can inspect in-review documents but cannot edit author content.

## 7. Reader Access Scope
Readers receive 404 for unapproved drafts and can only access published documents.

## 8. Registration Role Escalation Threat Model
Ensuring incoming role parameters are stripped or defaulted to READER.

## 9. Profile Update Role Escalation Threat Model
Enforcing read-only role fields on self-service profile endpoints.

## 10. Administrator Lockout Prevention
Guarding against admins accidentally demoting or deactivating their own account.

## 11. API Spec: GET /api/v1/users/
Query parameters, response formats, and permission requirements.

## 12. API Spec: PATCH /api/v1/users/{id}/role/
Request payload schema, role validation, and response shapes.

## 13. API Spec: PATCH /api/v1/users/{id}/status/
Activation/deactivation mechanics and lockout guards.

## 14. Frontend RoleGuard Architecture
Routing interception, redirection to /access-denied, and role checks.

## 15. UserManagementPage Component Design
KPI cards, search filtering, inline role assignment, and confirmation feedback.

## 16. Test Suite Coverage: apps.accounts
Summary of 20 unit tests covering authentication and role administration.

## 17. Test Suite Coverage: apps.articles
Summary of 21 tests covering article CRUD, markdown, and negative permissions.

## 18. Verification Log: 53 Passing Backend Tests
All tests executing with zero failures across PostgreSQL test database.

## 19. Verification Log: Frontend Production Build
Clean compilation with tsc -b and vite build in 7.17s.

