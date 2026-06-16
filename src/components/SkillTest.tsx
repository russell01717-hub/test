"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const skillNames: Record<string, string> = {
  listening: "Tinglab tushunish",
  reading: "O'qib tushunish",
  writing: "Yozma nutq",
  speaking: "Og'zaki nutq",
  grammar: "Grammatika",
};

const skillIcons: Record<string, string> = {
  listening: "M12 1a3 3 0 0 0-3 3v2.5l-5.5 4.5H2v8h20v-8h-1.5L15 6.5V4a3 3 0 0 0-3-3z",
  reading: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  writing: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  speaking: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  grammar: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

export default function SkillTestPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const skill = params.skill as string;
  const standard = pathname.startsWith("/attanal") ? "attanal" : "cefr";

  const [step, setStep] = useState<"intro" | "test" | "recording" | "submitting" | "result">("intro");
  const [testData, setTestData] = useState<any>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const startTest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", standard, skill }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestData(data.test);
      if (data.test.questions) {
        setAnswers(new Array(data.test.questions.length).fill(""));
      }
      setStep("test");
      if (skill === "speaking" || skill === "listening") {
        setTimeLeft(data.test.duration_seconds || 120);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [standard, skill]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStep("submitting");
        await submitAudio(blob);
      };

      recorder.start();
      setStep("recording");

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            recorder.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Mikrofonga ruxsat berilmadi");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const submitAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "evaluate", standard, skill, audioData: base64, mimeType: "audio/webm" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult(data.result);
        setStep("result");
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    setStep("submitting");
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          standard,
          skill,
          userAnswer: answers.join("\n---\n"),
          questionData: JSON.stringify(testData),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      setStep("result");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const standardLabel = standard === "cefr" ? "CEFR" : "At-tanal al-arobi";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={`/${standard}`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center"><span className="text-white font-bold text-sm">ع</span></div>
            <span className="font-bold text-lg gradient-text">{standardLabel}</span>
          </Link>
          <div className="flex items-center gap-3">
            {timeLeft > 0 && (
              <Badge variant={timeLeft < 30 ? "destructive" : "secondary"} className="text-sm px-3 py-1">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </Badge>
            )}
            <Badge variant="outline">{skillNames[skill] || skill}</Badge>
          </div>
        </div>
      </header>

      <section className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="pt-6">
                <div className="text-destructive text-center">
                  <p className="font-semibold mb-2">Xatolik</p>
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(""); setStep("intro"); }}>Qaytadan urinish</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "intro" && (
            <Card className="animate-scale-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={skillIcons[skill] || skillIcons.listening} /></svg>
                </div>
                <CardTitle className="text-2xl">{skillNames[skill] || skill} testi</CardTitle>
                <CardDescription className="text-base">
                  {standardLabel} standarti bo'yicha {skillNames[skill]?.toLowerCase() || skill} ko'nikmangiz baholanadi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="gradient-card rounded-lg p-4 text-center"><div className="font-semibold text-lg">{skill === "speaking" ? "2-3 daqiqa" : "10-15 daqiqa"}</div><div className="text-muted-foreground">Davomiyligi</div></div>
                  <div className="gradient-card rounded-lg p-4 text-center"><div className="font-semibold text-lg">AI</div><div className="text-muted-foreground">Baholash</div></div>
                </div>
                <Button size="lg" className="w-full" onClick={startTest} disabled={loading}>
                  {loading ? "Yuklanmoqda..." : "Testni boshlash"}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "test" && testData && (skill === "writing" || skill === "grammar") && (
            <div className="space-y-6 animate-fade-in">
              {(testData.questions || []).map((q: any, i: number) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full gradient-bg text-white text-xs flex items-center justify-center">{i + 1}</span>
                      {q.uz || q.question_uz || `Savol ${i + 1}`}
                    </CardTitle>
                    {q.ar && <CardDescription className="arabic-text text-lg">{q.ar}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {q.options ? (
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div
                            key={oi}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary ${answers[i] === opt ? "border-primary bg-primary/5" : ""}`}
                            onClick={() => {
                              const newAnswers = [...answers];
                              newAnswers[i] = opt;
                              setAnswers(newAnswers);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Textarea
                        value={answers[i] || ""}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[i] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        placeholder="Javobingizni yozing..."
                        className="min-h-[120px]"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button size="lg" className="w-full" onClick={submitAnswers} disabled={loading || answers.some((a) => !a)}>
                {loading ? "Baholanmoqda..." : "Javoblarni yuborish"}
              </Button>
            </div>
          )}

          {step === "test" && testData && (skill === "speaking" || skill === "listening") && (
            <Card className="animate-fade-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={skillIcons[skill]} /></svg>
                </div>
                <CardTitle className="text-xl">{testData.title || testData.topic}</CardTitle>
                <CardDescription className="text-base">{testData.instructions_uz || testData.instructions}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testData.topic && (
                  <div className="gradient-card rounded-lg p-4">
                    <p className="font-semibold mb-1">Mavzu:</p>
                    <p className="arabic-text text-lg">{testData.topic}</p>
                  </div>
                )}
                {testData.audioScript && (
                  <div className="gradient-card rounded-lg p-4">
                    <p className="font-semibold mb-1">Audio matn:</p>
                    <p className="text-sm text-muted-foreground">{testData.audioScript}</p>
                  </div>
                )}
                <Button size="lg" className="w-full" onClick={startRecording}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  Yozib olishni boshlash
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "recording" && (
            <Card className="animate-scale-in text-center">
              <CardContent className="py-12">
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                </div>
                <p className="text-xl font-semibold mb-2">Yozib olinmoqda...</p>
                <p className="text-muted-foreground mb-6">Gapirishni tugatganingizda tugmani bosing</p>
                <Button variant="destructive" size="lg" onClick={stopRecording}>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                  To'xtatish
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "submitting" && (
            <Card className="animate-scale-in text-center">
              <CardContent className="py-12">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold">AI baholanmoqda...</p>
                <p className="text-muted-foreground">Iltimos, kuting</p>
              </CardContent>
            </Card>
          )}

          {step === "result" && result && (
            <div className="space-y-6 animate-fade-in">
              <Card className="text-center overflow-hidden">
                <div className="gradient-bg p-8 text-white">
                  <div className="text-5xl font-bold mb-2">{result.level}</div>
                  <div className="text-white/80">{standardLabel} daraja</div>
                </div>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Umumiy ball</span>
                      <span className="font-semibold">{result.score}/100</span>
                    </div>
                    <Progress value={result.score} className="h-2" />
                  </div>
                  <p className="text-muted-foreground">{result.feedback}</p>
                </CardContent>
              </Card>

              {result.strengths && result.strengths.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Kuchli tomonlar</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {result.weaknesses && result.weaknesses.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Yaxshilanishi kerak</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Link href={`/${standard}`} className="flex-1">
                  <Button variant="outline" className="w-full">Orqaga</Button>
                </Link>
                <Button className="flex-1" onClick={startTest}>Qayta topshirish</Button>
              </div>
            </div>
          )}

          {loading && step === "intro" && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Test yuklanmoqda...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
