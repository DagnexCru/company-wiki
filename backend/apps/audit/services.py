import logging
from django.utils import timezone
from apps.audit.models import AuditEvent

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    "password",
    "password_confirm",
    "token",
    "refresh",
    "access",
    "secret",
    "authorization",
    "api_key",
    "csrf_token",
}


def sanitize_audit_details(data):
    """
    Recursively strip or mask confidential credentials and tokens
    to guarantee zero secret exposure in audit logs.
    """
    if not isinstance(data, dict):
        return data

    sanitized = {}
    for key, value in data.items():
        lower_key = str(key).lower()
        if any(sensitive in lower_key for sensitive in SENSITIVE_KEYS):
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_audit_details(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_audit_details(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    return sanitized


def get_client_ip(request):
    """Extract client IP address handling X-Forwarded-For if behind a proxy."""
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def log_audit_event(
    action,
    resource_type,
    actor=None,
    resource_id="",
    resource_name="",
    details=None,
    ip_address=None,
    request=None,
):
    """
    Convenience service function to record an immutable system audit event.
    Safely captures actor identity, client IP, action, resource, and sanitized metadata.
    """
    try:
        if request:
            if not actor and hasattr(request, "user") and request.user.is_authenticated:
                actor = request.user
            if not ip_address:
                ip_address = get_client_ip(request)

        clean_details = sanitize_audit_details(details or {})

        event = AuditEvent.objects.create(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            resource_name=str(resource_name)[:255],
            details=clean_details,
            ip_address=ip_address,
        )
        return event
    except Exception as exc:
        logger.error(f"Failed to record audit event '{action}': {exc}", exc_info=True)
        return None
