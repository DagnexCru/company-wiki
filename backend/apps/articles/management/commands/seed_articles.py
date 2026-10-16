from django.core.management.base import BaseCommand
from apps.accounts.models import CustomUser
from apps.articles.models import Article


class Command(BaseCommand):
    help = "Seed initial demonstration knowledge articles for development and testing."

    def handle(self, *args, **options):
        author = CustomUser.objects.filter(role=CustomUser.Role.AUTHOR).first()
        admin = CustomUser.objects.filter(role=CustomUser.Role.ADMIN).first()

        if not author:
            author = CustomUser.objects.create_user(
                email="author@company.com",
                username="alice_author",
                password="AuthorPassword123!",
                role=CustomUser.Role.AUTHOR,
                full_name="Alice Author",
            )
            self.stdout.write(self.style.SUCCESS("Created author@company.com"))

        if not admin:
            admin = CustomUser.objects.create_superuser(
                email="admin@company.com",
                username="admin_user",
                password="AdminPassword123!",
                role=CustomUser.Role.ADMIN,
                full_name="System Administrator",
            )
            self.stdout.write(self.style.SUCCESS("Created admin@company.com"))

        demo_articles = [
            {
                "title": "Engineering Git Workflow & Branching Conventions",
                "summary": "Standard operating procedure for git branches, semantic commit messages, and automated CI pull requests.",
                "content": """# Engineering Git Workflow & Branching Conventions

Welcome to the internal engineering team's standard version control guidelines.

## 1. Branch Strategy
We adhere to a trunk-based development strategy with short-lived feature branches:
- `main`: Always deployable production-ready branch.
- `feat/<ticket>-<short-description>`: New functional features.
- `fix/<ticket>-<short-description>`: Bug fixes and security patches.
- `chore/<short-description>`: Infrastructure, tooling, and refactoring.

## 2. Commit Message Standards
Use the Conventional Commits specification:
```bash
feat(articles): implement role-aware queryset filtering
fix(auth): correct token refresh expiration validation
docs(wiki): update API Postman collection and runbook
```

## 3. Pull Request Guidelines
1. Ensure all automated Django and React test suites pass locally.
2. Link the corresponding Jira/linear issue in the PR description.
3. Require at least one peer code review before squash and merge.
""",
                "author": author,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
            },
            {
                "title": "PostgreSQL Connection Pooling and Query Optimization",
                "summary": "Technical deep-dive on PgBouncer setup, statement timeouts, and multi-tenant schema partitioning.",
                "content": """# PostgreSQL Connection Pooling & Query Optimization

This guide outlines our internal PostgreSQL best practices for high-throughput microservices.

## 1. PgBouncer Configuration
For applications experiencing high connection concurrency:
- **Pool Mode:** Transaction pooling (`pool_mode = transaction`)
- **Default Pool Size:** 25 connections per database worker.
- **Max Client Connections:** 1,000 active clients.

## 2. Statement Timeouts
To prevent runaway queries from locking database tables:
```sql
ALTER DATABASE company_wiki_db SET statement_timeout = '15s';
ALTER DATABASE company_wiki_db SET lock_timeout = '5s';
```

## 3. Indexing Best Practices
Always index foreign keys and query search columns using B-Tree indexes or GiST/GIN for full-text search.
""",
                "author": author,
                "status": Article.Status.PUBLISHED,
                "is_featured": False,
            },
            {
                "title": "Employee Onboarding: Week 1 IT & Engineering Setup",
                "summary": "Complete walk-through for new hires: laptop provisioning, SSH keys, VPN setup, and development environments.",
                "content": """# Employee Onboarding: Week 1 Guide

Welcome to the company! This checklist will guide you through your first week.

## Day 1: System Provisioning
- [ ] Configure Okta / Single Sign-On (SSO) credentials.
- [ ] Install corporate password manager and configure 2FA.
- [ ] Set up Company VPN (WireGuard configuration profile).

## Day 2: Development Tooling
1. **Python & Pipenv:** Install Python 3.12+ and verify with `python --version`.
2. **Node.js & Vite:** Install LTS Node.js and configure global npm packages.
3. **Docker Desktop:** Enable WSL2 backend on Windows machines.

## Support Contacts
If you encounter any access permission issues, reach out to `#it-support` on Slack.
""",
                "author": admin,
                "status": Article.Status.PUBLISHED,
                "is_featured": True,
            },
            {
                "title": "Draft: Microservices Zero-Downtime Deployment Runbook",
                "summary": "Work-in-progress guide covering blue/green deployment orchestration with Kubernetes and Traefik ingress.",
                "content": """# Microservices Zero-Downtime Deployment Runbook [DRAFT]

*Status: Author Work-in-Progress (Not yet submitted for review)*

## Objectives
Ensure zero dropped HTTP transactions during rolling cluster upgrades.

### Planned Sections
1. Traffic draining with SIGTERM listeners.
2. Readines and Liveness probe calibration.
3. Database migration backward compatibility rules (Expand and Contract pattern).
""",
                "author": author,
                "status": Article.Status.DRAFT,
                "is_featured": False,
            },
            {
                "title": "Draft: Customer Data Privacy & GDPR Retention Policy",
                "summary": "Compliance guidelines for anonymizing user activity logs after 90 days.",
                "content": """# Data Privacy & GDPR Retention Policy [DRAFT]

*Author: Alice Author*

## Overview
Under GDPR Article 17, customers have the right to request erasure of personal data.
This document specifies which database tables must be anonymized vs permanently purged.
""",
                "author": author,
                "status": Article.Status.DRAFT,
                "is_featured": False,
            },
        ]

        created_count = 0
        for item in demo_articles:
            article, created = Article.objects.get_or_create(
                title=item["title"],
                defaults={
                    "summary": item["summary"],
                    "content": item["content"],
                    "author": item["author"],
                    "status": item["status"],
                    "is_featured": item["is_featured"],
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Successfully seeded {created_count} demonstration articles.")
        )
