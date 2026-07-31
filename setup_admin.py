import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birge.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.apps import apps
from django.db.models import Q

User = get_user_model()

print("=== Настройка администратора и прав организатора ===")

# 1. Создание суперпользователя
admin_username = 'admin'
admin_email = 'admin@example.com'
admin_password = 'admin123'

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

# 2. Назначаем is_staff для ролей organization/university через ParticipantProfile
try:
    Profile = apps.get_model('api', 'ParticipantProfile')
    profiles = Profile.objects.filter(user_type__in=['organization', 'university'])
    count = 0
    for profile in profiles:
        user = profile.user
        if not user.is_staff:
            user.is_staff = True
            user.save()
            count += 1
    print(f'Назначено is_staff для {count} пользователей через ParticipantProfile')
except Exception as e:
    print(f'Ошибка при работе с ParticipantProfile: {e}')

# 3. Явный поиск пользователя с номером (ищем во всех полях)
phone_variants = ['+996700232888', '996700232888', '700232888']
found = False
for phone in phone_variants:
    # Ищем в username, email, и в ParticipantProfile.phone (если есть)
    try:
        user = User.objects.get(Q(username=phone) | Q(email=phone))
        if not user.is_staff:
            user.is_staff = True
            user.save()
        print(f'Найден пользователь по полю username/email: {phone} -> is_staff установлен')
        found = True
        break
    except User.DoesNotExist:
        pass
    except User.MultipleObjectsReturned:
        print(f'Найдено несколько пользователей с {phone}, пропускаем')
        continue

if not found:
    # Попробуем найти через ParticipantProfile
    try:
        Profile = apps.get_model('api', 'ParticipantProfile')
        for phone in phone_variants:
            try:
                profile = Profile.objects.get(phone=phone)
                user = profile.user
                if not user.is_staff:
                    user.is_staff = True
                    user.save()
                print(f'Найден пользователь через ParticipantProfile.phone: {phone} -> is_staff установлен')
                found = True
                break
            except Profile.DoesNotExist:
                continue
    except Exception as e:
        print(f'Ошибка поиска в ParticipantProfile: {e}')

if not found:
    print('Пользователь с номером не найден. Проверьте в админке после обновления Django.')

print("=== Готово ===")
