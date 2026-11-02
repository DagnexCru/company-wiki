import math
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import CustomUser
from apps.taxonomy.models import Category, Tag
from apps.articles.models import Article, ArticleRevision, ArticleAttachment, ArticlePresence
from apps.workflows.models import ReviewRecord
from apps.audit.models import AuditEvent


class Command(BaseCommand):
    help = "Purge existing content (preserving users) and populate the database with comprehensive, realistic company wiki data for AI and workflow features."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-audit",
            action="store_true",
            help="Keep historical audit log entries instead of clearing them.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting complete database reset of articles, taxonomy, and workflows (preserving users)..."))

        # 1. Fetch Users
        admin_user = CustomUser.objects.filter(role=CustomUser.Role.ADMIN).first()
        author_user = CustomUser.objects.filter(role=CustomUser.Role.AUTHOR).first()
        reviewer_user = CustomUser.objects.filter(role=CustomUser.Role.REVIEWER).first()
        reader_user = CustomUser.objects.filter(role=CustomUser.Role.READER).first()

        if not admin_user:
            admin_user = CustomUser.objects.create_superuser(
                email="admin@company.com",
                username="admin_lead",
                full_name="Alex Admin",
                role=CustomUser.Role.ADMIN,
                password="AdminPassword123!",
            )
            self.stdout.write(self.style.SUCCESS("Created demo Admin account: admin@company.com"))

        if not author_user:
            author_user = CustomUser.objects.create_user(
                email="author@company.com",
                username="sarah_author",
                full_name="Sarah Jenkins",
                role=CustomUser.Role.AUTHOR,
                password="AuthorPassword123!",
            )
            self.stdout.write(self.style.SUCCESS("Created demo Author account: author@company.com"))

        if not reviewer_user:
            reviewer_user = CustomUser.objects.create_user(
                email="reviewer@company.com",
                username="david_reviewer",
                full_name="David Morales",
                role=CustomUser.Role.REVIEWER,
                password="ReviewerPassword123!",
            )
            self.stdout.write(self.style.SUCCESS("Created demo Reviewer account: reviewer@company.com"))

        if not reader_user:
            reader_user = CustomUser.objects.create_user(
                email="reader@company.com",
                username="rachel_reader",
                full_name="Rachel Vance",
                role=CustomUser.Role.READER,
                password="ReaderPassword123!",
            )
            self.stdout.write(self.style.SUCCESS("Created demo Reader account: reader@company.com"))

        # 2. Transactional Purge of Content (Preserving Users)
        with transaction.atomic():
            deleted_presence, _ = ArticlePresence.objects.all().delete()
            deleted_attachments, _ = ArticleAttachment.objects.all().delete()
            deleted_reviews, _ = ReviewRecord.objects.all().delete()
            deleted_revisions, _ = ArticleRevision.objects.all().delete()
            deleted_articles, _ = Article.objects.all().delete()
            deleted_tags, _ = Tag.objects.all().delete()
            deleted_categories, _ = Category.objects.all().delete()
            if not options.get("keep_audit"):
                deleted_audits, _ = AuditEvent.objects.all().delete()
            else:
                deleted_audits = 0

        self.stdout.write(
            self.style.SUCCESS(
                f"Cleared old content: {deleted_articles} articles, {deleted_revisions} revisions, "
                f"{deleted_reviews} reviews, {deleted_categories} categories, {deleted_tags} tags, "
                f"{deleted_presence} presences, {deleted_audits} audit logs."
            )
        )

        # 3. Seed Realistic Categories
        categories_spec = [
            {
                "name": "Engineering & Architecture",
                "description": "Software design patterns, backend microservices, coding conventions, and API architecture.",
                "icon": "code",
                "color": "indigo",
            },
            {
                "name": "DevOps & Cloud Infrastructure",
                "description": "Kubernetes orchestration, CI/CD pipelines, AWS/GCP cloud environments, and IaC standards.",
                "icon": "server",
                "color": "purple",
            },
            {
                "name": "Security & Compliance",
                "description": "SOC 2 Type II guidelines, Zero-Trust network policies, cryptography, and access controls.",
                "icon": "shield",
                "color": "rose",
            },
            {
                "name": "Incident Response & SRE",
                "description": "Severity escalation matrices, on-call runbooks, root-cause analyses, and post-mortem templates.",
                "icon": "alert-triangle",
                "color": "amber",
            },
            {
                "name": "People Operations & HR",
                "description": "Employee benefits, remote work allowances, performance ladders, and workplace conduct.",
                "icon": "users",
                "color": "emerald",
            },
            {
                "name": "IT Support & Workplace",
                "description": "Hardware provisioning, VPN setup, Okta SSO, password managers, and device encryption.",
                "icon": "life-buoy",
                "color": "sky",
            },
            {
                "name": "Product & Design System",
                "description": "Design tokens, accessibility guidelines, UX writing, and user testing frameworks.",
                "icon": "layout",
                "color": "cyan",
            },
            {
                "name": "Data Engineering & Analytics",
                "description": "Snowflake data warehousing, dbt modeling, real-time Kafka streams, and metric definitions.",
                "icon": "database",
                "color": "teal",
            },
            {
                "name": "Customer Support & Success",
                "description": "SLA commitments, client escalation paths, ticketing runbooks, and enterprise support SOPs.",
                "icon": "headphones",
                "color": "orange",
            },
            {
                "name": "Legal & Privacy Governance",
                "description": "GDPR compliance, data retention schedules, vendor confidentiality, and IP ownership.",
                "icon": "file-text",
                "color": "slate",
            },
        ]

        cats_map = {}
        for c in categories_spec:
            cat_obj, _ = Category.objects.get_or_create(
                name=c["name"],
                defaults={
                    "description": c["description"],
                    "icon": c["icon"],
                    "color": c["color"],
                },
            )
            cats_map[c["name"]] = cat_obj

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cats_map)} corporate categories."))

        # 4. Seed Realistic Tags
        tags_list = [
            "Architecture", "Backend", "Frontend", "React", "TypeScript", "Python", "Django",
            "PostgreSQL", "Kubernetes", "Docker", "DevOps", "CI/CD", "AWS", "Security",
            "ZeroTrust", "SOC2", "GDPR", "IncidentResponse", "Runbook", "SRE", "Observability",
            "Onboarding", "HR", "RemoteWork", "DesignSystem", "Tailwind", "API", "REST",
            "Performance", "Testing", "Database", "Snowflake"
        ]

        tags_map = {}
        for t_name in tags_list:
            t_obj, _ = Tag.objects.get_or_create(name=t_name)
            tags_map[t_name] = t_obj

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(tags_map)} taxonomy tags."))

        # 5. Seed Realistic, In-Depth Knowledge Articles
        now = timezone.now()

        articles_data = [
            {
                "title": "Production Incident Management & Severity Escalation Framework",
                "category": "Incident Response & SRE",
                "tags": ["IncidentResponse", "Runbook", "SRE", "Observability"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
                "summary": "Mandatory protocols, Slack command triggers, severity matrices (SEV-1 to SEV-4), and post-incident review timelines for production outages.",
                "content": """# Production Incident Management & Severity Escalation Framework

This standard operating procedure governs how engineering, operations, and support teams detect, triage, mitigate, and resolve production service disruptions.

## 1. Severity Classification Matrix

Every incident must be assigned an unambiguous severity tier upon declaration:

| Severity | Impact Description | Initial Response SLA | Escalation Target |
|---|---|---|---|
| **SEV-1 (Critical)** | Core platform down, massive customer data loss, or primary API failure affecting > 25% of traffic. | < 5 minutes | VP of Engineering, Incident Commander, Exec On-call |
| **SEV-2 (Major)** | Major component unavailable with no direct workaround (e.g., billing system down, search offline). | < 15 minutes | Service Tech Lead, Staff SRE On-call |
| **SEV-3 (Moderate)** | Non-critical feature degraded; customer workaround available; localized performance degradation. | < 1 hour | Primary Team On-call Engineer |
| **SEV-4 (Minor)** | Minor visual defects, administrative dashboard glitch, or non-blocking internal tooling bug. | Next business day | Backlog triage |

## 2. Incident Declaration & War Room Setup

To declare an incident, execute the automated bot command in Slack:
```bash
/incident declare "PostgreSQL read-replica replication lag exceeding 120s"
```
The automation performs the following instant provisioning:
- Creates a dedicated channel `#inc-<incident-id>` (e.g. `#inc-2026-042`).
- Pings the designated **Incident Commander (IC)** and on-call SRE pager.
- Spawns a Zoom war room conference link pinned to the channel topic.

## 3. Core Incident Roles
- **Incident Commander (IC):** Holds sole operational authority. Assigns tasks, coordinates mitigation, and keeps engineers focused.
- **Communications Lead:** Updates the public status page (`status.company.com`) every 20 minutes for SEV-1 incidents.
- **Operations / Investigator:** Focuses exclusively on logs, traces, and metrics to isolate root causes.

## 4. Post-Incident Review (PIR) Timeline
Within **48 hours** of incident resolution, the IC must facilitate a blameless post-mortem covering:
1. Exact chronological timeline with UTC timestamps.
2. Root cause analysis using the 5-Whys methodology.
3. Remediation action items tracked in Jira with assigned owners and 14-day completion targets.
""",
            },
            {
                "title": "Zero-Trust Security Architecture & Identity-Aware Access Policies",
                "category": "Security & Compliance",
                "tags": ["Security", "ZeroTrust", "SOC2", "AWS", "OAuth2"],
                "author": admin_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
                "summary": "Implementation details of our perimeterless security model, hardware YubiKey MFA requirements, and automated IAM least-privilege policies.",
                "content": """# Zero-Trust Security Architecture & Identity-Aware Access Policies

Our company operates under a strict **Zero-Trust Network Architecture (ZTNA)**. Perimeter security assumptions are eliminated; every request—whether originating inside the office network or remotely—must be authenticated, authorized, and encrypted.

## 1. Core Principles
- **Verify Explicitly:** Always authenticate and authorize based on all available data points, including user identity, device health, and geographic anomaly checks.
- **Least-Privilege Access:** Limit user and service access with Just-In-Time (JIT) and Just-Enough-Access (JEA) permissions.
- **Assume Breach:** Minimize blast radius by segmenting network zones, encrypting end-to-end, and maintaining continuous observability.

## 2. Hardware-Enforced Multi-Factor Authentication (MFA)
- All staff must authenticate using a FIDO2 / WebAuthn physical security key (YubiKey 5C series).
- SMS and voice-call OTP verification are **strictly prohibited** due to SIM-swapping vulnerabilities.
- TOTP authenticator apps are permitted only as a temporary backup after verification with IT Security.

## 3. Production Infrastructure Access
Direct SSH access to production EC2 instances and Kubernetes worker nodes is disabled. Engineers must access production systems exclusively through:
1. **Teleport Identity-Aware Proxy** with short-lived 8-hour certificates.
2. Two-person dual authorization for database read/write access.
3. Complete keystroke audit logging persisted to immutable S3 buckets.

## 4. Cryptographic Standards
- **Data at Rest:** Encrypted with AES-256 via AWS KMS customer-managed keys (CMK) with annual automated key rotation.
- **Data in Transit:** TLS 1.3 enforced across all public endpoints and internal service meshes. Legacy TLS 1.0/1.1 connections are terminated at the load balancer.
""",
            },
            {
                "title": "PostgreSQL 16 High-Availability Clustering & Connection Optimization",
                "category": "Engineering & Architecture",
                "tags": ["PostgreSQL", "Database", "Architecture", "Performance", "Backend"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
                "summary": "Technical blueprint for Patroni-orchestrated PostgreSQL 16 clusters, PgBouncer transaction pooling, and query indexing best practices.",
                "content": """# PostgreSQL 16 High-Availability Clustering & Connection Optimization

This document outlines the architecture, configuration parameters, and query performance guidelines for our core database tier.

## 1. Cluster Topography
Our production relational tier comprises a multi-AZ cluster:
- **1 Primary Leader:** Handles all write transactions and read-your-writes consistency queries.
- **2 Synchronous Standby Replicas:** Distributed across separate availability zones with zero data loss guarantee (`synchronous_commit = on`).
- **1 Asynchronous Analytics Replica:** Dedicated to heavy read-only BI reporting and data warehouse extractions.

## 2. Connection Pooling with PgBouncer
To prevent backend connection exhaustion under traffic spikes, all application pods connect through PgBouncer:
- **Pool Mode:** Transaction Pooling (`pool_mode = transaction`).
- **Max Client Connections:** 2,000 active client sockets.
- **Default Pool Size:** 40 connections per application schema.
- **Reserve Pool:** 10 burst connections held for sudden traffic spikes.

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
company_wiki_db = host=127.0.0.1 port=5432 dbname=company_wiki_db pool_mode=transaction

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
max_client_conn = 2000
default_pool_size = 40
reserve_pool_size = 10
```

## 3. Crucial Server Configuration Flags
```sql
-- Statement timeouts prevent long-running queries from blocking table locks
ALTER DATABASE company_wiki_db SET statement_timeout = '15s';
ALTER DATABASE company_wiki_db SET lock_timeout = '5s';
ALTER DATABASE company_wiki_db SET idle_in_transaction_session_timeout = '30s';
```

## 4. Indexing Guidelines
- Foreign keys must always carry an explicit index to eliminate table sequential scans during `DELETE` cascade cascades.
- Use composite indexes ordered from highest cardinality to lowest.
- For case-insensitive partial searches, utilize `pg_trgm` GIN indexes rather than unindexed `ILIKE '%term%'` scans.
""",
            },
            {
                "title": "Continuous Delivery Pipeline Standards with ArgoCD & GitHub Actions",
                "category": "DevOps & Cloud Infrastructure",
                "tags": ["DevOps", "Kubernetes", "CI/CD", "Docker", "Architecture"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "GitOps delivery lifecycle: automated image vulnerability scanning, semantic release tagging, and canary rollouts in Kubernetes.",
                "content": """# Continuous Delivery Pipeline Standards with ArgoCD & GitHub Actions

Our deployment ecosystem follows declarative GitOps principles. The git repository represents the single source of truth for desired infrastructure and software configurations.

## 1. CI Pipeline Sequence (GitHub Actions)
Every pull request triggers an automated testing matrix before merge approval:
1. **Linter & Static Analysis:** Flake8, ESLint, TypeScript compilation check (`tsc -b`).
2. **Unit & Integration Tests:** Django test runner with isolated PostgreSQL service container; Vite Vitest for React components.
3. **Security Vulnerability Scanning:** Trivy container vulnerability scan and Snyk dependency audit.
4. **Automated Semantic Versioning:** Generates release candidate tags (e.g., `v2.4.1-rc3`).

## 2. GitOps Delivery with ArgoCD
Once merged to `main`:
- GitHub Actions packages an immutable OCI container and pushes it to AWS ECR.
- The pipeline updates the Helm chart repository values with the new image SHA.
- ArgoCD detects the Git diff and begins an automated progressive rollout:
  - Phase 1: 10% canary traffic for 10 minutes with automated Prometheus HTTP 5xx error rate evaluation.
  - Phase 2: If error rate < 0.05%, ramp up to 50% for 15 minutes.
  - Phase 3: Complete 100% promotion across all replica sets.

## 3. Rollback Procedures
If an elevated error budget burn is detected during promotion:
- ArgoCD triggers an automated instant rollback to the previous green container tag.
- Engineers can also execute an emergency manual rollback in Slack:
```bash
/argocd rollback <service-name> --environment=production
```
""",
            },
            {
                "title": "Global Remote Work Policy, Home Office Budget & Working Hours",
                "category": "People Operations & HR",
                "tags": ["HR", "RemoteWork", "Onboarding"],
                "author": admin_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
                "summary": "Operating rules for distributed team members: core collaboration hours, home workstation stipends, and wellness programs.",
                "content": """# Global Remote Work Policy, Home Office Budget & Working Hours

We are a remote-first organization. We empower team members to work where they are most productive while maintaining cohesive team collaboration.

## 1. Core Collaboration Hours
To facilitate cross-functional coordination while respecting personal flexibility, all team members observe 4 core overlapping hours:
- **14:00 to 18:00 UTC (10:00 AM - 2:00 PM Eastern / 7:00 AM - 11:00 AM Pacific)**
- Outside these core collaboration hours, work is primarily asynchronous via Notion, GitHub, and Slack threads.

## 2. Equipment & Home Office Stipend
Every full-time team member is eligible for home office benefits:
- **Initial Setup Grant:** $1,500 USD upon hire for desk, ergonomic chair, external monitor, and peripheral accessories.
- **Annual Refresh Budget:** $500 USD annually for hardware maintenance, keyboard/mouse upgrades, or home networking equipment.
- **Monthly Internet / Connectivity Allowance:** $80 USD monthly automatically credited via payroll.

## 3. Communication Etiquette
- **Default to Public Channels:** Company conversations take place in public Slack channels rather than DMs to keep knowledge searchable and accessible.
- **No Weekend Notifications:** Slack notifications should be paused outside of personal business hours. Scheduled sends should be used for off-hours messages.
- **Meeting-Free Wednesdays:** Wednesdays are reserved for deep, uninterrupted engineering, design, and writing time. No recurring internal meetings may be scheduled.
""",
            },
            {
                "title": "New Hire Engineering Onboarding: First 30 Days Playbook",
                "category": "Engineering & Architecture",
                "tags": ["Onboarding", "Architecture", "DevOps", "Backend", "Frontend"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Day 1 through Day 30 milestones: workstation setup, local Docker development environment, first commit, and buddy mentorship.",
                "content": """# New Hire Engineering Onboarding: First 30 Days Playbook

Welcome to the Engineering team! This guide outlines your onboarding path from your first workstation boot to your first production feature deployment.

## 1. Week 1: Environment & Credentials
- **Day 1:** Set up your password manager (1Password) and hardware YubiKey MFA.
- **Day 2:** Clone the core monorepo and run the local development setup:
```bash
git clone https://github.com/company/company-wiki.git
cd company-wiki
# Backend setup
cd backend && pipenv install --dev
python manage.py migrate && python manage.py seed_enterprise_wiki
# Frontend setup
cd ../frontend && npm install
npm run dev
```
- **Day 3:** Join your squad's daily standup and meet your assigned Onboarding Buddy.
- **Day 4:** Review the [Engineering Git Workflow & Branching Conventions](/articles/engineering-git-workflow-branching-conventions).
- **Day 5:** Ship your first "Good First Issue" PR to production!

## 2. Week 2-3: Architecture Deep-Dive
- Shadow your squad's on-call engineer during a weekly rotation shift.
- Pair program with senior engineers on complex service domains.
- Review our [Zero-Trust Security Architecture](/articles/zero-trust-security-architecture-identity-aware-access-policies) documentation.

## 3. Day 30 Milestone Checklist
By your 30th day, you will:
- [ ] Independently author and deploy a production feature or bug fix.
- [ ] Participate in at least 5 peer code reviews.
- [ ] Complete your 30-day feedback check-in with your engineering manager.
""",
            },
            {
                "title": "RESTful API Design Standards, Idempotency & Rate Limiting",
                "category": "Engineering & Architecture",
                "tags": ["API", "REST", "Architecture", "Backend", "Python"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Mandatory standards for public and internal APIs: resource naming conventions, HTTP status codes, Idempotency-Key headers, and pagination.",
                "content": """# RESTful API Design Standards, Idempotency & Rate Limiting

This guide defines the architectural standards for all HTTP APIs built across our backend engineering teams.

## 1. Resource URL Naming Conventions
- URLs must use plural nouns in lowercase with kebab-case: `/api/v1/articles/`, `/api/v1/user-profiles/`.
- Verbs are strictly forbidden in resource paths (use HTTP methods instead):
  - `GET /articles/` (List)
  - `POST /articles/` (Create)
  - `GET /articles/<id>/` (Retrieve)
  - `PUT /articles/<id>/` (Full update)
  - `PATCH /articles/<id>/` (Partial update)
  - `DELETE /articles/<id>/` (Soft/hard delete)

## 2. Idempotency for Modifying Requests
For critical write operations (such as payments, order creation, or destructive operations), clients must include an `Idempotency-Key` header:
```http
POST /api/v1/orders/
Idempotency-Key: 8f9b2c34-2975-4d7a-85b3-31fcf988df91
Content-Type: application/json
```
- The backend stores idempotency keys in Redis with a 24-hour TTL.
- If a duplicate request arrives, the cached response is immediately returned without re-executing business logic.

## 3. Consistent Error Envelope
All error responses must follow RFC 7807 Problem Details formatting:
```json
{
  "type": "https://api.company.com/errors/validation-failed",
  "title": "Invalid Request Parameters",
  "status": 400,
  "detail": "The 'title' field cannot exceed 255 characters.",
  "instance": "/api/v1/articles/",
  "code": "FIELD_MAX_LENGTH_EXCEEDED"
}
```
""",
            },
            {
                "title": "SOC 2 Type II Compliance, Audit Logging & Cryptographic Keys",
                "category": "Security & Compliance",
                "tags": ["Security", "SOC2", "Compliance", "Architecture"],
                "author": admin_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Operational audit controls, automated evidence collection, tamper-evident log preservation, and quarterly access reviews.",
                "content": """# SOC 2 Type II Compliance, Audit Logging & Cryptographic Keys

Our platform maintains continuous SOC 2 Type II certification across Security, Availability, and Confidentiality Trust Services Criteria.

## 1. The Audit Logging Invariant
Every security-relevant action must generate an immutable, tamper-evident audit record:
- User login, logout, and failed authentication attempts.
- Role changes, permission grants, and administrative overrides.
- Article revisions, deletions, and emergency restorations.
- Sensitive data exports and bulk API queries.

Audit records are written synchronously to the `audit_events` relational table and streamed asynchronously to a write-once-read-many (WORM) AWS S3 Glacier vault.

## 2. Cryptographic Key Management Lifecycle
- **Key Generation:** Master keys are generated inside FIPS 140-2 Level 3 compliant Hardware Security Modules (HSMs).
- **Key Rotation:** Data encryption keys rotate automatically every 90 days. Master KMS keys rotate annually.
- **Separation of Duties:** Developers do not have access to production cryptographic key material or plaintext customer secrets.

## 3. Quarterly User Access Reviews
At the end of each calendar quarter, engineering and IT managers must certify that all employee system access conforms strictly to their current organizational responsibilities. Inactive accounts (> 30 days without login) are automatically deactivated.
""",
            },
            {
                "title": "Frontend Design System Guidelines: Tailwind CSS & Accessibility",
                "category": "Product & Design System",
                "tags": ["DesignSystem", "Tailwind", "Frontend", "React", "TypeScript"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Design tokens, color palettes, dark mode semantics, keyboard accessibility (WCAG AA), and component reuse standards.",
                "content": """# Frontend Design System Guidelines: Tailwind CSS & Accessibility

Our frontend applications adhere to a unified, component-driven design system built on React, TypeScript, and Tailwind CSS.

## 1. Color Palette Tokens & Dark Mode
We design with dark-mode parity as a first-class requirement:
- **Backgrounds:** `bg-slate-900` (main body), `bg-slate-800` (cards), `bg-slate-950` (modals and floating drawers).
- **Borders:** `border-slate-800` for subtle dividers, `border-slate-700` for interactive elements.
- **Accents:** `indigo-600` for primary actions, `emerald-500` for success states, `amber-500` for warnings, `rose-500` for destructive actions.

## 2. Accessibility (WCAG 2.1 AA) Standards
1. **Color Contrast:** All text must meet a minimum contrast ratio of 4.5:1 against its background.
2. **Keyboard Navigation:** Every interactive element must be reachable via `Tab` key and display a visible focus indicator (`focus:ring-2 focus:ring-indigo-500`).
3. **Screen Reader Attributes:** Non-text buttons must supply an explicit `aria-label` or `title` attribute.
4. **Touch Targets:** Buttons and clickable chips must maintain at least 44x44px hit-box sizing on mobile touch viewports.

## 3. Lucide Iconography
Standardize icon sizes across components:
- `w-3.5 h-3.5`: Inline badges, chips, and small pill buttons.
- `w-4 h-4`: Standard form inputs, navigation items, and button labels.
- `w-5 h-5`: Section headers and card callouts.
""",
            },
            {
                "title": "IT Workstation Security: BitLocker, FileVault & YubiKey Enrollment",
                "category": "IT Support & Workplace",
                "tags": ["ITSupport", "Security", "ZeroTrust", "Onboarding"],
                "author": admin_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Step-by-step instructions for full disk encryption, MDM device enrollment, password managers, and YubiKey backup pairing.",
                "content": """# IT Workstation Security: BitLocker, FileVault & YubiKey Enrollment

All laptops used for company work must be registered with our centralized Mobile Device Management (MDM) fleet before accessing corporate systems.

## 1. Full Disk Encryption
- **macOS Devices:** FileVault 2 must be activated during initial setup. Escrow recovery keys are securely stored in Jamf MDM.
- **Windows Devices:** BitLocker Drive Encryption with TPM 2.0 hardware chip must be enabled on drive `C:`.

## 2. Password Management
- Every employee is provisioned a company 1Password enterprise account.
- Passwords must be generated with at least 20 random alphanumeric and symbol characters.
- Sharing passwords over Slack, email, or unencrypted documents is a **terminable security violation**. Always use 1Password item sharing links.

## 3. Lost or Stolen Device Protocol
If a company laptop or hardware key is lost or stolen:
1. Immediately contact the 24/7 Security Hotline: `security-urgent@company.com`.
2. IT Security will trigger an instant cryptographic remote wipe via MDM.
3. All active Okta, Google Workspace, and GitHub sessions will be globally revoked.
""",
            },
            {
                "title": "Engineering Git Workflow, Branching Conventions & Semantic Commits",
                "category": "Engineering & Architecture",
                "tags": ["DevOps", "Architecture", "Testing", "Backend", "Frontend"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Rules for branch naming, conventional commits, pull request templates, squash-and-merge policies, and automated releases.",
                "content": """# Engineering Git Workflow, Branching Conventions & Semantic Commits

Our engineering organization follows a disciplined trunk-based development workflow to maximize release velocity and minimize long-lived branch divergence.

## 1. Branch Naming Structure
All branches must branch off the latest `main`:
- `feat/ENG-1024-realtime-presence`: New functional feature tied to a Jira issue.
- `fix/ENG-1055-cors-origin-header`: Bug fix or patch.
- `chore/upgrade-vite-8`: Tooling, framework, or dependency maintenance.
- `docs/add-api-quickstart`: Documentation updates only.

## 2. Conventional Commit Specification
Commit messages must follow the Angular / Conventional Commits format:
```text
feat(articles): implement real-time presence indicators and soft edit locks
fix(auth): resolve google oauth javascript origin mismatch
test(api): add automated integration checks for article revisions
docs(wiki): update engineering handbook and setup guides
```

## 3. Pull Request Requirements
- PR title must match commit syntax.
- All CI test suites, linters, and type checkers must pass with 0 errors.
- At least one code review approval from an designated CODEOWNERS reviewer.
- Commits are squashed upon merge to preserve a clean linear Git history on `main`.
""",
            },
            {
                "title": "Data Warehouse Architecture: Snowflake, dbt & Real-Time Pipelines",
                "category": "Data Engineering & Analytics",
                "tags": ["Database", "Snowflake", "Architecture", "Backend"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Core data analytics platform: Kafka event ingestion, Snowflake dimensional modeling (Star Schema), dbt transformations, and data quality tests.",
                "content": """# Data Warehouse Architecture: Snowflake, dbt & Real-Time Pipelines

Our centralized data platform aggregates events, transaction databases, and third-party SaaS tools into a unified analytical data warehouse.

## 1. Architecture Overview
- **Ingestion:** Debezium CDC (Change Data Capture) captures PostgreSQL WAL logs and streams row mutations to Apache Kafka.
- **Raw Storage:** Snowflake Bronze tables receive raw JSON payloads.
- **Transformation (dbt):** dbt models clean, deduplicate, and transform data into Silver (cleaned entities) and Gold (star-schema dimensional marts).

## 2. Data Quality & Freshness Testing
Every dbt model requires automated schema and data assertion tests:
```yaml
version: 2
models:
  - name: fct_article_views
    columns:
      - name: article_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_articles')
              field: id
```
Data pipelines run continuous tests; deviations trigger Slack alerts in `#data-pipeline-alerts`.
""",
            },
            {
                "title": "Customer Escalation & Enterprise Support SLA Matrix",
                "category": "Customer Support & Success",
                "tags": ["HR", "IncidentResponse", "Runbook"],
                "author": author_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Tiered support commitments, response time SLAs, Zendesk ticketing runbooks, and executive escalation triggers.",
                "content": """# Customer Escalation & Enterprise Support SLA Matrix

This operating procedure defines how Customer Success and Technical Support resolve enterprise client inquiries and technical hurdles.

## 1. Contractual SLA Commitments
- **Tier 1 (Critical Outage):** 15-minute response SLA, 2-hour target resolution.
- **Tier 2 (High Degradation):** 1-hour response SLA, 8-hour target resolution.
- **Tier 3 (Normal Request):** 4-hour response SLA, 24-hour target resolution.
- **Tier 4 (Low / General Question):** 1 business day response SLA.

## 2. Executive Escalation Paths
If a Tier 1 or Tier 2 ticket remains unresolved past 50% of the contractual SLA window, the ticket automatically escalates to the VP of Customer Success and the Engineering On-call Lead.
""",
            },
            {
                "title": "GDPR Compliance, Data Retention & Right-to-be-Forgotten Procedures",
                "category": "Legal & Privacy Governance",
                "tags": ["GDPR", "Compliance", "Security", "Database"],
                "author": admin_user,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
                "summary": "Handling privacy requests: Data Subject Access Requests (DSAR), 30-day deletion fulfillment, and PII anonymization procedures.",
                "content": """# GDPR Compliance, Data Retention & Right-to-be-Forgotten Procedures

Under GDPR Article 17 and CCPA regulations, our platform guarantees customers the right to access and erase their personally identifiable information (PII).

## 1. Data Deletion Workflow
Upon receipt of a verified erasure request:
1. Verify the identity of the data subject via email confirmation challenge.
2. Trigger the automated purge pipeline:
```bash
python manage.py purge_customer_pii --user-id=<uuid>
```
3. Hard delete records from transactional databases and anonymize user identifiers in analytical archives.
4. Issue a formal certificate of erasure within 30 calendar days.

## 2. Data Retention Schedules
- Customer transaction history: Retained for 7 years to comply with tax and audit laws.
- Ephemeral presence and telemetry logs: Automatically purged after 30 days.
- Marketing email tracking: Anonymized after 180 days of inactivity.
""",
            },
            # Sample IN_REVIEW draft for editorial workflow testing
            {
                "title": "Draft Proposal: Next-Generation Vector Search for Enterprise Wiki",
                "category": "Engineering & Architecture",
                "tags": ["Architecture", "Backend", "Python", "API"],
                "author": author_user,
                "status": Article.Status.IN_REVIEW,
                "is_featured": False,
                "summary": "Architectural proposal to integrate pgvector and dense embeddings for semantic document search across our knowledge base.",
                "content": """# Draft Proposal: Next-Generation Vector Search for Enterprise Wiki

This proposal outlines the implementation of dense vector embeddings to complement our existing keyword search and AI summarization capabilities.

## 1. Background & Motivation
While full-text keyword indexing provides sub-10ms retrieval, team members frequently query concepts with varying terminology (e.g. asking "how do I get a new computer" instead of "hardware workstation provisioning").

## 2. Technical Design
- **Embedding Model:** `text-embedding-3-small` or local HuggingFace sentence-transformers.
- **Vector Storage:** PostgreSQL `pgvector` extension storing 1536-dimensional floating point vectors.
- **Hybrid Retrieval:** Reciprocal Rank Fusion (RRF) combining BM25 keyword ranks with cosine distance scores.

## 3. Performance & Memory Impact
Estimated index size for 10,000 articles is ~80MB, requiring minimal additional RAM in our existing PostgreSQL cluster.
""",
            },
        ]

        created_articles_count = 0
        with transaction.atomic():
            for art_data in articles_data:
                category_name = art_data.pop("category")
                tags_names = art_data.pop("tags")
                category_obj = cats_map.get(category_name)

                article = Article.objects.create(
                    category=category_obj,
                    **art_data
                )
                
                # Attach tags
                tag_objs = [tags_map[tn] for tn in tags_names if tn in tags_map]
                article.tags.set(tag_objs)

                # Create initial immutable revision #1
                article.create_revision(
                    author=article.author,
                    change_summary="Initial verified production documentation baseline",
                )

                # For the in_review article, add a review record so the Review Queue has rich data
                if article.status == Article.Status.IN_REVIEW:
                    article.submitted_at = now - timedelta(hours=2)
                    article.save(update_fields=["submitted_at"])
                    ReviewRecord.objects.create(
                        article=article,
                        action=ReviewRecord.Action.SUBMIT,
                        actor=article.author,
                        from_status="draft",
                        to_status="in_review",
                        feedback="Submitted for technical review by architecture team.",
                        created_at=now - timedelta(hours=2),
                    )

                created_articles_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {created_articles_count} enterprise knowledge articles with initial revisions and taxonomy!"
            )
        )
