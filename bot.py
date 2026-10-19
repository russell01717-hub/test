import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, BufferedInputFile

from config import TELEGRAM_BOT_TOKEN, get_now
from database import (
    init_db, register_user, set_ruslan, get_ruslan_chat_id,
    find_target_chat_id, add_scheduled_message, get_pending_messages,
    cancel_scheduled_message, get_connection, clear_chat_history
)
from gemini_client import process_user_message
from scheduler import start_scheduler
from userbot_client import (
    is_userbot_ready, get_user_me, send_message_from_my_account,
    start_login_process, complete_login_code, complete_login_password,
    start_qr_login, wait_for_qr_login
)

# Setup Logging to both console and bot.log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bot.log", encoding="utf-8")
    ]
)
logger = logging.getLogger(__name__)

bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user = message.from_user
    register_user(user.id, user.username or "", user.first_name or "")
    
    userbot_status = "🔴 Ulanmagan (/qr yoki /login)"
    if await is_userbot_ready():
        me = await get_user_me()
        userbot_status = f"🟢 Ulangan ({me.first_name})"

    welcome_text = (
        f"Salom, <b>{user.first_name}</b> jigar! 👋 Qalesan brat?\n\n"
        f"Man sani doim kayfiyatingni ko'tarib, xizmatingda bo'ladigan eng yaqin do'stingman! 😎⚡️\n\n"
        f"🚀 <b>Nimalar qila olamiz, brat?</b>\n\n"
        f"1️⃣ <b>Kayfiyatni ko'taradigan zo'r suhbat:</b>\n"
        f"   Menga istalgan narsani yoz — zerikmaysan, doimo kayfiyat 100% bo'ladi! 💥\n"
        f"   • «nma gap jigar»\n"
        f"   • «zerikvomman bitta latifa ayt»\n"
        f"   • «kayfiyat nol nma qilsam bo'ladi»\n\n"
        f"2️⃣ <b>Shaxsiy Telegramingdan kontaktlaringga xabar yozish (Userbot):</b>\n"
        f"   • «kontaktimdagi Parvizga biror motivatsion gap yoz»\n"
        f"   • «Parvizga salom deb yoz mani nomimdan»\n\n"
        f"3️⃣ <b>Rejalashtirish va bot orqali yozish:</b>\n"
        f"   • «Ruslanga soat 19:00 da qanday yaxshimisan deb yoz»\n"
        f"   • «15 daqiqadan keyin eslatma yubor»\n\n"
        f"⚙️ <b>Buyruqlar:</b>\n"
        f"• <code>/qr</code> - QR kod bilan shaxsiy hisobni ulash\n"
        f"• <code>/userbot</code> - Shaxsiy hisob holati: <b>{userbot_status}</b>\n"
        f"• <code>/clear</code> - Yangidan boshlash (xotirani tozalash)\n"
        f"• <code>/list</code> - Rejadagi xabarlar\n\n"
        f"<i>Xo'sh jigar, nima yangiliklar o'zingda? Gapir brat!</i> 😉👊"
    )
    await message.answer(welcome_text, parse_mode="HTML")

@dp.message(Command("my_id"))
async def cmd_my_id(message: types.Message):
    await message.answer(
        f"🆔 Sizning Telegram ID: <code>{message.from_user.id}</code>\n"
        f"👤 Ism: {message.from_user.first_name}\n"
        f"🔗 Username: @{message.from_user.username or 'yo‘q'}",
        parse_mode="HTML"
    )

# --- QR CODE LOGIN ---
@dp.message(Command("qr"))
async def cmd_qr(message: types.Message):
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    res = await start_qr_login(message.from_user.id)

    if res["status"] == "already_authorized":
        await message.answer(
            f"✅ <b>Boshliq, siz allaqachon ulangansiz!</b>\n"
            f"👤 Ism: {res['name']}\n"
            f"Endi bemalol «kontaktimdagi Parvizga motivatsion gap yoz» deb buyruq berishingiz mumkin!",
            parse_mode="HTML"
        )
        return

    if res["status"] == "qr_generated":
        photo = BufferedInputFile(res["qr_bytes"], filename="qr_login.png")
        caption = (
            "📷 <b>JARVIS - QR KOD ORQALI TEZKOR ULASH</b>\n\n"
            "SMS yoki kod kutish shart emas! Quyidagilarni bajaring:\n\n"
            "1️⃣ Telefoningizda Telegramni oching\n"
            "2️⃣ <b>Sozlamalar (Settings)</b> ga kiring\n"
            "3️⃣ <b>Qurilmalar (Devices)</b> bo'limini tanlang\n"
            "4️⃣ <b>Qurilmani ulash (Link Desktop Device)</b> tugmasini bosing\n"
            "5️⃣ Ushbu QR kodni skaner qiling!\n\n"
            "⏳ <i>Skaner qilishingizni kutyapman (120 soniya)...</i>"
        )
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📲 Telegramda ochish", url=res["qr_url"])]
        ])
        await message.answer_photo(photo=photo, caption=caption, reply_markup=keyboard, parse_mode="HTML")

        # Start background listener for QR scan
        asyncio.create_task(handle_qr_wait(message, message.from_user.id))
    else:
        await message.answer(f"❌ QR kod yaratishda xatolik: {res.get('error')}")

