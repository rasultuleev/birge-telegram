import re
import requests
from django.conf import settings
from .models import ParticipantProfile

TELEGRAM_TOKEN = settings.TELEGRAM_BOT_TOKEN

def send_telegram_message(chat_id, text):
    if not chat_id:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    try:
        response = requests.post(url, json={'chat_id': chat_id, 'text': text})
        if response.status_code != 200:
            print(f"❌ Ошибка Telegram: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка отправки в Telegram: {e}")

def handle_telegram_message(data):
    message = data.get('message')
    if not message:
        return

    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '').strip()

    if not chat_id or not text:
        return

    # Обработка команды /start с номером телефона (глубокая ссылка)
    if text.startswith('/start phone_'):
        # Извлекаем номер: /start phone_+996700123456
        phone = text.replace('/start phone_', '').strip()
        try:
            profile = ParticipantProfile.objects.get(phone=phone)
            profile.telegram_chat_id = str(chat_id)
            profile.save()
            send_telegram_message(chat_id, f"✅ Ваш номер {phone} успешно привязан! Теперь вернитесь в приложение и введите код.")
        except ParticipantProfile.DoesNotExist:
            send_telegram_message(chat_id, f"❌ Номер {phone} не найден в системе. Сначала зарегистрируйтесь в приложении.")
        return

    # Обычный /start (без номера)
    if text.startswith('/start'):
        send_telegram_message(chat_id, "Привет! Для привязки номера откройте приложение и нажмите кнопку «Привязать Telegram», либо введите номер вручную в формате +996XXXXXXXXX.")
        return

    # Если пользователь вводит номер вручную (для отладки)
    if re.match(r'^\+996\d{9}$', text):
        phone = text.strip()
        try:
            profile = ParticipantProfile.objects.get(phone=phone)
            profile.telegram_chat_id = str(chat_id)
            profile.save()
            send_telegram_message(chat_id, f"✅ Ваш номер {phone} успешно привязан! Теперь войдите в приложение.")
        except ParticipantProfile.DoesNotExist:
            send_telegram_message(chat_id, f"❌ Номер {phone} не найден в системе. Сначала зарегистрируйтесь в приложении.")
        return

    # Любое другое сообщение
    send_telegram_message(chat_id, "Для привязки номера используйте кнопку в приложении или введите номер в формате +996XXXXXXXXX.")