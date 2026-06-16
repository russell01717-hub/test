import { auth } from "@/lib/auth";
import { evaluateAnswer, evaluateAudio, generateTest } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import type { SkillType, StandardType } from "@/lib/gemini";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, standard, skill, userAnswer, questionData, audioData, mimeType } = body;

    if (action === "generate") {
      const test = await generateTest(standard as StandardType, skill as SkillType);
      return Response.json({ test });
    }

    if (action === "evaluate") {
      let result;
      if (audioData) {
        result = await evaluateAudio(
          standard as StandardType,
          skill as SkillType,
          audioData,
          mimeType || "audio/webm"
        );
      } else {
        result = await evaluateAnswer(
          standard as StandardType,
          skill as SkillType,
          userAnswer,
          questionData
        );
      }

      const testResult = await prisma.testResult.create({
        data: {
          userId: session.user.id,
          standard: standard as string,
          skill: skill as string,
          level: result.level,
          score: result.score,
          feedback: JSON.stringify(result),
        },
      });

      return Response.json({ result, testResultId: testResult.id });
    }

    if (action === "history") {
      const results = await prisma.testResult.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return Response.json({ results });
    }

    if (action === "leaderboard") {
      const leaderboard = await prisma.testResult.groupBy({
        by: ["userId"],
        where: { standard: standard as string },
        _avg: { score: true },
        _max: { score: true },
        _count: { id: true },
        orderBy: { _avg: { score: "desc" } },
        take: 20,
      });

      const users = await prisma.user.findMany({
        where: { id: { in: leaderboard.map((l) => l.userId) } },
        select: { id: true, name: true, image: true },
      });

      const enriched = leaderboard.map((l) => ({
        ...l,
        user: users.find((u) => u.id === l.userId),
      }));

      return Response.json({ leaderboard: enriched });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "history") {
      const results = await prisma.testResult.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return Response.json({ results });
    }

    if (action === "result") {
      const id = url.searchParams.get("id");
      if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
      const result = await prisma.testResult.findFirst({
        where: { id, userId: session.user.id },
      });
      if (!result) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ result });
    }

    if (action === "leaderboard") {
      const standard = url.searchParams.get("standard") || "cefr";
      const leaderboard = await prisma.testResult.groupBy({
        by: ["userId"],
        where: { standard },
        _avg: { score: true },
        _max: { score: true },
        _count: { id: true },
        orderBy: { _avg: { score: "desc" } },
        take: 20,
      });

      const users = await prisma.user.findMany({
        where: { id: { in: leaderboard.map((l) => l.userId) } },
        select: { id: true, name: true, image: true },
      });

      const enriched = leaderboard.map((l) => ({
        ...l,
        user: users.find((u) => u.id === l.userId),
      }));

      return Response.json({ leaderboard: enriched });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
