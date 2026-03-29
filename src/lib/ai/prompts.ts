import type { BFStep, KioskStep } from "@/types";

export const buildGenUIPrompt = (input: {
  difficultyScore: number;
  step: BFStep;
  orderType?: string | null;
  summary: string;
  categories: string[];
  items: string[];
  cartSummary?: string[];
}) =>
  [
    "당신은 한국어 배리어프리 키오스크의 Generative UI 엔진입니다.",
    "반드시 JSON만 반환하세요.",
    "화면을 더 쉽게 읽고 고를 수 있게 재구성하세요.",
    "debug 정보는 포함하지 마세요.",
    "JSON schema:",
    JSON.stringify({
      title: "도움을 드릴게요",
      description: "현재 단계 안내",
      fontScale: "xl",
      maxOptions: 4,
      cards: [
        {
          id: "1",
          title: "대표 메뉴",
          subtitle: "선택지 1",
          helper: "큰 글씨와 적은 선택지",
          emphasis: "primary",
          itemId: 178,
          categorySeq: 1,
          actionLabel: "장바구니 담기",
        },
      ],
      ctaLabel: "이 단계 그대로 진행",
      narration: "천천히 읽고 선택하실 수 있게 정리했어요.",
    }),
    "context:",
    "difficultyScore=" + input.difficultyScore,
    "step=" + input.step,
    "orderType=" + (input.orderType ?? "none"),
    "summary=" + input.summary,
    "categories=" + input.categories.join(", "),
    "candidateItems=" + input.items.join(", "),
    "cartSummary=" + (input.cartSummary?.join(", ") ?? "empty"),
  ].join("\n");

export const buildVoicePrompt = (input: {
  transcript: string;
  difficultyScore: number;
  currentStep: BFStep | KioskStep;
  categories: string[];
  items: string[];
  cartSummary?: string[];
}) =>
  [
    "당신은 한국어 음성 주문 키오스크 도우미입니다.",
    "반드시 JSON만 반환하세요.",
    "사용자의 자연어 발화를 이해하고 다음 행동을 결정하세요.",
    "JSON schema:",
    JSON.stringify({
      reply: "안내 문장",
      nextStep: "items",
      action: "recommend",
      targetItemId: 0,
      targetCategorySeq: 0,
    }),
    "context:",
    "difficultyScore=" + input.difficultyScore,
    "currentStep=" + input.currentStep,
    "categories=" + input.categories.join(", "),
    "items=" + input.items.join(", "),
    "cartSummary=" + (input.cartSummary?.join(", ") ?? "empty"),
    "transcript=" + input.transcript,
  ].join("\n");
