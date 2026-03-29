"use client";

import { getCategories, getCategoryName, getDisplayName, getItemPrice } from "@/lib/menu";
import { formatPrice, stripHtml } from "@/lib/utils";
import type { CartItem, Locale, OrderType } from "@/types";

export interface PIMPrimitive {
  id: string;
  kind:
    | "choice-group"
    | "card-grid"
    | "progress-indicator"
    | "summary-panel"
    | "confirmation"
    | "cta";
  purpose: string;
}

export interface PIMScreen {
  id: "order-type" | "category-hub" | "item-shortlist" | "cart-review" | "checkout";
  title: string;
  userGoal: string;
  systemGoal: string;
  inputs: string[];
  outputs: string[];
  primitives: PIMPrimitive[];
}

export interface PIMTask {
  id: string;
  label: string;
  description: string;
}

export interface KioskPIM {
  id: string;
  title: string;
  domain: string;
  screens: PIMScreen[];
  tasks: PIMTask[];
  contextAxes: string[];
  menuAxes: Array<{ seq: number; label: string; itemCount: number }>;
}

export interface SeniorUserProfile {
  id: string;
  title: string;
  summary: string;
  ageBand: string;
  needs: string[];
  preferences: string[];
  stressors: string[];
}

export interface AdaptationRule {
  id: string;
  title: string;
  trigger: string;
  effect: string;
}

export interface AdaptedJourneyStep {
  id: string;
  title: string;
  helper: string;
  status: "complete" | "current" | "upcoming";
}

export interface AdaptedCategoryChoice {
  seq: number;
  label: string;
  helper: string;
  rationale: string;
  active: boolean;
}

export interface AdaptedItemCard {
  id: number;
  title: string;
  description: string;
  helper: string;
  priceLabel: string;
  calorieLabel: string;
  imageUrl: string;
  categorySeq: number;
  emphasis: "primary" | "secondary";
}

export interface AdaptedCartSummary {
  totalCount: number;
  totalPriceLabel: string;
  items: Array<{
    id: number;
    title: string;
    quantity: number;
    categoryName: string;
  }>;
}

export interface AdaptedKioskExperience {
  pim: KioskPIM;
  profile: SeniorUserProfile;
  rules: AdaptationRule[];
  matchedRuleIds: string[];
  narrative: string;
  supportHeadline: string;
  displayScale: "xl" | "2xl";
  journey: AdaptedJourneyStep[];
  categoryChoices: AdaptedCategoryChoice[];
  featuredItems: AdaptedItemCard[];
  cart: AdaptedCartSummary;
  orderTypeChoices: Array<{ id: OrderType; label: string; helper: string }>;
}

const SENIOR_PROFILE: SeniorUserProfile = {
  id: "senior-low-vision-guided",
  title: "시니어 프로필: 저시력 + 손떨림 + 낮은 작업기억 부담",
  summary:
    "글씨를 크게 보고, 한 번에 적은 수의 선택지만 보며, 현재 단계와 다음 행동이 늘 보이는 흐름을 선호합니다.",
  ageBand: "70대 초반",
  needs: [
    "큰 글자와 높은 대비",
    "넓은 터치 목표",
    "현재 위치와 다음 단계의 지속 노출",
  ],
  preferences: [
    "익숙한 대표 메뉴부터 제시",
    "한 화면당 3개 이하의 핵심 선택지",
    "장바구니와 결제 버튼을 항상 같은 위치에 유지",
  ],
  stressors: [
    "과도한 카드 수와 작은 정보 밀도",
    "카테고리 전환 후 위치가 바뀌는 CTA",
    "주문 진행 상황을 놓치게 하는 긴 스크롤",
  ],
};

const ADAPTATION_RULES: AdaptationRule[] = [
  {
    id: "AF-01",
    title: "Large targets",
    trigger: "시니어 프로필에 저시력/운동 제약이 포함될 때",
    effect: "주요 CTA와 메뉴 카드를 큰 타이포그래피와 넓은 버튼으로 재배치",
  },
  {
    id: "AF-02",
    title: "Choice reduction",
    trigger: "작업기억 부담이 높을 수 있을 때",
    effect: "카테고리와 메뉴를 상위 3개 선택지로 제한하고 익숙한 대표 메뉴를 우선 노출",
  },
  {
    id: "AF-03",
    title: "Persistent orientation",
    trigger: "맥락 상실 가능성이 있을 때",
    effect: "진행 단계, 현재 주문 방식, 장바구니 요약을 고정 패널로 유지",
  },
  {
    id: "AF-04",
    title: "Reassuring copy",
    trigger: "결정 스트레스를 줄여야 할 때",
    effect: "짧고 단정한 안내 문장과 현재 추천 이유를 함께 노출",
  },
];

