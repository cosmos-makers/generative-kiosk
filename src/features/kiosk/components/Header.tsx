"use client";

import { Search } from "lucide-react";
import type { Locale } from "@/types";

function formatHeaderTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

export function Header({
  locale,
  onLocaleToggle,
}: {
  locale: Locale;
  onLocaleToggle: () => void;
}) {
  return (
    <header className="rounded-[34px] border border-white/10 bg-[#1f1f1f] px-5 py-4 text-white kiosk-glow lg:px-8 lg:py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-lg font-bold tracking-tight text-white/85">{formatHeaderTime()}</div>

        <div className="mx-auto flex min-w-[240px] flex-1 items-center gap-3 rounded-full border border-white/10 bg-[#2a2a2a] px-5 py-3 text-sm text-white/65 lg:max-w-[420px] lg:flex-none">
          <Search className="size-4 text-white/45" />
          <span>{locale === "en" ? "Search the kiosk" : "맥도날드 키오스크 검색"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLocaleToggle}
            className="rounded-full bg-[#ffbc0d] px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#1f1f1f]"
          >
            {locale === "en" ? "KO" : "EN"}
          </button>
          <div className="rounded-full bg-[#3a3a3a] px-3 py-2 text-xs font-black text-[#ffcf54]">READY</div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#ffbc0d] text-3xl font-black text-[#1f1f1f] shadow-lg">
            M
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-white/38">
              Self order kiosk
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white lg:text-[2rem]">
              {locale === "en" ? "McDonald-style kiosk" : "맥도날드 스타일 키오스크"}
            </h1>
          </div>
        </div>

        <p className="hidden max-w-xl text-right text-sm leading-7 text-white/55 xl:block">
          {locale === "en"
            ? "Default flow stays in the normal kiosk. Adaptive assistance appears only after user-approved help."
            : "기본 진입은 일반 키오스크이며, 적응형 보조는 사용자가 도움을 수락한 뒤에만 나타납니다."}
        </p>
      </div>
    </header>
  );
}
