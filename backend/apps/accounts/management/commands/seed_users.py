from django.core.management.base import BaseCommand
from apps.accounts.models import CustomUser


class Command(BaseCommand):
    help = "Seed initial development users across all four roles (Admin, Author, Reviewer, Reader)."

    def handle(self, *args, **options):
        users_data = [
            {
                "email": "admin@company.com",
                "username": "admin_lead",
                "full_name": "Alex Admin",
                "role": CustomUser.Role.ADMIN,
                "password": "AdminPassword123!",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "author@company.com",
                "username": "sarah_author",
                "full_name": "Sarah Jenkins",
                "role": CustomUser.Role.AUTHOR,
                "password": "AuthorPassword123!",
            },
            {
                "email": "reviewer@company.com",
                "username": "david_reviewer",
                "full_name": "David Morales",
                "role": CustomUser.Role.REVIEWER,
                "password": "ReviewerPassword123!",
            },
            {
                "email": "reader@company.com",
                "username": "rachel_reader",
                "full_name": "Rachel Vance",
                "role": CustomUser.Role.READER,
                "password": "ReaderPassword123!",
            },
        ]

        created_count = 0
        for data in users_data:
            email = data["email"]
            if not CustomUser.objects.filter(email=email).exists():
                password = data.pop("password")
                CustomUser.objects.create_user(password=password, **data)
                self.stdout.write(self.style.SUCCESS(f"Created user: {email} ({data['role']})"))
                created_count += 1
            else:
                self.stdout.write(f"User {email} already exists.")

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} users."))
