"use client";

export function IdleScreen({ onStart }: { onStart: () => void }) {
  return (
    <button className="flex h-full min-h-[70vh] w-full flex-col items-center justify-center rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),linear-gradient(135deg,#0f172a,#1e293b_55%,#334155)] p-10 text-center text-white shadow-xl" onClick={onStart} type="button">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl font-black">M</div>
      <p className="text-sm uppercase tracking-[0.36em] text-lime-300">MDonald kiosk</p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight">터치하여 주문을 시작하세요</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">일반 주문 화면으로 진입한 뒤, 사용자가 원할 때만 더 큰 화면 GenUI 또는 음성 주문 보조로 전환합니다.</p>
    </button>
  );
}
