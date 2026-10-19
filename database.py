import sqlite3
import os
from datetime import datetime
from config import DB_PATH, get_now

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                is_ruslan INTEGER DEFAULT 0,
                created_at TEXT,
                last_seen TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_user_id INTEGER,
                target_name TEXT,
                target_chat_id INTEGER,
                message_text TEXT,
                scheduled_at TEXT,
                created_at TEXT,
                status TEXT DEFAULT 'PENDING'
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                role TEXT,
                message TEXT,
                created_at TEXT
            )
        """)
        conn.commit()

def register_user(user_id: int, username: str, first_name: str):
    now_str = get_now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, is_ruslan FROM users WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        
        is_ruslan = 0
        if first_name and "ruslan" in first_name.lower():
            is_ruslan = 1
        if username and "ruslan" in username.lower():
            is_ruslan = 1
            
        if row:
            current_is_ruslan = row["is_ruslan"]
            if current_is_ruslan == 1:
                is_ruslan = 1
            cursor.execute("""
                UPDATE users 
                SET username = ?, first_name = ?, last_seen = ?, is_ruslan = ?
                WHERE user_id = ?
            """, (username, first_name, now_str, is_ruslan, user_id))
        else:
            cursor.execute("""
                INSERT INTO users (user_id, username, first_name, is_ruslan, created_at, last_seen)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, username, first_name, is_ruslan, now_str, now_str))
        conn.commit()

def set_setting(key: str, value: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (key, str(value)))
        conn.commit()

def get_setting(key: str, default=None):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        if row:
            return row["value"]
        return default

def set_ruslan(chat_id: int):
    set_setting("ruslan_chat_id", str(chat_id))
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_ruslan = 1 WHERE user_id = ?", (chat_id,))
        conn.commit()

def get_ruslan_chat_id():
    setting_id = get_setting("ruslan_chat_id")
    if setting_id:
        try:
            return int(setting_id)
        except ValueError:
            pass
            
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE is_ruslan = 1 ORDER BY last_seen DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            return row["user_id"]
            
        cursor.execute("""
            SELECT user_id FROM users 
            WHERE LOWER(first_name) LIKE '%ruslan%' OR LOWER(username) LIKE '%ruslan%'
            ORDER BY last_seen DESC LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            return row["user_id"]
            
    return None

def find_target_chat_id(target_query: str):
    if not target_query:
        return None
    target_clean = target_query.strip().lstrip("@").lower()
    
    if "ruslan" in target_clean:
        ruslan_id = get_ruslan_chat_id()
        if ruslan_id:
            return ruslan_id
            
    if target_clean.isdigit():
        return int(target_clean)
        
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id FROM users 
            WHERE LOWER(username) = ? OR LOWER(first_name) LIKE ?
            ORDER BY last_seen DESC LIMIT 1
        """, (target_clean, f"%{target_clean}%"))
        row = cursor.fetchone()
        if row:
            return row["user_id"]
    return None

def add_scheduled_message(from_user_id: int, target_name: str, target_chat_id: int, message_text: str, scheduled_at: str) -> int:
    now_str = get_now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scheduled_messages (from_user_id, target_name, target_chat_id, message_text, scheduled_at, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        """, (from_user_id, target_name, target_chat_id, message_text, scheduled_at, now_str))
        conn.commit()
        return cursor.lastrowid

def get_due_messages():
    now_str = get_now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, from_user_id, target_name, target_chat_id, message_text, scheduled_at
            FROM scheduled_messages
            WHERE status = 'PENDING' AND scheduled_at <= ?
            ORDER BY scheduled_at ASC
        """, (now_str,))
        return [dict(row) for row in cursor.fetchall()]

def mark_message_status(message_id: int, status: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE scheduled_messages SET status = ? WHERE id = ?", (status, message_id))
        conn.commit()

def get_pending_messages(from_user_id: int = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        if from_user_id:
            cursor.execute("""
                SELECT id, from_user_id, target_name, target_chat_id, message_text, scheduled_at, created_at
                FROM scheduled_messages
                WHERE status = 'PENDING' AND from_user_id = ?
                ORDER BY scheduled_at ASC
            """, (from_user_id,))
        else:
            cursor.execute("""
                SELECT id, from_user_id, target_name, target_chat_id, message_text, scheduled_at, created_at
                FROM scheduled_messages
                WHERE status = 'PENDING'
                ORDER BY scheduled_at ASC
            """)
        return [dict(row) for row in cursor.fetchall()]

def cancel_scheduled_message(message_id: int, from_user_id: int = None) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        if from_user_id:
            cursor.execute("""
                UPDATE scheduled_messages SET status = 'CANCELLED' 
                WHERE id = ? AND from_user_id = ? AND status = 'PENDING'
            """, (message_id, from_user_id))
        else:
            cursor.execute("""
                UPDATE scheduled_messages SET status = 'CANCELLED' 
                WHERE id = ? AND status = 'PENDING'
            """, (message_id,))
        conn.commit()
        return cursor.rowcount > 0

# Chat History methods
def add_chat_history(user_id: int, role: str, message: str):
    now_str = get_now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history (user_id, role, message, created_at)
            VALUES (?, ?, ?, ?)
        """, (user_id, role, message, now_str))
        conn.commit()

def get_chat_history(user_id: int, limit: int = 8) -> list:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT role, message FROM chat_history
            WHERE user_id = ?
            ORDER BY id DESC LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        # Return in chronological order
        return [{"role": r["role"], "message": r["message"]} for r in reversed(rows)]

def clear_chat_history(user_id: int):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
        conn.commit()
