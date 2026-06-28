import os
from celery import Celery

# Set default settings module for celery CLI
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('lifesaver')

# Load configurations from settings namespace CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically locate and register @shared_task functions inside apps
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
