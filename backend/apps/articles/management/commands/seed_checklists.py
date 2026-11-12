from django.core.management.base import BaseCommand
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleChecklistProgress
from apps.taxonomy.models import Category


class Command(BaseCommand):
    help = "Seeds realistic SOP checklists and onboarding runbooks with live progress state."

    def handle(self, *args, **options):
        self.stdout.write("Seeding SOP checklist runbook articles...")

        author = CustomUser.objects.filter(role=CustomUser.Role.ADMIN).first() or CustomUser.objects.first()
        category, _ = Category.objects.get_or_create(
            name="Operations & DevOps",
            defaults={"slug": "operations-devops", "description": "Standard operating procedures and runbooks."},
        )

        sop_content = """# SOP: Production Release & Zero-Downtime Deployment Runbook

Standard Operating Procedure (SOP) for executing production rollouts, database migrations, and health checks with zero customer impact.

> **Policy Requirement**: All engineers leading a production release must check off each stage in sequence and maintain audit logs.

---

## Stage 1: Pre-Deployment Readiness & Sanity Checks
Verify that the release artifact and infrastructure prerequisites are satisfied:
- [ ] Confirm CI/CD pipeline on `main` branch passed all automated integration tests.
- [ ] Verify staging environment matches production schema version.
- [ ] Notify customer support and operations teams in the `#release-ops` Slack channel.
- [ ] Review open Sentry error budgets and verify baseline latency.

## Stage 2: Database Migration & Schema Safety
Execute safe database schema transitions:
- [ ] Take an automated snapshot/backup of the production PostgreSQL cluster.
- [ ] Apply non-destructive migrations (`ADD COLUMN NULLABLE` or new indexes).
- [ ] Validate database connection pool health and replica lag under 10ms.

## Stage 3: Blue-Green / Canary Container Rollout
Route production traffic incrementally:
- [ ] Deploy new Docker image to Canary instance (5% user traffic).
- [ ] Monitor HTTP 5xx error rate and response latencies for 10 minutes.
- [ ] Promote release to 100% of production traffic across all cluster nodes.

## Stage 4: Post-Deployment Smoke Tests & Verification
Confirm end-to-end functionality across critical paths:
- [ ] Execute automated synthetic login and token authentication smoke tests.
- [ ] Verify background Celery queue processing and notification delivery.
- [ ] Announce release completion and update version tag in `#announcements`.
"""

        article, created = Article.objects.update_or_create(
            slug="sop-production-release-zero-downtime-deployment-runbook",
            defaults={
                "title": "SOP: Production Release & Zero-Downtime Deployment Runbook",
                "summary": "Mandatory checklist and runbook for orchestrating zero-downtime production rollouts.",
                "content": sop_content,
                "author": author,
                "category": category,
                "status": Article.Status.PUBLISHED,
            },
        )

        self.stdout.write(self.style.SUCCESS(f"SOP Article configured: {article.title} ({'created' if created else 'updated'})"))

        # Seed multi-persona progress for team compliance and certificate verification
        from django.utils import timezone
        from datetime import timedelta

        all_steps = [
            "confirm-ci-cd-pipeline-on-mai-0",
            "verify-staging-environment-ma-1",
            "notify-customer-support-and-o-2",
            "review-open-sentry-error-budg-3",
            "take-an-automated-snapshot-ba-4",
            "apply-non-destructive-migrati-5",
            "validate-database-connection--6",
            "deploy-new-docker-image-to-ca-7",
            "monitor-http-5xx-error-rate-a-8",
            "promote-release-to-100-of-pro-9",
        ]

        # 1. Reader: 100% Completed (Verifiable Certificate ready!)
        reader_user = CustomUser.objects.filter(email="reader@company.com").first()
        if reader_user:
            ArticleChecklistProgress.objects.update_or_create(
                user=reader_user,
                article=article,
                defaults={
                    "checked_items": all_steps,
                    "total_items": 10,
                    "completed_count": 10,
                    "is_completed": True,
                    "completed_at": timezone.now() - timedelta(days=1),
                },
            )
            self.stdout.write(self.style.SUCCESS("Seeded 100% completion for reader@company.com (Certificate Ready)"))

        # 2. Admin: In-Progress / 80%
        admin_user = CustomUser.objects.filter(email="admin@company.com").first()
        if admin_user:
            ArticleChecklistProgress.objects.update_or_create(
                user=admin_user,
                article=article,
                defaults={
                    "checked_items": all_steps[:8],
                    "total_items": 10,
                    "completed_count": 8,
                    "is_completed": False,
                    "completed_at": None,
                },
            )
            self.stdout.write(self.style.SUCCESS("Seeded progress for admin@company.com (8/10 tasks - 80%)"))

        # 3. Author: 60%
        author_user = CustomUser.objects.filter(email="author@company.com").first()
        if author_user:
            ArticleChecklistProgress.objects.update_or_create(
                user=author_user,
                article=article,
                defaults={
                    "checked_items": all_steps[:6],
                    "total_items": 10,
                    "completed_count": 6,
                    "is_completed": False,
                    "completed_at": None,
                },
            )
            self.stdout.write(self.style.SUCCESS("Seeded progress for author@company.com (6/10 tasks - 60%)"))

        # 4. Reviewer: 40%
        reviewer_user = CustomUser.objects.filter(email="reviewer@company.com").first()
        if reviewer_user:
            ArticleChecklistProgress.objects.update_or_create(
                user=reviewer_user,
                article=article,
                defaults={
                    "checked_items": all_steps[:4],
                    "total_items": 10,
                    "completed_count": 4,
                    "is_completed": False,
                    "completed_at": None,
                },
            )
            self.stdout.write(self.style.SUCCESS("Seeded progress for reviewer@company.com (4/10 tasks - 40%)"))
