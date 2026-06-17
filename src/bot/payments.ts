export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export const PLANS: PaymentPlan[] = [
  {
    id: "free",
    name: "Bepul",
    price: 0,
    description: "Boshlang'ich daraja",
    features: ["2 ta test", "CEFR standarti", "Asosiy statistika", "Cheklangan natija"],
  },
  {
    id: "standard",
    name: "Standart",
    price: 49000,
    description: "Eng ommabop",
    features: ["10 ta test", "CEFR + At-tanal", "Batafsil tahlil", "Reytingda qatnashish", "Sertifikat"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 99000,
    description: "Cheksiz imkoniyat",
    features: ["Cheksiz test", "Barcha standartlar", "AI batafsil tahlil", "Reyting + sovrinlar", "Sertifikat", "Shaxsiy mentor"],
  },
];

export const CARD_NUMBER = "9860 1901 2345 6789";
export const CARD_HOLDER = "ARABICTEST UZ";
export const ADMIN_CHAT_ID = 0;

const payments = new Map<string, { userId: number; planId: string; status: "pending" | "confirmed" | "cancelled"; date: Date }>();

export function createPayment(userId: number, planId: string): string {
  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  payments.set(paymentId, { userId, planId, status: "pending", date: new Date() });
  return paymentId;
}

export function confirmPayment(paymentId: string): boolean {
  const payment = payments.get(paymentId);
  if (!payment || payment.status !== "pending") return false;
  payment.status = "confirmed";
  return true;
}

export function getPayment(paymentId: string) {
  return payments.get(paymentId);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}
