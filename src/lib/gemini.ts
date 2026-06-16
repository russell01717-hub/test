import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type SkillType = "listening" | "reading" | "writing" | "speaking" | "grammar";
export type StandardType = "cefr" | "attanal";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const ATTANAL_LEVELS = ["M1", "M2", "M3", "M4", "M5"] as const;

const SKILL_PROMPTS: Record<StandardType, Record<SkillType, string>> = {
  cefr: {
    listening: `You are a CEFR Arabic listening assessment expert. Evaluate the user's listening comprehension based on their response to an audio prompt. Rate them A1-C2. Provide score (0-100), level, detailed feedback in Uzbek, and format as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    reading: `You are a CEFR Arabic reading assessment expert. Evaluate the user's reading comprehension. Rate them A1-C2. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    writing: `You are a CEFR Arabic writing assessment expert. Evaluate the user's written Arabic. Rate them A1-C2. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    speaking: `You are a CEFR Arabic speaking assessment expert. Evaluate the user's spoken Arabic from audio/transcript. Rate them A1-C2. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    grammar: `You are a CEFR Arabic grammar assessment expert. Evaluate the user's Arabic grammar knowledge. Rate them A1-C2. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
  },
  attanal: {
    listening: `You are an At-tanal al-arobi Arabic listening assessment expert. Evaluate the user's listening comprehension. Rate them M1-M5. Provide score (0-100), level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    reading: `You are an At-tanal al-arobi Arabic reading assessment expert. Evaluate the user's reading comprehension. Rate them M1-M5. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    writing: `You are an At-tanal al-arobi Arabic writing assessment expert. Evaluate the user's written Arabic. Rate them M1-M5. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    speaking: `You are an At-tanal al-arobi Arabic speaking assessment expert. Evaluate the user's spoken Arabic. Rate them M1-M5. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
    grammar: `You are an At-tanal al-arobi Arabic grammar assessment expert. Evaluate the user's Arabic grammar. Rate them M1-M5. Provide score, level, feedback in Uzbek as JSON: { "score": number, "level": string, "feedback": string, "strengths": string[], "weaknesses": string[] }`,
  },
};

export const TEST_PROMPTS: Record<StandardType, Record<SkillType, string>> = {
  cefr: {
    listening: `Generate a CEFR Arabic listening test question. Give an Arabic audio transcript (simulated), and ask the user to listen and answer comprehension questions. The response should be in Uzbek and Arabic. Format as JSON: { "instructions": string, "audioScript": string, "questions": { "uz": string, "ar": string }[], "options": string[][] }`,
    reading: `Generate a CEFR Arabic reading test. Provide an Arabic text (appropriate for testing), then 5 comprehension questions. Response in Uzbek and Arabic as JSON: { "title": string, "text": string, "questions": { "uz": string, "ar": string }[], "options": string[][] }`,
    writing: `Generate a CEFR Arabic writing prompt. Give a topic for the user to write about in Arabic. Provide instructions in Uzbek. JSON: { "title": string, "instructions_uz": string, "instructions_ar": string, "wordCount": number }`,
    speaking: `Generate a CEFR Arabic speaking test. Give instructions for the user to record themselves speaking about a topic. JSON: { "title": string, "instructions_uz": string, "instructions_ar": string, "topic": string, "duration_seconds": number }`,
    grammar: `Generate a CEFR Arabic grammar test with 10 multiple choice questions covering various grammar topics. JSON: { "questions": { "uz": string, "ar": string, "options": string[], "correctIndex": number }[] }`,
  },
  attanal: {
    listening: `Generate an At-tanal al-arobi listening test with Arabic audio script and comprehension questions. JSON: { "instructions": string, "audioScript": string, "questions": { "uz": string, "ar": string }[], "options": string[][] }`,
    reading: `Generate an At-tanal al-arobi reading test with Arabic text and questions. JSON: { "title": string, "text": string, "questions": { "uz": string, "ar": string }[], "options": string[][] }`,
    writing: `Generate an At-tanal al-arobi writing prompt. JSON: { "title": string, "instructions_uz": string, "instructions_ar": string, "wordCount": number }`,
    speaking: `Generate an At-tanal al-arobi speaking test. JSON: { "title": string, "instructions_uz": string, "instructions_ar": string, "topic": string, "duration_seconds": number }`,
    grammar: `Generate an At-tanal al-arobi grammar test with 10 multiple choice questions covering Arabic grammar (nahw, sarf, balagha). JSON: { "questions": { "uz": string, "ar": string, "options": string[], "correctIndex": number }[] }`,
  },
};

export async function generateTest(standard: StandardType, skill: SkillType) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = TEST_PROMPTS[standard][skill];
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini response");
  return JSON.parse(jsonMatch[0]);
}

export async function evaluateAnswer(
  standard: StandardType,
  skill: SkillType,
  userAnswer: string,
  questionData?: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `${SKILL_PROMPTS[standard][skill]}\n\nQuestion: ${questionData || "Standard test"}\n\nUser Answer: ${userAnswer}\n\nEvaluate this answer and return JSON.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini evaluation");
  return JSON.parse(jsonMatch[0]);
}

export async function evaluateAudio(
  standard: StandardType,
  skill: SkillType,
  audioBase64: string,
  mimeType: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `${SKILL_PROMPTS[standard][skill]}\n\nAssess the Arabic speech in this audio recording. Return JSON.`;
  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
  ]);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse Gemini evaluation");
  return JSON.parse(jsonMatch[0]);
}
