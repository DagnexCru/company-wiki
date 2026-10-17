from django.core.management.base import BaseCommand
from apps.taxonomy.models import Category, Tag
from apps.articles.models import Article


class Command(BaseCommand):
    help = "Seed standard company categories and tags, and associate them with existing demo articles."

    def handle(self, *args, **options):
        categories_data = [
            {
                "name": "Engineering",
                "description": "Software architecture, coding standards, APIs, and development guides.",
                "icon": "code",
                "color": "indigo",
            },
            {
                "name": "IT Support",
                "description": "Hardware provisioning, VPN setup, network troubleshooting, and software licenses.",
                "icon": "life-buoy",
                "color": "sky",
            },
            {
                "name": "Human Resources",
                "description": "Company policies, employee benefits, code of conduct, and organizational directory.",
                "icon": "users",
                "color": "emerald",
            },
            {
                "name": "Operations & DevOps",
                "description": "CI/CD pipelines, container orchestration, monitoring, and cloud infrastructure.",
                "icon": "server",
                "color": "purple",
            },
            {
                "name": "Onboarding",
                "description": "Checklists, tool setup guides, and first-month milestones for new team members.",
                "icon": "rocket",
                "color": "amber",
            },
            {
                "name": "Security & Compliance",
                "description": "Information security protocols, credential management, and privacy compliance.",
                "icon": "shield",
                "color": "rose",
            },
        ]

        tags_data = [
            "Django",
            "PostgreSQL",
            "React",
            "TypeScript",
            "DevOps",
            "Security",
            "Onboarding",
            "Troubleshooting",
            "VPN",
            "Architecture",
        ]

        created_cats = {}
        for cat in categories_data:
            c, _ = Category.objects.get_or_create(
                name=cat["name"],
                defaults={
                    "description": cat["description"],
                    "icon": cat["icon"],
                    "color": cat["color"],
                },
            )
            created_cats[c.name] = c

        created_tags = {}
        for tag_name in tags_data:
            t, _ = Tag.objects.get_or_create(name=tag_name)
            created_tags[t.name] = t

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(created_cats)} categories and {len(created_tags)} tags."))

        # Link existing articles to taxonomy
        git_art = Article.objects.filter(slug__startswith="engineering-git-workflow").first()
        if git_art:
            git_art.category = created_cats.get("Engineering")
            git_art.save()
            git_art.tags.set([created_tags["DevOps"], created_tags["Architecture"]])

        pg_art = Article.objects.filter(slug__startswith="postgresql-connection").first()
        if pg_art:
            pg_art.category = created_cats.get("Engineering")
            pg_art.save()
            pg_art.tags.set([created_tags["PostgreSQL"], created_tags["Architecture"]])

        onboard_art = Article.objects.filter(slug__startswith="employee-onboarding").first()
        if onboard_art:
            onboard_art.category = created_cats.get("Onboarding")
            onboard_art.save()
            onboard_art.tags.set([created_tags["Onboarding"], created_tags["VPN"], created_tags["Security"]])

        k8s_art = Article.objects.filter(slug__startswith="draft-microservices-zero-downtime").first()
        if k8s_art:
            k8s_art.category = created_cats.get("Operations & DevOps")
            k8s_art.save()
            k8s_art.tags.set([created_tags["DevOps"], created_tags["Architecture"]])

        gdpr_art = Article.objects.filter(slug__startswith="draft-customer-data").first()
        if gdpr_art:
            gdpr_art.category = created_cats.get("Security & Compliance")
            gdpr_art.save()
            gdpr_art.tags.set([created_tags["Security"], created_tags["PostgreSQL"]])

        self.stdout.write(self.style.SUCCESS("Successfully linked demo articles to categories and tags."))
