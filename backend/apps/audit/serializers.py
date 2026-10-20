from rest_framework import serializers
from apps.audit.models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for individual audit event inspection by administrators.
    """
    actor_username = serializers.CharField(source="actor.username", read_only=True, default="System")
    actor_email = serializers.CharField(source="actor.email", read_only=True, default="")
    actor_role = serializers.CharField(source="actor.role", read_only=True, default="SYSTEM")
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "actor",
            "actor_username",
            "actor_email",
            "actor_role",
            "action",
            "action_display",
            "resource_type",
            "resource_id",
            "resource_name",
            "details",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields


class AuditEventListSerializer(serializers.ModelSerializer):
    """
    Compact serializer optimized for paginated audit log browsing.
    """
    actor_username = serializers.CharField(source="actor.username", read_only=True, default="System")
    actor_role = serializers.CharField(source="actor.role", read_only=True, default="SYSTEM")
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "actor_username",
            "actor_role",
            "action",
            "action_display",
            "resource_type",
            "resource_id",
            "resource_name",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
