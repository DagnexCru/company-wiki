import re
from typing import List, Optional
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()


def extract_mentions(text: str) -> List[str]:
    """
    Extract unique usernames mentioned with @username syntax from a text payload.
    Matches standard usernames containing alphanumeric, underscores, hyphens, and dots.
    """
    if not text:
        return []
    # Match @username when preceded by whitespace or start of string
    matches = re.findall(r"(?:^|\s)@([a-zA-Z0-9_.-]+)", text)
    # Strip any trailing punctuation (e.g. "@admin," -> "admin")
    cleaned = []
    for m in matches:
        stripped = m.rstrip(".,!?:;\"')]}").strip()
        if stripped and stripped.lower() not in [c.lower() for c in cleaned]:
            cleaned.append(stripped)
    return cleaned


def parse_and_notify_mentions(
    text: str,
    actor,
    link: str,
    article=None,
    custom_title: Optional[str] = None,
) -> List[Notification]:
    """
    Scans text for @mentions, resolves matching users in the database,
    and generates MENTION notifications for each valid recipient.
    """
    if not text:
        return []

    usernames = extract_mentions(text)
    if not usernames:
        return []

    # Find matching active users
    mentioned_users = User.objects.filter(
        username__in=usernames,
        is_active=True,
    )

    notifications_created = []
    actor_name = actor.full_name or actor.username if actor else "A teammate"

    for recipient in mentioned_users:
        # Don't notify users when they mention themselves
        if actor and recipient.id == actor.id:
            continue

        title = custom_title or f"{actor_name} mentioned you in a comment"
        snippet = text[:150] + ("..." if len(text) > 150 else "")

        notif = Notification.objects.create(
            recipient=recipient,
            sender=actor,
            notification_type=Notification.NotificationType.MENTION,
            title=title,
            message=snippet,
            link=link,
            article=article,
        )
        notifications_created.append(notif)

    return notifications_created


def notify_review_action(article, actor, action: str, feedback: str = "") -> List[Notification]:
    """
    Generates appropriate in-app notifications for workflow review events:
    - SUBMIT: notifies reviewers/admins that review is requested.
    - APPROVE: notifies author that their article was published.
    - REJECT: notifies author that changes were requested.
    - Mentions: notifies any users tagged in feedback.
    """
    created_notifs = []
    actor_name = actor.full_name or actor.username if actor else "Reviewer"

    if action == "SUBMIT":
        # Notify all active Reviewers and Admins (except the submitting author)
        target_reviewers = User.objects.filter(
            role__in=[User.Role.REVIEWER, User.Role.ADMIN],
            is_active=True,
        ).exclude(id=actor.id if actor else None)

        for reviewer in target_reviewers:
            notif = Notification.objects.create(
                recipient=reviewer,
                sender=actor,
                notification_type=Notification.NotificationType.REVIEW_REQUESTED,
                title=f"Review Requested: {article.title}",
                message=f"{actor_name} submitted '{article.title}' for editorial review.",
                link=f"/reviews/{article.id}",
                article=article,
            )
            created_notifs.append(notif)

    elif action == "APPROVE":
        # Notify original article author
        if article.author and (not actor or article.author.id != actor.id):
            notif = Notification.objects.create(
                recipient=article.author,
                sender=actor,
                notification_type=Notification.NotificationType.REVIEW_APPROVED,
                title=f"Article Approved: {article.title}",
                message=f"'{article.title}' was approved by {actor_name} and is now live.",
                link=f"/articles/{article.slug}",
                article=article,
            )
            created_notifs.append(notif)

    elif action == "REJECT":
        # Notify author of changes requested
        if article.author and (not actor or article.author.id != actor.id):
            reason_snippet = feedback.strip() if feedback else "Please revise and resubmit."
            notif = Notification.objects.create(
                recipient=article.author,
                sender=actor,
                notification_type=Notification.NotificationType.REVIEW_REJECTED,
                title=f"Changes Requested: {article.title}",
                message=f"{actor_name} requested changes on '{article.title}': \"{reason_snippet[:120]}\"",
                link=f"/articles/{article.slug}/edit",
                article=article,
            )
            created_notifs.append(notif)

    # Also parse any explicit @mentions in feedback
    if feedback:
        mention_notifs = parse_and_notify_mentions(
            text=feedback,
            actor=actor,
            link=f"/articles/{article.slug}",
            article=article,
            custom_title=f"{actor_name} mentioned you in review feedback for '{article.title}'",
        )
        created_notifs.extend(mention_notifs)

    return created_notifs


def notify_article_updated(article, actor) -> Optional[Notification]:
    """
    Notifies the original article author when another team member makes edits to their article.
    """
    if not article.author or not actor or article.author.id == actor.id:
        return None

    actor_name = actor.full_name or actor.username
    return Notification.objects.create(
        recipient=article.author,
        sender=actor,
        notification_type=Notification.NotificationType.ARTICLE_UPDATED,
        title=f"Article Updated: {article.title}",
        message=f"{actor_name} published updates to your article '{article.title}'.",
        link=f"/articles/{article.slug}",
        article=article,
    )
