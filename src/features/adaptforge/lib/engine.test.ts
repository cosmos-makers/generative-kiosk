import { describe, expect, it } from "vitest";
import { applySeniorAdaptForge, buildMcdonaldsKioskPIM } from "@/features/adaptforge/lib/engine";
import { getCategories } from "@/lib/menu";

describe("AdaptForge engine", () => {
  it("builds a PIM that matches the kiosk task flow", () => {
    const pim = buildMcdonaldsKioskPIM();

    expect(pim.screens.map((screen) => screen.id)).toEqual([
      "order-type",
      "category-hub",
      "item-shortlist",
      "cart-review",
      "checkout",
    ]);
    expect(pim.tasks).toHaveLength(5);
    expect(pim.menuAxes.length).toBeGreaterThan(0);
  });

  it("reduces choices and prioritizes a current category for the senior profile", () => {
    const activeCategory = getCategories()[0];
    const experience = applySeniorAdaptForge({
      difficultyScore: 88,
      activeCategorySeq: activeCategory?.seq,
      orderType: "dine-in",
      cart: [],
      locale: "ko",
    });

    expect(experience.profile.id).toBe("senior-low-vision-guided");
    expect(experience.categoryChoices).toHaveLength(3);
    expect(experience.categoryChoices[0]?.seq).toBe(activeCategory?.seq);
    expect(experience.featuredItems.length).toBeLessThanOrEqual(3);
    expect(experience.displayScale).toBe("2xl");
    expect(experience.matchedRuleIds).toEqual(["AF-01", "AF-02", "AF-03", "AF-04"]);
  });

  it("keeps the cart visible when items already exist", () => {
    const category = getCategories()[0];
    const menuItem = category?.items[0];

    expect(menuItem).toBeDefined();

    const experience = applySeniorAdaptForge({
      difficultyScore: 76,
      activeCategorySeq: category?.seq,
      orderType: "takeout",
      cart: menuItem
        ? [{ menuItem, quantity: 2, categoryName: category?.korName ?? "버거" }]
        : [],
      locale: "ko",
    });

    expect(experience.cart.totalCount).toBe(2);
    expect(experience.journey.at(-1)?.status).toBe("current");
    expect(experience.narrative).toContain("장바구니");
  });
});
