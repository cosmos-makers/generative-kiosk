"use client";

import { useMemo } from "react";
import { AdaptForgeScreen } from "@/features/adaptforge/components/AdaptForgeScreen";
import { BFCheckout } from "@/features/barrier-free/components/BFCheckout";
import { BFLayout } from "@/features/barrier-free/components/BFLayout";
import { DebugPanel, DebugToggle } from "@/features/debug/components/DebugPanel";
import { DifficultyDetector } from "@/features/difficulty/components/DifficultyDetector";
import { HelpOfferDialog } from "@/features/difficulty/components/HelpOfferDialog";
import { CartSheet } from "@/features/kiosk/components/CartSheet";
import { CategoryTabs } from "@/features/kiosk/components/CategoryTabs";
import { CheckoutScreen } from "@/features/kiosk/components/CheckoutScreen";
import { Header } from "@/features/kiosk/components/Header";
import { IdleScreen } from "@/features/kiosk/components/IdleScreen";
import { MenuGrid } from "@/features/kiosk/components/MenuGrid";
import { OrderTypeScreen } from "@/features/kiosk/components/OrderTypeScreen";
import { VoiceOrderInterface } from "@/features/voice/components/VoiceOrderInterface";
import { VoicePermissionGate } from "@/features/voice/components/VoicePermissionGate";
import { getCategories } from "@/lib/menu";
import { useKioskStore } from "@/store/kiosk";

export default function HomePage() {
  const categories = useMemo(() => getCategories(), []);

  const isIdle = useKioskStore((state) => state.isIdle);
  const step = useKioskStore((state) => state.step);
  const locale = useKioskStore((state) => state.locale);
  const activeCategorySeq = useKioskStore((state) => state.activeCategorySeq);
  const items = useKioskStore((state) => state.items);
  const difficultyScore = useKioskStore((state) => state.difficultyScore);
  const accessibilityMode = useKioskStore((state) => state.accessibilityMode);
  const orderType = useKioskStore((state) => state.orderType);
  const lastOrderNumber = useKioskStore((state) => state.lastOrderNumber);
  const voiceReady = useKioskStore((state) => state.voiceReady);
  const setIdle = useKioskStore((state) => state.setIdle);
  const setLocale = useKioskStore((state) => state.setLocale);
  const setActiveCategory = useKioskStore((state) => state.setActiveCategory);
  const setOrderType = useKioskStore((state) => state.setOrderType);
  const setStep = useKioskStore((state) => state.setStep);
  const addItem = useKioskStore((state) => state.addItem);
  const updateItemQuantity = useKioskStore((state) => state.updateItemQuantity);
  const clearCart = useKioskStore((state) => state.clearCart);
  const completeOrder = useKioskStore((state) => state.completeOrder);
  const resetSession = useKioskStore((state) => state.resetSession);
  const setVoiceReady = useKioskStore((state) => state.setVoiceReady);

  const activeCategory =
    categories.find((category) => category.seq === activeCategorySeq) ?? categories[0];
  const showCompletion = step === "complete" && Boolean(lastOrderNumber);

  const completionScreen = showCompletion ? (
    <section className="rounded-[28px] border border-[#d8e8d2] bg-[linear-gradient(135deg,#214e24_0%,#2e7d32_100%)] p-8 text-white kiosk-shadow">
      <p className="text-xs font-black uppercase tracking-[0.34em] text-white/65">Mock payment complete</p>
      <h2 className="mt-4 text-5xl font-black tracking-[-0.05em]">주문번호 {lastOrderNumber}</h2>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-white/82">
        오늘도 맛있는 식사 되세요!
      </p>
      <button
        type="button"
        onClick={resetSession}
        className="mt-8 rounded-[18px] bg-white px-6 py-4 font-black text-[#214e24]"
      >
        처음으로
      </button>
    </section>
  ) : null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#eee5d7_100%)] px-4 py-5 lg:px-8">
      <DifficultyDetector />
      <DebugPanel />
      <HelpOfferDialog />

      <DebugToggle />
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <Header
          locale={locale}
          onLocaleToggle={() => setLocale(locale === "en" ? "ko" : "en")}
          onHome={resetSession}
        />

        <section className="rounded-[34px] border border-[var(--mcd-border)] bg-[rgba(250,245,236,0.96)] p-4 shadow-[0_22px_40px_rgba(0,0,0,0.12)] lg:p-5">
          {isIdle ? <IdleScreen onStart={() => setIdle(false)} /> : null}

          {!isIdle && accessibilityMode === "none" && step === "order-type" ? (
            <OrderTypeScreen onSelect={setOrderType} />
          ) : null}

          {!isIdle && accessibilityMode === "none" && step === "menu" ? (
            <div className="grid gap-5 xl:grid-cols-[128px_1fr]">
              <aside className="rounded-[28px] bg-[rgba(255,255,255,0.82)] p-3 kiosk-shadow">
                <CategoryTabs
                  categories={categories.slice(0, 6)}
                  activeSeq={activeCategory?.seq ?? 1}
                  onChange={setActiveCategory}
                  locale={locale}
                />
              </aside>
              <MenuGrid
                category={activeCategory}
                locale={locale}
                onSelect={(item) =>
                  addItem(item, locale === "en" ? activeCategory.engName : activeCategory.korName)
                }
              />
            </div>
          ) : null}

          {!isIdle && accessibilityMode === "none" && step === "checkout" ? (
            <CheckoutScreen
              items={items}
              locale={locale}
              onComplete={completeOrder}
              onBack={() => setStep("menu")}
            />
          ) : null}

          {!isIdle && accessibilityMode === "none" && showCompletion ? completionScreen : null}

          {!isIdle && accessibilityMode === "large-ui" ? (
            <BFLayout title="AdaptForge가 재구성한 시니어 주문 화면">
              {showCompletion ? (
                completionScreen
              ) : step === "checkout" ? (
                <BFCheckout items={items} onComplete={completeOrder} />
              ) : (
                <AdaptForgeScreen
                  difficultyScore={difficultyScore}
                  cart={items}
                  orderType={orderType}
                  onCheckout={() => setStep("checkout")}
                />
              )}
            </BFLayout>
          ) : null}

          {!isIdle && accessibilityMode === "voice" && !voiceReady ? (
            showCompletion ? (
              completionScreen
            ) : (
              <VoicePermissionGate onContinue={() => setVoiceReady(true)} />
            )
          ) : null}

          {!isIdle && accessibilityMode === "voice" && voiceReady ? (
            showCompletion ? completionScreen : <VoiceOrderInterface />
          ) : null}
        </section>

        {!isIdle && accessibilityMode === "none" && step === "menu" ? (
          <CartSheet
            items={items}
            onCheckout={() => setStep("checkout")}
            onClear={clearCart}
            onAdjust={updateItemQuantity}
            locale={locale}
          />
        ) : null}
      </div>
    </main>
  );
}
