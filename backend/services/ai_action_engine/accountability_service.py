"""
Accountability partner coaching service. Monitors task deadlines, evaluates
performance streaks, and formats personalized coaching communications.
"""
import os
import logging
import openai
from typing import Dict

from apps.tasks.models import Task
from . import prompts
from . import progress_tracker

logger = logging.getLogger(__name__)


def generate_accountability_message(user, phase: str, notification_level: int = 1) -> Dict:
    """
    Generates a personalized motivational prompt / accountability message.
    """
    progress = progress_tracker.get_user_progress_summary(user)
    
    # Fetch today's tasks
    from django.utils import timezone
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tasks = Task.active_objects.filter(user=user, due_date__gte=today_start)
    
    tasks_content = "\n".join(
        f"- {t.title} ({t.status}, Priority: {t.priority})"
        for t in tasks
    ) or "No tasks scheduled today."

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "message": _fallback_message(phase, progress),
            "phase": phase,
            "level": notification_level
        }

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.ACCOUNTABILITY_PROMPT.format(
            phase=phase,
            streak=progress.get("streak_days", 0),
            score=progress.get("productivity_score", 0),
            tasks_content=tasks_content,
            level=notification_level
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=200,
        )

        return {
            "message": response.choices[0].message.content.strip(),
            "phase": phase,
            "level": notification_level
        }

    except Exception as e:
        logger.error(f"LLM accountability generation failed: {e}")
        return {
            "message": _fallback_message(phase, progress),
            "phase": phase,
            "level": notification_level
        }


def _fallback_message(phase: str, progress: Dict) -> str:
    """Fallback motivational reminders."""
    streak = progress.get("streak_days", 0)
    if phase == "MORNING_PLANNING":
        return f"Good morning! Let's conquer today. Your current streak is {streak} days. Review your plan and check off tasks early!"
    elif phase == "MIDDAY_CHECKIN":
        return "Hey! Keep moving. Check off any completed tasks so we can sync your achievements and update your calendar."
    elif phase == "EVENING_SUMMARY":
        return f"Evening summary: Great effort today! Your productivity score finished at {progress.get('productivity_score', 0)}%."
    elif phase == "DEADLINE_WARNING":
        return "Warning: You have an upcoming deadline! Try to break it into sub-tasks and start now."
    elif phase == "MISSED_RECOVERY":
        return "Missed deadline: No worries, let's reorganize your tasks and reschedule them to get back on track."
    
    return "Keep up the focus!"
