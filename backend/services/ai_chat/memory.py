"""
Conversation memory management for the AI Chat module.
Handles short-term memory (recent messages), long-term memory (summaries),
and automatic conversation compression.
"""
import os
import logging
import openai
from typing import List, Dict, Optional

from apps.ai_chatbot.models import ChatSession, ChatMessage
from . import prompts

logger = logging.getLogger(__name__)

# Maximum messages to keep in short-term memory
SHORT_TERM_LIMIT = 10
# Threshold to trigger auto-summarization
SUMMARIZATION_THRESHOLD = 15
# Number of old messages to summarize at once
SUMMARIZE_BATCH_SIZE = 10


def get_short_term_memory(session_id: int, limit: int = SHORT_TERM_LIMIT) -> List[Dict]:
    """
    Returns the last N messages from a chat session as a list of dicts.
    """
    try:
        messages = ChatMessage.objects.filter(
            session_id=session_id
        ).order_by('-created_at')[:limit]

        return [
            {'sender': msg.sender, 'content': msg.content}
            for msg in reversed(messages)
        ]
    except Exception as e:
        logger.error(f"Failed to retrieve short-term memory for session {session_id}: {e}")
        return []


def get_long_term_memory(session_id: int) -> Optional[str]:
    """
    Returns the compressed summary (long-term memory) for a chat session.
    """
    try:
        session = ChatSession.objects.get(id=session_id)
        return session.summary
    except ChatSession.DoesNotExist:
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve long-term memory for session {session_id}: {e}")
        return None


def build_message_history(session_id: int) -> List[Dict]:
    """
    Combines long-term memory (summary) and short-term memory (recent messages)
    into a list of OpenAI-compatible message dicts.
    """
    history = []

    # Inject long-term memory as a system context message
    summary = get_long_term_memory(session_id)
    if summary:
        history.append({
            'role': 'system',
            'content': f"Previous conversation summary:\n{summary}"
        })

    # Add recent messages
    recent = get_short_term_memory(session_id)
    for msg in recent:
        role = 'user' if msg['sender'] == ChatMessage.Sender.USER else 'assistant'
        history.append({'role': role, 'content': msg['content']})

    return history


def compress_and_summarize(session_id: int) -> None:
    """
    Long-term memory optimization: if a session has more than SUMMARIZATION_THRESHOLD
    messages, summarize the oldest SUMMARIZE_BATCH_SIZE messages, update the session
    summary, and delete the originals.
    """
    try:
        session = ChatSession.objects.get(id=session_id)
        messages_count = session.messages.count()

        if messages_count <= SUMMARIZATION_THRESHOLD:
            return

        # Get oldest messages to summarize
        old_messages = list(
            session.messages.order_by('created_at')[:SUMMARIZE_BATCH_SIZE]
        )
        conversation_text = "\n".join(
            f"{msg.sender}: {msg.content}" for msg in old_messages
        )

        # Try AI-powered summarization
        summary_text = _generate_summary(conversation_text)

        # Update session summary
        if session.summary:
            session.summary = f"{session.summary}\n\n{summary_text}"
        else:
            session.summary = summary_text
        session.save(update_fields=['summary'])

        # Delete summarized messages
        message_ids = [msg.id for msg in old_messages]
        ChatMessage.objects.filter(id__in=message_ids).delete()

        logger.info(
            f"Compressed {len(old_messages)} messages in session {session_id}"
        )
    except Exception as e:
        logger.error(f"Failed to compress session {session_id}: {e}")


def _generate_summary(conversation_text: str) -> str:
    """
    Uses the LLM to generate a concise summary of conversation text.
    Falls back to a simple truncation if the API is unavailable.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Fallback: simple truncation
        return f"Summary of earlier messages: {conversation_text[:500]}..."

    try:
        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url

        client = openai.OpenAI(**client_kwargs)

        prompt = prompts.SUMMARIZATION_PROMPT.format(conversation=conversation_text)

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"LLM summarization failed: {e}")
        return f"Summary of earlier messages: {conversation_text[:500]}..."
