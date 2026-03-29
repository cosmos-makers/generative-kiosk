"use client";

import type { MenuCategory, MenuItem } from "@/types";

import { MenuCard } from "./MenuCard";

export function MenuGrid({ category, onSelect }: { category: MenuCategory; onSelect: (item: MenuItem) => void }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{category.items.slice(0, 9).map((item) => <MenuCard item={item} key={item.id} onClick={() => onSelect(item)} />)}</div>;
}
