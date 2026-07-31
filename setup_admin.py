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
    print(f'Назначено is_staff для {count} пользователей через ParticipantProfile (по user_type)')
except Exception as e:
    print(f'Ошибка при работе с ParticipantProfile: {e}')

# 3. Поиск пользователя по номеру в ParticipantProfile.phone (ищем по частичному совпадению)
phone_contains = '700232888'
found = False

try:
    Profile = apps.get_model('api', 'ParticipantProfile')
    profiles = Profile.objects.filter(phone__icontains=phone_contains)
    if profiles.exists():
        for profile in profiles:
            user = profile.user
            if not user.is_staff:
                user.is_staff = True
                user.save()
            print(f'Найден пользователь через ParticipantProfile.phone (содержит "{phone_contains}"): username={user.username}, phone={profile.phone} -> is_staff установлен')
            found = True
    else:
        print(f'В ParticipantProfile.phone не найден пользователь с номером, содержащим "{phone_contains}"')
except Exception as e:
    print(f'Ошибка поиска в ParticipantProfile.phone: {e}')

# 4. Дополнительно поищем в User.username и User.email (на всякий случай)
if not found:
    users = User.objects.filter(Q(username__icontains=phone_contains) | Q(email__icontains=phone_contains))
    if users.exists():
        for user in users:
            if not user.is_staff:
                user.is_staff = True
                user.save()
            print(f'Найден пользователь в User: username="{user.username}", email="{user.email}" -> is_staff установлен')
            found = True

if not found:
    print('Пользователь с номером не найден. Проверьте в админке после обновления Django.')

print("=== Готово ===")
