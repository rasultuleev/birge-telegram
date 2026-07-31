from django.apps import AppConfig

class BirgeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'birge'

    def ready(self):
        import birge.signals  # Подключаем сигналы
