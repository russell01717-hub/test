import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiquidNav } from "@/components/LiquidNav";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <LiquidNav />

      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm animate-fade-in">AI Texnologiyasi asosida baholash</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight animate-fade-in">
              Arab tilini bilish darajangizni{" "}
              <span className="gradient-text">aniqlang</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
              CEFR va At-tanal al-arobi xalqaro standartlari bo'yicha AI yordamida arab tili darajangizni professional baholang
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Link href="/cefr"><Button size="lg" className="min-w-[200px] h-12 text-base">CEFR bo'yicha sinov</Button></Link>
              <Link href="/attanal"><Button size="lg" variant="outline" className="min-w-[200px] h-12 text-base">At-tanal al-arobi</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Aniq natija", desc: "Har bir ko'nikma bo'yicha batafsil tahlil va AI tomonidan baholash" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Tez sinov", desc: "Har bir test 20-30 daqiqa davom etadi, natija darhol" },
              { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", title: "Professional", desc: "Xalqaro standartlarga mos, AI yordamida baholash tizimi" },
            ].map((f, i) => (
              <Card key={i} className="text-center animate-fade-in border-0 shadow-lg hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                  </div>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Standartlar bo'yicha baholash</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Ikki xalqaro standart asosida arab tili bilimingizni to'liq baholang</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/cefr">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/50 h-full">
                <CardHeader><Badge className="w-fit mb-2 gradient-bg text-white">CEFR</Badge><CardTitle className="text-2xl">CEFR standarti</CardTitle><CardDescription className="text-base">Yevropa til referens ramkasi bo'yicha A1 dan C2 gacha baholash</CardDescription></CardHeader>
                <CardContent><div className="flex flex-wrap gap-2">{["Tinglab tushunish","O'qib tushunish","Yozma nutq","Og'zaki nutq"].map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div></CardContent>
              </Card>
            </Link>
            <Link href="/attanal">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-purple-500/50 h-full">
                <CardHeader><Badge className="w-fit mb-2 bg-purple-600 text-white">At-tanal al-arobi</Badge><CardTitle className="text-2xl">At-tanal al-arobi</CardTitle><CardDescription className="text-base">Xalqaro arab tili standarti bo'yicha M1 dan M5 gacha baholash</CardDescription></CardHeader>
                <CardContent><div className="flex flex-wrap gap-2">{["Tinglab tushunish","O'qib tushunish","Yozma nutq","Og'zaki nutq","Grammatika"].map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div></CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 gradient-bg text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[{n:"2",d:"Baholash standarti"},{n:"9",d:"Ko'nikma turlari"},{n:"AI",d:"Yordamida baholash"},{n:"100%",d:"Onlayn"}].map((s,i) => (
              <div key={i} className="animate-fade-in" style={{animationDelay:`${i*0.1}s`}}>
                <div className="text-4xl font-bold mb-1">{s.n}</div>
                <div className="text-white/80 text-sm">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded gradient-bg flex items-center justify-center"><span className="text-white font-bold text-xs">ع</span></div>
              <span className="font-bold gradient-text">ARABICTEST.UZ</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 ARABICTEST.UZ. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
