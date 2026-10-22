import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


def verify_google_token(id_token: str) -> dict:
    """
    Verifies a Google OAuth 2.0 ID token using Google's tokeninfo API service.
    Validates token signature, expiration, audience (client_id), and verified email status.

    Returns:
        dict: Verified payload containing 'email', 'name', 'sub', 'picture', etc.

    Raises:
        AuthenticationFailed: If verification fails, token is expired, or audience mismatches.
    """
    if not id_token or not isinstance(id_token, str) or not id_token.strip():
        raise AuthenticationFailed("Google ID token was not provided or is invalid.")

    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token.strip())}"

    try:
        req = urllib.request.Request(
            tokeninfo_url,
            headers={"User-Agent": "CompanyWiki-Auth/1.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_msg = "Google token verification failed."
        try:
            err_data = json.loads(e.read().decode("utf-8"))
            if "error_description" in err_data:
                error_msg = f"Google authentication error: {err_data['error_description']}"
            elif "error" in err_data:
                error_msg = f"Google authentication error: {err_data['error']}"
        except Exception:
            pass
        logger.warning("Google ID token rejected by Google API: %s", error_msg)
        raise AuthenticationFailed(error_msg)
    except urllib.error.URLError as e:
        logger.error("Failed to reach Google tokeninfo endpoint: %s", str(e))
        raise AuthenticationFailed("Unable to verify Google credentials due to network error.")
    except Exception as e:
        logger.error("Unexpected error verifying Google ID token: %s", str(e))
        raise AuthenticationFailed("An unexpected error occurred while verifying Google identity.")

    # 1. Verify token issuer
    issuer = payload.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        logger.warning("Google token untrusted issuer: %s", issuer)
        raise AuthenticationFailed("Untrusted Google token issuer.")

    # 2. Verify token audience (Client ID)
    expected_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    token_aud = payload.get("aud")
    if expected_client_id and token_aud != expected_client_id:
        logger.warning(
            "Google token audience mismatch. Expected '%s', got '%s'",
            expected_client_id,
            token_aud,
        )
        raise AuthenticationFailed("Google token client ID does not match this application.")

    # 3. Verify email exists and is verified
    email = payload.get("email")
    if not email:
        raise AuthenticationFailed("Google account did not provide an email address.")

    email_verified = payload.get("email_verified")
    if email_verified not in (True, "true", "True", 1):
        raise AuthenticationFailed("Google email address has not been verified by Google.")

    return payload
