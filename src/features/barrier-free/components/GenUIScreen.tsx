"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdaptiveCard, AdaptiveUIResponse, CartItem } from "@/types";
import { getCategoryBySeq, getDisplayName, getCategories, loadMenu } from "@/lib/menu";
import { stripHtml } from "@/lib/utils";
import { useKioskStore } from "@/store/kiosk";

function buildLocalFallback(difficultyScore: number): AdaptiveUIResponse {
  const fontScale = difficultyScore >= 85 ? "2xl" : difficultyScore >= 70 ? "xl" : "lg";
  const maxOptions = difficultyScore >= 85 ? 3 : difficultyScore >= 70 ? 4 : 6;
  const category = getCategories()[0];

  return {
    title: "도움 모드가 활성화되었습니다",
    description: "현재 난이도에 맞춰 큰 글씨와 적은 선택지로 주문 흐름을 유지합니다.",
    fontScale,
    maxOptions,
    cards: (category?.items ?? []).slice(0, maxOptions).map((item, index) => ({
      id: String(item.id),
      title: getDisplayName(item),
      subtitle: `${item.calorie} kcal`,
      helper: "큰 글씨와 짧은 설명으로 바로 담을 수 있어요.",
      emphasis: index === 0 ? "primary" : "secondary",
      itemId: item.id,
      categorySeq: category?.seq,
      actionLabel: "장바구니 담기",
    })),
    ctaLabel: "큰 글씨 결제로 이동",
    narration: "천천히 읽고 선택하실 수 있도록 화면을 정리했어요.",
  };
}

function resolveCard(card: AdaptiveCard) {
  const itemIdFromId = Number(card.id);
  const resolvedItemId = card.itemId ?? (Number.isNaN(itemIdFromId) ? undefined : itemIdFromId);
  const category = getCategoryBySeq(card.categorySeq);
  const item = category?.items.find((entry) => entry.id === resolvedItemId);

  return {
    category,
    item,
  };
}

export function GenUIScreen({
  difficultyScore,
  cart,
  orderType,
  onCheckout,
}: {
  difficultyScore: number;
  cart: CartItem[];
  orderType?: "dine-in" | "takeout" | null;
  onCheckout: () => void;
}) {
  const menu = useMemo(() => loadMenu(), []);
  const addLLMLog = useKioskStore((state) => state.addLLMLog);
  const addItem = useKioskStore((state) => state.addItem);
  const setLiveProgress = useKioskStore((state) => state.setLiveProgress);
  const setOrderType = useKioskStore((state) => state.setOrderType);
  const [screen, setScreen] = useState<AdaptiveUIResponse>(buildLocalFallback(difficultyScore));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAdaptiveScreen() {
      const fallback = buildLocalFallback(difficultyScore);
      setLoading(true);

      try {
        const response = await fetch("/api/gen-ui", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficultyScore,
            step: "items",
            context: {
              category: "추천 메뉴",
              categorySeq: menu.categories[0]?.seq ?? null,
              orderType: orderType ?? null,
              cartSummary: cart.map((item) => `${stripHtml(item.menuItem.korName)} x${item.quantity}`),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`gen-ui ${response.status}`);
        }

        const data = (await response.json()) as AdaptiveUIResponse;
        if (cancelled) {
          return;
        }

        setScreen(data);
        addLLMLog({
          type: "gen-ui",
          prompt: data.meta?.prompt ?? "adaptive-ui-request",
          response: JSON.stringify(data),
          summary: `${data.meta?.provider ?? "fallback"} · ${data.title}`,
        });
        setLiveProgress({
          phase: "large-ui",
          label: `${data.meta?.provider ?? "fallback"} adaptive layout ready`,
          stability: "stable",
        });
      } catch {
        if (!cancelled) {
          setScreen(fallback);
          setLiveProgress({
            phase: "large-ui",
            label: "Fallback adaptive layout ready",
            stability: "watching",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdaptiveScreen();

    return () => {
      cancelled = true;
    };
  }, [addLLMLog, cart, difficultyScore, menu.categories, orderType, setLiveProgress]);

  const traceRows = [
    `difficulty ${Math.round(difficultyScore)}`,
    `font scale ${screen.fontScale}`,
    `max options ${screen.maxOptions}`,
    `provider ${screen.meta?.provider ?? "fallback"}`,
    orderType ? `order type ${orderType}` : "order type pending",
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <aside data-testid="genui-pipeline" className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/[0.08] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/70">Adaptive trace</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight">{screen.title}</h3>
          <p className="mt-3 text-base leading-7 text-white/75">{screen.description}</p>
        </div>

        <div className="grid gap-3">
          {traceRows.map((row, index) => (
            <div key={row} className="rounded-[1.2rem] border border-white/10 bg-black/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.26em] text-emerald-100/50">step {index + 1}</p>
              <p className="mt-2 text-sm font-semibold text-white/80">{row}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">AI narration</p>
          <p className="mt-3 text-base leading-7 text-white/80">{screen.narration}</p>
        </div>
      </aside>

      <section className="space-y-5 rounded-[1.8rem] border border-white/10 bg-[#08111f]/55 p-5">
        {!orderType ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { id: "dine-in", label: "매장에서 먹기" },
              { id: "takeout", label: "포장하기" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setOrderType(option.id as "dine-in" | "takeout")}
                className="rounded-[1.5rem] border border-white/15 bg-white/[0.05] px-5 py-5 text-left text-white"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/70">주문 방식</p>
                <p className="mt-3 text-2xl font-black">{option.label}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {screen.cards.map((card) => {
            const { category, item } = resolveCard(card);
            const canAdd = Boolean(category && item);

            return (
              <div
                key={card.id}
                className={`rounded-[1.35rem] border p-4 ${
                  card.emphasis === "primary"
                    ? "border-[#ffcc32]/60 bg-[#ffcc32]/12"
                    : "border-white/10 bg-white/[0.05]"
                } ${loading ? "adaptive-skeleton" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/45">{card.subtitle}</p>
                  {loading ? (
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
                      loading
                    </span>
                  ) : null}
                </div>
                <h4 className="mt-2 text-2xl font-black text-white">{card.title}</h4>
                <p className="mt-2 text-base leading-7 text-white/70">{card.helper}</p>

                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={() => {
                    if (!category || !item) {
                      return;
                    }

                    addItem(item, category.korName);
                    setLiveProgress({
                      phase: "large-ui",
                      label: `${getDisplayName(item)}를 큰 글씨 주문 흐름에 추가`,
                      stability: "stable",
                    });
                  }}
                  className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
                >
                  {canAdd ? card.actionLabel ?? "장바구니 담기" : "카드 정보 확인 중"}
                </button>
              </div>
            );
          })}
        </div>

        <section className="rounded-[1.5rem] border border-white/10 bg-[#09131b] p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Adaptive cart</p>
              <h4 className="mt-2 text-2xl font-black">
                {cart.length ? `${cart.length}개 메뉴가 담겼어요` : "먼저 메뉴를 하나 담아보세요"}
              </h4>
            </div>
            <button
              type="button"
              disabled={!cart.length}
              onClick={onCheckout}
              className="rounded-full bg-[#ffcc32] px-5 py-3 font-black text-[#2b2200] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              {screen.ctaLabel}
            </button>
          </div>

          {cart.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <p className="text-sm text-white/45">{item.categoryName}</p>
                  <p className="mt-1 text-xl font-bold">{stripHtml(item.menuItem.korName)}</p>
                  <p className="mt-1 text-sm text-white/60">수량 {item.quantity}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
