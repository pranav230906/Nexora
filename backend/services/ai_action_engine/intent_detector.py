"""
Intent detection module. Classifies user text into action engine intents.
"""
import os
import json
import logging
import openai
from typing import Dict

from . import prompts

logger = logging.getLogger(__name__)


def detect_intent(text: str) -> Dict:
    """
    Detect the user's intent: CREATE_TASK, COMPLETE_TASK, PLANNING, or GENERAL_CONVERSATION.
    Returns a dict with 'intent' (str) and 'confidence' (float).
    """
    text_lower = text.lower().strip()

    # Fast local keyword fallback if offline or no API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_detect_intent(text_lower)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.INTENT_DETECTION_PROMPT.format(text=text)

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=100,
        )

        result = json.loads(response.choices[0].message.content.strip())
        return {
            'intent': result.get('intent', 'GENERAL_CONVERSATION'),
            'confidence': float(result.get('confidence', 1.0))
        }
    except Exception as e:
        logger.error(f"LLM intent detection failed: {e}. Falling back to keywords.")
        return _fallback_detect_intent(text_lower)


def _fallback_detect_intent(text_lower: str) -> Dict:
    """Keyword-based intent classifier fallback."""
    create_keywords = [
        'remind', 'schedule', 'todo', 'task', 'add', 'submit', 'prepare', 
        'call', 'meet', 'tomorrow', 'next week', 'every monday', 'plan to'
    ]
    complete_keywords = [
        'done', 'completed', 'finished', 'submitted', 'uploaded', 
        'check off', 'resolved', 'finish task', 'mark complete'
    ]
    planning_keywords = [
        'reorganize', 'plan my day', 'time block', 'schedule focus', 
        'organize list', 'replan', 'timeline', 'daily planner'
    ]

    for kw in complete_keywords:
        if kw in text_lower:
            return {'intent': 'COMPLETE_TASK', 'confidence': 0.8}

    for kw in planning_keywords:
        if kw in text_lower:
            return {'intent': 'PLANNING', 'confidence': 0.8}

    for kw in create_keywords:
        if kw in text_lower:
            return {'intent': 'CREATE_TASK', 'confidence': 0.8}

    return {'intent': 'GENERAL_CONVERSATION', 'confidence': 0.7}
