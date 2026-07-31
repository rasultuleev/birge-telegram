from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.apps import apps

User = get_user_model()

class Command(BaseCommand):
    help = 'Создаёт суперпользователя и назначает права организатора для ролей "organization" и "university"'

    def handle(self, *args, **options):
        # Создание суперпользователя
        admin_username = 'admin'
        admin_email = 'admin@example.com'
        admin_password = 'admin123'  # СМЕНИТЕ НА СВОЙ ПАРОЛЬ!

        if not User.objects.filter(username=admin_username).exists():
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'Суперпользователь {admin_username} создан'))
        else:
            self.stdout.write(self.style.WARNING('Суперпользователь уже существует'))

        # Назначаем права организатора для ролей organization и university
        try:
            # Ищем модель профиля (обычно она называется Profile и лежит в приложении 'birge')
            Profile = apps.get_model('birge', 'Profile')
            profiles = Profile.objects.filter(user_type__in=['organization', 'university'])
            count = 0
            for profile in profiles:
                user = profile.user
                if not user.is_staff:
                    user.is_staff = True
                    user.save()
                    count += 1
            self.stdout.write(self.style.SUCCESS(f'Назначено is_staff для {count} пользователей'))
        except LookupError:
            self.stdout.write(self.style.ERROR('Модель Profile не найдена. Убедитесь, что приложение называется "birge" и модель Profile существует.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка: {e}'))
