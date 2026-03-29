"use client";

import { useState } from "react";
import { getDisplayName, getItemPrice } from "@/lib/menu";
import { submitMockOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Locale } from "@/types";

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
  const totalPrice = items.reduce(
    (sum, item) => sum + getItemPrice(item.menuItem) * item.quantity,
    0,
  );

  return (
    <section className="kiosk-paper rounded-[34px] p-7 text-[#1f1d18] kiosk-shadow">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-[#c2482d]">Mock checkout</p>
      <h2 className="mt-4 text-4xl font-black tracking-tight">
        {locale === "en"
          ? "Review the tray before mock payment"
          : "결제 전에 주문 내역을 마지막으로 확인하세요"}
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
            {locale === "en" ? "Estimated total" : "총 예상 금액"}
          </span>
          <span className="text-3xl font-black text-[#1f1d18]">₩ {formatPrice(totalPrice)}</span>
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
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            const orderNumber = await submitMockOrder(items);
            onComplete(orderNumber);
            setSubmitting(false);
          }}
          className="rounded-[20px] bg-[#7bc769] px-5 py-4 text-base font-black text-[#17310f] disabled:opacity-60"
        >
          {submitting
            ? locale === "en"
              ? "Submitting…"
              : "주문 처리 중..."
            : locale === "en"
              ? "Complete payment"
              : "결제 완료"}
        </button>
      </div>
    </section>
  );
}
