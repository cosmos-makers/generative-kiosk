"use client";

import type { MenuCategory } from "@/types";

export function CategoryTabs({ categories, activeSeq, onChange }: { categories: MenuCategory[]; activeSeq: number; onChange: (seq: number) => void }) {
  return <div className="flex gap-3 overflow-x-auto pb-2">{categories.map((category) => <button className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeSeq === category.seq ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-200"}`} key={category.seq} onClick={() => onChange(category.seq)} type="button">{category.korName}</button>)}</div>;
}
