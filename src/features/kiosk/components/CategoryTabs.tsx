"use client";

import { getCategoryName } from "@/lib/menu";
import type { Locale, MenuCategory } from "@/types";

function glyph(label: string) {
  if (/버거|burger/i.test(label)) return "🍔";
  if (/해피|happy/i.test(label)) return "🧸";
  if (/사이드|side/i.test(label)) return "🍟";
  if (/디저트|dessert/i.test(label)) return "🍰";
  if (/음료|drink/i.test(label)) return "🥤";
  return label.slice(0, 1).toUpperCase();
}

export function CategoryTabs({
  categories,
  activeSeq,
  onChange,
  locale,
}: {
  categories: MenuCategory[];
  activeSeq: number;
  onChange: (seq: number) => void;
  locale: Locale;
}) {
  return (
    <div className="grid gap-3">
      {categories.map((category) => {
        const label = getCategoryName(category, locale);
        const active = activeSeq === category.seq;

        return (
          <button
            key={category.seq}
            type="button"
            onClick={() => onChange(category.seq)}
            className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-[24px] border px-3 py-4 text-center transition ${
              active
                ? "border-[#d8b04b] bg-[#fff3cf] text-[#1e1c17] shadow-sm"
                : "border-[#ece3d2] bg-white/85 text-[#665f53] hover:border-[#e3d6bf] hover:bg-[#fbf5e8]"
            }`}
          >
            <span
              className={`flex size-10 items-center justify-center rounded-full text-sm font-black ${
                active ? "bg-[#ffbc0d] text-[#1f1f1f]" : "bg-[#f2ecde] text-[#8a7a5e]"
              }`}
            >
              {glyph(label)}
            </span>
            <span className="text-xs font-bold leading-5">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
