"use client";

import type { Locale } from "@/types";

export function Header({
  locale,
  onLocaleToggle,
  onHome,
}: {
  locale: Locale;
  onLocaleToggle: () => void;
  onHome?: () => void;
}) {
  return (
    <header className="flex items-center gap-4 rounded-2xl bg-[#da0000] px-4 py-3 text-white kiosk-glow">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffbc0d]">
        <span className="text-2xl font-black leading-none text-[#da0000]" style={{ fontFamily: "Arial Black, sans-serif" }}>
          M
        </span>
      </div>

      <h1 className="text-xl font-black leading-none tracking-tight text-white" style={{ fontFamily: "Arial Black, sans-serif" }}>
        MDonald<span className="text-[#ffbc0d]">&apos;s</span>
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onLocaleToggle}
          className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10"
        >
          {locale === "en" ? "KO" : "EN"}
        </button>
        {onHome ? (
          <button
            type="button"
            onClick={onHome}
            className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10"
          >
            홈
          </button>
        ) : null}
      </div>
    </header>
  );
}
