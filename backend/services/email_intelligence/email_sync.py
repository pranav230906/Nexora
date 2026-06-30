"""
Email synchronization orchestrator. Pulls inbox list, decodes messages,
checks for duplicates, triggers AI analysis, and logs synced results.
"""
import logging
from django.utils import timezone
from apps.email_intelligence.models import SyncedEmail, GmailCredential
from . import gmail_service
from . import email_parser
from . import ai_email_analyzer
from . import entity_extractor
from . import action_generator

logger = logging.getLogger(__name__)


def synchronize_user_gmail(user) -> int:
    """
    Performs unread email synchronizations for the user.
    Returns count of new tasks generated.
    """
    try:
        # Check pause state
        cred = GmailCredential.objects.get(user=user)
        if cred.is_sync_paused:
            logger.info(f"Sync paused for user {user.email}")
            return 0
    except GmailCredential.DoesNotExist:
        return 0

    message_ids = gmail_service.fetch_unread_messages(user)
    if not message_ids:
        return 0

    new_actions_count = 0

    for msg_meta in message_ids:
        msg_id = msg_meta['id']
        thread_id = msg_meta['threadId']

        # 1. Check for duplicates
        if SyncedEmail.objects.filter(user=user, message_id=msg_id).exists():
            continue

        # 2. Fetch full email message payload detail
        detail = gmail_service.get_message_detail(user, msg_id)
        if not detail:
            continue

        # 3. Decode headers and body
        parsed = email_parser.parse_raw_message(detail)
        
        # 4. Create placeholder record to prevent duplicate downloads
        synced_record = SyncedEmail.objects.create(
            user=user,
            message_id=msg_id,
            thread_id=thread_id,
            subject=parsed['subject'],
            from_address=parsed['from'],
            received_at=timezone.now(),
            is_processed=False
        )

        # 5. AI Relevance analysis check
        analysis = ai_email_analyzer.analyze_email_relevance(
            parsed['subject'], 
            parsed['from'], 
            parsed['body']
        )

        if analysis.get('is_actionable') is True:
            # 6. Extract task details
            entities = entity_extractor.extract_action_entities(
                parsed['subject'],
                parsed['body']
            )

            # 7. Create Task & Calendar Event
            task, event_id = action_generator.generate_productivity_actions(user, entities, msg_id)
            if task:
                synced_record.task = task
                synced_record.event_id = event_id
                new_actions_count += 1

        synced_record.is_processed = True
        synced_record.save()

    return new_actions_count


def process_single_email_payload(user, message_data: dict) -> tuple:
    """
    Manually parses and extracts actions from a raw message payload object.
    Returns (Task, event_id).
    """
    parsed = email_parser.parse_raw_message(message_data)
    entities = entity_extractor.extract_action_entities(parsed['subject'], parsed['body'])
    return action_generator.generate_productivity_actions(user, entities, message_data.get('id', 'manual'))
