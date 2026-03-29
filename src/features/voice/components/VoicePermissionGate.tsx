"use client";

import { useEffect } from "react";
import { Mic } from "lucide-react";

export function VoicePermissionGate({ onContinue }: { onContinue: () => void }) {
  // 마운트 즉시 진행 — 별도 버튼 클릭 불필요
  useEffect(() => {
    onContinue();
  }, [onContinue]);

  return (
    <section className="flex flex-col items-center justify-center gap-6 rounded-[2rem] border border-sky-200/20 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.24),transparent_32%),linear-gradient(135deg,#08111f_0%,#123451_100%)] p-12 text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-400/20">
        <Mic className="size-8 text-sky-300 animate-pulse" />
      </div>
      <p className="text-lg font-semibold text-sky-100/80">마이크 연결 중...</p>
    </section>
  );
}
