import os
from datetime import datetime, timezone, timedelta

# Load .env file if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# API and Bot Tokens
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Telegram Client (Userbot) MTProto Credentials
TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", 2040))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "b18441a1ff607e10a989891a5462e627")
USER_SESSION_PATH = os.path.join(os.path.dirname(__file__), "user_session")

# Models in order of fallback preference
GEMINI_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
]

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), "bot_data.db")

# Timezone (Uzbekistan is UTC+5)
TZ_OFFSET = timedelta(hours=5)
def get_now():
    return datetime.now(timezone(TZ_OFFSET))
