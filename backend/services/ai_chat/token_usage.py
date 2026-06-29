"""
Token usage tracking for the AI Chat module.
Reuses the existing AITokenLog model from ai_assistant app.
"""
import logging
from django.db.models import Sum, Count
from apps.ai_assistant.models import AITokenLog

logger = logging.getLogger(__name__)

# Pricing per token (USD) — gpt-4o-mini defaults
PRICING = {
    'gpt-4o-mini': {'input': 0.00000015, 'output': 0.00000060},
    'gpt-4o': {'input': 0.0000025, 'output': 0.00001},
    'default': {'input': 0.00000015, 'output': 0.00000060},
}


def estimate_tokens(text: str) -> int:
    """
    Quick token estimation. Approximately 1 token per 4 characters.
    For accurate counting, use tiktoken when available.
    """
    try:
        import tiktoken
        enc = tiktoken.encoding_for_model("gpt-4o-mini")
        return len(enc.encode(text))
    except Exception:
        return max(1, len(text) // 4)


def calculate_cost(input_tokens: int, output_tokens: int, model: str = 'default') -> float:
    """Calculate USD cost for given token counts and model."""
    rates = PRICING.get(model, PRICING['default'])
    return (input_tokens * rates['input']) + (output_tokens * rates['output'])


def log_chat_usage(user, input_tokens: int, output_tokens: int, model: str = 'gpt-4o-mini') -> None:
    """
    Creates an AITokenLog entry for a chat interaction.
    """
    cost = calculate_cost(input_tokens, output_tokens, model)
    try:
        AITokenLog.objects.create(
            user=user,
            agent_name='ChatService',
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=cost,
        )
    except Exception as e:
        logger.error(f"Failed to log chat token usage: {e}")


def get_user_usage_summary(user) -> dict:
    """
    Returns aggregated token usage statistics for a user.
    """
    logs = AITokenLog.objects.filter(user=user)

    totals = logs.aggregate(
        total_input=Sum('input_tokens'),
        total_output=Sum('output_tokens'),
        total_cost=Sum('cost'),
        total_calls=Count('id'),
    )

    # Chat-specific stats
    chat_logs = logs.filter(agent_name='ChatService')
    chat_totals = chat_logs.aggregate(
        chat_input=Sum('input_tokens'),
        chat_output=Sum('output_tokens'),
        chat_cost=Sum('cost'),
        chat_calls=Count('id'),
    )

    return {
        'total': {
            'input_tokens': totals['total_input'] or 0,
            'output_tokens': totals['total_output'] or 0,
            'total_cost': float(totals['total_cost'] or 0),
            'total_calls': totals['total_calls'] or 0,
        },
        'chat': {
            'input_tokens': chat_totals['chat_input'] or 0,
            'output_tokens': chat_totals['chat_output'] or 0,
            'total_cost': float(chat_totals['chat_cost'] or 0),
            'total_calls': chat_totals['chat_calls'] or 0,
        },
    }
