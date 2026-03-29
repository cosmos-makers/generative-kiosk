"use client";

export function BFLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="genui-stage-shell space-y-6 rounded-[2rem] border border-[#dcefd8] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_25%),linear-gradient(180deg,#0b2b1a_0%,#123827_100%)] p-6 text-white shadow-[0_24px_40px_rgba(11,43,26,0.18)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/70">AdaptForge flow</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight lg:text-5xl">{title}</h2>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white/70">
          PIM + senior profile injection
        </div>
      </div>
      {children}
    </section>
  );
}
