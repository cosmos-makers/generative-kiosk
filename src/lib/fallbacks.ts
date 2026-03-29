import type { AdaptiveUIResponse, BFStep, KioskStep, VoiceOrderAction } from "@/types";
import {
  findItemById,
  getCategories,
  getCategoryBySeq,
  getDisplayName,
} from "@/lib/menu";
import { stripHtml } from "@/lib/utils";

function normalizeText(value: string) {
  return value.replace(/[^가-힣a-z0-9]/gi, "").toLowerCase();
}

function extractQuantity(transcript: string) {
  if (/세\s*개|3개|3 개/.test(transcript)) return 3;
  if (/두\s*개|2개|2 개/.test(transcript)) return 2;
  return 1;
}

export function buildFallbackGenUIResponse(input: {
  difficultyScore: number;
  step: BFStep;
  categorySeq?: number | null;
  orderType?: "dine-in" | "takeout" | null;
  cartSummary?: string[];
}): AdaptiveUIResponse {
  const fontScale =
    input.difficultyScore >= 85
      ? "2xl"
      : input.difficultyScore >= 70
        ? "xl"
        : "lg";
  const maxOptions = input.difficultyScore >= 85 ? 3 : input.difficultyScore >= 70 ? 4 : 6;
  const categories = getCategories();
  const category = getCategoryBySeq(input.categorySeq ?? categories[0]?.seq);
  const cards = (category?.items ?? categories[0]?.items ?? [])
    .slice(0, maxOptions)
    .map((item, index) => ({
      id: String(item.id),
      title: getDisplayName(item),
      subtitle: item.calorie,
      itemId: item.id,
      categorySeq: category?.seq,
      helper:
        index === 0
          ? "가장 쉬운 선택지부터 보여드려요."
          : "선택지 수를 줄여 부담을 낮췄어요.",
      actionLabel: "장바구니 담기",
      emphasis: (index === 0 ? "primary" : "secondary") as
        | "primary"
        | "secondary",
    }));

  const hasCart = Boolean(input.cartSummary?.length);

  return {
    title: category ? `${category.korName} 추천` : "도움 모드 추천",
    description: hasCart
      ? `현재 ${input.orderType === "takeout" ? "포장" : input.orderType === "dine-in" ? "매장" : "주문"} 흐름을 유지하면서 판단하기 쉬운 선택지만 크게 다시 보여줍니다.`
      : "현재 단계에서 판단하기 쉬운 선택지만 크게 다시 보여줍니다.",
    fontScale,
    maxOptions,
    cards,
    ctaLabel: hasCart ? "장바구니 검토로 이동" : "이 단계 그대로 진행",
    narration: "천천히 읽고 선택하실 수 있도록 화면을 정리했어요.",
  };
}

export function buildFallbackVoiceAction(input: {
  transcript: string;
  currentStep: BFStep | KioskStep;
  cartItems?: Array<{ id: number; quantity: number }>;
}): VoiceOrderAction {
  const transcript = input.transcript.toLowerCase();
  const firstCategory = getCategories()[0];
  const firstItem = firstCategory?.items[0];
  const flattenedItems = getCategories().flatMap((category) =>
    category.items.map((item) => ({ category, item })),
  );

  const matchedItem = flattenedItems.find(({ item }) =>
    normalizeText(transcript).includes(normalizeText(stripHtml(item.korName))),
  );

  if (matchedItem) {
    const quantity = extractQuantity(transcript);
    return {
      reply: `${getDisplayName(matchedItem.item)} 메뉴 ${quantity}개를 담아드릴게요.`,
      nextStep: "items",
      action: "add-item",
      targetCategorySeq: matchedItem.category.seq,
      targetItemId: matchedItem.item.id,
      quantity,
    };
  }

  const matchedCategory = getCategories().find((category) =>
    normalizeText(transcript).includes(normalizeText(category.korName)),
  );

  if (matchedCategory) {
    return {
      reply: `${matchedCategory.korName}부터 크게 보여 드릴게요.`,
      nextStep: "items",
      action: "recommend",
      targetCategorySeq: matchedCategory.seq,
      targetItemId: matchedCategory.items[0]?.id,
    };
  }

  if (transcript.includes("포장")) {
    return {
      reply: "좋아요. 포장 주문으로 진행할게요.",
      nextStep: "category",
      action: "recommend",
      orderType: "takeout",
    };
  }

  if (transcript.includes("매장")) {
    return {
      reply: "좋아요. 매장에서 드시는 주문으로 진행할게요.",
      nextStep: "category",
      action: "recommend",
      orderType: "dine-in",
    };
  }

  if (transcript.includes("장바구니") || transcript.includes("결제")) {
    return {
      reply: "장바구니를 확인하고 결제로 넘어갈게요.",
      nextStep: "cart-review",
      action: "go-cart",
    };
  }

  const wantsAnother =
    transcript.includes("하나더") ||
    transcript.includes("하나 더") ||
    transcript.includes("더줘") ||
    transcript.includes("더 줘");

  if (wantsAnother && input.cartItems?.length) {
    const lastCartItem = input.cartItems[input.cartItems.length - 1];
    const item = findItemById(lastCartItem.id);

    if (item) {
      return {
        reply: `${getDisplayName(item)} 메뉴를 하나 더 담아드릴게요.`,
        nextStep: "items",
        action: "add-item",
        targetItemId: item.id,
        targetCategorySeq: getCategories().find((category) =>
          category.items.some((candidate) => candidate.id === item.id),
        )?.seq,
        quantity: 1,
      };
    }
  }

  return {
    reply: `${firstCategory?.korName ?? "인기 메뉴"}부터 크게 보여 드릴게요.`,
    nextStep: "items",
    action: "recommend",
    targetCategorySeq: firstCategory?.seq,
    targetItemId: firstItem?.id,
  };
}
