"use client";

import type { Locale, MenuCategory, MenuItem } from "@/types";
import { MenuCard } from "./MenuCard";

export function MenuGrid({
  category,
  locale,
  onSelect,
}: {
  category: MenuCategory;
  locale: Locale;
  onSelect: (item: MenuItem) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--mcd-muted)]">
            Recommended menu
          </p>
          <h2 className="mt-2 text-[2rem] font-black tracking-[-0.05em] text-[var(--mcd-charcoal)]">
            {locale === "en" ? category.engName : category.korName}
          </h2>
        </div>
        <div className="rounded-full border border-[var(--mcd-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--mcd-charcoal)]">
          {category.items.length} items
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {category.items.slice(0, 8).map((item) => (
          <MenuCard item={item} key={item.id} locale={locale} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}
