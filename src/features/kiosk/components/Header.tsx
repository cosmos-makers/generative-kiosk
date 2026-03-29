"use client";

export function Header({ title = "MDonald Barrier-Free Kiosk" }: { title?: string }) {
  return (
    <header className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-[#0f1724]/90 px-6 py-4 shadow-xl backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Landscape-first kiosk</p>
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      </div>
      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">실행 중</div>
    </header>
  );
}
