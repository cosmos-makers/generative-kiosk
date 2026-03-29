import menuData from "@/data/menu.json";
import { stripHtml } from "@/lib/utils";
import type { MenuCategory, MenuData, MenuItem } from "@/types";
const menu = menuData as MenuData;
export const loadMenu = (): MenuData => menu;
export const getCategories = (): MenuCategory[] => menu.categories;
export const getCategoryBySeq = (seq?: number | null) => menu.categories.find((c) => c.seq === seq);
export const findItemById = (id?: number | null): MenuItem | undefined => menu.categories.flatMap((c) => c.items).find((item) => item.id === id);
export const getDisplayName = (item: MenuItem) => stripHtml(item.korName);
