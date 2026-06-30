"""
Planner module. Builds time-blocked daily execution schedules for tasks,
incorporating user calendar availability.
"""
import os
import json
import logging
import openai
from typing import List, Dict
from django.utils import timezone
from apps.tasks.models import Task
from services.google_calendar import read_calendar_events
from . import prompts

logger = logging.getLogger(__name__)


def generate_daily_schedule(user) -> List[Dict]:
    """
    Builds a list of daily focus and break time blocks.
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Fetch active tasks for today
    tasks = Task.active_objects.filter(
        user=user, 
        status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
    ).order_by('priority')[:5]

    tasks_list_str = "\n".join(
        f"- {t.title} (Priority: {t.priority}, Est: {t.estimated_time}m)"
        for t in tasks
    )

    # 2. Fetch upcoming events
    events = read_calendar_events(user, time_min=today_start.isoformat(), max_results=10)
    events_list_str = ""
    for ev in events:
        start = ev.get('start', {})
        start_time = start.get('dateTime') or start.get('date', '')
        events_list_str += f"- {ev.get('summary')}: starts {start_time}\n"

    if not tasks_list_str:
        return []

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_schedule(tasks)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.PLANNING_PROMPT.format(
            current_time=now.strftime("%Y-%m-%d"),
            tasks_list=tasks_list_str,
            events_list=events_list_str or "No calendar events today."
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
            max_tokens=500,
        )

        # Expecting a JSON object with a "schedule" or root list
        content = response.choices[0].message.content.strip()
        data = json.loads(content)
        if isinstance(data, dict):
            # If the LLM wrapped it, extract list
            for key in ['schedule', 'blocks', 'items']:
                if key in data and isinstance(data[key], list):
                    return data[key]
            # If no standard key, return dict values if they look like a list
            values = list(data.values())
            if len(values) == 1 and isinstance(values[0], list):
                return values[0]
        elif isinstance(data, list):
            return data

        return _fallback_schedule(tasks)

    except Exception as e:
        logger.error(f"LLM planning compilation failed: {e}")
        return _fallback_schedule(tasks)


def _fallback_schedule(tasks: List[Task]) -> List[Dict]:
    """Generates simple sequential focus blocks for offline runs."""
    schedule = []
    current_hour = 9  # Start at 9 AM
    
    for t in tasks:
        schedule.append({
            "start_time": f"{current_hour:02d}:00",
            "duration": t.estimated_time or 60,
            "label": f"Focus: {t.title}",
            "type": "FOCUS",
            "description": f"Dedicated block to complete {t.title}"
        })
        
        # Insert a break
        current_hour += 1
        schedule.append({
            "start_time": f"{current_hour:02d}:00",
            "duration": 15,
            "label": "Short Break",
            "type": "BREAK",
            "description": "Rest your eyes, hydrate, and stretch."
        })
        current_hour += 1

    return schedule
