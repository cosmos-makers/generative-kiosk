"use client";

const OPTIONS = [
  { id: "dine-in", title: "매장에서 먹기", subtitle: "테이블에서 천천히 드실게요" },
  { id: "takeout", title: "포장하기", subtitle: "빠르게 받아서 가져갈게요" },
] as const;

export function OrderTypeScreen({ onSelect }: { onSelect: (type: "dine-in" | "takeout") => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {OPTIONS.map((option) => (
        <button key={option.id} type="button" onClick={() => onSelect(option.id)} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-left shadow-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-200/80">Start</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white">{option.title}</h2>
          <p className="mt-4 text-lg leading-8 text-white/65">{option.subtitle}</p>
        </button>
      ))}
    </section>
  );
}
