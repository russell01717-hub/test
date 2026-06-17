"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const plans = [
  {
    name: "Bepul",
    price: "0",
    priceNum: 0,
    description: "Boshlang'ich daraja",
    features: ["2 ta test", "CEFR standarti", "Asosiy statistika", "Cheklangan natija"],
    popular: false,
  },
  {
    name: "Standart",
    price: "49",
    priceNum: 49000,
    description: "Eng ommabop",
    features: ["10 ta test", "CEFR + At-tanal", "Batafsil tahlil", "Reytingda qatnashish", "Sertifikat"],
    popular: true,
  },
  {
    name: "Premium",
    price: "99",
    priceNum: 99000,
    description: "Cheksiz imkoniyat",
    features: ["Cheksiz test", "Barcha standartlar", "AI batafsil tahlil", "Reyting + sovrinlar", "Sertifikat", "Shaxsiy mentor"],
    popular: false,
  },
];

export default function PricingPage() {
  const [botUsername, setBotUsername] = useState("arabictestaibot");

  useEffect(() => {
    fetch("/api/bot?action=plans").catch(() => {});
  }, []);

  function getBotLink(planId: string) {
    return `https://t.me/${botUsername}?start=${planId}`;
  }

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
                  {plan.priceNum === 0 ? (
                    <Link href="/auth/register"><Button className="w-full" variant="outline">Boshlash</Button></Link>
                  ) : (
                    <a href={getBotLink(plan.name.toLowerCase())} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        Telegram orqali to'lash
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center animate-fade-in">
            <Card className="max-w-xl mx-auto border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram bot orqali to'lov
                </CardTitle>
                <CardDescription>
                  To'lovni amalga oshirish uchun @{botUsername} botiga o'ting va kerakli tarifni tanlang.
                  Bot sizga karta raqami va to'lov ma'lumotlarini yuboradi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    @{botUsername} ga o'tish
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