const CORE_TASKS: PIMTask[] = [
  {
    id: "choose-order-type",
    label: "주문 방식 선택",
    description: "매장/포장 중 하나를 빠르게 정하고 이후 흐름을 고정한다.",
  },
  {
    id: "scan-categories",
    label: "카테고리 범위 좁히기",
    description: "현재 주문 목적에 맞는 카테고리만 먼저 노출한다.",
  },
  {
    id: "pick-item",
    label: "대표 메뉴 선택",
    description: "익숙하고 설명이 짧은 대표 메뉴부터 담는다.",
  },
  {
    id: "review-cart",
    label: "장바구니 확인",
    description: "추가한 메뉴 수량과 합계를 같은 위치에서 검토한다.",
  },
  {
    id: "checkout",
    label: "결제 완료",
    description: "결제 직전 정보를 최소 구조로 확인하고 완료한다.",
  },
];

const SCREEN_MODEL: PIMScreen[] = [
  {
    id: "order-type",
    title: "Order Type",
    userGoal: "식사 맥락을 먼저 정한다.",
    systemGoal: "다음 화면의 추천 문맥을 만든다.",
    inputs: ["order-type choice"],
    outputs: ["selected order type", "menu entry"],
    primitives: [
      { id: "order-type-choice", kind: "choice-group", purpose: "매장/포장 이원 선택" },
      { id: "order-type-cta", kind: "cta", purpose: "선택 후 즉시 다음 단계 이동" },
    ],
  },
  {
    id: "category-hub",
    title: "Category Hub",
    userGoal: "메뉴 범위를 줄인다.",
    systemGoal: "메뉴 탐색 비용을 낮춘다.",
    inputs: ["available categories", "current order type"],
    outputs: ["active category"],
    primitives: [
      { id: "category-stepper", kind: "progress-indicator", purpose: "현재 탐색 단계 인지" },
      { id: "category-choices", kind: "choice-group", purpose: "선택 가능한 카테고리 축소" },
    ],
  },
  {
    id: "item-shortlist",
    title: "Item Shortlist",
    userGoal: "부담 없이 대표 메뉴를 고른다.",
    systemGoal: "짧은 설명과 큰 카드로 빠른 결정을 돕는다.",
    inputs: ["active category", "menu catalog"],
    outputs: ["cart mutations"],
    primitives: [
      { id: "item-grid", kind: "card-grid", purpose: "대표 메뉴 2~3개 제시" },
      { id: "item-reason", kind: "summary-panel", purpose: "왜 이 메뉴가 추천되는지 설명" },
    ],
  },
  {
    id: "cart-review",
    title: "Cart Review",
    userGoal: "이미 담은 메뉴와 합계를 같은 시야에서 확인한다.",
    systemGoal: "결제 직전 불안을 줄인다.",
    inputs: ["cart contents"],
    outputs: ["checkout intent", "quantity confidence"],
    primitives: [
      { id: "cart-summary", kind: "summary-panel", purpose: "수량/총액 고정" },
      { id: "cart-cta", kind: "cta", purpose: "결제 단계로 진입" },
    ],
  },
  {
    id: "checkout",
    title: "Checkout",
    userGoal: "최종 확인 후 완료한다.",
    systemGoal: "마지막 확인 화면을 최소 정보 구조로 제공한다.",
    inputs: ["cart summary", "payment intent"],
    outputs: ["completed order"],
    primitives: [
      { id: "checkout-confirmation", kind: "confirmation", purpose: "주문 내역 최종 확인" },
      { id: "checkout-cta", kind: "cta", purpose: "결제 완료" },
    ],
  },
];

function prioritizeCategories(activeCategorySeq?: number | null, locale: Locale = "ko") {
  const categories = getCategories();
  const active = categories.find((category) => category.seq === activeCategorySeq);
  const rest = categories.filter((category) => category.seq !== activeCategorySeq);
  const prioritized = active ? [active, ...rest] : categories;

  return prioritized.slice(0, 3).map((category, index) => ({
    seq: category.seq,
    label: getCategoryName(category, locale),
    helper:
      index === 0
        ? "지금 맥락에서 가장 먼저 보이면 좋은 카테고리"
        : "선택 폭은 유지하되 화면 부담은 줄인 후보",
    rationale:
      index === 0
        ? "현재 흐름과 가까운 메뉴군을 우선 배치했습니다."
        : "대안은 남겨두되 화면 전환 수를 최소화했습니다.",
    active: category.seq === (active?.seq ?? prioritized[0]?.seq),
  }));
}

function scoreItem(title: string, description: string) {
  const text = `${title} ${description}`;
  let score = 0;

  if (/빅맥|불고기|치즈버거|햄버거|후렌치|감자|콜라|아메리카노/.test(text)) {
    score += 4;
  }

  if (/세트/.test(text)) {
    score += 2;
  }

  if (text.length < 60) {
    score += 1;
  }

  return score;
}

function buildFeaturedItems(categorySeq: number | null | undefined, locale: Locale = "ko") {
  const categories = getCategories();
  const category = categories.find((entry) => entry.seq === categorySeq) ?? categories[0];
  if (!category) {
    return [];
  }

  return [...category.items]
    .map((item) => ({
      item,
      score: scoreItem(stripHtml(getDisplayName(item, locale)), stripHtml(item.description)),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ item }, index): AdaptedItemCard => ({
      id: item.id,
      title: stripHtml(getDisplayName(item, locale)),
      description: stripHtml(item.description).replace(/\s+/g, " ").trim(),
      helper:
        index === 0
          ? "대표 메뉴부터 크게 보여드려요."
          : "선택지를 줄여도 비교는 가능하도록 남겨둔 메뉴예요.",
      priceLabel: `₩ ${formatPrice(getItemPrice(item))}`,
      calorieLabel: `${item.calorie} kcal`,
      imageUrl: item.imageUrl,
      categorySeq: category.seq,
      emphasis: index === 0 ? "primary" : "secondary",
    }));
}

