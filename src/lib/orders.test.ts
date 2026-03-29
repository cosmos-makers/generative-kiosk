import { describe, expect, it, vi, afterEach } from "vitest";
import type { CartItem, MenuItem } from "@/types";
import { submitMockOrder } from "@/lib/orders";

const item: MenuItem = {
  id: 1,
  korName: "테스트 버거",
  engName: "Test Burger",
  description: "desc",
  calorie: "500",
  imageUrl: "https://example.com/item.png",
};

const cart: CartItem[] = [{ menuItem: item, quantity: 1, categoryName: "버거" }];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitMockOrder", () => {
  it("uses the API order number when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ orderNumber: "A-777" }),
      }),
    );

    await expect(submitMockOrder(cart)).resolves.toBe("A-777");
  });

  it("falls back to a generated order number when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await submitMockOrder(cart);
    expect(result).toMatch(/^A-/);
  });
});
