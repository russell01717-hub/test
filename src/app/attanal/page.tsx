import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const skills = [
  { id: "listening", title: "Tinglab tushunish", desc: "Audio materialni tinglab tushunish darajangizni sinang", icon: "M12 1a3 3 0 0 0-3 3v2.5l-5.5 4.5H2v8h20v-8h-1.5L15 6.5V4a3 3 0 0 0-3-3z" },
  { id: "reading", title: "O'qib tushunish", desc: "Matnni o'qib tushunish qobiliyatingizni baholang", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "writing", title: "Yozma nutq", desc: "Yozma ifoda qilish mahoratingizni tekshiring", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "speaking", title: "Og'zaki nutq", desc: "So'zlashish qobiliyatingizni baholang", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
  { id: "grammar", title: "Grammatika", desc: "Arab tili grammatikasini bilishingizni sinang", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

export default function AttanalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center"><span className="text-white font-bold text-sm">ع</span></div>
            <span className="font-bold text-xl gradient-text">ARABICTEST.UZ</span>
          </Link>
          <Link href="/"><Button variant="ghost" size="sm">Orqaga</Button></Link>
        </div>
      </header>
      <section className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-600 text-white">At-tanal al-arobi</Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">At-tanal al-arobi bo'yicha baholash</h1>
            <p className="text-muted-foreground text-lg">Xalqaro standart bo'yicha o'z darajangizni aniqlang</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((s, i) => (
              <Link key={s.id} href={`/attanal/${s.id}`}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 h-full animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
                    </div>
                    <CardTitle className="text-xl">{s.title}</CardTitle>
                    <CardDescription>{s.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="group-hover:translate-x-1 transition-transform p-0 h-auto text-primary">Boshlash →</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
