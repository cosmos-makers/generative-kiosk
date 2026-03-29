"use client";

import type { CSSProperties, PointerEvent } from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { applySeniorAdaptForge } from "@/features/adaptforge/lib/engine";
import { findItemById } from "@/lib/menu";
import { useKioskStore } from "@/store/kiosk";
import type { CartItem, OrderType } from "@/types";

function setGlassPointer(event: PointerEvent<HTMLElement>) {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const rotateX = ((y - 50) / 50) * -5;
  const rotateY = ((x - 50) / 50) * 5;

  element.style.setProperty("--glass-x", `${x}%`);
  element.style.setProperty("--glass-y", `${y}%`);
  element.style.setProperty("--glass-rotate-x", `${rotateX}deg`);
  element.style.setProperty("--glass-rotate-y", `${rotateY}deg`);
}

function resetGlassPointer(event: PointerEvent<HTMLElement>) {
  const element = event.currentTarget;

  element.style.setProperty("--glass-x", "50%");
  element.style.setProperty("--glass-y", "50%");
  element.style.setProperty("--glass-rotate-x", "0deg");
  element.style.setProperty("--glass-rotate-y", "0deg");
}

const glassInteractionProps = {
  onPointerMove: setGlassPointer,
  onPointerLeave: resetGlassPointer,
};

function staggerStyle(delay: number): CSSProperties {
  return { animationDelay: `${delay}ms` };
}

