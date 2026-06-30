"""
Entity parsing module. Extracts structured entities like dates,
durations, priorities, and category options from natural language.
"""
import os
import json
import logging
from datetime import datetime
from django.utils import timezone
import openai
from typing import Dict

from . import prompts

logger = logging.getLogger(__name__)


def parse_entities(text: str) -> Dict:
    """
    Extracts entities using the LLM. Fallback matches simple defaults.
    """
    now = timezone.now()
    current_time_str = now.isoformat()
    day_of_week = now.strftime('%A')

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_entities(text)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.ENTITY_PARSING_PROMPT.format(
            text=text,
            current_time=current_time_str,
            day_of_week=day_of_week
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=300,
        )

        result = json.loads(response.choices[0].message.content.strip())
        
        # Verify date format is parseable or null
        due = result.get('due_date')
        if due:
            try:
                # Validate by parsing
                datetime.fromisoformat(due.replace('Z', '+00:00'))
            except ValueError:
                result['due_date'] = None

        return result

    except Exception as e:
        logger.error(f"LLM entity parsing failed: {e}. Falling back to default.")
        return _fallback_entities(text)


def _fallback_entities(text: str) -> Dict:
    """Fallback entity extractor for local/offline run."""
    text_lower = text.lower()
    
    # Infer priority
    priority = "MEDIUM"
    if any(k in text_lower for k in ['urgent', 'asap', 'critical', 'immediately']):
        priority = "URGENT"
    elif any(k in text_lower for k in ['high', 'important', 'must']):
        priority = "HIGH"
    elif any(k in text_lower for k in ['low', 'minor', 'whenever']):
        priority = "LOW"

    # Infer estimated duration
    estimated_time = 30
    if 'hour' in text_lower:
        if 'two' in text_lower or '2' in text_lower:
            estimated_time = 120
        elif 'three' in text_lower or '3' in text_lower:
            estimated_time = 180
        else:
            estimated_time = 60

    # Clean summary title
    title = text[:80] + ("..." if len(text) > 80 else "")

    # Recurrence detection
    is_recurring = False
    recurrence_pattern = None
    if 'every' in text_lower:
        is_recurring = True
        if 'day' in text_lower:
            recurrence_pattern = 'DAILY'
        elif 'week' in text_lower or 'monday' in text_lower or 'friday' in text_lower:
            recurrence_pattern = 'WEEKLY'
        elif 'month' in text_lower:
            recurrence_pattern = 'MONTHLY'

    return {
        "title": title,
        "due_date": None,
        "estimated_time": estimated_time,
        "priority": priority,
        "category": "Work",
        "description": text,
        "is_recurring": is_recurring,
        "recurrence_pattern": recurrence_pattern
    }
