"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { getDisplayName, getItemPrice } from "@/lib/menu";
import { formatPrice, stripHtml } from "@/lib/utils";
import type { Locale, MenuItem } from "@/types";

export function MenuCard({
  item,
  onClick,
  locale,
}: {
  item: MenuItem;
  onClick: () => void;
  locale: Locale;
}) {
  return (
    <button
      className="group flex h-full flex-col rounded-[28px] border border-[#ece6d8] bg-white px-4 py-5 text-left shadow-[0_16px_40px_rgba(49,43,26,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[#ffbc0d] hover:shadow-[0_22px_48px_rgba(49,43,26,0.18)]"
      data-testid={`menu-item-${item.id}`}
      onClick={onClick}
      type="button"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,#fff8db_0%,#fff4df_35%,#fff_100%)]">
        <Image
          alt={stripHtml(item.korName)}
          className="object-contain p-4 transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1280px) 15vw, (min-width: 768px) 22vw, 80vw"
          src={item.imageUrl}
          unoptimized
        />
        <div className="absolute right-3 top-3 rounded-full bg-[#da291c] px-2 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white">
          {item.newIcon || "new"}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#a8926b]">
          {item.menuStatus?.split(",")[0] ?? "menu"}
        </p>
        <h3 className="mt-2 text-lg font-black tracking-tight text-[#201d17] lg:text-xl">
          {getDisplayName(item, locale)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6c6456]">
          {stripHtml(item.description).replace(/\s+/g, " ").trim()}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9b8a6c]">price</p>
            <p className="mt-1 text-xl font-black text-[#1e1b17]">₩ {formatPrice(getItemPrice(item))}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1f1f1f] px-4 py-2 text-sm font-black text-[#ffbc0d]">
            <Plus className="size-4" />
            담기
          </span>
        </div>
      </div>
    </button>
  );
}
