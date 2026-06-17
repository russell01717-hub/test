"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useSession } from "next-auth/react";

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

const CARD_NUMBER = "9860 1901 2345 6789";
const CARD_HOLDER = "ARABICTEST UZ";

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(plan: typeof plans[0]) {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    setSelectedPlan(plan);
    setPaymentId("");
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentId.trim() || !selectedPlan) return;
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: paymentId.trim(), planId: selectedPlan.name.toLowerCase(), amount: selectedPlan.priceNum }),
    });
    setSubmitted(true);
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
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => handleSelect(plan)}>
                    {plan.priceNum === 0 ? "Boshlash" : "Sotib olish"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && selectedPlan.priceNum > 0 && !submitted && (
            <Card className="max-w-lg mx-auto mt-12 animate-scale-in border-primary/30">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{selectedPlan.name} tarifi</CardTitle>
                <CardDescription>To'lov ma'lumotlari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="gradient-card rounded-lg p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">To'lov summasi</p>
                  <p className="text-3xl font-bold">{formatPrice(selectedPlan.priceNum)}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm text-muted-foreground">💳 Karta raqami</p>
                  <p className="text-lg font-mono font-bold tracking-wider select-all">{CARD_NUMBER}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm text-muted-foreground">👤 Karta egasi</p>
                  <p className="text-lg font-semibold">{CARD_HOLDER}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">To'lovni amalga oshirgandan so'ng, to'lov ID sini kiriting:</p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="paymentId">To'lov ID</Label>
                      <Input id="paymentId" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="To'lov raqamini kiriting" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={!paymentId.trim()}>To'lovni tasdiqlash</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}

          {submitted && (
            <Card className="max-w-lg mx-auto mt-12 animate-scale-in text-center border-green-500/30">
              <CardContent className="py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">So'rovingiz qabul qilindi!</h3>
                <p className="text-muted-foreground mb-4">Admin to'lovni tekshirib, hisobingizni faollashtiradi. Bu bir necha daqiqa olishi mumkin.</p>
                <Link href="/dashboard"><Button>Dashboard</Button></Link>
              </CardContent>
            </Card>
          )}

          {!selectedPlan && (
            <div className="text-center mt-12 animate-fade-in">
              <p className="text-sm text-muted-foreground">💳 Karta: {CARD_NUMBER} | {CARD_HOLDER}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
