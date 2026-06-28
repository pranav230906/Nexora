import uuid
import logging

logger = logging.getLogger(__name__)

class RequestIDLoggingMiddleware:
    """
    Middleware injecting a unique request-id header to log payloads for easier session tracing.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request.request_id = request_id

        response = self.get_response(request)
        response['X-Request-ID'] = request_id
        return response
