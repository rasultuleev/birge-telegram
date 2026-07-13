import requests
from django.conf import settings
from .models import ParticipantProfile

TELEGRAM_TOKEN = settings.TELEGRAM_BOT_TOKEN

def send_telegram_message(chat_id, text):
    """Отправляет сообщение в Telegram"""
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
    """Обрабатывает входящее сообщение от Telegram"""
    message = data.get('message')
    if not message:
        return

    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '').strip()

    if not chat_id or not text:
        return

    if text.startswith('/start'):
        send_telegram_message(chat_id, "Привет! Введите ваш номер телефона в формате +996XXXXXXXXX для привязки.")
        return

    # Если пользователь ввёл номер телефона
    if text.startswith('+996') and len(text) >= 12:
        phone = text.strip()
        try:
            profile = ParticipantProfile.objects.get(phone=phone)
            profile.telegram_chat_id = str(chat_id)
            profile.save()
            send_telegram_message(chat_id, f"✅ Ваш номер {phone} успешно привязан! Теперь вы будете получать коды подтверждения в Telegram.")
        except ParticipantProfile.DoesNotExist:
            send_telegram_message(chat_id, f"❌ Номер {phone} не найден в системе. Сначала зарегистрируйтесь в приложении.")
        return

    send_telegram_message(chat_id, "❌ Я не понял. Для привязки номера отправьте /start, затем введите номер телефона в формате +996XXXXXXXXX.")