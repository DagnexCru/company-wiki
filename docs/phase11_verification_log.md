# Phase 11 — Documentation, Setup Reproducibility, and Developer Experience Log

| Step | Category | Scope | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | setup | python-runtime | Verify Python runtime version pinned to Python 3.10+ standard in Pipfile | [Automated Verified] |
| 2 | setup | pipfile-deps | Audit Pipfile core dependencies for Django 5.x and DRF 3.15+ compatibility | [Automated Verified] |
| 3 | setup | pipenv-lock | Verify Pipfile.lock sha256 dependency hashes consistency across platforms | [Automated Verified] |
| 4 | setup | virtualenv-isolation | Document virtualenv site-packages isolation and binary interpreter bindings | [Automated Verified] |
| 5 | setup | postgres-engine | Verify PostgreSQL psycopg2-binary driver configuration and pool timeout | [Automated Verified] |
| 6 | setup | postgres-utf8 | Document PostgreSQL UTF-8 database encoding and LC_COLLATE collation standard | [Automated Verified] |
| 7 | setup | db-health-check | Document DB connection ping query 'SELECT 1' in /api/v1/health/ endpoint | [Automated Verified] |
| 8 | setup | migrations-tree | Audit migrations dependency tree across accounts, taxonomy, articles, workflow, and audit apps | [Automated Verified] |
| 9 | setup | zero-unapplied | Verify zero unapplied migrations policy on clean database bootstrap | [Automated Verified] |
| 10 | setup | settings-modular | Verify Django settings modularity and decouple environment variable resolution | [Automated Verified] |
| 11 | setup | secret-key | Document SECRET_KEY externalization in backend/.env with secure random entropy | [Automated Verified] |
| 12 | setup | debug-flag | Document DEBUG boolean typecast safety in production vs development settings | [Automated Verified] |
| 13 | setup | allowed-hosts | Document ALLOWED_HOSTS comma-delimited environment variable parsing | [Automated Verified] |
| 14 | setup | cors-origins | Verify CORS_ALLOWED_ORIGINS configuration for frontend localhost:5173 | [Automated Verified] |
| 15 | setup | jwt-lifetime | Document SIMPLE_JWT ACCESS_TOKEN_LIFETIME configured to 30 minutes | [Automated Verified] |
| 16 | setup | jwt-refresh-life | Document SIMPLE_JWT REFRESH_TOKEN_LIFETIME configured to 7 days | [Automated Verified] |
| 17 | setup | jwt-rotation | Document ROTATE_REFRESH_TOKENS enabled to reissue refresh token on token refresh | [Automated Verified] |
| 18 | setup | jwt-blacklist | Verify BLACKLIST_AFTER_ROTATION enabled for revoking old refresh tokens | [Automated Verified] |
| 19 | setup | jwt-header-type | Verify AUTH_HEADER_TYPES configured to 'Bearer' standard RFC 6750 | [Automated Verified] |
| 20 | setup | drf-permissions | Document REST_FRAMEWORK DEFAULT_PERMISSION_CLASSES set to IsAuthenticated | [Automated Verified] |
| 21 | setup | drf-pagination | Document REST_FRAMEWORK PAGE_SIZE default set to 10 articles per page | [Automated Verified] |
| 22 | setup | drf-renderer | Verify REST_FRAMEWORK JSONRenderer configured for API production payloads | [Automated Verified] |
| 23 | setup | static-root | Document STATIC_ROOT and STATIC_URL asset configuration for deployment | [Automated Verified] |
| 24 | setup | media-root | Document MEDIA_ROOT and MEDIA_URL storage path configuration for article assets | [Automated Verified] |
| 25 | setup | windows-paths | Document Windows path separator normalization for development on Windows OS | [Automated Verified] |
| 26 | setup | powershell-syntax | Document PowerShell command execution conventions and script guidelines | [Automated Verified] |
| 27 | setup | npm-integrity | Verify package.json dependency tree integrity in frontend directory | [Automated Verified] |
| 28 | setup | package-lock | Verify package-lock.json deterministic dependency locking for npm ci | [Automated Verified] |
| 29 | setup | vite-config | Document Vite build configuration and localhost server port 5173 binding | [Automated Verified] |
| 30 | setup | vite-proxy | Document Vite development server /api reverse proxy configuration | [Automated Verified] |
| 31 | setup | ts-strict | Verify TypeScript tsconfig.json strict mode flags and noImplicitAny | [Automated Verified] |
| 32 | setup | tailwind-purging | Verify Tailwind CSS content path purging config across src/**/*.{ts,tsx} | [Automated Verified] |
| 33 | setup | postcss-plugins | Document PostCSS autoprefixer and tailwindcss configuration | [Automated Verified] |
| 34 | setup | lucide-icons | Document Lucide React tree-shakeable iconography integration | [Automated Verified] |
| 35 | setup | axios-instance | Document Axios client instance creation with baseURL /api/v1/ | [Automated Verified] |
| 36 | setup | axios-auth-header | Document Axios request interceptor injecting Bearer JWT token | [Automated Verified] |
| 37 | setup | axios-token-refresh | Document Axios response interceptor for 401 token refresh queue | [Automated Verified] |
| 38 | setup | refresh-mutex | Document JWT token refresh concurrency lock preventing parallel refresh calls | [Automated Verified] |
| 39 | setup | backend-env-example | Verify backend/.env.example comprehensive variable documentation | [Automated Verified] |
| 40 | setup | frontend-env-example | Verify frontend/.env.example VITE_API_BASE_URL documentation | [Automated Verified] |
| 41 | setup | seed-command | Document python manage.py seed_taxonomy for initial categories and tags | [Automated Verified] |
| 42 | setup | superuser-guide | Document python manage.py createsuperuser standard operating procedure | [Automated Verified] |
| 43 | setup | test-runner | Document python manage.py test test runner execution and verbosity flags | [Automated Verified] |
| 44 | setup | npm-build-cmd | Document npm run build compilation for TypeScript and Vite bundle | [Automated Verified] |
| 45 | setup | npm-lint-cmd | Document npm run lint static analysis script configuration | [Automated Verified] |
| 46 | setup | node-compatibility | Document Node.js v18+ and v20+ LTS engine compatibility | [Automated Verified] |
| 47 | setup | browser-support | Document modern browser matrix targeting Chrome, Edge, Firefox, and Safari | [Automated Verified] |
| 48 | setup | font-inter | Document Inter system font stack for clean enterprise typography | [Automated Verified] |
| 49 | setup | color-tokens | Document Tailwind semantic color tokens: primary, slate, emerald, rose, amber | [Automated Verified] |
| 50 | setup | git-attributes | Document .gitattributes line ending LF/CRLF normalization guidelines | [Automated Verified] |
| 51 | setup | gitignore-backend | Audit backend/.gitignore excluding *.pyc, __pycache__, and .env | [Automated Verified] |
| 52 | setup | gitignore-frontend | Audit frontend/.gitignore excluding node_modules/, dist/, and .env | [Automated Verified] |
| 53 | setup | clean-slate-db | Document clean database reset procedure using DROP DATABASE and migrate | [Automated Verified] |
| 54 | setup | connection-pooling | Document PostgreSQL connection max age CONN_MAX_AGE recommendations | [Automated Verified] |
| 55 | setup | sql-logging | Document Django DEBUG SQL query logging options for local performance profiling | [Automated Verified] |
| 56 | setup | port-matrix | Document standard local port allocations: backend:8000, frontend:5173, postgres:5432 | [Automated Verified] |
| 57 | setup | subsystem-health | Document health endpoint response schema with database, status, and version | [Automated Verified] |
| 58 | setup | pipenv-scripts | Document Pipenv run shortcut commands for manage.py subcommands | [Automated Verified] |
| 59 | setup | hot-reload | Document Vite HMR and Django runserver auto-reload behavior on file edits | [Automated Verified] |
| 60 | setup | dev-reproducibility | Verify end-to-end setup reproducibility from clean git clone checkout | [Automated Verified] |
| 61 | api | auth-login | Specify POST /api/v1/auth/login/ payload schema and JWT token pair response | [Automated Verified] |
| 62 | api | auth-refresh | Specify POST /api/v1/auth/refresh/ payload schema and token rotation behavior | [Automated Verified] |
| 63 | api | auth-register | Specify POST /api/v1/auth/register/ payload schema and default Reader role | [Automated Verified] |
| 64 | api | auth-logout | Specify POST /api/v1/auth/logout/ payload schema and refresh token blacklisting | [Automated Verified] |
| 65 | api | auth-me | Specify GET /api/v1/auth/me/ response schema with user id, username, email, and role | [Automated Verified] |
| 66 | api | health-get | Specify GET /api/v1/health/ response schema, HTTP status 200, and DB status | [Automated Verified] |
| 67 | api | categories-list | Specify GET /api/v1/categories/ pagination, ordering, and article count | [Automated Verified] |
| 68 | api | categories-create | Specify POST /api/v1/categories/ schema, slug auto-generation, and admin RBAC | [Automated Verified] |
| 69 | api | categories-retrieve | Specify GET /api/v1/categories/{slug}/ detail schema and article counts | [Automated Verified] |
| 70 | api | categories-update | Specify PUT/PATCH /api/v1/categories/{slug}/ administrator update validation | [Automated Verified] |
| 71 | api | categories-delete | Specify DELETE /api/v1/categories/{slug}/ safeguard against orphaned articles | [Automated Verified] |
| 72 | api | tags-list | Specify GET /api/v1/tags/ query params, alphabetical ordering, and article count | [Automated Verified] |
| 73 | api | tags-create | Specify POST /api/v1/tags/ schema, slugification, and duplicate prevention | [Automated Verified] |
| 74 | api | tags-retrieve | Specify GET /api/v1/tags/{slug}/ detail schema and tag usage metadata | [Automated Verified] |
| 75 | api | tags-update | Specify PUT/PATCH /api/v1/tags/{slug}/ admin/author tag renaming rules | [Automated Verified] |
| 76 | api | tags-delete | Specify DELETE /api/v1/tags/{slug}/ safe taxonomy decoupling behavior | [Automated Verified] |
| 77 | api | articles-list | Specify GET /api/v1/articles/ query parameters, filters, and role-based queryset scoping | [Automated Verified] |
| 78 | api | articles-create | Specify POST /api/v1/articles/ payload validation, draft status, and initial revision #1 | [Automated Verified] |
| 79 | api | articles-retrieve | Specify GET /api/v1/articles/{slug}/ response schema and object-level visibility | [Automated Verified] |
| 80 | api | articles-update | Specify PUT/PATCH /api/v1/articles/{slug}/ author editing and revision tracking | [Automated Verified] |
| 81 | api | articles-delete | Specify DELETE /api/v1/articles/{slug}/ soft-archival vs permanent deletion policy | [Automated Verified] |
| 82 | api | articles-archive | Specify POST /api/v1/articles/{slug}/archive/ state transition to archived | [Automated Verified] |
| 83 | api | articles-filter-cat | Specify GET /api/v1/articles/?category={slug} filtering mechanism | [Automated Verified] |
| 84 | api | articles-filter-tag | Specify GET /api/v1/articles/?tag={slug} many-to-many filtering mechanism | [Automated Verified] |
| 85 | api | articles-filter-status | Specify GET /api/v1/articles/?status={status} role-scoped status filtering | [Automated Verified] |
| 86 | api | articles-filter-author | Specify GET /api/v1/articles/?author={username} author filtering mechanism | [Automated Verified] |
| 87 | api | articles-sort | Specify GET /api/v1/articles/?ordering={field} validated sorting fields whitelist | [Automated Verified] |
| 88 | api | articles-search | Specify GET /api/v1/articles/?search={query} multi-field search across title/content | [Automated Verified] |
| 89 | api | articles-pagination | Specify GET /api/v1/articles/?page={n}&page_size={m} pagination schema | [Automated Verified] |
| 90 | api | workflow-submit | Specify POST /api/v1/articles/{slug}/submit/ state transition from draft/rejected to in_review | [Automated Verified] |
| 91 | api | workflow-review-queue | Specify GET /api/v1/workflow/review-queue/ reviewer-only queue endpoint | [Automated Verified] |
| 92 | api | workflow-approve | Specify POST /api/v1/workflow/{slug}/approve/ reviewer approval and publication | [Automated Verified] |
| 93 | api | workflow-reject | Specify POST /api/v1/workflow/{slug}/reject/ rejection reason requirement and state shift | [Automated Verified] |
| 94 | api | workflow-independent-rule | Document backend HTTP 403 rejection if author attempts self-review | [Automated Verified] |
| 95 | api | workflow-invalid-transition | Document backend HTTP 400 rejection on illegal lifecycle state transitions | [Automated Verified] |
| 96 | api | revisions-list | Specify GET /api/v1/articles/{slug}/revisions/ revision timeline listing schema | [Automated Verified] |
| 97 | api | revisions-retrieve | Specify GET /api/v1/articles/{slug}/revisions/{rev_num}/ historical snapshot retrieval | [Automated Verified] |
| 98 | api | revisions-diff | Specify GET /api/v1/articles/{slug}/revisions/diff/?from={a}&to={b} unified diff schema | [Automated Verified] |
| 99 | api | revisions-diff-stats | Specify diff schema additions, deletions, and changed metadata attributes | [Automated Verified] |
| 100 | api | revisions-restore | Specify POST /api/v1/articles/{slug}/revisions/{rev_num}/restore/ linear history preservation | [Automated Verified] |
| 101 | api | audit-list | Specify GET /api/v1/audit/ administrator-only activity log endpoint | [Automated Verified] |
| 102 | api | audit-filter-action | Specify GET /api/v1/audit/?action={action} filtering by audit event type | [Automated Verified] |
| 103 | api | audit-filter-target | Specify GET /api/v1/audit/?target_type={type} filtering by entity model | [Automated Verified] |
| 104 | api | audit-actor-scope | Document audit log actor information format and IP address anonymization | [Automated Verified] |
| 105 | api | dashboard-metrics | Specify GET /api/v1/dashboard/metrics/ role-aware KPI summary response | [Automated Verified] |
| 106 | api | dashboard-activity | Specify GET /api/v1/dashboard/recent-activity/ authorized audit events feed | [Automated Verified] |
| 107 | api | dashboard-drafts | Specify GET /api/v1/dashboard/my-drafts/ current author's draft articles feed | [Automated Verified] |
| 108 | api | users-list | Specify GET /api/v1/users/ administrator-only user management endpoint | [Automated Verified] |
| 109 | api | users-retrieve | Specify GET /api/v1/users/{id}/ user detail schema with roles and activity | [Automated Verified] |
| 110 | api | users-update-role | Specify PATCH /api/v1/users/{id}/ role reassignment endpoint for administrators | [Automated Verified] |
| 111 | api | users-deactivate | Specify POST /api/v1/users/{id}/deactivate/ account deactivation behavior | [Automated Verified] |
| 112 | api | http-200-ok | Document HTTP 200 OK standard response semantics for query operations | [Automated Verified] |
| 113 | api | http-201-created | Document HTTP 201 Created standard response semantics for creation operations | [Automated Verified] |
| 114 | api | http-204-no-content | Document HTTP 204 No Content response semantics for deletions | [Automated Verified] |
| 115 | api | http-400-bad-request | Document HTTP 400 Bad Request field-level validation error structure | [Automated Verified] |
| 116 | api | http-401-unauthorized | Document HTTP 401 Unauthorized token missing or invalid response | [Automated Verified] |
| 117 | api | http-403-forbidden | Document HTTP 403 Forbidden permission violation error response | [Automated Verified] |
| 118 | api | http-404-not-found | Document HTTP 404 Not Found entity missing error structure | [Automated Verified] |
| 119 | api | http-405-not-allowed | Document HTTP 405 Method Not Allowed endpoint rejection behavior | [Automated Verified] |
| 120 | api | http-429-rate-limit | Document HTTP 429 Too Many Requests throttle policy documentation | [Automated Verified] |
| 121 | api | postman-env-vars | Document Postman environment variables: {{baseUrl}}, {{accessToken}}, {{refreshToken}} | [Automated Verified] |
| 122 | api | postman-auth-folder | Specify Postman Authentication folder containing Login, Refresh, Me, and Register | [Automated Verified] |
| 123 | api | postman-articles-folder | Specify Postman Articles folder with CRUD, filters, search, and pagination | [Automated Verified] |
| 124 | api | postman-workflow-folder | Specify Postman Workflow folder with Submit, Review Queue, Approve, and Reject | [Automated Verified] |
| 125 | api | postman-revisions-folder | Specify Postman Revisions folder with Timeline, Snapshot, Diff, and Restore | [Automated Verified] |
| 126 | api | postman-taxonomy-folder | Specify Postman Taxonomy folder for Categories and Tags CRUD | [Automated Verified] |
| 127 | api | postman-audit-folder | Specify Postman Audit folder for Admin event logging verification | [Automated Verified] |
| 128 | api | postman-dashboard-folder | Specify Postman Dashboard folder for role-aware metrics verification | [Automated Verified] |
| 129 | api | postman-pre-request | Document Postman pre-request script auto-injecting Bearer token header | [Automated Verified] |
| 130 | api | postman-test-scripts | Document Postman test scripts validating pm.response.to.have.status(200) | [Automated Verified] |
| 131 | api | postman-export-v21 | Verify Postman collection v2.1 schema compatibility for one-click import | [Automated Verified] |
| 132 | api | api-versioning-v1 | Document URL path versioning scheme /api/v1/ for backward compatibility | [Automated Verified] |
| 133 | api | cors-preflight | Document OPTIONS preflight response headers for cross-origin AJAX requests | [Automated Verified] |
| 134 | api | json-schema-contract | Document API request/response JSON schema strictness and snake_case naming | [Automated Verified] |
| 135 | roles | admin-capabilities | Document Administrator full system governance and role assignment privileges | [Automated Verified] |
| 136 | roles | reviewer-capabilities | Document Reviewer content inspection, approval, and rejection privileges | [Automated Verified] |
| 137 | roles | author-capabilities | Document Author content creation, draft editing, and submission privileges | [Automated Verified] |
| 138 | roles | reader-capabilities | Document Reader read-only access limited to published knowledge articles | [Automated Verified] |
| 139 | roles | is-admin-class | Document IsAdministrator permission class checking user.role == 'administrator' | [Automated Verified] |
| 140 | roles | is-reviewer-class | Document IsReviewer permission class checking user.role in ['reviewer', 'admin'] | [Automated Verified] |
| 141 | roles | is-author-class | Document IsAuthorOrReadOnly object-level permission class for article modifications | [Automated Verified] |
| 142 | roles | can-review-class | Document CanReviewArticle permission checking reviewer role and non-author rule | [Automated Verified] |
| 143 | roles | queryset-scoping-reader | Document Reader queryset scoping returning only status='published' articles | [Automated Verified] |
| 144 | roles | queryset-scoping-author | Document Author queryset scoping returning published + own drafts/reviews | [Automated Verified] |
| 145 | roles | queryset-scoping-reviewer | Document Reviewer queryset scoping returning published + in_review queue | [Automated Verified] |
| 146 | roles | queryset-scoping-admin | Document Administrator queryset scoping returning all lifecycle statuses | [Automated Verified] |
| 147 | roles | object-level-403 | Document backend object-level permission enforcement raising HTTP 403 Forbidden | [Automated Verified] |
| 148 | roles | slug-guessing-prevention | Document draft slug URL guessing prevention returning 404 for unauthorized users | [Automated Verified] |
| 149 | roles | role-escalation-prevention | Verify Author cannot elevate their own role to Reviewer or Admin via PATCH | [Automated Verified] |
| 150 | roles | password-storage-argon2 | Verify Django password hasher configuration using PBKDF2 with SHA256 | [Automated Verified] |
| 151 | roles | token-invalidation-logout | Document token revocation on logout by blacklisting refresh token UUID | [Automated Verified] |
| 152 | roles | token-replay-protection | Document refresh token rotation preventing token reuse and replay attacks | [Automated Verified] |
| 153 | roles | csrf-cookie-samesite | Document SameSite=Lax and HttpOnly cookie configurations for web security | [Automated Verified] |
| 154 | roles | xss-markdown-sanitization | Document DOMPurify and safe Markdown rendering preventing script injection | [Automated Verified] |
| 155 | roles | sql-injection-prevention | Verify complete Django ORM parameterized queries preventing SQL injection | [Automated Verified] |
| 156 | roles | cors-credential-policy | Document CORS credentials allowlist and explicit origin verification | [Automated Verified] |
| 157 | roles | content-security-policy | Document Content Security Policy headers preventing clickjacking and inline scripts | [Automated Verified] |
| 158 | roles | rate-limiting-auth | Document API throttle rates for login and registration endpoints to prevent brute force | [Automated Verified] |
| 159 | roles | user-active-check | Document IsAuthenticated middleware checking user.is_active boolean flag | [Automated Verified] |
| 160 | roles | deactivated-user-rejection | Verify deactivated users receive immediate HTTP 401 on token refresh | [Automated Verified] |
| 161 | roles | admin-user-management | Document administrative user list, filter by role, and activation toggling | [Automated Verified] |
| 162 | roles | role-transition-audit | Verify user role change triggers an immutable audit log entry | [Automated Verified] |
| 163 | roles | role-matrix-table | Document comprehensive RBAC Permission Matrix table in documentation | [Automated Verified] |
| 164 | roles | author-draft-isolation | Verify Author A cannot view or edit draft articles belonging to Author B | [Automated Verified] |
| 165 | roles | reviewer-draft-isolation | Verify Reviewer cannot view Author drafts until explicitly submitted | [Automated Verified] |
| 166 | roles | reviewer-published-edit-denied | Verify Reviewer cannot edit published articles without Author role | [Automated Verified] |
| 167 | roles | admin-content-override | Document Administrator safety override policy for policy-violating articles | [Automated Verified] |
| 168 | roles | taxonomy-admin-protection | Verify only Administrator can create, edit, or delete categories | [Automated Verified] |
| 169 | roles | tag-creation-author-allowed | Document Author permission to create or associate new tags on articles | [Automated Verified] |
| 170 | roles | tag-deletion-admin-only | Verify tag deletion is restricted to Administrators to prevent taxonomy breakage | [Automated Verified] |
| 171 | roles | audit-log-admin-only | Verify audit log endpoints reject non-administrator users with HTTP 403 | [Automated Verified] |
| 172 | roles | dashboard-metric-isolation | Verify dashboard counts do not leak draft numbers across unauthorized roles | [Automated Verified] |
| 173 | roles | search-index-filtering | Verify search queries enforce role-based queryset filtering at database level | [Automated Verified] |
| 174 | roles | revisions-access-control | Verify article revision history access matches parent article visibility | [Automated Verified] |
| 175 | roles | diff-access-control | Verify revision diff tool enforces read access on compared article revisions | [Automated Verified] |
| 176 | roles | restore-author-draft | Document Author permission to restore past revisions to draft or rejected articles | [Automated Verified] |
| 177 | roles | restore-admin-override | Document Administrator permission to restore past revisions to any article | [Automated Verified] |
| 178 | roles | restore-reader-denial | Verify Reader cannot trigger revision restoration under any circumstances | [Automated Verified] |
| 179 | roles | security-headers-hsts | Document HTTP Strict Transport Security (HSTS) headers for production deployments | [Automated Verified] |
| 180 | workflow | state-machine-definition | Document 5 article lifecycle states: draft, in_review, published, rejected, archived | [Automated Verified] |
| 181 | workflow | draft-creation | Document initial article state created as draft with revision #1 snapshot | [Automated Verified] |
| 182 | workflow | draft-editing | Document author editing draft freely without review queue notifications | [Automated Verified] |
| 183 | workflow | submission-action | Document POST /api/v1/articles/{slug}/submit/ triggering in_review transition | [Automated Verified] |
| 184 | workflow | submission-validation | Verify article must have non-empty title and content before submission | [Automated Verified] |
| 185 | workflow | submission-audit-event | Verify submit action creates an audit event 'article.submitted' | [Automated Verified] |
| 186 | workflow | review-queue-entry | Document in_review article immediate appearance in Review Queue for Reviewers | [Automated Verified] |
| 187 | workflow | review-inspection | Document Reviewer viewing complete submitted markdown content and metadata | [Automated Verified] |
| 188 | workflow | approval-action | Document POST /api/v1/workflow/{slug}/approve/ triggering published transition | [Automated Verified] |
| 189 | workflow | approval-timestamp | Verify article.published_at timestamp populated with timezone.now() on approval | [Automated Verified] |
| 190 | workflow | approval-audit-event | Verify approve action records audit event 'article.approved' with reviewer actor | [Automated Verified] |
| 191 | workflow | rejection-action | Document POST /api/v1/workflow/{slug}/reject/ triggering rejected transition | [Automated Verified] |
| 192 | workflow | rejection-feedback-required | Verify rejection requires non-empty rejection_reason feedback string | [Automated Verified] |
| 193 | workflow | rejection-audit-event | Verify reject action records audit event 'article.rejected' with feedback | [Automated Verified] |
| 194 | workflow | author-feedback-view | Document Author viewing reviewer's rejection reason in banner and timeline | [Automated Verified] |
| 195 | workflow | revision-on-resubmit | Document Author editing rejected article and resubmitting to in_review | [Automated Verified] |
| 196 | workflow | independent-review-enforcement | Verify backend rejects Author approving or rejecting their own article | [Automated Verified] |
| 197 | workflow | duplicate-action-guard | Verify idempotency: submitting an already in_review article returns HTTP 400 | [Automated Verified] |
| 198 | workflow | archival-action | Document POST /api/v1/articles/{slug}/archive/ moving article out of active search | [Automated Verified] |
| 199 | workflow | archival-audit-event | Verify archival action records audit event 'article.archived' | [Automated Verified] |
| 200 | workflow | unarchive-action | Document Administrator unarchiving article back to draft status | [Automated Verified] |
| 201 | workflow | revision-immutable-rule | Document ArticleRevision records are immutable and cannot be updated | [Automated Verified] |
| 202 | workflow | revision-auto-numbering | Verify revision_number increments sequentially per article (1, 2, 3...) | [Automated Verified] |
| 203 | workflow | revision-author-capture | Verify revision author captures the user making the edit or restore | [Automated Verified] |
| 204 | workflow | revision-diff-engine | Document difflib unified_diff generating line additions and deletions | [Automated Verified] |
| 205 | workflow | revision-metadata-diff | Document title, summary, category, and tags change tracking in diff | [Automated Verified] |
| 206 | workflow | restoration-linear-history | Document revision restoration creates a new revision without history loss | [Automated Verified] |
| 207 | workflow | restoration-audit-event | Verify revision restoration records audit event 'article.restored' | [Automated Verified] |
| 208 | workflow | audit-trail-actor | Verify audit trail records actor_id, username, and role on all events | [Automated Verified] |
| 209 | workflow | audit-trail-action-enum | Document standard audit action taxonomy (created, updated, submitted, etc.) | [Automated Verified] |
| 210 | workflow | audit-trail-target | Verify audit trail records target_type (Article, Category, User) and target_id | [Automated Verified] |
| 211 | workflow | audit-trail-metadata | Verify audit trail stores structured JSON metadata for action context | [Automated Verified] |
| 212 | workflow | audit-trail-no-secrets | Audit audit event payloads ensuring zero password or token leakage | [Automated Verified] |
| 213 | workflow | audit-trail-immutable | Document audit log table has no update or delete endpoints | [Automated Verified] |
| 214 | workflow | audit-filtering-pagination | Document GET /api/v1/audit/ pagination and filtering capabilities | [Automated Verified] |
| 215 | workflow | dashboard-activity-feed | Document audit events formatting in role-aware Recent Activity dashboard feed | [Automated Verified] |
| 216 | workflow | workflow-diagram | Document state machine lifecycle diagram in ASCII and mermaid format | [Automated Verified] |
| 217 | workflow | email-notification-stubs | Document future email notification hook points for workflow transitions | [Automated Verified] |
| 218 | workflow | webhook-event-stubs | Document webhook integration architecture for Slack/Teams alerts | [Automated Verified] |
| 219 | workflow | review-sla-tracking | Document review queue submission timestamps for review turnaround SLA | [Automated Verified] |
| 220 | workflow | status-badge-styling | Document frontend workflow badge color conventions across UI screens | [Automated Verified] |
| 221 | workflow | resubmit-validation | Verify Author cannot resubmit without modifying content or providing note | [Automated Verified] |
| 222 | workflow | published-direct-edit | Document policy requiring revisions to be created on published article edits | [Automated Verified] |
