import random
import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleViewLog


class Command(BaseCommand):
    help = "Seeds realistic time-series view logs for deep article analytics and trend charts."

    def handle(self, *args, **options):
        self.stdout.write("Seeding realistic time-series view logs...")

        users = list(CustomUser.objects.all())
        articles = list(Article.objects.all())

        if not articles:
            self.stdout.write(self.style.WARNING("No articles found to seed views for."))
            return

        now = timezone.now()
        seeded_count = 0

        # Target primary articles for rich view analytics
        primary_slugs = [
            "sop-production-release-zero-downtime-deployment-runbook",
        ]
        target_articles = [a for a in articles if a.slug in primary_slugs]
        if not target_articles:
            target_articles = articles[:3]

        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0",
        ]

        referrers = [
            "https://company-wiki.internal/articles",
            "https://company-wiki.internal/dashboard",
            "https://slack.com/",
            "https://google.com/search",
            "",
        ]

        for article in target_articles:
            # Check existing view logs count
            existing = ArticleViewLog.objects.filter(article=article).count()
            if existing >= 50:
                self.stdout.write(f"Article '{article.title}' already has {existing} view logs. Skipping duplicate.")
                continue

            logs_to_create = []
            # Generate views over the past 90 days with weekday patterns and realistic spikes
            for day_offset in range(90, -1, -1):
                target_date = now - datetime.timedelta(days=day_offset)
                is_weekend = target_date.weekday() >= 5
                
                # Weekday traffic is 12-35 views; Weekend is 3-10 views
                base_views = random.randint(3, 8) if is_weekend else random.randint(14, 38)
                
                # Add spikes in recent weeks (e.g. Days 3, 10, 24)
                if day_offset in [2, 3, 7, 14, 28]:
                    base_views += random.randint(20, 45)

                for _ in range(base_views):
                    view_time = target_date.replace(
                        hour=random.randint(8, 20),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59),
                        microsecond=0,
                    )
                    
                    # 70% logged-in user, 30% anonymous session
                    has_user = random.random() < 0.70 and bool(users)
                    assigned_user = random.choice(users) if has_user else None
                    session_key = f"sess_{random.randint(100000, 999999)}" if not assigned_user else None
                    ip_addr = f"10.0.{random.randint(1, 5)}.{random.randint(10, 250)}"

                    logs_to_create.append(
                        ArticleViewLog(
                            article=article,
                            user=assigned_user,
                            session_key=session_key,
                            ip_address=ip_addr,
                            user_agent=random.choice(user_agents),
                            referrer=random.choice(referrers),
                            viewed_at=view_time,
                        )
                    )

            ArticleViewLog.objects.bulk_create(logs_to_create)
            total_logs = len(logs_to_create)
            seeded_count += total_logs
            # Update article.view_count to reflect active views
            article.view_count = max(article.view_count, total_logs)
            article.save(update_fields=["view_count"])
            self.stdout.write(f"Seeded {total_logs} view logs for '{article.title}'")

        self.stdout.write(self.style.SUCCESS(f"Successfully populated {seeded_count} total article view logs!"))

