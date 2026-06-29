"""
Tool Router for the AI Chat module.
Detects when the user's message requires data lookup and dispatches
to the appropriate context_builder function. Model-agnostic approach
using keyword/pattern matching — works with any LLM backend.
"""
import re
import logging
from typing import List, Dict, Callable

from . import context_builder

logger = logging.getLogger(__name__)

# Tool definitions: name → (keywords, handler function)
TOOL_REGISTRY: Dict[str, Dict] = {
    'get_tasks': {
        'keywords': [
            'task', 'tasks', 'todo', 'to-do', 'to do', 'overdue',
            'deadline', 'deadlines', 'pending', 'backlog', 'checklist',
            'assigned', 'what should i do', 'what do i need', 'remaining',
        ],
        'handler': context_builder.get_user_tasks,
        'description': 'Retrieves active tasks with status, priority, and due dates.',
    },
    'get_goals': {
        'keywords': [
            'goal', 'goals', 'milestone', 'milestones', 'objective',
            'objectives', 'target', 'targets', 'ambition',
        ],
        'handler': context_builder.get_user_goals,
        'description': 'Retrieves goals with milestone completion progress.',
    },
    'get_habits': {
        'keywords': [
            'habit', 'habits', 'streak', 'streaks', 'check-in',
            'checkin', 'routine', 'routines', 'daily habit',
        ],
        'handler': context_builder.get_user_habits,
        'description': 'Retrieves habits with current and best streaks.',
    },
    'get_calendar': {
        'keywords': [
            'calendar', 'schedule', 'scheduled', 'event', 'events',
            'meeting', 'meetings', 'upcoming', 'agenda', 'plan for today',
            'plan for the week', 'what\'s coming up', 'next week',
        ],
        'handler': context_builder.get_user_calendar,
        'description': 'Retrieves upcoming calendar events for the next 7 days.',
    },
    'get_productivity': {
        'keywords': [
            'productivity', 'score', 'analytics', 'report', 'performance',
            'focus', 'focus hours', 'statistics', 'stats', 'progress',
            'how am i doing', 'how productive', 'efficiency',
        ],
        'handler': context_builder.get_user_productivity,
        'description': 'Retrieves productivity analytics and scores.',
    },
    'get_notifications': {
        'keywords': [
            'notification', 'notifications', 'alert', 'alerts',
            'unread', 'new messages', 'updates',
        ],
        'handler': context_builder.get_user_notifications,
        'description': 'Retrieves recent unread notifications.',
    },
    'get_gamification': {
        'keywords': [
            'xp', 'level', 'coins', 'achievement', 'achievements',
            'badge', 'badges', 'leaderboard', 'rank', 'gamification',
            'reward', 'rewards',
        ],
        'handler': context_builder.get_user_gamification,
        'description': 'Retrieves gamification profile (XP, level, coins, achievements).',
    },
}

# Broad productivity keywords — trigger full context when message is general
BROAD_PRODUCTIVITY_KEYWORDS = [
    'what should i do today',
    'summarize my day',
    'daily summary',
    'weekly summary',
    'how am i doing',
    'give me an overview',
    'my progress',
    'help me plan',
    'optimize my day',
    'what\'s my status',
]


def detect_tools_needed(message: str) -> List[str]:
    """
    Analyzes the user's message using keyword matching to determine
    which data-fetching tools should be called.
    Returns a list of tool names.
    """
    message_lower = message.lower().strip()
    matched_tools = []

    # Check for broad productivity queries first
    for phrase in BROAD_PRODUCTIVITY_KEYWORDS:
        if phrase in message_lower:
            # Return all productivity-related tools
            return ['get_tasks', 'get_goals', 'get_habits', 'get_productivity', 'get_gamification']

    # Check each tool's keywords
    for tool_name, tool_def in TOOL_REGISTRY.items():
        for keyword in tool_def['keywords']:
            # Use word boundary matching for short keywords to avoid false positives
            if len(keyword) <= 4:
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, message_lower):
                    matched_tools.append(tool_name)
                    break
            else:
                if keyword in message_lower:
                    matched_tools.append(tool_name)
                    break

    return list(set(matched_tools))


def execute_tools(tool_names: List[str], user) -> Dict[str, str]:
    """
    Executes the specified tools and returns their results.
    """
    results = {}
    for tool_name in tool_names:
        if tool_name in TOOL_REGISTRY:
            try:
                handler = TOOL_REGISTRY[tool_name]['handler']
                results[tool_name] = handler(user)
            except Exception as e:
                logger.error(f"Tool execution error for '{tool_name}': {e}")
                results[tool_name] = f"Error retrieving data for {tool_name}."
        else:
            logger.warning(f"Unknown tool requested: {tool_name}")
    return results


def format_tool_results(results: Dict[str, str]) -> str:
    """
    Formats tool results into a structured string for LLM consumption.
    """
    if not results:
        return ""

    sections = []
    for tool_name, result in results.items():
        sections.append(result)

    return "\n\n".join(sections)
