"""
Email MIME structure parser helper. Extracts headers (Subject, From, Date)
and decodes body payloads cleanly.
"""
import base64
import logging
from typing import Dict

logger = logging.getLogger(__name__)


def parse_raw_message(message_data: dict) -> Dict[str, str]:
    """
    Extracts Subject, From, Date, and decodes body content from the Gmail API response payload.
    """
    payload = message_data.get('payload', {})
    headers = payload.get('headers', [])

    parsed = {
        'id': message_data.get('id', ''),
        'thread_id': message_data.get('threadId', ''),
        'subject': '',
        'from': '',
        'date': '',
        'body': ''
    }

    # Extract headers
    for h in headers:
        name = h.get('name', '').lower()
        if name == 'subject':
            parsed['subject'] = h.get('value', '')
        elif name == 'from':
            parsed['from'] = h.get('value', '')
        elif name == 'date':
            parsed['date'] = h.get('value', '')

    # Decode body payload
    body_data = ""
    parts = [payload]
    
    # If multipart, append subparts
    if 'parts' in payload:
        parts.extend(payload['parts'])

    for part in parts:
        mime_type = part.get('mimeType', 'text/plain')
        # Prefer plain text or fallback to HTML
        if mime_type in ['text/plain', 'text/html']:
            data = part.get('body', {}).get('data', '')
            if data:
                try:
                    # Decode base64url encoded string
                    decoded = base64.urlsafe_b64decode(data).decode('utf-8')
                    body_data += decoded
                except Exception as e:
                    logger.debug(f"Failed to decode payload: {e}")
        
        # Recurse inside nested parts if any
        if 'parts' in part:
            parts.extend(part['parts'])

    # Sanitize and truncate body to avoid overloading the LLM
    parsed['body'] = body_data.strip()[:6000]
    return parsed
