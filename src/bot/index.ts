import { Telegraf, Markup } from "telegraf";
import { PLANS, CARD_NUMBER, CARD_HOLDER, ADMIN_CHAT_ID, createPayment, formatPrice } from "./payments";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

export const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const name = ctx.from.first_name || "Foydalanuvchi";
  ctx.reply(
    `Assalomu alaykum, ${name}! 🌙\n\nArab tilini bilish darajangizni aniqlash va sertifikat olish uchun quyidagi tariflardan birini tanlang:`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📖 Bepul — 0 so'm", "plan_free")],
      [Markup.button.callback("⭐ Standart — 49 000 so'm", "plan_standard")],
      [Markup.button.callback("👑 Premium — 99 000 so'm", "plan_premium")],
    ])
  );
});

bot.action(/plan_(.+)/, (ctx) => {
  const planId = ctx.match[1];
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return ctx.reply("Tarif topilmadi.");

  if (planId === "free") {
    return ctx.reply(
      "✅ Bepul tarif tanlandi!\n\n"
      + "Siz 2 ta test topshirishingiz mumkin.\n"
      + "👉 https://arabictest.uz/cefr",
      Markup.inlineKeyboard([Markup.button.webApp("Testni boshlash", "https://arabictest.uz/cefr")])
    );
  }

  const paymentId = createPayment(ctx.from.id, planId);
  ctx.reply(
    `💳 *${plan.name} tarifi*\n\n`
    + `To'lov summasi: ${formatPrice(plan.price)}\n\n`
    + `💳 Karta raqami: \`${CARD_NUMBER}\`\n`
    + `👤 Karta egasi: ${CARD_HOLDER}\n\n`
    + `To'lovni amalga oshirgandan so'ng, quyidagi tugmani bosing yoki to'lov ID sini admin@arabictest ga yuboring:\n\n`
    + `To'lov ID: \`${paymentId}\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ To'lov qildim", callback_data: `confirm_${paymentId}` }],
          [{ text: "❌ Bekor qilish", callback_data: "cancel" }],
        ],
      },
    }
  );
});

bot.action(/confirm_(.+)/, (ctx) => {
  const paymentId = ctx.match[1];
  ctx.reply(
    "✅ So'rovingiz qabul qilindi!\n\n"
    + "Admin to'lovni tekshirib, hisobingizni faollashtiradi.\n"
    + "Bu biroz vaqt olishi mumkin (5-10 daqiqa).",
    Markup.inlineKeyboard([Markup.button.url("🌐 Saytga kirish", "https://arabictest.uz")])
  );
  if (ADMIN_CHAT_ID) {
    ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `🆕 Yangi to'lov!\n\nID: \`${paymentId}\`\nFoydalanuvchi: @${ctx.from.username || ctx.from.first_name}\nStatus: Kutilmoqda`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.action("cancel", (ctx) => {
  ctx.reply("❌ To'lov bekor qilindi. Yana kerak bo'lsa /start ni bosing.");
});

bot.help((ctx) => {
  ctx.reply(
    "🤖 ARABICTEST.UZ — Telegram bot\n\n"
    + "Buyruqlar:\n"
    + "/start - Tariflarni ko'rish\n"
    + "/plans - Narxlar\n"
    + "/help - Yordam\n\n"
    + "🌐 Sayt: https://arabictest.uz"
  );
});

bot.command("plans", (ctx) => {
  ctx.reply(
    "📋 *Mavjud tariflar:*\n\n"
    + "1️⃣ Bepul — 0 so'm (2 ta test)\n"
    + "2️⃣ Standart — 49 000 so'm (10 ta test + sertifikat)\n"
    + "3️⃣ Premium — 99 000 so'm (cheksiz test + shaxsiy mentor)\n\n"
    + "Tanlash uchun /start ni bosing.",
    { parse_mode: "Markdown" }
  );
});

export async function startBot() {
  try {
    await bot.launch();
    console.log("🤖 Telegram bot started");
  } catch (error) {
    console.error("Failed to start Telegram bot:", error);
  }
}