export function AdaptForgeScreen({
  difficultyScore,
  cart,
  orderType,
  onCheckout,
}: {
  difficultyScore: number;
  cart: CartItem[];
  orderType?: OrderType | null;
  onCheckout: () => void;
}) {
  const locale = useKioskStore((state) => state.locale);
  const activeCategorySeq = useKioskStore((state) => state.activeCategorySeq);
  const setActiveCategory = useKioskStore((state) => state.setActiveCategory);
  const addItem = useKioskStore((state) => state.addItem);
  const setLiveProgress = useKioskStore((state) => state.setLiveProgress);
  const setOrderType = useKioskStore((state) => state.setOrderType);

  const experience = useMemo(
    () =>
      applySeniorAdaptForge({
        difficultyScore,
        activeCategorySeq,
        orderType,
        cart,
        locale,
      }),
    [activeCategorySeq, cart, difficultyScore, locale, orderType],
  );

  return (
    <div className="genui-stage grid gap-5 xl:grid-cols-[0.88fr_1.28fr_0.84fr]">
      <aside
        {...glassInteractionProps}
        className="liquid-glass genui-card-enter space-y-4 rounded-[1.9rem] border border-[#d6e8d5] bg-[linear-gradient(180deg,rgba(255,248,235,0.82)_0%,rgba(243,250,241,0.76)_100%)] p-5 text-[#17321b] shadow-[0_18px_34px_rgba(15,49,25,0.1)]"
        style={staggerStyle(40)}
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#2f6f3f]">
            AdaptForge trace
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight">{experience.profile.title}</h3>
          <p className="mt-3 text-base leading-7 text-[#44614a]">{experience.profile.summary}</p>
        </div>

        <div className="liquid-glass-subtle rounded-[1.4rem] border border-[#cfe0cf] bg-white/90 p-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7f8f7f]">
            PIM abstraction
          </p>
          <div className="mt-3 space-y-3">
            {experience.pim.screens.map((screen) => (
              <div
                key={screen.id}
                className="genui-card-enter rounded-[1rem] border border-[#e2ebdf] bg-[#f8fcf5] px-4 py-3"
                style={staggerStyle(120 + experience.pim.screens.indexOf(screen) * 45)}
              >
                <p className="text-sm font-black text-[#16311c]">{screen.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#57725d]">{screen.userGoal}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="liquid-glass-subtle rounded-[1.4rem] border border-[#cfe0cf] bg-[#11341c] p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#cde7d0]">
            Injected rules
          </p>
          <div className="mt-3 space-y-3">
            {experience.rules.map((rule) => (
              <div
                key={rule.id}
                className="genui-card-enter rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3"
                style={staggerStyle(200 + experience.rules.indexOf(rule) * 50)}
              >
                <p className="text-sm font-black">
                  {rule.id} · {rule.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/75">{rule.effect}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section
        {...glassInteractionProps}
        className="liquid-glass genui-card-enter space-y-5 rounded-[1.9rem] border border-[#e1ecdb] bg-[linear-gradient(180deg,rgba(255,250,240,0.84)_0%,rgba(255,254,248,0.8)_100%)] p-5 text-[#1d1b18] shadow-[0_18px_34px_rgba(33,26,17,0.1)]"
        style={staggerStyle(120)}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="genui-card-enter inline-flex items-center gap-2 rounded-full bg-[#ffefc2]/88 px-3 py-2 text-sm font-black text-[#6a4c00] shadow-[0_10px_18px_rgba(255,204,50,0.18)] backdrop-blur-sm">
              <Sparkles className="size-4" />
              {experience.supportHeadline}
            </div>
            <h3 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#201a14] lg:text-5xl">
              AdaptForge가 맥도날드 주문 화면을 시니어 흐름으로 재구성했습니다
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#5d5547]">
              {experience.narrative}
            </p>
          </div>
          <div className="liquid-glass-subtle genui-card-enter rounded-[1.2rem] border border-[#efe1bd] bg-white px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ad8d45]">
              Display scale
            </p>
            <p className="mt-2 text-2xl font-black text-[#201a14]">{experience.displayScale}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {experience.journey.map((step, index) => (
            <div
              key={step.id}
              className={`liquid-glass-subtle genui-card-enter rounded-[1.25rem] border px-4 py-4 ${
                step.status === "complete"
                  ? "border-[#beddb9] bg-[#f1faed]"
                  : step.status === "current"
                    ? "border-[#ffcc32] bg-[#fff6d6]"
                    : "border-[#ece7dc] bg-white"
              }`}
              style={staggerStyle(180 + index * 55)}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9a8867]">
                step {index + 1}
              </p>
              <p className="mt-2 text-xl font-black text-[#201a14]">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#625949]">{step.helper}</p>
            </div>
          ))}
        </div>

        {!orderType ? (
          <div className="grid gap-4 md:grid-cols-2">
            {experience.orderTypeChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => setOrderType(choice.id)}
                {...glassInteractionProps}
                className="liquid-glass-button genui-card-enter rounded-[1.55rem] border border-[#ead9b7] bg-[linear-gradient(180deg,rgba(255,247,222,0.84)_0%,rgba(255,254,248,0.76)_100%)] px-5 py-5 text-left shadow-[0_10px_20px_rgba(66,42,0,0.08)] transition hover:-translate-y-0.5"
                style={staggerStyle(choice.id === "dine-in" ? 260 : 320)}
              >
                <p className="text-sm font-black uppercase tracking-[0.26em] text-[#b7601f]">
                  Order type
                </p>
                <p className="mt-3 text-3xl font-black text-[#201a14]">{choice.label}</p>
                <p className="mt-3 text-base leading-7 text-[#625949]">{choice.helper}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div
          {...glassInteractionProps}
          className="liquid-glass genui-card-enter rounded-[1.55rem] border border-[#e8ddd0] bg-white/88 p-5"
          style={staggerStyle(280)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#a48f6b]">
                Shortlisted categories
              </p>
              <h4 className="mt-2 text-3xl font-black tracking-tight text-[#201a14]">
                카테고리를 줄여 길을 잃지 않게 합니다
              </h4>
            </div>
            <div className="hidden rounded-full bg-[#f3f4ef] px-4 py-2 text-sm font-bold text-[#49614f] md:block">
              현재 주문 방식: {orderType === "takeout" ? "포장" : orderType === "dine-in" ? "매장" : "미선택"}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {experience.categoryChoices.map((choice) => (
              <button
                key={choice.seq}
                type="button"
                onClick={() => setActiveCategory(choice.seq)}
                {...glassInteractionProps}
                className={`liquid-glass-button genui-card-enter rounded-[1.35rem] border px-4 py-4 text-left transition ${
                  choice.active
                    ? "border-[#17321b] bg-[linear-gradient(180deg,rgba(23,50,27,0.86)_0%,rgba(19,39,22,0.8)_100%)] text-white shadow-[0_14px_24px_rgba(23,50,27,0.18)]"
                    : "border-[#ebe5d9] bg-[linear-gradient(180deg,rgba(255,250,242,0.84)_0%,rgba(255,255,255,0.78)_100%)] text-[#201a14] hover:border-[#ffcc32]"
                }`}
                style={staggerStyle(340 + experience.categoryChoices.indexOf(choice) * 55)}
              >
                <p
                  className={`text-[11px] font-black uppercase tracking-[0.28em] ${
                    choice.active ? "text-white/70" : "text-[#6a6356]"
                  }`}
                >
                  Category
                </p>
                <p className="mt-2 text-2xl font-black">{choice.label}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{choice.helper}</p>
                <p className="mt-3 text-sm leading-6 opacity-70">{choice.rationale}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {experience.featuredItems.map((item) => (
            <article
              key={item.id}
              {...glassInteractionProps}
              className={`liquid-glass genui-card-enter overflow-hidden rounded-[1.7rem] border ${
                item.emphasis === "primary"
                  ? "border-[#ffcc32] bg-[linear-gradient(180deg,rgba(255,245,207,0.88)_0%,rgba(255,250,240,0.78)_100%)] shadow-[0_18px_28px_rgba(255,188,13,0.18)]"
                  : "border-[#ece4d7] bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(252,250,246,0.8)_100%)]"
              }`}
              style={staggerStyle(420 + experience.featuredItems.indexOf(item) * 75)}
            >
              <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_top,#fff7db_0%,#fffdf7_100%)]">
                <Image
                  alt={item.title}
                  className="object-contain p-5"
                  fill
                  sizes="(min-width: 1280px) 18vw, (min-width: 768px) 30vw, 80vw"
                  src={item.imageUrl}
                  unoptimized
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a98f66]">
                  {item.emphasis === "primary" ? "Primary recommendation" : "Alternative"}
                </p>
                <h4 className="mt-3 text-3xl font-black tracking-tight text-[#201a14]">
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-7 text-[#5f584b]">{item.helper}</p>
                <div className="liquid-glass-subtle mt-4 rounded-[1rem] bg-[#f6f4ee]/90 px-4 py-3">
                  <p className="text-base font-black text-[#201a14]">{item.priceLabel}</p>
                  <p className="mt-1 text-sm text-[#6a6356]">{item.calorieLabel}</p>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-7 text-[#615b50]">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const sourceItem = findItemById(item.id);
                    if (!sourceItem) {
                      return;
                    }

                    addItem(
                      sourceItem,
                      experience.categoryChoices.find((choice) => choice.seq === item.categorySeq)?.label ??
                        "추천 메뉴",
                    );
                    setLiveProgress({
                      phase: "adaptforge",
                      label: `${item.title}를 AdaptForge 추천 흐름에 추가`,
                      stability: "stable",
                    });
                  }}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#17321b] px-4 py-4 text-lg font-black text-white transition duration-200 active:scale-[0.98]"
                >
                  지금 담기
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside
        {...glassInteractionProps}
        className="liquid-glass genui-card-enter space-y-4 rounded-[1.9rem] border border-[#dcead8] bg-[linear-gradient(180deg,rgba(18,56,35,0.84)_0%,rgba(13,39,24,0.8)_100%)] p-5 text-white shadow-[0_18px_34px_rgba(7,28,14,0.22)]"
        style={staggerStyle(200)}
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#cde8d0]">
            Persistent summary
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight">장바구니와 다음 행동을 고정했습니다</h3>
          <p className="mt-3 text-base leading-7 text-white/75">{experience.supportHeadline}</p>
        </div>

        <div className="liquid-glass-subtle genui-card-enter rounded-[1.4rem] border border-white/10 bg-white/5 p-4" style={staggerStyle(260)}>
          <div className="flex items-center gap-3">
            <ShoppingBag className="size-5 text-[#ffcc32]" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-white/50">Cart</p>
              <p className="mt-1 text-3xl font-black">{experience.cart.totalCount}개</p>
            </div>
          </div>
          <p className="mt-4 text-4xl font-black">{experience.cart.totalPriceLabel}</p>
        </div>

        <div className="liquid-glass-subtle genui-card-enter space-y-3 rounded-[1.4rem] border border-white/10 bg-black/10 p-4" style={staggerStyle(320)}>
          {experience.cart.items.length ? (
            experience.cart.items.map((item) => (
              <div key={item.id} className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm text-white/50">{item.categoryName}</p>
                <p className="mt-1 text-xl font-black">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">수량 {item.quantity}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[1rem] border border-dashed border-white/15 px-4 py-5 text-sm leading-7 text-white/65">
              추천 메뉴 중 하나를 담으면 이 영역이 그대로 유지된 채 결제 전 검토 패널로 바뀝니다.
            </div>
          )}
        </div>

        <div className="liquid-glass-subtle genui-card-enter rounded-[1.4rem] border border-white/10 bg-white/5 p-4" style={staggerStyle(380)}>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
            Reassurance
          </p>
          <div className="mt-3 space-y-3">
            {experience.profile.preferences.map((preference) => (
              <div key={preference} className="flex gap-3 text-sm leading-6 text-white/80">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#ffcc32]" />
                <span>{preference}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!experience.cart.totalCount}
          onClick={onCheckout}
          className="genui-card-enter w-full rounded-[1.3rem] bg-[#ffcc32] px-5 py-5 text-xl font-black text-[#2b2200] shadow-[0_18px_34px_rgba(255,204,50,0.24)] transition duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
          style={staggerStyle(440)}
        >
          {experience.cart.totalCount ? "이 구성을 그대로 결제하기" : "먼저 메뉴를 하나 담아주세요"}
        </button>
      </aside>
    </div>
  );
}