async def handle_qr_wait(message: types.Message, user_id: int):
    res = await wait_for_qr_login(user_id, timeout=120)
    if res["status"] == "success":
        await message.answer(
            f"🎉 <b>Muborak, Boshliq!</b>\n\n"
            f"Shaxsiy Telegram hisobingiz (<b>{res['name']}</b>) muvaffaqiyatli ulandi! 🚀\n\n"
            f"Endi JARVIS sizning shaxsiy profilingizdan kontaktlaringizga xabar yoza oladi.\n"
            f"Sinab ko'ring: <i>«kontaktimdagi Parvizga biror motivatsion gap yoz»</i>",
            parse_mode="HTML"
        )
    elif res["status"] == "password_needed":
        await message.answer(
            "🔐 <b>Boshliq, sizda 2 bosqichli tekshiruv (2FA parol) bor ekan!</b>\n\n"
            "Ulanishni yakunlash uchun parolingizni yuboring:\n"
            "<code>/password sizning_parolingiz</code>",
            parse_mode="HTML"
        )
    elif res["status"] == "timeout":
        await message.answer("⏳ QR kod vaqti tugadi. Qayta urinish uchun /qr buyrug'ini yuboring.")

# --- TELEGRAM BUSINESS / HAMKOR BOT GUIDE ---
@dp.message(Command("hamkor", "business"))
async def cmd_hamkor(message: types.Message):
    guide_text = (
        "💼 <b>Telegram Business orqali ulash (Nomer va kodsiz):</b>\n\n"
        "Agar sizda Telegram Business yoki Premium bo'lsa, botni to'g'ridan-to'g'ri Telegram sozlamalaridan ulashingiz mumkin:\n\n"
        "1️⃣ Telegram <b>Sozlamalar (Settings)</b> ga kiring\n"
        "2️⃣ <b>Telegram Business</b> bo'limiga kiring\n"
        "3️⃣ <b>Chat-botlar (Chatbots)</b> bo'limini oching\n"
        "4️⃣ Bot qidiruviga <code>@buyruqqajavob_bot</code> ni yozing va qo'shing!\n\n"
        "✨ Shunda bot sizning rasmiy Hamkor Botingizga aylanadi!"
    )
    await message.answer(guide_text, parse_mode="HTML")

