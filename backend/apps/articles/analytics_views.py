import datetime
import csv
import io
import json
from django.db import models
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.accounts.models import CustomUser
from apps.articles.models import Article, ArticleViewLog, ArticleFeedback, ArticleEngagementSession


class AuthorAnalyticsOverviewView(APIView):
    """
    Author Portfolio Overview & Top Performing Articles Leaderboard API.
    GET /api/v1/analytics/author-overview/
    Permissions:
    - Authors / Admins / Reviewers: Inspect their own portfolio or target author.
    - Readers: Can view their own authored articles if any, or general overview.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        author_id = request.query_params.get("author_id")
        sort_by = request.query_params.get("sort_by", "views").lower()

        # Target user determination
        if author_id and (user.is_admin or getattr(user, "role", None) in ["ADMIN", "REVIEWER"]):
            try:
                target_author = CustomUser.objects.get(id=author_id)
            except (CustomUser.DoesNotExist, ValueError):
                return Response(
                    {"detail": f"Author with id '{author_id}' was not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            target_author = user

        # Filter articles authored by target_author
        articles_qs = Article.objects.filter(author=target_author).select_related("category")
        total_articles = articles_qs.count()
        published_qs = articles_qs.filter(status=Article.Status.PUBLISHED)
        published_count = published_qs.count()
        draft_count = articles_qs.filter(status=Article.Status.DRAFT).count()
        in_review_count = articles_qs.filter(status=Article.Status.IN_REVIEW).count()

        # Views aggregation
        total_views = articles_qs.aggregate(total=models.Sum("view_count"))["total"] or 0

        # Unique readers from ArticleViewLog
        view_logs_qs = ArticleViewLog.objects.filter(article__in=articles_qs)
        unique_users_count = view_logs_qs.exclude(user__isnull=True).values("user").distinct().count()
        unique_sessions_count = view_logs_qs.filter(user__isnull=True).exclude(session_key__isnull=True).values("session_key").distinct().count()
        total_unique_readers = unique_users_count + unique_sessions_count
        if total_unique_readers == 0 and total_views > 0:
            total_unique_readers = max(1, round(total_views * 0.65))

        # 7-day trend
        now = timezone.now()
        seven_days_ago = now - datetime.timedelta(days=7)
        views_last_7_days = view_logs_qs.filter(viewed_at__gte=seven_days_ago).count()

        # Engagement sessions (Reading time)
        engagement_qs = ArticleEngagementSession.objects.filter(article__in=articles_qs)
        total_active_seconds = engagement_qs.aggregate(total=models.Sum("active_seconds"))["total"] or 0
        total_reading_hours = round(total_active_seconds / 3600.0, 1)

        # Average helpfulness calculation
        scores = []
        total_helpful = 0
        total_unhelpful = 0
        for art in published_qs:
            total_helpful += art.helpful_count
            total_unhelpful += art.unhelpful_count
            if (art.helpful_count + art.unhelpful_count) > 0:
                scores.append(art.helpfulness_score)

        avg_helpfulness_score = round(sum(scores) / len(scores)) if scores else 0

        # Format helper
        def format_duration(seconds):
            if seconds < 60:
                return f"{int(seconds)}s"
            m = int(seconds // 60)
            s = int(seconds % 60)
            return f"{m}m {s}s" if s > 0 else f"{m}m"

        avg_read_time_seconds = round(total_active_seconds / engagement_qs.count()) if engagement_qs.count() > 0 else 0

        # Build Ranked Leaderboard of Articles
        articles_data = []
        for art in articles_qs:
            art_eng = engagement_qs.filter(article=art)
            eng_count = art_eng.count()
            art_active_sec = art_eng.aggregate(avg=models.Avg("active_seconds"))["avg"] or 0
            art_completed = art_eng.filter(reached_100=True).count()
            completion_rate = round((art_completed / eng_count) * 100, 1) if eng_count > 0 else 0.0

            articles_data.append({
                "id": str(art.id),
                "title": art.title,
                "slug": art.slug,
                "status": art.status,
                "category_name": art.category.name if art.category else "General",
                "category_slug": art.category.slug if art.category else "general",
                "view_count": art.view_count,
                "helpful_count": art.helpful_count,
                "unhelpful_count": art.unhelpful_count,
                "helpfulness_score": art.helpfulness_score,
                "total_reading_seconds": art_eng.aggregate(s=models.Sum("active_seconds"))["s"] or 0,
                "avg_reading_seconds": round(art_active_sec),
                "avg_reading_formatted": format_duration(art_active_sec),
                "reading_sessions_count": eng_count,
                "completion_rate_percentage": completion_rate,
                "created_at": art.created_at.isoformat(),
                "updated_at": art.updated_at.isoformat(),
                "published_at": art.published_at.isoformat() if art.published_at else None,
            })

        # Sort leaderboard
        if sort_by == "rating" or sort_by == "helpfulness":
            articles_data.sort(key=lambda x: (x["helpfulness_score"], x["view_count"]), reverse=True)
        elif sort_by == "reading_time":
            articles_data.sort(key=lambda x: (x["total_reading_seconds"], x["view_count"]), reverse=True)
        elif sort_by == "recent":
            articles_data.sort(key=lambda x: x["updated_at"], reverse=True)
        else:  # Default: views
            articles_data.sort(key=lambda x: (x["view_count"], x["helpfulness_score"]), reverse=True)

        # Assign ranks
        for idx, item in enumerate(articles_data):
            item["rank"] = idx + 1

        # Top performing category
        category_view_counts = {}
        for art in articles_data:
            cat = art["category_name"]
            category_view_counts[cat] = category_view_counts.get(cat, 0) + art["view_count"]

        top_category = max(category_view_counts.items(), key=lambda x: x[1])[0] if category_view_counts else "None"

        # Check if CSV export format requested
        export_fmt = request.query_params.get("format", "").lower()
        if export_fmt == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            output.write("\ufeff")  # UTF-8 BOM

            writer.writerow(["=== AUTHOR PORTFOLIO ANALYTICS LEADERBOARD REPORT ==="])
            writer.writerow(["Author Name", getattr(target_author, "full_name", "") or target_author.username])
            writer.writerow(["Author Username", target_author.username])
            writer.writerow(["Email", target_author.email])
            writer.writerow(["Role", getattr(target_author, "role", "AUTHOR")])
            writer.writerow(["Exported At", now.strftime("%Y-%m-%d %H:%M:%S UTC")])
            writer.writerow([])

            writer.writerow(["=== PORTFOLIO EXECUTIVE SUMMARY ==="])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Total Articles", total_articles])
            writer.writerow(["Published Articles", published_count])
            writer.writerow(["In-Review Articles", in_review_count])
            writer.writerow(["Draft Articles", draft_count])
            writer.writerow(["Total Portfolio Views", total_views])
            writer.writerow(["Total Unique Readers", total_unique_readers])
            writer.writerow(["Views Last 7 Days", views_last_7_days])
            writer.writerow(["Average Helpfulness Score", f"{avg_helpfulness_score}%"])
            writer.writerow(["Total Helpful Votes", total_helpful])
            writer.writerow(["Total Unhelpful Votes", total_unhelpful])
            writer.writerow(["Total Reading Hours", f"{total_reading_hours} hrs"])
            writer.writerow(["Top Performing Domain", top_category])
            writer.writerow([])

            writer.writerow(["=== TOP PERFORMING ARTICLES LEADERBOARD ==="])
            writer.writerow(["Rank", "Article Title", "Slug", "Status", "Category", "Views", "Helpfulness Score", "Helpful Votes", "Unhelpful Votes", "Avg Reading Time", "Reading Sessions", "Completion Rate"])
            for a in articles_data:
                writer.writerow([
                    a["rank"],
                    a["title"],
                    a["slug"],
                    a["status"],
                    a["category_name"],
                    a["view_count"],
                    f"{a['helpfulness_score']}%",
                    a["helpful_count"],
                    a["unhelpful_count"],
                    a["avg_reading_formatted"],
                    a["reading_sessions_count"],
                    f"{a['completion_rate_percentage']}%",
                ])

            filename = f"author_portfolio_{target_author.username}_{now.strftime('%Y%m%d_%H%M%S')}.csv"
            response = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response

        return Response(
            {
                "author": {
                    "id": str(target_author.id),
                    "username": target_author.username,
                    "full_name": getattr(target_author, "full_name", "") or target_author.username,
                    "email": target_author.email,
                    "role": getattr(target_author, "role", "AUTHOR"),
                },
                "summary": {
                    "total_articles": total_articles,
                    "published_articles": published_count,
                    "draft_articles": draft_count,
                    "in_review_articles": in_review_count,
                    "total_portfolio_views": total_views,
                    "total_unique_readers": total_unique_readers,
                    "views_last_7_days": views_last_7_days,
                    "average_helpfulness_score": avg_helpfulness_score,
                    "total_helpful_votes": total_helpful,
                    "total_unhelpful_votes": total_unhelpful,
                    "total_reading_hours": total_reading_hours,
                    "total_reading_seconds": total_active_seconds,
                    "avg_reading_formatted": format_duration(avg_read_time_seconds),
                    "top_performing_category": top_category,
                },
                "sort_by": sort_by,
                "top_articles": articles_data,
            },
            status=status.HTTP_200_OK,
        )
