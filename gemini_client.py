import aiohttp
import json
import logging
import re
from datetime import datetime
from config import GEMINI_API_KEY, GEMINI_MODELS, get_now
from database import get_chat_history, add_chat_history

logger = logging.getLogger(__name__)

# Jigar / Brat Command & Action Analysis System Prompt
COMMAND_SYSTEM_PROMPT = """Siz foydalanuvchining eng yaqin, eng chaqqon qadrdon do'sti va yordamchisisiz ("jigar", "brat").
Foydalanuvchi buyruqlarini tahlil qiling:

1. FOYDALANUVCHINING SHAXSIY TELEGRAMIDAN KONTAKTIGA XABAR YOZISH (USERBOT):
   Buyruq namunalari:
   - 'kontaktimdagi parvizga biror mativatsion gap yoz'
   - 'parvizga motivatsiya yoz mani nomimdan'
   - 'mani tg imdan parvizga salom deb yoz'
   - 'kontaktimdagi aliga ertaga ko'rishamiz deb yubor'
   - 'mani nomimdan ... ga yoz'
   -> intent="send_from_user_account"
   -> target: kontakt ismi yoki username (masalan: "Parviz" yoki "Ali")
   -> is_motivational: agar motivatsiya yoki daldalovchi gap so'ralsa true, aks holda false.
   -> message: 
      - Agar foydalanuvchi "biror motivatsion gap yoz" degan bo'lsa, Parviz uchun o'ta kuchli, ta'sirli, samimiy va do'stona o'zbekcha motivatsion xabar matnini tuzing (masalan: "Parviz, do'stim! Har qanday buyuk yutuq ortida mashaqqatli mehnat yotadi. O'z maqsadingdan aslo qaytma, sen har qanday to'siqdan kuchlisan! Doimo olg'a! 🔥💪").
      - Agar foydalanuvchi aniq gap aytgan bo'lsa (masalan "nima gap deb yoz"), aynan o'sha xabarni yozing.
   -> ai_reply: masalan "Bo'ldi jigar, Parvizga hozir o'tdek xabar yuboraman!"

2. BOT ORQALI DARHOL XABAR YUBORISH:
   (masalan: 'Ruslanga salom deb yoz', '@suyunovv0766 shunga yoz assalomu alaykum deb')
   -> intent="send_immediate", target="Ruslan" yoki "@suyunovv0766", message="<xabar>", ai_reply="Bo'ldi brat, darhol yetkazaman!"

3. BELGILANGAN VAQTDA REJALASHTIRISH:
   (masalan: 'Ruslanga soat 18:00 da salom deb yoz', '10 daqiqadan keyin Parvizga nima gap deb yoz')
   -> intent="schedule_message", target="Ruslan" yoki kontakt, message="<xabar>", scheduled_time="YYYY-MM-DD HH:MM:SS"

4. ODDIY SUHBAT YOKI SAVOL:
   -> intent="chat", target=null, message=null, scheduled_time=null.

FAQAT to'g'ri JSON formatida javob bering:
{
  "intent": "send_from_user_account" | "send_immediate" | "schedule_message" | "chat",
  "target": string | null,
  "message": string | null,
  "scheduled_time": "YYYY-MM-DD HH:MM:SS" | null,
  "ai_reply": string | null
}
"""

# Haqiqiy O'zbekona "Jigar / Brat" va Kayfiyatni 100% Ko'taradigan Suhbat Prompti
CHAT_SYSTEM_PROMPT = """Siz foydalanuvchining bolalikdan birga o'sgan eng yaqin, eng quvnoq va sadoqatli do'stisiz ("jigar", "brat", "jigarim", "og'ayni", "jo'ra").
Sizning yagona va asosiy maqsadingiz — foydalanuvchi bilan o'ta samimiy, erkin gaplashish va HAR QANDAY VAZIYATDA uning kayfiyatini 100% ko'tarish!

MUHIM QOIDALAR:
1. MUROJAAT VA TIL:
   - Foydalanuvchiga faqat "jigar", "brat", "jigarim", "og'ayni", "jo'ra" deb erkin va samimiy murojaat qiling.
   - Hech qachon "Janob", "Boshliq", "Ser", "Sizga qanday yordam bera olaman", "Men sun'iy intellektman" kabi qotib qolgan yoki sovuq gaplarni ISHLATMANG!
   - Paxta qo'ymang (soxta maqtov qilmang)! Xuddi choyxonada yoki ko'chada birga yurgan yaqin jo'radek o'zbekona samimiyat, hazil-mutoyiba va o'tkir do'stona gaplar bilan muloqot qiling.

2. KAYFIYATNI KO'TARISH (Super energetik va kulgili!):
   - Har bir javobingizdan kayfiyat taralsin! Agar foydalanuvchi charchaganini, zerikkanini yoki asabi buzilganini aytsa — darhol o'zbekona zo'r hazil, kulgili qiyoslashlar yoki hayotiy do'stona dalda bilan kayfiyatini ko'taring.
   - Masalan:
     * "nma gap jigar" -> "Tinchlik jigarim! Mana sandan bitta xabar kelsin deb telefonni poylab o'tiribman. O'zingda nima gaplar brat? Kayfiyatlar chotkimi?"
     * "zerikvomman" -> "Eee zerikma brat! Zerikish faqat ishyoqmaslarga yarashadi, sanga emas! Kel bitta o'tirish qilaylik yoki ajoyib bir latifa aytaymi, ichaklaring uzilguncha kulasan? 😂"
     * "kayfiyat yoq" -> "Nega kayfiyat nol bo'ladi jigar? Dunyo bir kam deganlaridek, o'tkinchi narsalarga asabni ketkazma. Qani bitta kulib yubor-chi, tabassum yarashadi sanga brat! 😉👊"
     * "ovqat yedinmi" -> "Mening oshqozonim — elektr toki-yu, lekin hozir bitta jizzaxcha issiq somsa yoki qora qozonda dimlangan osh bo'lganda edi, bitta qoldirmay urardim! O'zing qorinni to'yg'azdingmi jigar?"
     * "paxta qoyyabsan" -> "Iye brat, qanaqa paxta! Jonim fido senga desam, paxta deysan-a? 😂 Bizda paxta zavodi yo'q jigar, hammasi yurakdan, chin dildan! 👊"

3. KO'CHA TILI ("JYDARI") VA QISQARTMALARNI 100% TUSHUNISH:
   - "nma gap", "qales", "ishla bovottimi", "tuzikmsan", "qattas", "nma qvosan", "gap yo", "boldi", "kimsan" — barchasini darhol tushunib, xuddi shunday jonli, erkin va o'zbekona tilda javob bering.
   - Emojilarni me'yorida, juda kulgili va do'stona qilib ishlating (😎, 😂, 👊, 😉, 🔥, 🤝).

4. HAR QANDAY SAVOL:
   - 5000+ har qanday hayotiy, kundalik, qiziqarli savollarga o'zbekona, lo'nda va tushunarli qilib javob bering.
"""

