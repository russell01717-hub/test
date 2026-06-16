"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      fetch("/api/evaluate?action=history")
        .then((r) => r.json())
        .then((d) => setResults(d.results || []))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const bestLevel = results.length > 0 ? results.sort((a, b) => b.score - a.score)[0]?.level : "-";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center"><span className="text-white font-bold text-sm">ع</span></div>
            <span className="font-bold text-lg gradient-text">ARABICTEST.UZ</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session?.user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Chiqish</Button>
          </div>
        </div>
      </header>

      <section className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-3xl font-bold mb-8 animate-fade-in">Dashboard</h1>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="animate-fade-in"><CardHeader className="pb-2"><CardDescription>Testlar soni</CardDescription><CardTitle className="text-3xl">{results.length}</CardTitle></CardHeader></Card>
            <Card className="animate-fade-in" style={{animationDelay:"0.1s"}}><CardHeader className="pb-2"><CardDescription>O'rtacha ball</CardDescription><CardTitle className="text-3xl">{avgScore}</CardTitle></CardHeader></Card>
            <Card className="animate-fade-in" style={{animationDelay:"0.2s"}}><CardHeader className="pb-2"><CardDescription>Eng yuqori daraja</CardDescription><CardTitle className="text-3xl gradient-text">{bestLevel}</CardTitle></CardHeader></Card>
            <Card className="animate-fade-in" style={{animationDelay:"0.3s"}}><CardHeader className="pb-2"><CardDescription>Standartlar</CardDescription><CardTitle className="text-3xl">{new Set(results.map((r) => r.standard)).size}</CardTitle></CardHeader></Card>
          </div>

          <div className="flex gap-4 mb-8">
            <Link href="/cefr"><Button>CEFR testi</Button></Link>
            <Link href="/attanal"><Button variant="outline">At-tanal al-arobi testi</Button></Link>
            <Link href="/leaderboard"><Button variant="ghost">Reyting</Button></Link>
          </div>

          <h2 className="text-xl font-semibold mb-4">Test tarixi</h2>

          {results.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Hali test topshirmagansiz. Yuqoridagi tugmalar orqali boshlang!</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <Card key={r.id} className="animate-fade-in" style={{animationDelay:`${i*0.05}s`}}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={r.standard === "cefr" ? "default" : "secondary"}>{r.standard.toUpperCase()}</Badge>
                        <span className="font-medium">{r.skill}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{r.level}</div>
                      <div className="text-sm text-muted-foreground">{r.score}/100</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
