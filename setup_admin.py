import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birge.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.apps import apps

User = get_user_model()

print("=== Настройка администратора и прав организатора ===")

# Создание суперпользователя
admin_username = 'admin'
admin_email = 'admin@example.com'
admin_password = 'admin123'  # Смените при необходимости

if not User.objects.filter(username=admin_username).exists():
    User.objects.create_superuser(
        username=admin_username,
        email=admin_email,
        password=admin_password,
        is_staff=True,
        is_superuser=True
    )
    print(f'Суперпользователь {admin_username} создан')
else:
    print(f'Суперпользователь {admin_username} уже существует')

# Назначаем is_staff для ролей organization и university (через профиль)
try:
    Profile = apps.get_model('birge', 'Profile')
    profiles = Profile.objects.filter(user_type__in=['organization', 'university'])
    count = 0
    for profile in profiles:
        user = profile.user
        if not user.is_staff:
            user.is_staff = True
            user.save()
            count += 1
    print(f'Назначено is_staff для {count} пользователей через профиль')
except LookupError:
    print('Модель Profile не найдена, пропускаем')

# Прямое назначение для вашего номера телефона (гарантия)
phone_number = '+996700232888'
try:
    user = User.objects.get(phone=phone_number)
    if not user.is_staff:
        user.is_staff = True
        user.save()
        print(f'Пользователю {phone_number} принудительно назначен is_staff')
    else:
        print(f'Пользователь {phone_number} уже организатор')
except User.DoesNotExist:
    print(f'Пользователь с номером {phone_number} не найден')
except Exception as e:
    print(f'Ошибка при поиске пользователя: {e}')

print("=== Готово ===")
