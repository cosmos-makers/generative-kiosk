"use client";

import { ArrowRight, UtensilsCrossed } from "lucide-react";

const OPTIONS = [
  {
    id: "dine-in",
    title: "매장에서 먹기",
    subtitle: "트레이로 받아 자리에서 천천히 드실게요.",
    eyebrow: "Eat here",
  },
  {
    id: "takeout",
    title: "포장하기",
    subtitle: "빠르게 받아서 가져가실 수 있게 포장해 드려요.",
    eyebrow: "Take out",
  },
] as const;

export function OrderTypeScreen({ onSelect }: { onSelect: (type: "dine-in" | "takeout") => void }) {
  return (
    <section className="kiosk-paper kiosk-grid-pattern rounded-[34px] p-7 text-[#221f1a] kiosk-shadow">
      <div className="flex items-center gap-3 text-[#a76b00]">
        <UtensilsCrossed className="size-5" />
        <p className="text-xs font-black uppercase tracking-[0.32em]">Welcome</p>
      </div>
      <h2 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">
        주문 방식을 먼저 선택해 주세요
      </h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            data-testid={`order-type-${option.id}`}
            type="button"
            onClick={() => onSelect(option.id)}
            className="group rounded-[28px] border border-[#d4ccb8] bg-white/95 px-6 py-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#ffbc0d] hover:shadow-xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#c2482d]">
              {option.eyebrow}
            </p>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-[#1d1b18]">
              {option.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#5f574a]">{option.subtitle}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1d1b18]">
              이 흐름으로 시작하기
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
