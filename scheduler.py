import asyncio
import logging
from aiogram import Bot
from aiogram.exceptions import TelegramAPIError
from database import get_due_messages, mark_message_status

logger = logging.getLogger(__name__)

async def start_scheduler(bot: Bot, check_interval: int = 5):
    logger.info("Scheduler started.")
    while True:
        try:
            due_messages = get_due_messages()
            for msg in due_messages:
                msg_id = msg["id"]
                from_user_id = msg["from_user_id"]
                target_name = msg["target_name"] or "Ruslan"
                target_chat_id = msg["target_chat_id"]
                text = msg["message_text"]

                try:
                    # Send message to target
                    await bot.send_message(
                        chat_id=target_chat_id,
                        text=f"📩 Sizga xabar keldi:\n\n{text}"
                    )
                    mark_message_status(msg_id, "SENT")
                    logger.info(f"Message {msg_id} sent to target {target_chat_id}")

                    # Notify sender if sender is different from target
                    if from_user_id and from_user_id != target_chat_id:
                        try:
                            await bot.send_message(
                                chat_id=from_user_id,
                                text=f"✅ Rejalashtirilgan xabar {target_name}ga muvaffaqiyatli yetkazildi:\n\n<i>\"{text}\"</i>",
                                parse_mode="HTML"
                            )
                        except TelegramAPIError:
                            pass

                except TelegramAPIError as e:
                    logger.error(f"Failed to send scheduled message {msg_id} to {target_chat_id}: {e}")
                    mark_message_status(msg_id, "FAILED")
                    if from_user_id:
                        try:
                            await bot.send_message(
                                chat_id=from_user_id,
                                text=f"⚠️ {target_name}ga rejalashtirilgan xabarni yuborib bo'lmadi.\nSababi: {e.message}"
                            )
                        except TelegramAPIError:
                            pass

        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")

        await asyncio.sleep(check_interval)
