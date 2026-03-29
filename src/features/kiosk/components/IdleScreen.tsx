"use client";

export function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <button
      className="flex min-h-[60vh] w-full flex-col items-center justify-center rounded-[36px] bg-[var(--mcd-charcoal)] px-8 py-16 text-center text-white kiosk-shadow"
      onClick={onStart}
      type="button"
    >
      <div className="text-7xl font-black text-[var(--mcd-yellow)]">M</div>
      <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/60">self ordering kiosk</p>
      <h1 className="mt-4 text-5xl font-black">터치하여 주문을 시작하세요</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">
        먼저 일반 모드로 진입하고, 필요할 때만 큰 글씨 AI 또는 음성 보조를 켤 수 있습니다.
      </p>
    </button>
  );
}
