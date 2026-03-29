"use client";

import { useState } from "react";
import { getDisplayName, getItemPrice } from "@/lib/menu";
import { submitMockOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Locale } from "@/types";

const PAYMENT_METHODS = [
  { id: "simple", label: "간편결제", sublabel: "카카오페이 · 네이버페이 · 삼성페이" },
  { id: "card", label: "신용카드", sublabel: "국내외 신용 · 체크카드" },
] as const;

export function CheckoutScreen({
  items,
  onComplete,
  onBack,
  locale,
}: {
  items: CartItem[];
  onComplete: (orderNumber?: string) => void;
  onBack: () => void;
  locale: Locale;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const totalPrice = items.reduce(
    (sum, item) => sum + getItemPrice(item.menuItem) * item.quantity,
    0,
  );

  return (
    <section className="kiosk-paper rounded-[34px] p-7 text-[#1f1d18] kiosk-shadow">
      <h2 className="text-4xl font-black tracking-tight">
        {locale === "en" ? "Review your order" : "주문 내역 확인"}
      </h2>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.menuItem.id}
            className="rounded-[26px] border border-[#e3dbc9] bg-white/85 p-5"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-[#a08f71]">{item.categoryName}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight">
              {getDisplayName(item.menuItem, locale)}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#655c4d]">
              {locale === "en" ? "Quantity" : "수량"} {item.quantity} · ₩
              {formatPrice(getItemPrice(item.menuItem) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[26px] border border-[#e3dbc9] bg-white/85 p-5">
        <div className="flex items-center justify-between gap-4 text-[#524b41]">
          <span className="text-sm font-semibold uppercase tracking-[0.24em]">
            {locale === "en" ? "Total" : "합계"}
          </span>
          <span className="text-3xl font-black text-[#1f1d18]">₩ {formatPrice(totalPrice)}</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#a08f71]">
          {locale === "en" ? "Payment method" : "결제 수단"}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedPayment(method.id)}
              className={`rounded-[22px] border-2 px-6 py-5 text-left transition ${
                selectedPayment === method.id
                  ? "border-[#ffbc0d] bg-[#fff9e6]"
                  : "border-[#e3dbc9] bg-white/85 hover:border-[#ffbc0d]/60"
              }`}
            >
              <p className="text-lg font-black text-[#1f1d18]">{method.label}</p>
              <p className="mt-1 text-xs text-[#8a7e6e]">{method.sublabel}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[20px] border border-[#cfbea0] bg-white px-5 py-4 text-base font-black text-[#1f1d18]"
        >
          {locale === "en" ? "Back to menu" : "메뉴로 돌아가기"}
        </button>
        <button
          type="button"
          disabled={submitting || !selectedPayment}
          onClick={async () => {
            setSubmitting(true);
            const orderNumber = await submitMockOrder(items);
            onComplete(orderNumber);
            setSubmitting(false);
          }}
          className="rounded-[20px] bg-[#da0000] px-5 py-4 text-base font-black text-white disabled:opacity-40"
        >
          {submitting
            ? locale === "en" ? "Processing…" : "처리 중..."
            : locale === "en" ? "Pay now" : "결제하기"}
        </button>
      </div>
    </section>
  );
}
