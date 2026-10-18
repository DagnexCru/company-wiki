## 1. Role Hierarchy Specification
Details on ADMIN, AUTHOR, REVIEWER, and READER roles and capabilities.

## 2. Least Privilege Security Philosophy
Enforcing strict authorization on every read and write query.

## 3. Defense in Depth: Server vs Frontend
Frontend hides actions for UX; backend enforces invariants strictly.

## 4. Object-Level Article Ownership
Verifying request.user == article.author or request.user.is_admin.

