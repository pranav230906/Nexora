from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Disable password validators length constraints in development for speed
AUTH_PASSWORD_VALIDATORS = []

# Use local memory cache in development to avoid local Redis server dependency
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'life-saver-dev-cache',
    }
}
