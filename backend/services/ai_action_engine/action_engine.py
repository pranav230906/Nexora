"""
Main orchestrator for the AI Action Engine.
Connects STT, intent classification, task extraction, scheduling, and notifications.
"""
import logging
from typing import Dict, Tuple, Optional

from apps.tasks.models import Task
from . import voice_processor
from . import intent_detector
from . import task_extractor
from . import scheduler
from . import completion_verifier
from . import planner
from . import accountability_service

logger = logging.getLogger(__name__)


class ActionEngine:
    """
    Exposes top-level functions for parsing voice/text commands, verifying completions,
    and triggering replanning.
    """

    @staticmethod
    def process_raw_input(user, text: Optional[str] = None, audio_file_path: Optional[str] = None) -> Dict:
        """
        Executes Voice/Text Input -> STT -> Intent Classification -> Task/Entity Extraction -> Calendar Scheduling.
        """
        # 1. Speech-to-Text if audio uploaded
        raw_text = ""
        if audio_file_path:
            try:
                raw_text = voice_processor.transcribe_voice_file(audio_file_path)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to transcribe audio: {e}"
                }
        else:
            raw_text = (text or "").strip()

        if not raw_text:
            return {
                "success": False,
                "error": "No input text or voice file provided."
            }

        # 2. Intent Detection
        intent_data = intent_detector.detect_intent(raw_text)
        intent = intent_data["intent"]

        # 3. Route based on Intent
        if intent == "CREATE_TASK":
            task, follow_up = task_extractor.extract_and_create_task(user, raw_text)
            if follow_up:
                return {
                    "success": True,
                    "intent": intent,
                    "requires_follow_up": True,
                    "response": follow_up
                }

            # 4. Schedule Calendar
            calendar_synced = False
            if task:
                calendar_synced = scheduler.schedule_task_on_calendar(user, task)

            return {
                "success": True,
                "intent": intent,
                "requires_follow_up": False,
                "task_id": task.id if task else None,
                "task_title": task.title if task else None,
                "calendar_synced": calendar_synced,
                "response": f"Successfully created and scheduled task: '{task.title}'."
            }

        elif intent == "COMPLETE_TASK":
            # Attempt to verify or find what task they refer to
            # (In a real app we lookup task title in text, let's look up their most recent active task)
            recent_task = Task.active_objects.filter(user=user, status__in=['TODO', 'IN_PROGRESS']).order_by('-created_at').first()
            if not recent_task:
                return {
                    "success": True,
                    "intent": intent,
                    "response": "You don't have any active tasks to mark complete!"
                }

            verification = completion_verifier.verify_task_completion(recent_task, submission_text=raw_text)
            if verification["verified"]:
                return {
                    "success": True,
                    "intent": intent,
                    "task_id": recent_task.id,
                    "verified": True,
                    "response": f"Verification successful! Marked '{recent_task.title}' as completed. Reason: {verification['reason']}"
                }
            else:
                return {
                    "success": True,
                    "intent": intent,
                    "task_id": recent_task.id,
                    "verified": False,
                    "response": f"I couldn't verify completion of '{recent_task.title}'. Reason: {verification['reason']}"
                }

        elif intent == "PLANNING":
            blocks = planner.generate_daily_schedule(user)
            return {
                "success": True,
                "intent": intent,
                "schedule": blocks,
                "response": "I've structured a daily timeline for your active tasks. Review your focus slot allocations!"
            }

        else:
            # GENERAL_CONVERSATION
            motivation = accountability_service.generate_accountability_message(user, "MIDDAY_CHECKIN")
            return {
                "success": True,
                "intent": intent,
                "response": motivation["message"]
            }
