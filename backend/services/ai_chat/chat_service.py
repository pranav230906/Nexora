"""
ChatService — the main orchestrator for the Nexora AI Chat module.
Single entry point for sending messages, streaming responses, and managing context.
"""
import os
import logging
import openai
from typing import Generator, Optional, Dict

from apps.ai_chatbot.models import ChatSession, ChatMessage
from . import prompts
from . import memory
from . import tool_router
from . import token_usage
from . import vector_store
from .streaming import format_sse_event

logger = logging.getLogger(__name__)

# Security limits
MAX_MESSAGE_LENGTH = 4000
MAX_CONTEXT_TOKENS = 8000
OPENAI_TIMEOUT = 30


class ChatService:
    """
    Orchestrates the complete AI chat flow:
    1. Save user message
    2. Detect tool calls
    3. Execute tools and gather context
    4. Retrieve conversation memory
    5. Search relevant past conversations
    6. Build final prompt
    7. Call LLM (streaming or non-streaming)
    8. Save AI response
    9. Index in vector store
    10. Track token usage
    11. Trigger auto-summarization
    """

    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.base_url = os.environ.get("OPENAI_BASE_URL")
        self.model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {}
        if self.api_key:
            client_kwargs['api_key'] = self.api_key
            if self.base_url:
                client_kwargs['base_url'] = self.base_url
            self.client = openai.OpenAI(**client_kwargs)
        else:
            self.client = None

    def _validate_message(self, message: str) -> str:
        """Validate and sanitize user message."""
        message = message.strip()
        if not message:
            raise ValueError("Message cannot be empty.")
        if len(message) > MAX_MESSAGE_LENGTH:
            message = message[:MAX_MESSAGE_LENGTH]
            logger.warning("User message truncated to max length.")
        return message

    def _build_messages(
        self,
        user,
        session_id: int,
        user_message: str,
        tool_results_str: str = "",
        search_results_str: str = "",
    ) -> list:
        """
        Build the complete messages array for the OpenAI API call.
        """
        messages = []

        # 1. System prompt
        system_content = prompts.CHAT_SYSTEM_PROMPT

        # 2. Inject tool results as context
        if tool_results_str:
            system_content += "\n\n" + prompts.TOOL_RESULTS_TEMPLATE.format(
                tool_results=tool_results_str
            )

        # 3. Inject semantic search results
        if search_results_str:
            system_content += "\n\n" + prompts.SEMANTIC_SEARCH_TEMPLATE.format(
                search_results=search_results_str
            )

        messages.append({"role": "system", "content": system_content})

        # 4. Conversation history (long-term + short-term memory)
        history = memory.build_message_history(session_id)
        messages.extend(history)

        # 5. Current user message (wrapped for injection protection)
        wrapped_message = prompts.USER_MESSAGE_WRAPPER.format(message=user_message)
        messages.append({"role": "user", "content": wrapped_message})

        return messages

    def send_message(self, user, session_id: int, message: str) -> Dict:
        """
        Non-streaming message handler. Returns the complete AI response.
        """
        message = self._validate_message(message)

        # Save user message
        session = ChatSession.objects.get(id=session_id, user=user)
        ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.USER,
            content=message,
        )
        session.save()  # Touch updated_at

        # Detect and execute tools
        tool_names = tool_router.detect_tools_needed(message)
        tool_results = {}
        tool_results_str = ""
        if tool_names:
            tool_results = tool_router.execute_tools(tool_names, user)
            tool_results_str = tool_router.format_tool_results(tool_results)

        # Semantic search for relevant past conversations
        search_results_str = ""
        try:
            store = vector_store.get_user_store(user.id)
            search_results = store.search(message, top_k=3)
            if search_results:
                search_results_str = "\n".join(
                    f"- {r['text']}" for r in search_results if r.get('text')
                )
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")

        # Build messages
        messages = self._build_messages(
            user, session_id, message, tool_results_str, search_results_str
        )

        # Call LLM
        if not self.client:
            ai_response = "[AI Chat is in offline mode. Configure your OPENAI_API_KEY to enable responses.]"
        else:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                    timeout=OPENAI_TIMEOUT,
                )
                ai_response = response.choices[0].message.content.strip()

                # Track token usage
                if response.usage:
                    token_usage.log_chat_usage(
                        user,
                        response.usage.prompt_tokens,
                        response.usage.completion_tokens,
                        self.model,
                    )
            except Exception as e:
                logger.error(f"LLM call failed: {e}")
                ai_response = f"[AI temporarily unavailable. Error: {str(e)[:100]}]"

        # Save AI response
        ai_msg = ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.AI,
            content=ai_response,
            tool_calls=tool_results if tool_results else None,
            token_count=token_usage.estimate_tokens(ai_response),
        )
        session.save()

        # Index in vector store (background-safe)
        try:
            store = vector_store.get_user_store(user.id)
            store.add_message(message, {'session_id': session_id, 'role': 'user'})
            store.add_message(ai_response, {'session_id': session_id, 'role': 'assistant'})
        except Exception as e:
            logger.error(f"Vector indexing failed: {e}")

        # Auto-summarization check
        memory.compress_and_summarize(session_id)

        # Auto-title if session is still "New Chat"
        if session.title == 'New Chat' and message:
            session.title = message[:50] + ('...' if len(message) > 50 else '')
            session.save(update_fields=['title'])

        return {
            'id': ai_msg.id,
            'sender': 'AI',
            'content': ai_response,
            'tool_calls': list(tool_results.keys()) if tool_results else [],
            'created_at': ai_msg.created_at.isoformat(),
        }

    def stream_message(self, user, session_id: int, message: str) -> Generator[str, None, None]:
        """
        Streaming message handler. Yields SSE-formatted events.
        """
        message = self._validate_message(message)

        # Save user message
        session = ChatSession.objects.get(id=session_id, user=user)
        ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.USER,
            content=message,
        )
        session.save()

        # Detect and execute tools
        tool_names = tool_router.detect_tools_needed(message)
        tool_results = {}
        tool_results_str = ""
        if tool_names:
            tool_results = tool_router.execute_tools(tool_names, user)
            tool_results_str = tool_router.format_tool_results(tool_results)
            # Emit tool call event
            yield format_sse_event(
                {'tools': list(tool_results.keys())},
                event_type='tool_call'
            )

        # Semantic search
        search_results_str = ""
        try:
            store = vector_store.get_user_store(user.id)
            search_results = store.search(message, top_k=3)
            if search_results:
                search_results_str = "\n".join(
                    f"- {r['text']}" for r in search_results if r.get('text')
                )
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")

        # Build messages
        messages = self._build_messages(
            user, session_id, message, tool_results_str, search_results_str
        )

        # Stream LLM response
        full_response = ""

        if not self.client:
            fallback = "[AI Chat is in offline mode. Configure your OPENAI_API_KEY.]"
            yield format_sse_event({'chunk': fallback}, event_type='chunk')
            full_response = fallback
        else:
            try:
                response_stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                    timeout=OPENAI_TIMEOUT,
                )

                for chunk in response_stream:
                    delta = chunk.choices[0].delta
                    content = getattr(delta, 'content', '') or ''
                    if content:
                        full_response += content
                        yield format_sse_event({'chunk': content}, event_type='chunk')

                # Track token usage (estimated for streaming)
                input_est = token_usage.estimate_tokens(str(messages))
                output_est = token_usage.estimate_tokens(full_response)
                token_usage.log_chat_usage(user, input_est, output_est, self.model)

            except Exception as e:
                logger.error(f"Streaming LLM call failed: {e}")
                error_msg = f"[Streaming error: {str(e)[:100]}]"
                yield format_sse_event({'chunk': error_msg}, event_type='chunk')
                full_response += error_msg

        # Save AI response
        ChatMessage.objects.create(
            session=session,
            sender=ChatMessage.Sender.AI,
            content=full_response,
            tool_calls=tool_results if tool_results else None,
            token_count=token_usage.estimate_tokens(full_response),
        )
        session.save()

        # Emit done event
        yield format_sse_event({'status': 'complete'}, event_type='done')

        # Index in vector store
        try:
            store = vector_store.get_user_store(user.id)
            store.add_message(message, {'session_id': session_id, 'role': 'user'})
            store.add_message(full_response, {'session_id': session_id, 'role': 'assistant'})
        except Exception as e:
            logger.error(f"Vector indexing failed: {e}")

        # Auto-summarization
        memory.compress_and_summarize(session_id)

        # Auto-title
        if session.title == 'New Chat' and message:
            session.title = message[:50] + ('...' if len(message) > 50 else '')
            session.save(update_fields=['title'])
