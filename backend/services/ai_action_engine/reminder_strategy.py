"""
Reminder strategy generator. Computes and generates context-aware notification alerts.
Implements the 6-level intelligent escalation warnings.
"""
from typing import Dict, Optional
from apps.tasks.models import Task


class EscalationLevel:
    LEVEL_1 = 1  # Gentle reminder
    LEVEL_2 = 2  # Motivation helper
    LEVEL_3 = 3  # Focus suggestions
    LEVEL_4 = 4  # Day replanning / Reorganization warning
    LEVEL_5 = 5  # Critical alert
    LEVEL_6 = 6  # Missed recovery suggestions


def get_escalation_level(task: Task, time_remaining_hours: float) -> int:
    """
    Decides the escalation warning level based on time remaining
    and the status of the task.
    """
    if task.status == Task.Status.COMPLETED:
        return EscalationLevel.LEVEL_1

    # Overdue
    if time_remaining_hours < 0:
        return EscalationLevel.LEVEL_6

    # Critical (under 2 hours)
    if time_remaining_hours <= 2:
        return EscalationLevel.LEVEL_5

    # Pressuring (under 6 hours)
    if time_remaining_hours <= 6:
        return EscalationLevel.LEVEL_4

    # Midday focus check (under 12 hours)
    if time_remaining_hours <= 12:
        if task.priority in [Task.Priority.HIGH, Task.Priority.URGENT]:
            return EscalationLevel.LEVEL_3
        return EscalationLevel.LEVEL_2

    return EscalationLevel.LEVEL_1


def generate_escalation_message(task: Task, level: int) -> Dict:
    """
    Generates structured notifications based on the escalation tier level.
    """
    title_prefix = f"[L{level}] AI Action Coach"
    title = f"{title_prefix}: Focus Alert"
    
    if level == EscalationLevel.LEVEL_1:
        message = f"Morning plan: You scheduled '{task.title}' today. Keep it on your radar."
    elif level == EscalationLevel.LEVEL_2:
        message = f"Quick check-in: '{task.title}' is set for today. Let's make some progress when you have a slot!"
    elif level == EscalationLevel.LEVEL_3:
        message = f"Ready to start? '{task.title}' is high priority. Would you like to block out a focus session now?"
    elif level == EscalationLevel.LEVEL_4:
        message = f"Warning: '{task.title}' is due in a few hours. Let's start now or reschedule to avoid a late submission."
    elif level == EscalationLevel.LEVEL_5:
        message = f"CRITICAL: '{task.title}' is due shortly! Minimize distractions and launch now."
    elif level == EscalationLevel.LEVEL_6:
        message = f"Missed deadline recovery: You missed the target for '{task.title}'. Let's reschedule this to keep your momentum."
    else:
        message = f"Update on task: '{task.title}'."

    return {
        "title": title,
        "message": message,
        "level": level
    }
