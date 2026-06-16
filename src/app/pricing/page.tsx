import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Bepul",
    price: "0",
    description: "Boshlang'ich daraja",
    features: ["2 ta test", "CEFR standarti", "Asosiy statistika", "Cheklangan natija"],
    popular: false,
  },
  {
    name: "Standart",
    price: "49",
    description: "Eng ommabop",
    features: ["10 ta test", "CEFR + At-tanal", "Batafsil tahlil", "Reytingda qatnashish", "Sertifikat"],
    popular: true,
  },
  {
    name: "Premium",
    price: "99",
    description: "Cheksiz imkoniyat",
    features: ["Cheksiz test", "Barcha standartlar", "AI batafsil tahlil", "Reyting + sovrinlar", "Sertifikat", "Shaxsiy mentor"],
    popular: false,
  },
];

export default function PricingPage() {
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

      <section className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Narxlar</h1>
            <p className="text-muted-foreground text-lg">O'zingizga mos tarifni tanlang</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? "border-primary shadow-xl scale-105" : ""} animate-fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white">Ommabop</Badge>}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/oy</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register"><Button className="w-full" variant={plan.popular ? "default" : "outline"}>Boshlash</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
