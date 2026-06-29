import json
import os
import openai
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken

from .models import ChatSession, ChatMessage
from apps.ai_assistant.models import AITokenLog

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

        # 1. Save User Message in database
        await self.save_message(self.session_id, ChatMessage.Sender.USER, message_text)

        # 2. Fetch context memory
        history = await self.get_conversation_history(self.session_id)
        summary = await self.get_session_summary(self.session_id)

        # 3. Stream OpenAI completion
        await self.stream_ai_response(message_text, history, summary)

        # 4. Check for auto-summarization triggers (Long-term memory optimization)
        await self.trigger_auto_summarization(self.session_id)

    async def stream_ai_response(self, user_msg, history, summary):
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            # Fallback if OpenAI key is not configured
            fallback = "[AI Chatbot is in offline demo mode. Setup your OpenAI API key to start conversations.]"
            await self.send_json({"type": "chat_chunk", "chunk": fallback})
            await self.send_json({"type": "chat_done"})
            await self.save_message(self.session_id, ChatMessage.Sender.AI, fallback)
            return

        client = openai.OpenAI(api_key=api_key)
        
        # Build prompt messages
        system_prompt = "You are a helpful and energetic personal developer assistant. Respond in clear Markdown."
        if summary:
            system_prompt += f"\n\nHere is a summary of the historical conversation context so far:\n{summary}"

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            role = "user" if msg['sender'] == ChatMessage.Sender.USER else "assistant"
            messages.append({"role": role, "content": msg['content']})

        # Add current user message
        messages.append({"role": "user", "content": user_msg})

        full_response = ""
        try:
            # Execute chat completion call asynchronously via executor
            loop = asyncio.get_event_loop()
            response_stream = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    stream=True,
                    temperature=0.7
                )
            )

            for chunk in response_stream:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', '') or ''
                if content:
                    full_response += content
                    # Send token chunk directly to client
                    await self.send_json({"type": "chat_chunk", "chunk": content})

            await self.send_json({"type": "chat_done"})

            # Log estimated tokens to AITokenLog
            input_est = len(str(messages)) // 4
            output_est = len(full_response) // 4
            await self.log_ai_cost(self.user, input_est, output_est)

            # Save full AI response message to database
            await self.save_message(self.session_id, ChatMessage.Sender.AI, full_response)

        except Exception as e:
            print(f"Failed to stream response: {e}")
            error_msg = f"\n\n[Failed to stream response: {str(e)}]"
            await self.send_json({"type": "chat_chunk", "chunk": error_msg})
            await self.send_json({"type": "chat_done"})
            await self.save_message(self.session_id, ChatMessage.Sender.AI, full_response + error_msg)

    # Database operations helper wrappers
    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def verify_session_owner(self, session_id, user):
        return ChatSession.objects.filter(id=session_id, user=user).exists()

    @database_sync_to_async
    def save_message(self, session_id, sender, content):
        session = ChatSession.objects.get(id=session_id)
        ChatMessage.objects.create(session=session, sender=sender, content=content)
        # Touch session to update updated_at timestamp
        session.save()

    @database_sync_to_async
    def get_conversation_history(self, session_id):
        messages = ChatMessage.objects.filter(session_id=session_id).order_by('-created_at')[:10]
        return [{"sender": msg.sender, "content": msg.content} for msg in reversed(messages)]

    @database_sync_to_async
    def get_session_summary(self, session_id):
        return ChatSession.objects.get(id=session_id).summary

    @database_sync_to_async
    def log_ai_cost(self, user, input_tokens, output_tokens):
        # Pricing for gpt-4o-mini
        cost = (input_tokens * 0.00000015) + (output_tokens * 0.00000060)
        AITokenLog.objects.create(
            user=user,
            agent_name="ChatbotConsumer",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost
        )

    @database_sync_to_async
    def trigger_auto_summarization(self, session_id):
        """
        Long-term memory optimization: if a session contains more than 15 messages,
        we summarize the oldest 10 messages, update the summary block, and delete them.
        """
        session = ChatSession.objects.get(id=session_id)
        messages_count = session.messages.count()
        if messages_count <= 15:
            return

        # Fetch oldest 10 messages
        old_messages = session.messages.order_by('created_at')[:10]
        old_texts = [f"{msg.sender}: {msg.content}" for msg in old_messages]
        
        # Simple local summarization fallback
        summary_text = f"Summary of early thread: {', '.join(old_texts)[:300]}..."
        
        # Update summary
        if session.summary:
            session.summary = f"{session.summary}\n\n{summary_text}"
        else:
            session.summary = summary_text
        session.save()

        # Delete summarized records
        for msg in old_messages:
            msg.delete()
