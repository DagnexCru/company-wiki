from datetime import datetime, timezone
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


class HealthCheckView(APIView):
    """
    Health check endpoint reporting API and database operational status.
    GET /api/v1/health/
    Publicly accessible, strictly prevents disclosure of system secrets or credentials.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        db_status = "connected"
        db_error = None
        http_status = status.HTTP_200_OK

        try:
            # Execute lightweight query to verify active database connectivity
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
        except OperationalError as exc:
            db_status = "unreachable"
            db_error = "Database service is temporarily unavailable"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        except Exception:
            db_status = "error"
            db_error = "Database connection error"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE

        response_data = {
            "status": "healthy" if db_status == "connected" else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": "development",
            "services": {
                "api": "operational",
                "database": db_status
            }
        }

        if db_error:
            response_data["services"]["database_message"] = db_error

        return Response(response_data, status=http_status)