# --- PHONE CODE LOGIN HANDLERS ---
@dp.message(Command("login"))
async def cmd_login(message: types.Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer(
            "📱 <b>Shaxsiy Telegram hisobingizni ulash:</b>\n\n"
            "Agar kod kelmasa, eng oson va tezkor yo'l — <code>/qr</code> buyrug'ini bosing!\n\n"
            "Yoki raqamingizni yozing:\n"
            "<code>/login +998901234567</code>",
            parse_mode="HTML"
        )
        return

    phone = args[1].strip()
    if not phone.startswith("+"):
        phone = "+" + phone

    await message.answer("⏳ Kod so'ralmoqda, bir oz kuting...")
    res = await start_login_process(message.from_user.id, phone)

    if res["status"] == "already_authorized":
        await message.answer(
            f"✅ <b>Boshliq, siz allaqachon ulangansiz!</b>\n"
            f"👤 Ism: {res['name']}\n"
            f"Endi bemalol «kontaktimdagi Parvizga motivatsion gap yoz» deb buyruq bering!",
            parse_mode="HTML"
        )
    elif res["status"] == "code_sent":
        await message.answer(
            f"📩 <b>Tasdiqlash kodi yuborildi!</b>\n\n"
            f"Telegramingizga kelgan 5 xonali kodni kiriting:\n"
            f"<code>/code 12345</code>\n\n"
            f"<i>(Agar kod kelmasa, <code>/qr</code> buyrug'ini bosing — kodsiz, QR skaner bilan ulanadi)</i>",
            parse_mode="HTML"
        )
    else:
        await message.answer(
            f"❌ Xatolik yuz berdi: {res.get('error')}\n\n"
            f"💡 <b>Tavsiya:</b> <code>/qr</code> buyrug'i orqali kodsiz, QR kodni skaner qilib osongina ulaning!",
            parse_mode="HTML"
        )

@dp.message(Command("code"))
async def cmd_code(message: types.Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("Iltimos, kodni kiriting: <code>/code 12345</code>", parse_mode="HTML")
        return

    code = args[1].strip()
    await message.answer("⏳ Kod tekshirilmoqda...")
    res = await complete_login_code(message.from_user.id, code)

    if res["status"] == "success":
        await message.answer(
            f"🎉 <b>Muborak, Boshliq!</b>\n\n"
            f"Shaxsiy Telegram hisobingiz (<b>{res['name']}</b>) muvaffaqiyatli ulandi! 🚀\n\n"
            f"Sinab ko'ring: <i>«kontaktimdagi Parvizga biror motivatsion gap yoz»</i>",
            parse_mode="HTML"
        )
    elif res["status"] == "password_needed":
        await message.answer(
            "🔐 Sizda 2 bosqichli tekshiruv (2FA parol) bor ekan.\n"
            "Parolingizni quyidagicha yuboring:\n"
            "<code>/password sizning_parolingiz</code>",
            parse_mode="HTML"
        )
    elif res["status"] == "no_pending_login":
        await message.answer("⚠️ Avval <code>/login +998...</code> yoki <code>/qr</code> orqali boshlang.", parse_mode="HTML")
    else:
        await message.answer(f"❌ Xato: {res.get('error')}\n\n💡 Eng oson yo'l — <code>/qr</code> buyrug'ini bosing!")

@dp.message(Command("password"))
async def cmd_password(message: types.Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("Iltimos, parolingizni kiriting: <code>/password sizning_parolingiz</code>", parse_mode="HTML")
        return

    password = args[1].strip()
    await message.answer("⏳ Parol tekshirilmoqda...")
    res = await complete_login_password(message.from_user.id, password)

    if res["status"] == "success":
        await message.answer(
            f"🎉 <b>Muvaffaqiyatli ulandi, Janob!</b>\n\n"
            f"Hisob: <b>{res['name']}</b>\n"
            f"Endi JARVIS sizning nomingizdan kontaktlaringizga xabar yoza oladi!",
            parse_mode="HTML"
        )
    else:
        await message.answer(f"❌ Parol noto'g'ri: {res.get('error')}")

@dp.message(Command("userbot"))
async def cmd_userbot(message: types.Message):
    ready = await is_userbot_ready()
    if ready:
        me = await get_user_me()
        await message.answer(
            f"🟢 <b>JARVIS Userbot Faol!</b>\n\n"
            f"👤 Egasi: <b>{me.first_name}</b> (@{me.username or 'yo‘q'})\n"
            f"📱 Telefon: +{me.phone}\n"
            f"⚡️ Holat: Sizning nomingizdan kontaktlaringizga xabar yuborishga shay!",
            parse_mode="HTML"
        )
    else:
        await message.answer(
            "🔴 <b>Userbot Ulanmagan!</b>\n\n"
            "Kodsiz va SMSsiz ulanish uchun: <code>/qr</code> buyrug'ini bosing!",
            parse_mode="HTML"
        )

# --- BOT & SCHEDULER MANAGEMENT ---
@dp.message(Command("iam_ruslan"))
async def cmd_iam_ruslan(message: types.Message):
    user = message.from_user
    set_ruslan(user.id)
    await message.answer(
        f"✅ <b>{user.first_name}</b>, siz muvaffaqiyatli 'Ruslan' qabul qiluvchi sifatida belgilandingiz! (ID: <code>{user.id}</code>)",
        parse_mode="HTML"
    )

@dp.message(Command("set_ruslan"))
async def cmd_set_ruslan(message: types.Message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer("Iltimos, ID kiriting: <code>/set_ruslan 123456789</code>", parse_mode="HTML")
        return
        
    target_arg = args[1].strip()
    target_id = int(target_arg) if target_arg.isdigit() else find_target_chat_id(target_arg)
        
    if target_id:
        set_ruslan(target_id)
        await message.answer(f"✅ Ruslan sifatida <code>{target_id}</code> ID belgilandi!", parse_mode="HTML")
    else:
        await message.answer(f"❌ '{target_arg}' topilmadi.", parse_mode="HTML")

@dp.message(Command("status"))
async def cmd_status(message: types.Message):
    ruslan_id = get_ruslan_chat_id()
    ruslan_info = "Belgilanmagan"
    if ruslan_id:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT username, first_name FROM users WHERE user_id = ?", (ruslan_id,))
            row = cursor.fetchone()
            if row:
                ruslan_info = f"{row['first_name']} (@{row['username'] or 'yo‘q'}) [ID: {ruslan_id}]"
            else:
                ruslan_info = f"ID: {ruslan_id}"

    userbot_status = "Ulangan 🟢" if await is_userbot_ready() else "Ulanmagan 🔴 (/qr)"
    pending = get_pending_messages()
    now_str = get_now().strftime("%Y-%m-%d %H:%M:%S")

    text = (
        f"📊 <b>JARVIS Tizim Holati:</b>\n"
        f"🕒 Vaqt: {now_str}\n"
        f"⚡️ Shaxsiy Userbot: <b>{userbot_status}</b>\n"
        f"👤 Belgilangan Ruslan: <b>{ruslan_info}</b>\n"
        f"📬 Kutilayotgan xabarlar: <b>{len(pending)}</b> ta\n"
        f"🧠 Gemini AI: <b>Ulangan (JARVIS Active)</b>"
    )
    await message.answer(text, parse_mode="HTML")

@dp.message(Command("list"))
async def cmd_list(message: types.Message):
    user_id = message.from_user.id
    messages = get_pending_messages(user_id)
    if not messages:
        await message.answer("📭 Hozircha sizda kutilayotgan rejalashtirilgan xabarlar yo'q, Boshliq.")
        return
        
    text = "📋 <b>Sizning rejalashtirilgan xabarlaringiz:</b>\n\n"
    for m in messages:
        text += (
            f"🆔 <b>ID: {m['id']}</b>\n"
            f"👤 Kimga: {m['target_name'] or 'Ruslan'}\n"
            f"📅 Vaqt: <code>{m['scheduled_at']}</code>\n"
            f"💬 Xabar: <i>\"{m['message_text']}\"</i>\n"
            f"❌ Bekor qilish: /cancel_{m['id']}\n"
            f"--------------------\n"
        )
    await message.answer(text, parse_mode="HTML")

@dp.message(F.text.regexp(r"^/cancel_(\d+)$"))
async def cmd_cancel_shortcut(message: types.Message):
    msg_id = int(message.text.replace("/cancel_", ""))
    ok = cancel_scheduled_message(msg_id, message.from_user.id)
    if ok:
        await message.answer(f"✅ #{msg_id} raqamli reja bekor qilindi, Janob.")
    else:
        await message.answer(f"❌ #{msg_id} reja topilmadi.")

@dp.message(Command("cancel"))
async def cmd_cancel(message: types.Message):
    args = message.text.split()
    if len(args) < 2 or not args[1].isdigit():
        await message.answer("Bekor qilish: <code>/cancel 1</code>", parse_mode="HTML")
        return
    msg_id = int(args[1])
    ok = cancel_scheduled_message(msg_id, message.from_user.id)
    if ok:
        await message.answer(f"✅ #{msg_id} raqamli xabar bekor qilindi, Janob.")
    else:
        await message.answer(f"❌ #{msg_id} xabar topilmadi.")

@dp.message(Command("clear"))
async def cmd_clear(message: types.Message):
    clear_chat_history(message.from_user.id)
    await message.answer("🧹 Bo'ldi jigar, xotirani tozalab yangidan boshladik! Xo'sh, nima yangiliklar brat? 😎")

# --- MAIN INCOMING TEXT DISPATCHER ---
@dp.message(F.text)
async def handle_user_text(message: types.Message):
    user = message.from_user
    register_user(user.id, user.username or "", user.first_name or "")
    
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    
    analysis = await process_user_message(user.id, message.text, user.first_name or "jigar")
    
    intent = analysis.get("intent", "chat")
    target = analysis.get("target")
    target_msg = analysis.get("message")
    scheduled_time = analysis.get("scheduled_time")
    ai_reply = analysis.get("ai_reply", "")
    
    logger.info(f"Bot [User {user.id}]: '{message.text}' -> intent={intent}, target={target}")

    # 1. SEND FROM USER'S OWN TELEGRAM ACCOUNT (USERBOT)
    if intent == "send_from_user_account":
        target_name = target or "kontakt"
        await bot.send_chat_action(chat_id=message.chat.id, action="typing")
        
        send_res = await send_message_from_my_account(target_name, target_msg)
        
        if send_res.get("success"):
            rep_text = (
                f"🔥 <b>Bo'ldi brat, gap yo'q!</b>\n\n"
                f"Sani shaxsiy Telegramingdan <b>{send_res['recipient_name']}</b>ga shartta xabar yetkazildi:\n\n"
                f"💬 <i>\"{send_res['text']}\"</i>\n\n"
                f"🎯 <i>Ish bitdi jigar, xotirjam bo'laver!</i> 👊😎"
            )
            await message.answer(rep_text, parse_mode="HTML")
            return
        elif send_res.get("error") == "not_logged_in":
            await message.answer(
                f"⚠️ <b>E jigar, shaxsiy Telegraming hali ulanmagan-ku!</b>\n\n"
                f"Ulash juda oson:\n"
                f"👉 <code>/qr</code> buyrug'ini bossang, QR kod chiqadi. Telefoningdan bitta skaner qilsang, srazu ulanasan brat!\n\n"
                f"💡 <i>{target_name} uchun tayyorlagan xabarim:</i>\n«{target_msg}»",
                parse_mode="HTML"
            )
            return
        else:
            await message.answer(
                f"⚠️ <b>E brat:</b> {send_res.get('message')}\n\n"
                f"💡 <i>Tayyorlangan xabar:</i>\n«{target_msg}»",
                parse_mode="HTML"
            )
            return

    # 2. IMMEDIATE SEND VIA BOT
    elif intent == "send_immediate" and target_msg:
        target_chat_id = find_target_chat_id(target or "Ruslan")
        target_name = target or "Ruslan"

        if target_chat_id:
            try:
                await bot.send_message(
                    chat_id=target_chat_id,
                    text=f"📩 <b>{user.first_name}</b> dan xabar keldi:\n\n{target_msg}",
                    parse_mode="HTML"
                )
                await message.answer(
                    f"✅ <b>Bo'ldi jigar!</b> {target_name}ga xabarni darhol yetkazdim:\n\n"
                    f"💬 <i>\"{target_msg}\"</i> 👊",
                    parse_mode="HTML"
                )
                return
            except Exception as e:
                logger.error(f"Error sending message to {target_chat_id}: {e}")
                await message.answer(f"⚠️ Xabarni yuborishda xatolik bo'ldi brat: {e}")
                return
        else:
            await message.answer(
                f"⚠️ <b>{target_name}</b>ning Telegram ID sini topolmadim jigar!\n\n"
                f"Agar shaxsiy Telegramingdan yubormoqchi bo'lsang: <code>/qr</code> orqali hisobingni ulab, <i>«kontaktimdagi {target_name}ga ... yoz»</i> deb buyur brat.\n\n"
                f"💬 Tayyorlangan xabar: <i>\"{target_msg}\"</i>",
                parse_mode="HTML"
            )
            return

    # 3. SCHEDULED MESSAGE
    elif intent == "schedule_message" and target_msg and scheduled_time:
        target_name = target or "Ruslan"
        if str(target).lower() == "self":
            target_chat_id = user.id
            target_name = "O'zingizga (Eslatma)"
        else:
            target_chat_id = find_target_chat_id(target_name)

        msg_id = add_scheduled_message(
            from_user_id=user.id,
            target_name=target_name,
            target_chat_id=target_chat_id or 0,
            message_text=target_msg,
            scheduled_at=scheduled_time
        )

        await message.answer(
            f"⏰ <b>Bosh ustiga brat!</b> #{msg_id} raqam bilan eslab qoldim.\n\n"
            f"👤 Kimga: <b>{target_name}</b>\n"
            f"🕒 Vaqt: <code>{scheduled_time}</code>\n"
            f"💬 Xabar: <i>\"{target_msg}\"</i>\n\n"
            f"Vaqti kelishi bilan shartta yetkazaman, xavotir olma jigar! 👊",
            parse_mode="HTML"
        )
        return

    # 4. NORMAL JARVIS AI CHAT
    else:
        if ai_reply:
            await message.answer(ai_reply)
        else:
            await message.answer("Eshitaman, Boshliq! Sizga qanday yordam bera olaman?")

async def main():
    logger.info("Initializing database...")
    init_db()

    if await is_userbot_ready():
        me = await get_user_me()
        logger.info(f"Userbot active: {me.first_name} (+{me.phone})")
    else:
        logger.info("Userbot not logged in yet. Use /qr, /login or start_login.bat")

    asyncio.create_task(start_scheduler(bot))

    logger.info("Starting JARVIS bot polling...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped.")
