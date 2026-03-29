"use client";

import { Mic } from "lucide-react";

export function VoicePermissionGate({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-sky-200/20 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.24),transparent_32%),linear-gradient(135deg,#08111f_0%,#123451_100%)] p-8 text-white shadow-[0_24px_40px_rgba(8,17,31,0.24)]">
      <div className="flex items-center gap-3 text-sky-200">
        <Mic className="size-5" />
        <p className="text-xs font-black uppercase tracking-[0.35em]">Adaptive track B</p>
      </div>
      <h2 className="mt-4 text-4xl font-black tracking-tight">음성으로 주문을 도와드릴게요</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-sky-100/82">
        마이크 권한을 확인한 뒤 음성 주문 인터페이스로 진입합니다. 실패하더라도 디버그/자동화
        검증을 위해 텍스트 시뮬레이터가 함께 제공됩니다.
      </p>
      <button
        type="button"
        data-testid="voice-permission-start"
        onClick={onContinue}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-black text-slate-950"
      >
        <Mic className="size-4" />
        마이크 권한 확인 후 시작
      </button>
    </section>
  );
}
