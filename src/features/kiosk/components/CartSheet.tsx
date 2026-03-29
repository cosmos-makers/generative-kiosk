"use client";

import type { CartItem } from "@/types";
import { estimateMenuPrice, formatPrice, stripHtml } from "@/lib/utils";

export function CartSheet({
  items,
  onCheckout,
  onClear,
  onAdjust,
  locale,
}: {
  items: CartItem[];
  onCheckout: () => void;
  onClear: () => void;
  onAdjust: (itemId: number, delta: number) => void;
  locale: "ko" | "en";
}) {
  const totalPrice = items.reduce(
    (sum, item) => sum + estimateMenuPrice(item.menuItem.id) * item.quantity,
    0,
  );

  return (
    <aside className="rounded-[2rem] border border-[#1f1f1f] bg-[#111111] p-4 text-white shadow-[0_24px_40px_rgba(0,0,0,0.18)] lg:px-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">주문 내역</p>
          <div className="mt-3 rounded-[1.45rem] border border-white/8 bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {items.length === 0 ? (
              <p className="text-center text-sm text-white/55">장바구니가 비어 있습니다</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="rounded-[18px] border border-white/8 bg-white/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-white/90">
                      <span className="truncate font-semibold">
                        {locale === "en" ? item.menuItem.engName.replace(/<[^>]+>/g, "") : stripHtml(item.menuItem.korName)}
                      </span>
                      <span className="shrink-0 text-white/45">₩ {formatPrice(estimateMenuPrice(item.menuItem.id) * item.quantity)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/45">{item.categoryName}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`decrease-${item.menuItem.id}`}
                          onClick={() => onAdjust(item.menuItem.id, -1)}
                          className="rounded-full border border-white/10 px-2 py-1"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`increase-${item.menuItem.id}`}
                          onClick={() => onAdjust(item.menuItem.id, 1)}
                          className="rounded-full border border-white/10 px-2 py-1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.45rem] bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">총 예상 금액</p>
          <p className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-white">
            ₩ {formatPrice(totalPrice)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[290px] lg:grid-cols-1">
          <button
            type="button"
            onClick={onClear}
            className="rounded-[1rem] bg-[#d61f1f] px-6 py-4 text-base font-black text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)]"
          >
            주문 취소
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!items.length}
            className="rounded-[1rem] bg-[#86c56a] px-6 py-4 text-base font-black text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.14)] disabled:cursor-not-allowed disabled:bg-[#bfd8b3]"
          >
            {items.length ? "주문 완료" : "메뉴를 담아주세요"}
          </button>
        </div>
      </div>
    </aside>
  );
}
