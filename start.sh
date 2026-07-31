#!/bin/bash
# Выполняем скрипт обеспечения администратора
python manage.py ensure_admin

# Запускаем Celery (в фоне) и Gunicorn (на переднем плане)
celery -A birge worker -l info --concurrency=1 &
gunicorn birge.wsgi:application --bind 0.0.0.0:$PORT --timeout 120
