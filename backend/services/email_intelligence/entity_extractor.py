"""
Entity extraction service. Pulls structured Task and Calendar details
from email subjects and bodies.
"""
import os
import json
import logging
from django.utils import timezone
import openai
from typing import Dict

from . import prompts

logger = logging.getLogger(__name__)


def extract_action_entities(subject: str, body: str) -> Dict:
    """
    Submits raw email text to OpenAI to parse parameters.
    """
    current_time_str = timezone.now().isoformat()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_entities(subject, body)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.ACTION_EXTRACTION_PROMPT.format(
            current_time=current_time_str,
            subject=subject,
            body=body[:3000]
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=300,
        )

        result = json.loads(response.choices[0].message.content.strip())
        return result

    except Exception as e:
        logger.error(f"LLM entity extraction from email failed: {e}")
        return _fallback_entities(subject, body)


def _fallback_entities(subject: str, body: str) -> Dict:
    """Fallback parser for local runs."""
    text_lower = (subject + " " + body).lower()
    
    # Simple due date fallback
    due_date = timezone.now() + timezone.timedelta(days=1)
    
    # Priority
    priority = "MEDIUM"
    if any(k in text_lower for k in ['urgent', 'payment due', 'asap', 'critical']):
        priority = "HIGH"

    # Schedule Calendar flag
    schedule_calendar = any(k in text_lower for k in ['meeting', 'interview', 'zoom', 'call', 'at'])

    return {
        "title": subject[:100],
        "description": f"Extracted from email: {subject}\n\n{body[:200]}...",
        "due_date": due_date.isoformat(),
        "duration_minutes": 60 if schedule_calendar else 30,
        "priority": priority,
        "schedule_calendar": schedule_calendar,
        "calendar_start": due_date.isoformat() if schedule_calendar else None,
        "calendar_end": (due_date + timezone.timedelta(hours=1)).isoformat() if schedule_calendar else None
    }
