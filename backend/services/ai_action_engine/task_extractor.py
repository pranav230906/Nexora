"""
Task extraction service. Responsible for validating entities and saving Tasks
using the existing Django Task model. Returns follow-up questions for missing fields.
"""
import logging
from typing import Dict, Tuple, Optional

from apps.tasks.models import Task, Tag
from . import entity_parser

logger = logging.getLogger(__name__)


def extract_and_create_task(user, text: str) -> Tuple[Optional[Task], Optional[str]]:
    """
    Parses entities from the text, checks for missing details, and creates a Task.
    If details are missing, returns (None, follow_up_question).
    """
    entities = entity_parser.parse_entities(text)

    title = entities.get('title', '').strip()
    if not title:
        return None, "What is the title of the task you would like to schedule?"

    # Check for missing due date
    due_date = entities.get('due_date')
    if not due_date:
        return None, f"I found the task '{title}'. What date or time should I set for this?"

    try:
        # Create or fetch category tag
        tag_name = entities.get('category') or 'General'
        tag, _ = Tag.objects.get_or_create(user=user, name=tag_name)

        # Build task parameters
        task_data = {
            'user': user,
            'title': title,
            'description': entities.get('description') or '',
            'priority': entities.get('priority', 'MEDIUM').upper(),
            'status': Task.Status.TODO,
            'due_date': due_date,
            'estimated_time': entities.get('estimated_time', 30),
            'is_recurring': entities.get('is_recurring', False),
            'recurrence_pattern': entities.get('recurrence_pattern'),
        }

        # Create Task using existing Task module manager
        task = Task.objects.create(**task_data)
        task.tags.add(tag)
        task.save()

        logger.info(f"AI Action Engine created task {task.id} for user {user.email}")
        return task, None

    except Exception as e:
        logger.error(f"Failed to create task via Action Engine: {e}")
        return None, f"An error occurred while creating your task: {str(e)[:100]}"
