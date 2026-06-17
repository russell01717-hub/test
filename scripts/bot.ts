import "dotenv/config";
import { bot } from "../src/bot/index";

bot.launch().then(() => console.log("🤖 Telegram bot started"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
