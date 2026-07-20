import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birge.settings')
app = Celery('birge')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()