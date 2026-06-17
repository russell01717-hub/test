import "dotenv/config";
import { startBot } from "../src/bot/index";

startBot().catch(console.error);
