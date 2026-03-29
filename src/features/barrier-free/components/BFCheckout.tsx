"use client";

import { useState } from "react";
import type { CartItem } from "@/types";
import { submitMockOrder } from "@/lib/orders";
import { estimateMenuPrice, formatPrice, stripHtml } from "@/lib/utils";

export function BFCheckout({
  items,
  onComplete,
}: {
  items: CartItem[];
  onComplete: (orderNumber?: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const total = items.reduce((sum, item) => sum + estimateMenuPrice(item.menuItem.id) * item.quantity, 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 rounded-[1.8rem] border border-white/10 bg-white/[0.06] p-5 text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/70">AdaptForge checkout</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">시니어 프로필에 맞춘 결제 확인 화면</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <div key={item.menuItem.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 text-white">
              <p className="text-sm text-white/45">{item.categoryName}</p>
              <h3 className="mt-1 text-2xl font-black">{stripHtml(item.menuItem.korName)}</h3>
              <p className="mt-2 text-sm text-white/60">수량 {item.quantity} · {item.menuItem.calorie} kcal</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[1.8rem] border border-white/10 bg-[#071710] p-6 text-white">
        <p className="text-xs uppercase tracking-[0.32em] text-white/45">total</p>
        <p className="mt-2 text-4xl font-black">₩ {formatPrice(total)}</p>
        <button
          type="button"
          data-testid="bf-complete-order"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            const orderNumber = await submitMockOrder(items);
            onComplete(orderNumber);
            setSubmitting(false);
          }}
          className="mt-8 w-full rounded-[1.2rem] bg-[#ffbc0d] px-6 py-4 text-lg font-black text-[#2b2318] disabled:opacity-60"
        >
          {submitting ? "주문 처리 중..." : "AdaptForge 화면으로 주문 완료"}
        </button>
      </div>
    </div>
  );
}
