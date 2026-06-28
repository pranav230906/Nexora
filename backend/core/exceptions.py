from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardizes DRF error responses to a uniform payload:
    {
        "error": "Error message summary",
        "code": "error_code",
        "details": {} # Optional sub-field validations
    }
    """
    # Call DRF's default exception handler first to get the standard response
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'error': exc.__class__.__name__,
            'code': getattr(exc, 'default_code', 'error'),
            'details': response.data
        }
        response.data = custom_data
    else:
        # Catch unhandled exceptions (e.g. database connection drop, zero division)
        logger.error(f'Unhandled Exception: {str(exc)}', exc_info=True)
        response = Response(
            {
                'error': 'InternalServerError',
                'code': 'server_error',
                'details': 'An unexpected error occurred on the server.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
