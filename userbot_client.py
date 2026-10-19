import os
import io
import asyncio
import logging
import qrcode
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneCodeExpiredError
from telethon.tl.functions.contacts import GetContactsRequest
from config import TELEGRAM_API_ID, TELEGRAM_API_HASH, USER_SESSION_PATH

logger = logging.getLogger(__name__)

_client_instance = None
_pending_login = {}     # {user_id: {"phone": phone, "phone_code_hash": hash}}
_pending_qr = {}        # {user_id: qr_object}

def get_client() -> TelegramClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = TelegramClient(USER_SESSION_PATH, TELEGRAM_API_ID, TELEGRAM_API_HASH)
    return _client_instance

async def is_userbot_ready() -> bool:
    """Checks if the userbot session exists and is authorized"""
    session_file = f"{USER_SESSION_PATH}.session"
    if not os.path.exists(session_file):
        return False
    try:
        client = get_client()
        if not client.is_connected():
            await client.connect()
        return await client.is_user_authorized()
    except Exception as e:
        logger.error(f"Error checking userbot readiness: {e}")
        return False

async def get_user_me():
    """Gets information about the logged-in user"""
    if not await is_userbot_ready():
        return None
    try:
        client = get_client()
        return await client.get_me()
    except Exception as e:
        logger.error(f"Error getting me: {e}")
        return None

# --- QR CODE LOGIN METHODS ---
async def start_qr_login(user_id: int) -> dict:
    """Generates QR code for instant login without phone number or SMS"""
    client = get_client()
    if not client.is_connected():
        await client.connect()

    if await client.is_user_authorized():
        me = await client.get_me()
        return {
            "status": "already_authorized",
            "name": me.first_name,
            "phone": me.phone
        }

    try:
        qr = await client.qr_login()
        _pending_qr[user_id] = qr

        # Generate QR image in-memory
        qr_img = qrcode.make(qr.url)
        buf = io.BytesIO()
        qr_img.save(buf, format="PNG")
        buf.seek(0)

        return {
            "status": "qr_generated",
            "qr_bytes": buf.getvalue(),
            "qr_url": qr.url
        }
    except Exception as e:
        logger.error(f"Failed to generate QR: {e}")
        return {"status": "error", "error": str(e)}

async def wait_for_qr_login(user_id: int, timeout: int = 120) -> dict:
    """Awaits user scanning the QR code"""
    if user_id not in _pending_qr:
        return {"status": "no_qr"}

    qr = _pending_qr[user_id]
    try:
        user = await qr.wait(timeout=timeout)
        _pending_qr.pop(user_id, None)
        return {
            "status": "success",
            "name": user.first_name,
            "username": getattr(user, "username", None)
        }
    except SessionPasswordNeededError:
        return {"status": "password_needed"}
    except asyncio.TimeoutError:
        _pending_qr.pop(user_id, None)
        return {"status": "timeout"}
    except Exception as e:
        _pending_qr.pop(user_id, None)
        return {"status": "error", "error": str(e)}

# --- PHONE CODE LOGIN METHODS ---
async def start_login_process(user_id: int, phone: str) -> dict:
    """Initiates login with phone number"""
    client = get_client()
    if not client.is_connected():
        await client.connect()

    if await client.is_user_authorized():
        me = await client.get_me()
        return {
            "status": "already_authorized",
            "name": me.first_name,
            "phone": me.phone
        }

    try:
        sent_code = await client.send_code_request(phone)
        _pending_login[user_id] = {
            "phone": phone,
            "phone_code_hash": sent_code.phone_code_hash
        }
        return {
            "status": "code_sent",
            "phone": phone
        }
    except Exception as e:
        logger.error(f"Failed to send code to {phone}: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

async def complete_login_code(user_id: int, code: str) -> dict:
    """Completes login with SMS / Telegram code"""
    if user_id not in _pending_login:
        return {"status": "no_pending_login"}

    data = _pending_login[user_id]
    phone = data["phone"]
    phone_code_hash = data["phone_code_hash"]
    client = get_client()

    try:
        user = await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
        _pending_login.pop(user_id, None)
        return {
            "status": "success",
            "name": user.first_name
        }
    except SessionPasswordNeededError:
        return {"status": "password_needed"}
    except (PhoneCodeInvalidError, PhoneCodeExpiredError) as e:
        return {"status": "code_invalid", "error": str(e)}
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def complete_login_password(user_id: int, password: str) -> dict:
    """Completes 2FA password verification"""
    client = get_client()
    try:
        user = await client.sign_in(password=password)
        _pending_login.pop(user_id, None)
        _pending_qr.pop(user_id, None)
        return {
            "status": "success",
            "name": user.first_name
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

# --- SENDING FROM USER ACCOUNT ---
async def send_message_from_my_account(target_query: str, message_text: str) -> dict:
    """
    Finds a contact by name, username, or phone and sends message directly from the user's account.
    Returns dict with keys: success, recipient_name, text, error
    """
    if not await is_userbot_ready():
        return {
            "success": False,
            "error": "not_logged_in",
            "message": "Shaxsiy Telegram hisobingiz hali ulanmagan. /qr buyrug'i orqali kodsiz, tezkor ulab olishingiz mumkin!"
        }

    client = get_client()
    if not client.is_connected():
        await client.connect()

    clean_target = target_query.strip().lower().lstrip("@")
    target_entity = None
    target_display_name = target_query

    try:
        # 1. Direct username or phone resolution if starts with @ or +
        if target_query.startswith("@") or target_query.startswith("+"):
            try:
                target_entity = await client.get_entity(target_query)
            except Exception:
                pass

        # 2. Search user's contacts
        if not target_entity:
            try:
                contacts_result = await client(GetContactsRequest(hash=0))
                for u in contacts_result.users:
                    u_fname = (u.first_name or "").lower()
                    u_lname = (u.last_name or "").lower()
                    u_uname = (u.username or "").lower()
                    u_phone = (u.phone or "").lower()

                    if (clean_target in u_fname or 
                        clean_target in u_lname or 
                        clean_target in u_uname or 
                        clean_target in u_phone):
                        target_entity = u
                        target_display_name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username
                        break
            except Exception as e:
                logger.error(f"Error reading contacts: {e}")

        # 3. Search recent dialogs (chats)
        if not target_entity:
            try:
                async for dialog in client.iter_dialogs(limit=100):
                    d_name = (dialog.name or "").lower()
                    if clean_target in d_name:
                        target_entity = dialog.entity
                        target_display_name = dialog.name
                        break
            except Exception as e:
                logger.error(f"Error searching dialogs: {e}")

        # 4. If found, send the message
        if target_entity:
            await client.send_message(target_entity, message_text)
            logger.info(f"Userbot sent message to {target_display_name}: {message_text[:50]}...")
            return {
                "success": True,
                "recipient_name": target_display_name,
                "text": message_text
            }
        else:
            return {
                "success": False,
                "error": "contact_not_found",
                "message": f"Kontaktlaringiz yoki chatlaringiz orasidan «{target_query}» topilmadi."
            }

    except Exception as e:
        logger.error(f"Error sending message from user account: {e}")
        return {
            "success": False,
            "error": "send_failed",
            "message": f"Xabar yuborishda xatolik: {str(e)}"
        }