function buildJourney(orderType: OrderType | null, cart: CartItem[]): AdaptedJourneyStep[] {
  const hasCart = cart.length > 0;

  return [
    {
      id: "order-type",
      title: "주문 방식",
      helper: orderType ? "주문 맥락이 정해졌습니다." : "매장 또는 포장을 먼저 선택합니다.",
      status: orderType ? "complete" : "current",
    },
    {
      id: "category",
      title: "카테고리",
      helper: "큰 버튼으로 메뉴 범위를 줄입니다.",
      status: orderType ? (hasCart ? "complete" : "current") : "upcoming",
    },
    {
      id: "item",
      title: "대표 메뉴",
      helper: "익숙한 메뉴 3개만 먼저 보여줍니다.",
      status: hasCart ? "complete" : orderType ? "current" : "upcoming",
    },
    {
      id: "checkout",
      title: "결제",
      helper: "장바구니를 같은 위치에서 확인합니다.",
      status: hasCart ? "current" : "upcoming",
    },
  ];
}

function buildCartSummary(cart: CartItem[], locale: Locale = "ko"): AdaptedCartSummary {
  const total = cart.reduce((sum, entry) => sum + getItemPrice(entry.menuItem) * entry.quantity, 0);

  return {
    totalCount: cart.reduce((sum, entry) => sum + entry.quantity, 0),
    totalPriceLabel: `₩ ${formatPrice(total)}`,
    items: cart.map((entry) => ({
      id: entry.menuItem.id,
      title: stripHtml(getDisplayName(entry.menuItem, locale)),
      quantity: entry.quantity,
      categoryName: entry.categoryName,
    })),
  };
}

export function buildMcdonaldsKioskPIM(locale: Locale = "ko"): KioskPIM {
  const categories = getCategories();

  return {
    id: "mcdonalds-kiosk-pim",
    title: "McDonald's Kiosk Abstract UI Model",
    domain: "quick-service restaurant self-ordering",
    screens: SCREEN_MODEL,
    tasks: CORE_TASKS,
    contextAxes: [
      "orderType",
      "activeCategory",
      "cartState",
      "difficultyScore",
      "language",
    ],
    menuAxes: categories.slice(0, 6).map((category) => ({
      seq: category.seq,
      label: getCategoryName(category, locale),
      itemCount: category.items.length,
    })),
  };
}

export function getSeniorProfile() {
  return SENIOR_PROFILE;
}

export function getAdaptForgeRules() {
  return ADAPTATION_RULES;
}

export function applySeniorAdaptForge(input: {
  difficultyScore: number;
  activeCategorySeq?: number | null;
  orderType?: OrderType | null;
  cart: CartItem[];
  locale?: Locale;
}): AdaptedKioskExperience {
  const locale = input.locale ?? "ko";
  const pim = buildMcdonaldsKioskPIM(locale);
  const categoryChoices = prioritizeCategories(input.activeCategorySeq, locale);
  const activeCategorySeq = categoryChoices.find((entry) => entry.active)?.seq ?? categoryChoices[0]?.seq;
  const featuredItems = buildFeaturedItems(activeCategorySeq, locale);
  const cart = buildCartSummary(input.cart, locale);

  return {
    pim,
    profile: SENIOR_PROFILE,
    rules: ADAPTATION_RULES,
    matchedRuleIds: ADAPTATION_RULES.map((rule) => rule.id),
    narrative:
      input.orderType == null
        ? "주문 방식을 먼저 정하면 시니어 프로필에 맞는 카테고리와 대표 메뉴를 바로 이어서 제시합니다."
        : cart.totalCount > 0
          ? "현재 장바구니를 항상 보이게 유지해, 다시 뒤로 가지 않고도 결제 결정을 할 수 있게 했습니다."
          : "대표 메뉴와 다음 단계를 같은 시야 안에 배치해 현재 위치를 잃지 않도록 구성했습니다.",
    supportHeadline:
      input.difficultyScore >= 85
        ? "선택 수를 3개로 제한하고 읽기 부담을 더 줄였습니다."
        : "큰 글씨, 짧은 설명, 고정 장바구니로 주문 부담을 낮췄습니다.",
    displayScale: input.difficultyScore >= 85 ? "2xl" : "xl",
    journey: buildJourney(input.orderType ?? null, input.cart),
    categoryChoices,
    featuredItems,
    cart,
    orderTypeChoices: [
      {
        id: "dine-in",
        label: "매장에서 먹기",
        helper: "자리에서 드실 주문으로 안내를 고정합니다.",
      },
      {
        id: "takeout",
        label: "포장하기",
        helper: "가져가실 주문으로 화면 단계를 맞춥니다.",
      },
    ],
  };
}
