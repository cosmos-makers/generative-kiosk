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
    </button>
  );
}
