from celery import shared_task
import requests
from django.conf import settings
from django.core.mail import send_mail  # если вдруг понадобится, но мы не используем

@shared_task
def send_telegram_code(chat_id, code):
    token = settings.TELEGRAM_BOT_TOKEN
    if not token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        response = requests.post(url, json={
            'chat_id': chat_id,
            'text': f"🔐 Ваш код подтверждения Birge: {code}",
        })
        if response.status_code != 200:
            print(f"❌ Ошибка Telegram: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка отправки в Telegram: {e}")