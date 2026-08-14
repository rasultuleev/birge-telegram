import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birge_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Создаём суперпользователя, если нет
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Суперпользователь admin создан')
else:
    print('Суперпользователь уже существует')
