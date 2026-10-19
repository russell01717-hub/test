import asyncio
import os
import qrcode
from telethon import TelegramClient
from config import TELEGRAM_API_ID, TELEGRAM_API_HASH, USER_SESSION_PATH

async def main():
    print("=" * 65)
    print("      JARVIS USERBOT - TELEGRAM HISOBINI ULASH")
    print("=" * 65)
    print("1. QR KOD ORQALI (SMS yoki kod kutmasdan, Telegramdan skaner qilish)")
    print("2. Telefon raqam va SMS kod orqali")
    print("=" * 65)

    client = TelegramClient(USER_SESSION_PATH, TELEGRAM_API_ID, TELEGRAM_API_HASH)
    await client.connect()

    if await client.is_user_authorized():
        me = await client.get_me()
        print(f"\n[OK] Siz allaqachon ulangansiz: {me.first_name} (@{me.username or 'yo\'q'})")
        print(f"Telefon: +{me.phone}")
        print("\nJARVIS to'liq shay holatda!")
        await client.disconnect()
        return

    choice = input("\nTanlang (1 yoki 2) [Standart: 1]: ").strip()
    if choice != "2":
        # QR Code Login
        print("\n[INFO] QR Kod yaratilmoqda...")
        qr = await client.qr_login()

        # Save to file and open image
        qr_img = qrcode.make(qr.url)
        qr_file = os.path.join(os.path.dirname(__file__), "qr_login.png")
        qr_img.save(qr_file)

        print("\n" + "*" * 65)
        print(" [DIQQAT] QR KOD RASMI SAQLANDI: qr_login.png")
        print(" Telefoningizda Telegramni oching:")
        print(" 1. Sozlamalar (Settings)")
        print(" 2. Qurilmalar (Devices)")
        print(" 3. Qurilmani ulash (Link Desktop Device)")
        print(" 4. Kompyuter ekranidagi yoki qr_login.png rasmini skaner qiling!")
        print("*" * 65)

        # Open image automatically on Windows
        try:
            os.startfile(qr_file)
        except Exception:
            pass

        print("\n[KUTILMOQDA] Skaner qilishingiz kutilmoqda (120 soniya)...")
        try:
            user = await qr.wait(timeout=120)
            print("\n" + "=" * 65)
            print(f" [MUVAFFAQIYATLI ULINDI!] ")
            print(f" Ism: {user.first_name}")
            print(f" Username: @{user.username or 'yo\'q'}")
            print("=" * 65)
            print("Endi botga o'tib «kontaktimdagi Parvizga motivatsion gap yoz» deb ko'ring!")
        except Exception as e:
            if "password" in str(e).lower() or "SessionPasswordNeededError" in str(type(e)):
                password = input("\nIkki bosqichli tekshiruv (2FA) parolingizni kiriting: ").strip()
                user = await client.sign_in(password=password)
                print(f"\n[OK] Muvaffaqiyatli ulandi: {user.first_name}")
            else:
                print(f"\n[XATOLIK]: {e}")
    else:
        # Phone code login
        phone = input("\nTelefon raqamingizni kiriting (+998901234567 formatda): ").strip()
        if not phone.startswith("+"):
            phone = "+" + phone

        await client.send_code_request(phone)
        print(f"\n[INFO] Telegram orqali {phone} raqamiga tasdiqlash kodi yuborildi.")
        code = input("Telegramdan kelgan 5 xonali kodni kiriting: ").strip()

        try:
            await client.sign_in(phone=phone, code=code)
        except Exception as e:
            if "password" in str(e).lower() or "SessionPasswordNeededError" in str(type(e)):
                password = input("Ikki bosqichli tekshiruv (2FA) parolingizni kiriting: ").strip()
                await client.sign_in(password=password)
            else:
                print(f"[XATOLIK] Kirish amalga oshmadi: {e}")
                await client.disconnect()
                return

        me = await client.get_me()
        print(f"\n[MUVAFFAQIYATLI ULINDI!] Ism: {me.first_name}")

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
