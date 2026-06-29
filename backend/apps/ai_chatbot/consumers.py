"""
WebSocket consumer for real-time AI Chat streaming.
Refactored to use the new ChatService orchestrator.
"""
import json
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from .models import ChatSession, ChatMessage
from services.ai_chat.chat_service import ChatService
from services.ai_chat import memory, tool_router, token_usage, vector_store

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']

        # Extract JWT access token from query parameters
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = dict(x.split('=') for x in query_string.split('&') if '=' in x)
        token = params.get('token')

        if not token:
            await self.close(code=4001)
            return

        # Authenticate User via simple JWT
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)

            # Verify if user owns the chat session
            session_valid = await self.verify_session_owner(self.session_id, self.user)
            if not session_valid:
                await self.close(code=4003)
                return

            await self.accept()

        except Exception as e:
            print(f"WS Authentication Failed: {e}")
            await self.close(code=4002)

    async def disconnect(self, close_code):
        pass

    async def receive_json(self, content):
        message_text = content.get('message', '').strip()
        if not message_text:
            return

        # Validate message length
        if len(message_text) > 4000:
            message_text = message_text[:4000]

        # 1. Save User Message in database
        await self.save_message(self.session_id, ChatMessage.Sender.USER, message_text)

        # 2. Detect and execute tools
        tool_names = await asyncio.get_event_loop().run_in_executor(
            None, tool_router.detect_tools_needed, message_text
        )
        tool_results = {}
        tool_results_str = ""
        if tool_names:
            tool_results = await asyncio.get_event_loop().run_in_executor(
                None, tool_router.execute_tools, tool_names, self.user
            )
            tool_results_str = tool_router.format_tool_results(tool_results)
            await self.send_json({
                "type": "tool_call",
                "tools": list(tool_results.keys()),
            })

        # 3. Fetch context memory
        history = await self.get_conversation_history(self.session_id)
        summary = await self.get_session_summary(self.session_id)

        # 4. Stream AI response
        await self.stream_ai_response(message_text, history, summary, tool_results_str)

        # 5. Auto-summarization
        await asyncio.get_event_loop().run_in_executor(
            None, memory.compress_and_summarize, int(self.session_id)
        )

        # 6. Auto-title
        await self.auto_title_session(self.session_id, message_text)

    async def stream_ai_response(self, user_msg, history, summary, tool_context=""):
        import os
        import openai

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            fallback = "[AI Chatbot is in offline demo mode. Setup your OpenAI API key to start conversations.]"
            await self.send_json({"type": "chat_chunk", "chunk": fallback})
            await self.send_json({"type": "chat_done"})
            await self.save_message(self.session_id, ChatMessage.Sender.AI, fallback)
            return

        base_url = os.environ.get("OPENAI_BASE_URL")
        model = os.environ.get("AI_MODEL", "gpt-4o-mini")

        client_kwargs = {'api_key': api_key}
        if base_url:
            client_kwargs['base_url'] = base_url
        client = openai.OpenAI(**client_kwargs)

        # Build prompt
        from services.ai_chat import prompts as chat_prompts

        system_prompt = chat_prompts.CHAT_SYSTEM_PROMPT
        if summary:
            system_prompt += f"\n\nPrevious conversation summary:\n{summary}"
        if tool_context:
            system_prompt += "\n\n" + chat_prompts.TOOL_RESULTS_TEMPLATE.format(
                tool_results=tool_context
            )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            role = "user" if msg['sender'] == ChatMessage.Sender.USER else "assistant"
            messages.append({"role": role, "content": msg['content']})

        # Wrap user message for injection protection
        wrapped = chat_prompts.USER_MESSAGE_WRAPPER.format(message=user_msg)
        messages.append({"role": "user", "content": wrapped})

        full_response = ""
        try:
            loop = asyncio.get_event_loop()
            response_stream = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    temperature=0.7,
                )
            )

            for chunk in response_stream:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', '') or ''
                if content:
                    full_response += content
                    await self.send_json({"type": "chat_chunk", "chunk": content})

            await self.send_json({"type": "chat_done"})

            # Log token usage
            input_est = token_usage.estimate_tokens(str(messages))
            output_est = token_usage.estimate_tokens(full_response)
            await loop.run_in_executor(
                None,
                token_usage.log_chat_usage,
                self.user, input_est, output_est, model
            )

            # Save full AI response
            await self.save_message(self.session_id, ChatMessage.Sender.AI, full_response)

            # Index in vector store
            try:
                store = vector_store.get_user_store(self.user.id)
                await loop.run_in_executor(
                    None,
                    store.add_message,
                    full_response,
                    {'session_id': self.session_id, 'role': 'assistant'}
                )
            except Exception:
                pass

        except Exception as e:
            print(f"Failed to stream response: {e}")
            error_msg = f"\n\n[Failed to stream response: {str(e)}]"
            await self.send_json({"type": "chat_chunk", "chunk": error_msg})
            await self.send_json({"type": "chat_done"})
            await self.save_message(self.session_id, ChatMessage.Sender.AI, full_response + error_msg)

    # Database operations
    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def verify_session_owner(self, session_id, user):
        return ChatSession.objects.filter(id=session_id, user=user).exists()

    @database_sync_to_async
    def save_message(self, session_id, sender, content):
        session = ChatSession.objects.get(id=session_id)
        ChatMessage.objects.create(
            session=session,
            sender=sender,
            content=content,
            token_count=token_usage.estimate_tokens(content),
        )
        session.save()

    @database_sync_to_async
    def get_conversation_history(self, session_id):
        messages = ChatMessage.objects.filter(session_id=session_id).order_by('-created_at')[:10]
        return [{"sender": msg.sender, "content": msg.content} for msg in reversed(messages)]

    @database_sync_to_async
    def get_session_summary(self, session_id):
        return ChatSession.objects.get(id=session_id).summary

    @database_sync_to_async
    def auto_title_session(self, session_id, message):
        session = ChatSession.objects.get(id=session_id)
        if session.title == 'New Chat' and message:
            session.title = message[:50] + ('...' if len(message) > 50 else '')
            session.save(update_fields=['title'])
