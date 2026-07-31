"""
WSGI config for birge project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'birge.settings')

application = get_wsgi_application()

# Вызов ensure_admin при старте wsgi
try:
    from django.core.management import call_command
    call_command('ensure_admin')
except Exception as e:
    print(f'Error ensuring admin: {e}')

# Вызов ensure_admin при старте wsgi
try:
    from django.core.management import call_command
    call_command('ensure_admin')
except Exception as e:
    print(f'Error ensuring admin: {e}')
