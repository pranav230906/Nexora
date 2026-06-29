"""
SSE (Server-Sent Events) streaming utilities for the AI Chat module.
Provides a Django StreamingHttpResponse wrapper for real-time AI responses.
"""
import json
import logging

from django.http import StreamingHttpResponse

logger = logging.getLogger(__name__)


def format_sse_event(data: dict, event_type: str = 'message') -> str:
    """
    Format a single SSE event.
    Returns a string with proper SSE formatting (event: + data: lines).
    """
    lines = []
    if event_type != 'message':
        lines.append(f"event: {event_type}")
    lines.append(f"data: {json.dumps(data)}")
    lines.append("")  # Blank line to terminate event
    return "\n".join(lines) + "\n"


def sse_stream_response(event_generator):
    """
    Wraps a generator that yields SSE-formatted strings into a
    Django StreamingHttpResponse with proper headers.
    """
    response = StreamingHttpResponse(
        event_generator,
        content_type='text/event-stream',
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    response['Connection'] = 'keep-alive'
    return response
