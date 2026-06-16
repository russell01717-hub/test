import { prisma } from "@/lib/db";
import { hash } from "bcrypt-ts";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email va parol majburiy" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Bu email allaqachon ro'yxatdan o'tgan" }, { status: 400 });
    }
    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    return Response.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
