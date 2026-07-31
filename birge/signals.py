from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps

@receiver(post_save, sender='birge.Profile')
def set_organizer_rights(sender, instance, created, **kwargs):
    """
    Автоматически назначает is_staff=True для пользователей с ролью organization или university.
    """
    user = instance.user
    if instance.user_type in ['organization', 'university']:
        if not user.is_staff:
            user.is_staff = True
            user.save()
            print(f'Права организатора назначены пользователю {user.phone}')
    else:
        # Если роль сменили на другую, можно убрать права (опционально)
        if user.is_staff:
            # Проверим, есть ли у пользователя другие профили с ролью организатора?
            # Проще всего оставить права, но если хотите отзывать - раскомментируйте:
            # user.is_staff = False
            # user.save()
            pass
