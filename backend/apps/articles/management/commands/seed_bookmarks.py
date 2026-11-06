from django.core.management.base import BaseCommand
from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleBookmark


class Command(BaseCommand):
    help = "Seeds realistic personal bookmarks and reading lists across all demo personas."

    def handle(self, *args, **options):
        self.stdout.write("Seeding personal bookmarks...")

        users = CustomUser.objects.filter(
            email__in=[
                "admin@company.com",
                "author@company.com",
                "reviewer@company.com",
                "reader@company.com",
            ]
        )
        articles = list(Article.objects.filter(status=Article.Status.PUBLISHED)[:10])

        if not articles:
            self.stdout.write(self.style.WARNING("No published articles found to bookmark."))
            return

        collections_map = {
            "admin@company.com": [
                (articles[0], "Architecture", "Quarterly architectural baseline standard for teams."),
                (articles[1] if len(articles) > 1 else articles[0], "Must Read", "Review incident escalation path."),
            ],
            "author@company.com": [
                (articles[0], "Favorites", "Great reference for API formatting."),
                (articles[2] if len(articles) > 2 else articles[0], "Reference", "Style guide for onboarding documentation."),
            ],
            "reviewer@company.com": [
                (articles[1] if len(articles) > 1 else articles[0], "Architecture", "Check against ISO security compliance checklist."),
            ],
            "reader@company.com": [
                (articles[0], "Onboarding", "Read before first sprint planning on Monday."),
                (articles[1] if len(articles) > 1 else articles[0], "Favorites", "Essential command cheat sheet."),
            ],
        }

        created_count = 0
        for user in users:
            items = collections_map.get(user.email, [])
            for art, col, note in items:
                bm, created = ArticleBookmark.objects.get_or_create(
                    user=user,
                    article=art,
                    defaults={
                        "collection_name": col,
                        "personal_note": note,
                    },
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} bookmarks across demo users."))
