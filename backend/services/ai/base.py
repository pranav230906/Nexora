import os
import time
import openai
from django.conf import settings
from apps.ai_assistant.models import AITokenLog

class BaseAIAgent:
    """
    Base class for all AI agents, managing the OpenAI client,
    token usage tracking, cost calculations, and retry logic.
    """
    def __init__(self, system_prompt, model="gpt-4o-mini"):
        self.system_prompt = system_prompt
        # Read model from environment or fallback to default
        self.model = os.environ.get("AI_MODEL", model)
        self.api_key = os.environ.get("OPENAI_API_KEY")
        
        # Initialize OpenAI client (supports OpenAI-compatible custom base URLs)
        if self.api_key:
            base_url = os.environ.get("OPENAI_BASE_URL")
            if base_url:
                self.client = openai.OpenAI(api_key=self.api_key, base_url=base_url)
            else:
                self.client = openai.OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def calculate_cost(self, input_tokens, output_tokens):
        """
        Calculates approximate pricing cost in USD for model token usage.
        Pricing for gpt-4o-mini:
        - Input: $0.15 / 1M tokens ($0.00000015 per token)
        - Output: $0.60 / 1M tokens ($0.00000060 per token)
        """
        input_rate = 0.00000015
        output_rate = 0.00000060
        return (input_tokens * input_rate) + (output_tokens * output_rate)

    def log_token_usage(self, user, agent_name, input_tokens, output_tokens):
        """
        Saves token counts and computed USD cost to the AITokenLog table.
        """
        cost = self.calculate_cost(input_tokens, output_tokens)
        try:
            AITokenLog.objects.create(
                user=user,
                agent_name=agent_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=cost
            )
        except Exception as e:
            print(f"Failed to log AI token usage: {e}")

    def call_llm(self, user, user_message, max_retries=3, fallback_response="[AI Assistant is temporarily unavailable. Please try again later.]"):
        """
        Executes a chat completion call with retry loops and exponential backoff.
        Returns response content string.
        """
        if not self.client:
            return fallback_response

        agent_name = self.__class__.__name__
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_message}
        ]

        attempt = 0
        backoff = 1.0

        while attempt < max_retries:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7
                )
                
                # Extract token usage metadata
                usage = response.usage
                input_tokens = usage.prompt_tokens
                output_tokens = usage.completion_tokens
                
                # Log usage inside DB log
                if user and not user.is_anonymous:
                    self.log_token_usage(user, agent_name, input_tokens, output_tokens)

                return response.choices[0].message.content.strip()

            except Exception as e:
                attempt += 1
                print(f"AI call failed (Attempt {attempt}/{max_retries}) for agent {agent_name}: {e}")
                
                # Write to secrets/ai_error.txt for debugging
                try:
                    os.makedirs('secrets', exist_ok=True)
                    with open('secrets/ai_error.txt', 'w') as f:
                        f.write(f"Agent: {agent_name}\nError: {str(e)}\n")
                except Exception:
                    pass

                if attempt == max_retries:
                    break
                time.sleep(backoff)
                backoff *= 2.0

        return fallback_response
