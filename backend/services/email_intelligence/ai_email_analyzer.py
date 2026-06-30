"""
AI Email analyzer. Determines if an email is actionable and extracts urgency metrics.
"""
import os
import json
import logging
import openai
from typing import Dict

from . import prompts

logger = logging.getLogger(__name__)


def analyze_email_relevance(subject: str, sender: str, body: str) -> Dict:
    """
    Submits email content to OpenAI to evaluate if it demands task scheduling.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_relevance(subject, body)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.EMAIL_ANALYSIS_PROMPT.format(
            subject=subject,
            sender=sender,
            body=body[:3000]
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=200,
        )

        result = json.loads(response.choices[0].message.content.strip())
        return {
            "is_actionable": result.get("is_actionable", False),
            "category": result.get("category", "GENERAL_NOTIFICATION"),
            "confidence": float(result.get("confidence", 0.0)),
            "summary": result.get("summary", "")
        }

    except Exception as e:
        logger.error(f"LLM email analysis failed: {e}")
        return _fallback_relevance(subject, body)


def _fallback_relevance(subject: str, body: str) -> Dict:
    """Keyword relevance fallback classifier."""
    text = (subject + " " + body).lower()
    
    action_keywords = [
        'invoice', 'bill', 'payment due', 'interview', 'meeting invitation', 
        'deadline', 'zoom link', 'assignment', 'booking confirmation', 'ticket',
        'action required', 'follow up', 'please respond'
    ]
    
    is_actionable = any(kw in text for kw in action_keywords)
    
    category = "GENERAL_NOTIFICATION"
    if 'bill' in text or 'payment' in text or 'invoice' in text:
        category = "BILL_PAYMENT"
    elif 'interview' in text or 'meeting' in text or 'zoom' in text or 'calendar' in text:
        category = "MEETING_INVITATION"
    elif 'assignment' in text or 'deadline' in text:
        category = "ASSIGNMENT_DEADLINE"
    elif 'booking' in text or 'ticket' in text or 'travel' in text or 'flight' in text:
        category = "TRAVEL_BOOKING"
    elif 'follow up' in text or 'respond' in text:
        category = "FOLLOW_UP_REQUEST"

    return {
        "is_actionable": is_actionable,
        "category": category,
        "confidence": 0.7 if is_actionable else 0.9,
        "summary": subject[:60]
    }
