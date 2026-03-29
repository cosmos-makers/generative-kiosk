import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));
export const formatOrderNumber = (seed = Date.now()) => `A-${String(seed).slice(-3)}`;
export const generateOrderNumber = (seed = Date.now()) => formatOrderNumber(seed);
export const estimateMenuPrice = (seed: number) => 1500 + ((seed % 7) + 1) * 500;
