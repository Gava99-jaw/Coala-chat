from datetime import datetime
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

# Токен бота
TOKEN = "8597242816:AAE-InRA0Tk1DoRRcG0TEvebL76-r0m5XB8"

# Словарь для хранения времени последнего сообщения пользователя
user_last_message = {}

async def track_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отслеживает кто и когда написал сообщение"""
    
    user = update.effective_user
    chat = update.effective_chat
    message_time = datetime.now()
    
    # Получаем информацию о пользователе
    user_id = user.id
    username = user.username or f"{user.first_name or ''} {user.last_name or ''}".strip() or "Без имени"
    
    # Форматируем время
    time_str = message_time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Проверяем, писал ли пользователь раньше
    if user_id in user_last_message:
        last_time = user_last_message[user_id]
        time_diff = (message_time - last_time).total_seconds()
        print(f"⏱️ Пользователь @{username} (ID: {user_id}) пишет снова через {time_diff:.1f} сек")
    else:
        print(f"🆕 Первое сообщение от @{username} (ID: {user_id})")
    
    # Запоминаем время
    user_last_message[user_id] = message_time
    
    # Выводим основную информацию
    print(f"📨 Сообщение от: @{username}")
    print(f"🆔 ID: {user_id}")
    print(f"💬 Чат: {chat.title if chat.title else chat.effective_name}")
    print(f"⏰ Время: {time_str}")
    print("-" * 40)

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    print(f"❌ Ошибка: {context.error}")

def main():
    """Запуск бота"""
    # Создаем приложение
    app = Application.builder().token(TOKEN).build()
    
    # Добавляем обработчик всех сообщений
    app.add_handler(MessageHandler(filters.ALL, track_message))
    
    # Добавляем обработчик ошибок
    app.add_error_handler(error_handler)
    
    print("🤖 Бот запущен и следит за сообщениями...")
    print("Нажми Ctrl+C для остановки")
    
    # Запускаем бота
    app.run_polling()

if __name__ == "__main__":
    main()
