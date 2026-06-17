import { bot } from "@/bot/index";

export async function POST(request: Request) {
  try {
    const update = await request.json();
    await bot.handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Bot webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
