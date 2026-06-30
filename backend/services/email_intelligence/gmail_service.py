"""
Gmail API Client wrapper. Fetches emails from Google Gmail API.
"""
import logging
from googleapiclient.discovery import build
from typing import List, Dict, Optional

from . import oauth_service

logger = logging.getLogger(__name__)


def get_gmail_client(user):
    """
    Returns an authenticated googleapiclient resource client for Gmail.
    """
    creds = oauth_service.refresh_user_gmail_tokens(user)
    if not creds:
        return None
    return build('gmail', 'v1', credentials=creds)


def fetch_unread_messages(user, max_results: int = 15) -> List[Dict]:
    """
    Fetches the metadata and list of unread message IDs from the user's inbox from yesterday onwards.
    """
    service = get_gmail_client(user)
    if not service:
        return []

    try:
        from django.utils import timezone
        # Restrict sync to only emails received starting yesterday to optimize token usage and processing costs
        yesterday = timezone.now() - timezone.timedelta(days=1)
        after_date_str = yesterday.strftime("%Y/%m/%d")
        query_str = f'is:unread label:INBOX after:{after_date_str}'

        results = service.users().messages().list(
            userId='me',
            q=query_str,
            maxResults=max_results
        ).execute()

        return results.get('messages', [])
    except Exception as e:
        logger.error(f"Failed to fetch Gmail list for {user.email}: {e}")
        return []


def get_message_detail(user, message_id: str) -> Optional[Dict]:
    """
    Fetches full headers and body text details for a single Gmail message.
    """
    service = get_gmail_client(user)
    if not service:
        return None

    try:
        message = service.users().messages().get(
            userId='me',
            id=message_id,
            format='full'
        ).execute()
        return message
    except Exception as e:
        logger.error(f"Failed to fetch Gmail details for message {message_id}: {e}")
        return None
