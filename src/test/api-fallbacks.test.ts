import { describe, expect, it } from "vitest";
import {
  buildFallbackGenUIResponse,
  buildFallbackVoiceAction,
} from "@/lib/fallbacks";

describe("api fallbacks", () => {
  it("reduces options for high difficulty scores", () => {
    const result = buildFallbackGenUIResponse({
      difficultyScore: 90,
      step: "items",
      categorySeq: 1,
    });

    expect(result.fontScale).toBe("2xl");
    expect(result.maxOptions).toBe(3);
    expect(result.cards.length).toBeLessThanOrEqual(3);
  });

  it("keeps a category-specific title when category is known", () => {
    const result = buildFallbackGenUIResponse({
      difficultyScore: 72,
      step: "items",
      categorySeq: 1,
    });

    expect(result.title).toContain("버거");
  });

  it("uses cart and order context in the fallback description", () => {
    const result = buildFallbackGenUIResponse({
      difficultyScore: 80,
      step: "items",
      categorySeq: 1,
      orderType: "takeout",
      cartSummary: ["빅맥 세트 x1"],
    });

    expect(result.ctaLabel).toBe("장바구니 검토로 이동");
    expect(result.description).toContain("포장");
  });

  it("matches a specific menu item from natural language", () => {
    const result = buildFallbackVoiceAction({
      transcript: "빅맥 세트 담아줘",
      currentStep: "items",
    });

    expect(result.action).toBe("add-item");
    expect(result.targetItemId).toBe(178);
  });

  it("extracts quantity from natural language", () => {
    const result = buildFallbackVoiceAction({
      transcript: "빅맥 세트 두 개 담아줘",
      currentStep: "items",
    });

    expect(result.action).toBe("add-item");
    expect(result.targetItemId).toBe(178);
    expect(result.quantity).toBe(2);
  });

  it("uses cart context for follow-up phrases like 하나 더", () => {
    const result = buildFallbackVoiceAction({
      transcript: "하나 더 담아줘",
      currentStep: "items",
      cartItems: [{ id: 178, quantity: 1 }],
    });

    expect(result.action).toBe("add-item");
    expect(result.targetItemId).toBe(178);
    expect(result.quantity).toBe(1);
  });

  it("routes checkout language to checkout/cart review flow", () => {
    const result = buildFallbackVoiceAction({
      transcript: "이제 결제할게",
      currentStep: "items",
    });

    expect(result.action).toBe("go-cart");
    expect(result.nextStep).toBe("cart-review");
  });

  it("captures order type intent for takeout", () => {
    const result = buildFallbackVoiceAction({
      transcript: "포장으로 할게",
      currentStep: "order-type",
    });

    expect(result.orderType).toBe("takeout");
    expect(result.nextStep).toBe("category");
  });
});
