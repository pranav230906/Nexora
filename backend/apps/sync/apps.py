from django.apps import AppConfig

class SyncConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sync'

    def ready(self):
        import apps.sync.signals
