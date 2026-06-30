"""
OAuth Service for per-user Google Gmail connection.
Handles OAuth redirect generation, credentials validation, and token refresh.
"""
import os
import logging
from typing import Optional
from django.utils import timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow

# Relax oauthlib token scope change checks
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

logger = logging.getLogger(__name__)

# Minimal scopes required for listing and parsing emails
GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]


def get_oauth_flow(redirect_uri: str) -> Flow:
    """
    Builds Google OAuth Flow client using environment variables.
    """
    client_config = {
        "web": {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    return Flow.from_client_config(
        client_config,
        scopes=GMAIL_SCOPES,
        redirect_uri=redirect_uri
    )


def refresh_user_gmail_tokens(user) -> Optional[Credentials]:
    """
    Checks if a user's Gmail OAuth credentials have expired and refreshes them.
    Returns refreshed Google Credentials or None if failed.
    """
    from apps.email_intelligence.models import GmailCredential
    try:
        cred_record = GmailCredential.objects.get(user=user)
    except GmailCredential.DoesNotExist:
        return None

    creds = Credentials(
        token=cred_record.access_token,
        refresh_token=cred_record.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET")
    )

    # Check and refresh if token is close to expiry or invalid
    if cred_record.token_expiry <= timezone.now() or not creds.valid:
        try:
            creds.refresh(Request())
            cred_record.access_token = creds.token
            if creds.refresh_token:
                cred_record.refresh_token = creds.refresh_token
            # Set 1 hour expiry
            cred_record.token_expiry = timezone.now() + timezone.timedelta(seconds=3600)
            cred_record.save()
            logger.info(f"Refreshed Gmail tokens for user {user.email}")
        except Exception as e:
            logger.error(f"Failed to refresh Gmail tokens for {user.email}: {e}")
            return None

    return creds