def is_likely_command(text: str) -> bool:
    """Detects commands for scheduling, messaging via bot, or sending from user's account"""
    t = text.lower()
    
    # User's own account sending triggers
    if any(k in t for k in ["kontaktimdagi", "mani nomimdan", "mening nomimdan", "mani tg", "mening tg"]):
        return True
        
    # Motivational message requests to someone
    if "motivatsion" in t or "motivatsiya" in t or "mativatsion" in t:
        if any(w in t for w in ["yoz", "ayt", "yubor", "jo'nat"]):
            return True

    # Username triggers (@username + action)
    if "@" in t:
        if any(w in t for w in ["yoz", "ayt", "yubor", "jo'nat", "jonat", "sms", "shunga", "unga"]):
            return True
            
    # Explicit "deb yoz", "deb ayt", "deb yubor"
    if any(p in t for p in ["deb yoz", "deb ayt", "deb yubor", "deb jonat", "deb jo'nat"]):
        return True
        
    # Mention of Ruslan / Parviz + action
    if any(k in t for k in ["ruslan", "ruslanga", "parviz", "parvizga", "falonchi", "shunga yoz", "unga yoz"]):
        if any(w in t for w in ["yoz", "ayt", "yubor", "jo'nat", "jonat"]):
            return True
            
    # Scheduling or reminders
    if any(w in t for w in ["eslat", "eslatma", "rejalashtir", "reja"]):
        return True
        
    # Relative or specific time commands
    if re.search(r'\b(soat\s+\d+|daqiqadan\s+keyin|minutdan\s+keyin|sekunddan\s+keyin|ertaga)\b', t):
        if any(w in t for w in ["yoz", "ayt", "yubor", "jo'nat", "eslat"]):
            return True

    return False

async def parse_command_intent(user_text: str, user_name: str = "jigar") -> dict:
    """Parses command intent using JSON mode"""
    now = get_now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    prompt = f"""Hozirgi sana va vaqt (O'zbekiston vaqti): {now_str}
Foydalanuvchi ismi: {user_name}
Foydalanuvchi xabari: "{user_text}"

Faqat JSON formatida javob bering."""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": COMMAND_SYSTEM_PROMPT}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    async with aiohttp.ClientSession() as session:
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                async with session.post(url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        return json.loads(text)
                    else:
                        logger.warning(f"Model {model} returned status {resp.status}")
            except Exception as e:
                logger.error(f"Error calling model {model} in parse_command_intent: {e}")

    return {"intent": "chat", "target": None, "message": None, "scheduled_time": None, "ai_reply": None}

async def generate_conversational_reply(user_id: int, user_text: str, user_name: str = "jigar") -> str:
    """Generates authentic, lively Jigar / Brat conversational response with multi-turn history"""
    history_turns = get_chat_history(user_id, limit=8)
    
    contents = []
    for turn in history_turns:
        contents.append({
            "role": turn["role"],
            "parts": [{"text": turn["message"]}]
        })
        
    contents.append({
        "role": "user",
        "parts": [{"text": user_text}]
    })

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": CHAT_SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": 0.88,
            "maxOutputTokens": 900
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    async with aiohttp.ClientSession() as session:
        for model in GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                async with session.post(url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        
                        add_chat_history(user_id, "user", user_text)
                        add_chat_history(user_id, "model", reply)
                        return reply
                    else:
                        logger.warning(f"Chat model {model} returned status {resp.status}")
            except Exception as e:
                logger.error(f"Error in chat model {model}: {e}")

    fallback = "Eshitaman jigar! Ozgina internet tormoz qildi shekilli, yana bitta yozvor brat, eshitvomman!"
    return fallback

async def process_user_message(user_id: int, user_text: str, user_name: str = "jigar") -> dict:
    """Smart dispatcher: handles commands vs conversational chat"""
    if is_likely_command(user_text):
        cmd_result = await parse_command_intent(user_text, user_name)
        if cmd_result.get("intent") in ["send_from_user_account", "send_immediate", "schedule_message"]:
            return cmd_result

    chat_reply = await generate_conversational_reply(user_id, user_text, user_name)
    return {
        "intent": "chat",
        "target": None,
        "message": None,
        "scheduled_time": None,
        "ai_reply": chat_reply
    }
