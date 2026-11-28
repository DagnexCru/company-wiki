"""
Notification Dispatchers and External Webhook Bridges for Collaborative Discussions.
Handles In-App notification alerts, Email dispatches, and Slack/Teams Webhook payloads.
"""

import json
import logging
import urllib.request
import urllib.error
from typing import List, Optional, Dict, Any

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services import parse_and_notify_mentions

logger = logging.getLogger(__name__)
User = get_user_model()


class SlackWebhookBridge:
    """
    Formats discussion events into Slack Block Kit payload structures
    and delivers incoming webhooks to configured channels.
    """

    @classmethod
    def get_webhook_url(cls, override_url: Optional[str] = None) -> str:
        if override_url:
            return override_url
        return getattr(settings, "SLACK_WEBHOOK_URL", "") or ""

    @classmethod
    def format_annotation_created_payload(
        cls, annotation, actor, article_url: Optional[str] = None
    ) -> Dict[str, Any]:
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        article = annotation.article
        article_title = article.title if article else "Wiki Article"
        slug = article.slug if article else ""
        link = article_url or f"/articles/{slug}?annotation={annotation.id}"
        quote_text = annotation.highlighted_text[:120] + ("..." if len(annotation.highlighted_text) > 120 else "")
        comment_body = annotation.content[:300] + ("..." if len(annotation.content) > 300 else "")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"💬 New Discussion on '{article_title}'",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Highlighted Quote:*\n>{quote_text}",
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{actor_name} commented:*\n{comment_body}",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📍 Article: *{article_title}* | Status: `Open` | Link: `{link}`",
                    }
                ],
            },
        ]

        return {
            "text": f"💬 New Discussion by {actor_name} on '{article_title}': \"{quote_text}\"",
            "blocks": blocks,
            "event_type": "annotation_created",
            "annotation_id": str(annotation.id),
        }

    @classmethod
    def format_annotation_reply_payload(
        cls, reply, actor, article_url: Optional[str] = None
    ) -> Dict[str, Any]:
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        annotation = reply.annotation
        article = annotation.article if annotation else None
        article_title = article.title if article else "Wiki Article"
        slug = article.slug if article else ""
        link = article_url or f"/articles/{slug}?annotation={annotation.id if annotation else ''}"
        reply_body = reply.content[:300] + ("..." if len(reply.content) > 300 else "")

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"↪️ New Reply in Discussion on '{article_title}'",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{actor_name} replied:*\n{reply_body}",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Original Quote: >{annotation.highlighted_text[:80]} | Link: `{link}`",
                    }
                ],
            },
        ]

        return {
            "text": f"↪️ New Reply by {actor_name} on '{article_title}': \"{reply_body}\"",
            "blocks": blocks,
            "event_type": "annotation_reply_created",
            "reply_id": str(reply.id),
        }

    @classmethod
    def format_annotation_resolved_payload(
        cls, annotation, actor, article_url: Optional[str] = None
    ) -> Dict[str, Any]:
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        article = annotation.article
        article_title = article.title if article else "Wiki Article"
        slug = article.slug if article else ""
        link = article_url or f"/articles/{slug}?annotation={annotation.id}"
        quote_text = annotation.highlighted_text[:100]

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"✅ Discussion Resolved on '{article_title}'",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{actor_name}* marked the discussion on >\"{quote_text}\" as *Resolved*.",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Article: *{article_title}* | Link: `{link}`",
                    }
                ],
            },
        ]

        return {
            "text": f"✅ Discussion on '{quote_text}' marked Resolved by {actor_name}.",
            "blocks": blocks,
            "event_type": "annotation_resolved",
            "annotation_id": str(annotation.id),
        }

    @classmethod
    def send_slack_webhook(
        cls, payload: Dict[str, Any], webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        url = cls.get_webhook_url(webhook_url)
        if not url:
            # Simulated webhook execution when no live external URL configured
            logger.info("No SLACK_WEBHOOK_URL configured. Simulating delivery: %s", payload.get("text"))
            return {
                "success": True,
                "simulated": True,
                "detail": "Slack webhook simulated successfully (no external URL configured).",
                "payload": payload,
            }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                response_text = response.read().decode("utf-8")
                return {
                    "success": 200 <= status_code < 300,
                    "simulated": False,
                    "status_code": status_code,
                    "response": response_text,
                    "payload": payload,
                }
        except urllib.error.URLError as err:
            logger.error("Slack webhook dispatch failed: %s", err)
            return {
                "success": False,
                "simulated": False,
                "error": str(err),
                "payload": payload,
            }


class DiscussionNotificationDispatcher:
    """
    Central dispatcher coordinating multi-channel notification broadcasts:
    1. In-App Notifications (Notification model)
    2. Email Notifications (Django send_mail)
    3. Slack / Teams Webhooks (SlackWebhookBridge)
    """

    @classmethod
    def send_email_alert(
        cls,
        recipients: List[Any],
        subject: str,
        message: str,
        link: Optional[str] = None,
    ) -> int:
        valid_emails = [
            u.email
            for u in recipients
            if getattr(u, "email", None) and "@" in u.email and u.is_active
        ]
        if not valid_emails:
            return 0

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Company Wiki <noreply@company-wiki.local>")
        full_body = message
        if link:
            full_body += f"\n\nView discussion online: {link}"

        try:
            return send_mail(
                subject=f"[Wiki Discussions] {subject}",
                message=full_body,
                from_email=from_email,
                recipient_list=valid_emails,
                fail_silently=True,
            )
        except Exception as e:
            logger.warning("Failed to send notification email: %s", e)
            return 0

    @classmethod
    def dispatch_annotation_created(cls, annotation, actor) -> Dict[str, Any]:
        """
        Triggered when a new inline annotation is opened.
        """
        article = annotation.article
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        link = f"/articles/{article.slug}?annotation={annotation.id}" if article else ""
        notified_recipients = []

        # 1. Notify mentioned users
        mentioned_notifs = parse_and_notify_mentions(
            text=annotation.content,
            actor=actor,
            link=link,
            article=article,
            custom_title=f"{actor_name} mentioned you in an inline discussion on '{article.title}'",
        )
        notified_user_ids = {n.recipient_id for n in mentioned_notifs}
        notified_recipients.extend([n.recipient for n in mentioned_notifs])

        # 2. Notify article author if distinct from actor and not already mentioned
        if article and article.author_id != actor.id and article.author_id not in notified_user_ids:
            notif = Notification.objects.create(
                recipient=article.author,
                sender=actor,
                notification_type=Notification.NotificationType.COMMENT,
                title=f"{actor_name} started a discussion on '{article.title}'",
                message=f"Quote: \"{annotation.highlighted_text[:100]}\"\nComment: {annotation.content[:150]}",
                link=link,
                article=article,
            )
            notified_user_ids.add(article.author_id)
            notified_recipients.append(article.author)

        # 3. Email dispatch
        email_sent_count = cls.send_email_alert(
            recipients=notified_recipients,
            subject=f"New discussion on '{article.title}'",
            message=f"{actor_name} highlighted:\n\"{annotation.highlighted_text}\"\n\nComment:\n{annotation.content}",
            link=link,
        )

        # 4. Slack Webhook dispatch
        slack_payload = SlackWebhookBridge.format_annotation_created_payload(annotation, actor)
        webhook_result = SlackWebhookBridge.send_slack_webhook(slack_payload)

        return {
            "in_app_count": len(notified_user_ids),
            "email_sent_count": email_sent_count,
            "webhook_result": webhook_result,
        }

    @classmethod
    def dispatch_reply_created(cls, reply, actor) -> Dict[str, Any]:
        """
        Triggered when a reply is posted in an existing discussion tree.
        """
        annotation = reply.annotation
        article = annotation.article if annotation else None
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        link = f"/articles/{article.slug}?annotation={annotation.id}" if article and annotation else ""
        notified_recipients = []

        # 1. Notify mentioned users
        mentioned_notifs = parse_and_notify_mentions(
            text=reply.content,
            actor=actor,
            link=link,
            article=article,
            custom_title=f"{actor_name} mentioned you in a discussion reply on '{article.title if article else ''}'",
        )
        notified_user_ids = {n.recipient_id for n in mentioned_notifs}
        notified_recipients.extend([n.recipient for n in mentioned_notifs])

        # 2. Notify thread author if different from replier
        if annotation and annotation.author_id != actor.id and annotation.author_id not in notified_user_ids:
            notif = Notification.objects.create(
                recipient=annotation.author,
                sender=actor,
                notification_type=Notification.NotificationType.COMMENT,
                title=f"{actor_name} replied to your inline annotation",
                message=reply.content[:150] + ("..." if len(reply.content) > 150 else ""),
                link=link,
                article=article,
            )
            notified_user_ids.add(annotation.author_id)
            notified_recipients.append(annotation.author)

        # 3. Notify parent reply author if nested and distinct
        if reply.parent and reply.parent.author_id != actor.id and reply.parent.author_id not in notified_user_ids:
            notif = Notification.objects.create(
                recipient=reply.parent.author,
                sender=actor,
                notification_type=Notification.NotificationType.COMMENT,
                title=f"{actor_name} replied to your comment in the thread",
                message=reply.content[:150] + ("..." if len(reply.content) > 150 else ""),
                link=link,
                article=article,
            )
            notified_user_ids.add(reply.parent.author_id)
            notified_recipients.append(reply.parent.author)

        # 4. Email dispatch
        email_sent_count = cls.send_email_alert(
            recipients=notified_recipients,
            subject=f"New reply in discussion on '{article.title if article else 'Wiki'}'",
            message=f"{actor_name} replied:\n{reply.content}",
            link=link,
        )

        # 5. Slack Webhook dispatch
        slack_payload = SlackWebhookBridge.format_annotation_reply_payload(reply, actor)
        webhook_result = SlackWebhookBridge.send_slack_webhook(slack_payload)

        return {
            "in_app_count": len(notified_user_ids),
            "email_sent_count": email_sent_count,
            "webhook_result": webhook_result,
        }

    @classmethod
    def dispatch_annotation_resolved(cls, annotation, actor) -> Dict[str, Any]:
        """
        Triggered when an annotation discussion is marked resolved.
        """
        article = annotation.article
        actor_name = actor.full_name or actor.username if actor else "A teammate"
        link = f"/articles/{article.slug}?annotation={annotation.id}" if article else ""
        notified_user_ids = set()
        notified_recipients = []

        # Notify annotation author if different from resolver
        if annotation.author_id != actor.id:
            notif = Notification.objects.create(
                recipient=annotation.author,
                sender=actor,
                notification_type=Notification.NotificationType.COMMENT,
                title=f"{actor_name} marked your discussion as resolved",
                message=f"Quote: \"{annotation.highlighted_text[:100]}\"",
                link=link,
                article=article,
            )
            notified_user_ids.add(annotation.author_id)
            notified_recipients.append(annotation.author)

        # Email dispatch
        email_sent_count = cls.send_email_alert(
            recipients=notified_recipients,
            subject=f"Discussion resolved on '{article.title if article else 'Wiki'}'",
            message=f"{actor_name} marked the discussion on \"{annotation.highlighted_text}\" as resolved.",
            link=link,
        )

        # Slack Webhook dispatch
        slack_payload = SlackWebhookBridge.format_annotation_resolved_payload(annotation, actor)
        webhook_result = SlackWebhookBridge.send_slack_webhook(slack_payload)

        return {
            "in_app_count": len(notified_user_ids),
            "email_sent_count": email_sent_count,
            "webhook_result": webhook_result,
        }
