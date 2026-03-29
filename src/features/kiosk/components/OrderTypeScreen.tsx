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
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="kiosk-paper kiosk-grid-pattern rounded-[34px] p-7 text-[#221f1a] kiosk-shadow">
        <div className="flex items-center gap-3 text-[#a76b00]">
          <UtensilsCrossed className="size-5" />
          <p className="text-xs font-black uppercase tracking-[0.32em]">Welcome</p>
        </div>
        <h2 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">
          주문 방식을 먼저 선택해 주세요
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f574a] lg:text-lg">
          실제 키오스크처럼 일반 주문 화면에서 시작하고, 사용자가 어려움을 느낄 때만
          GenUI 또는 음성 안내를 제안합니다.
        </p>
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
      </div>

      <div className="overflow-hidden rounded-[34px] border border-[#573318] bg-[linear-gradient(135deg,#7b1f0f_0%,#c23818_35%,#ff9433_100%)] p-7 text-white kiosk-shadow">
        <p className="text-xs font-black uppercase tracking-[0.34em] text-white/70">Promo banner</p>
        <h3 className="mt-4 text-4xl font-black tracking-tight">라즈베리 크림치즈 파이</h3>
        <p className="mt-4 max-w-md text-base leading-8 text-white/85">
          레퍼런스 화면의 상단 프로모션 배너 톤을 그대로 가져온 따뜻한 그라데이션과 큰 제품
          메시지로 첫인상을 맞췄습니다.
        </p>
        <div className="mt-8 rounded-[28px] border border-white/15 bg-black/15 p-5 backdrop-blur-sm">
          <p className="text-sm text-white/70">Adaptive readiness</p>
          <ul className="mt-3 space-y-3 text-sm leading-7 text-white/90">
            <li>• 일반 모드가 기본값으로 유지됩니다.</li>
            <li>• 도움 제안은 난이도·체류 시간 조건을 넘을 때만 나타납니다.</li>
            <li>• 디버그 on에서만 카메라/점수/로그를 오버레이합니다.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
