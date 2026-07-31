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

# Назначаем is_staff для ролей organization/university через ParticipantProfile (приложение api)
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
except LookupError:
    print('Модель api.ParticipantProfile не найдена')
except Exception as e:
    print(f'Ошибка при работе с ParticipantProfile: {e}')

# Явное назначение для вашего номера: ищем в username, email, и в профиле
phone_variants = ['+996700232888', '996700232888', '700232888']
found = False
# Поиск в User (username и email)
for field in ['username', 'email']:
    for value in phone_variants:
        try:
            kwargs = {field: value}
            user = User.objects.get(**kwargs)
            if not user.is_staff:
                user.is_staff = True
                user.save()
                print(f'Пользователю {value} (поле {field}) назначен is_staff')
                found = True
                break
        except User.DoesNotExist:
            continue
    if found:
        break

# Если не нашли в User, ищем в ParticipantProfile
if not found:
    try:
        Profile = apps.get_model('api', 'ParticipantProfile')
        for phone in phone_variants:
            try:
                profile = Profile.objects.get(phone=phone)
                user = profile.user
                if not user.is_staff:
                    user.is_staff = True
                    user.save()
                    print(f'Пользователю {phone} (из ParticipantProfile) назначен is_staff')
                    found = True
                    break
            except Profile.DoesNotExist:
                continue
    except Exception as e:
        print(f'Ошибка при поиске в ParticipantProfile: {e}')

if not found:
    print('Пользователь с номером не найден ни в одном поле. Проверьте в админке.')

print("=== Готово ===")
