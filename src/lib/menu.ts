import menuData from "@/data/menu.json";
import { stripHtml } from "@/lib/utils";
import type { Locale, MenuCategory, MenuData, MenuItem } from "@/types";

const menu = menuData as MenuData;

export const loadMenu = (): MenuData => menu;
export const getCategories = (): MenuCategory[] => menu.categories;
export const getCategoryBySeq = (seq?: number | null) =>
  menu.categories.find((category) => category.seq === seq);
export const findItemById = (id?: number | null): MenuItem | undefined =>
  menu.categories.flatMap((category) => category.items).find((item) => item.id === id);
export const getDisplayName = (item: MenuItem, locale: Locale = "ko") =>
  stripHtml(locale === "en" ? item.engName || item.korName : item.korName);
export const getCategoryName = (category: MenuCategory, locale: Locale = "ko") =>
  locale === "en" ? category.engName || category.korName : category.korName;
export const getMenuSearchText = (item: MenuItem) =>
  [item.korName, item.engName, item.description].map(stripHtml).join(" ").toLowerCase();
export const getItemPrice = (item: MenuItem) => {
  const base = item.menuStatus?.includes("세트") ? 4800 : 2600;
  const step = (item.id % 6) * 400;
  return base + step;
};
