"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [standard, setStandard] = useState("cefr");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/evaluate?action=leaderboard&standard=${standard}`)
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, [standard]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center"><span className="text-white font-bold text-sm">ع</span></div>
            <span className="font-bold text-lg gradient-text">ARABICTEST.UZ</span>
          </Link>
          <Link href="/"><Button variant="ghost" size="sm">Orqaga</Button></Link>
        </div>
      </header>

      <section className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Reyting</h1>
            <div className="flex justify-center gap-2">
              <Button variant={standard === "cefr" ? "default" : "outline"} size="sm" onClick={() => setStandard("cefr")}>CEFR</Button>
              <Button variant={standard === "attanal" ? "default" : "outline"} size="sm" onClick={() => setStandard("attanal")}>At-tanal al-arobi</Button>
            </div>
          </div>

          {loading ? (
            <Card><CardContent className="py-12 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></CardContent></Card>
          ) : leaderboard.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Hali hech kim test topshirmagan</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, i) => (
                <Card key={entry.userId} className={`animate-fade-in ${i < 3 ? "border-primary/30" : ""}`} style={{animationDelay:`${i*0.05}s`}}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.user?.image || ""} />
                      <AvatarFallback>{entry.user?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{entry.user?.name || "Foydalanuvchi"}</div>
                      <div className="text-sm text-muted-foreground">{entry._count.id} ta test</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{Math.round(entry._avg.score)}</div>
                      <div className="text-xs text-muted-foreground">o'rtacha ball</div>
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
