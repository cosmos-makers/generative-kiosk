"use client";

import Image from "next/image";
import type { MenuItem } from "@/types";
import { stripHtml } from "@/lib/utils";

export function MenuCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return <button className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl" onClick={onClick} type="button"><div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100"><Image alt={stripHtml(item.korName)} className="object-cover transition duration-500 group-hover:scale-105" fill sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 90vw" src={item.imageUrl} unoptimized /></div><div className="space-y-2 p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-semibold text-slate-950">{stripHtml(item.korName)}</h3>{item.newIcon ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">NEW</span> : null}</div><p className="line-clamp-2 text-sm leading-6 text-slate-500">{item.description.replace(/\s+/g, " ").trim()}</p><p className="text-sm font-medium text-slate-700">{item.calorie} kcal</p></div></button>;
}
