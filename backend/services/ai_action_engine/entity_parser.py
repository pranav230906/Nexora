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
        
        # Verify date format is parseable or fallback to tomorrow
        due = result.get('due_date')
        parsed_dt = None
        if due:
            due_clean = due.strip()
            if len(due_clean) == 10: # YYYY-MM-DD
                due_clean += "T12:00:00Z"
            if ' ' in due_clean and 'T' not in due_clean:
                due_clean = due_clean.replace(' ', 'T')
            try:
                parsed_dt = datetime.fromisoformat(due_clean.replace('Z', '+00:00'))
            except ValueError:
                from django.utils.dateparse import parse_datetime
                parsed_dt = parse_datetime(due_clean)

        if not parsed_dt:
            # Smart parsing of text for basic date words
            text_lower = text.lower()
            tomorrow = timezone.now() + timezone.timedelta(days=1)
            if 'today' in text_lower:
                parsed_dt = timezone.now()
            elif 'tomorrow' in text_lower:
                parsed_dt = tomorrow
            elif 'next week' in text_lower:
                parsed_dt = timezone.now() + timezone.timedelta(days=7)
            else:
                parsed_dt = tomorrow

        # Format as ISO string ending with Z
        result['due_date'] = parsed_dt.strftime('%Y-%m-%dT%H:%M:%SZ')
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

    # Smart parsing of text for basic date words
    tomorrow = timezone.now() + timezone.timedelta(days=1)
    if 'today' in text_lower:
        parsed_dt = timezone.now()
    elif 'tomorrow' in text_lower:
        parsed_dt = tomorrow
    elif 'next week' in text_lower:
        parsed_dt = timezone.now() + timezone.timedelta(days=7)
    else:
        parsed_dt = tomorrow
    due_date_str = parsed_dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    return {
        "title": title,
        "due_date": due_date_str,
        "estimated_time": estimated_time,
        "priority": priority,
        "category": "Work",
        "description": text,
        "is_recurring": is_recurring,
        "recurrence_pattern": recurrence_pattern
    }
