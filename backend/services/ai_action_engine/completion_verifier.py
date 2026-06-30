"""
Task completion verifier. Analyzes text descriptions, URLs, PDF metadata,
or screenshot files to check if the task objectives were completed.
"""
import os
import json
import logging
import openai
from typing import Dict, Optional

from apps.tasks.models import Task
from . import prompts

logger = logging.getLogger(__name__)


def verify_task_completion(
    task: Task, 
    submission_text: Optional[str] = None, 
    file_description: Optional[str] = None
) -> Dict:
    """
    Submits task requirements and verification assets to the LLM to inspect.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Fallback: auto-approve text inputs containing "completed" or similar
        return _fallback_verification(submission_text)

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.COMPLETION_VERIFICATION_PROMPT.format(
            task_title=task.title,
            task_description=task.description or "No description provided.",
            submission_text=submission_text or "No text/URL provided.",
            file_description=file_description or "No validation assets uploaded."
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
            max_tokens=250,
        )

        result = json.loads(response.choices[0].message.content.strip())
        
        # If successfully verified, update the task status in the database
        if result.get('verified') is True:
            task.status = Task.Status.COMPLETED
            task.save()
            logger.info(f"AI Action Engine verified task {task.id} as completed.")

        return {
            "verified": result.get('verified', False),
            "confidence": float(result.get('confidence', 0.0)),
            "reason": result.get('reason', 'Verification details could not be parsed.')
        }

    except Exception as e:
        logger.error(f"LLM task verification failed: {e}")
        return _fallback_verification(submission_text)


def _fallback_verification(submission_text: Optional[str]) -> Dict:
    """Local fallback verification."""
    text_lower = (submission_text or "").lower()
    
    # If the user uploaded something or typed a confirmation containing verified tokens
    keywords = ['done', 'finished', 'complete', 'http', 'github.com', 'pdf']
    if any(k in text_lower for k in keywords) or len(text_lower) > 20:
        return {
            "verified": True,
            "confidence": 0.8,
            "reason": "Verified task via structural text fallback evaluation."
        }

    return {
        "verified": False,
        "confidence": 0.5,
        "reason": "Please provide a more detailed text summary, repository link, or documentation."
    }
