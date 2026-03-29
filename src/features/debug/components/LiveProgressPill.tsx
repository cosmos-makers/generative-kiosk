"use client";

import { useKioskStore } from "@/store/kiosk";

export function LiveProgressPill() {
  const liveProgress = useKioskStore((s) => s.liveProgress);
  const debugEnabled = useKioskStore((s) => s.debugEnabled);
  const dot =
    liveProgress.stability === "stable"
      ? "bg-emerald-400"
      : liveProgress.stability === "watching"
        ? "bg-amber-300"
        : "bg-rose-400";

  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 rounded-full bg-[#3d4152] px-5 py-3 text-xs text-white shadow-[0_12px_20px_rgba(24,26,36,0.2)]">
      <span className={`size-2 rounded-full ${dot}`} />
      <span className="font-semibold uppercase tracking-[0.25em] text-white/55">Live build</span>
      <span className="max-w-[32rem] truncate text-white/90">{liveProgress.label}</span>
      {debugEnabled ? (
        <span className="rounded-full bg-[#ffcc32]/20 px-2 py-1 font-semibold text-[#fff4b5]">
          DEBUG ON
        </span>
      ) : null}
    </div>
  );
}
