"use client";

import { useMemo } from "react";
import { BFCheckout } from "@/features/barrier-free/components/BFCheckout";
import { BFLayout } from "@/features/barrier-free/components/BFLayout";
import { GenUIScreen } from "@/features/barrier-free/components/GenUIScreen";
import { DebugPanel, DebugToggle } from "@/features/debug/components/DebugPanel";
import { LiveProgressPill } from "@/features/debug/components/LiveProgressPill";
import { DifficultyDetector } from "@/features/difficulty/components/DifficultyDetector";
import { HelpOfferDialog } from "@/features/difficulty/components/HelpOfferDialog";
import { CartSheet } from "@/features/kiosk/components/CartSheet";
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
  const activeCategory = categories[0];

  const isIdle = useKioskStore((state) => state.isIdle);
  const step = useKioskStore((state) => state.step);
  const items = useKioskStore((state) => state.items);
  const difficultyScore = useKioskStore((state) => state.difficultyScore);
  const accessibilityMode = useKioskStore((state) => state.accessibilityMode);
  const orderType = useKioskStore((state) => state.orderType);
  const lastOrderNumber = useKioskStore((state) => state.lastOrderNumber);
  const voiceReady = useKioskStore((state) => state.voiceReady);
  const setIdle = useKioskStore((state) => state.setIdle);
  const setOrderType = useKioskStore((state) => state.setOrderType);
  const setStep = useKioskStore((state) => state.setStep);
  const addItem = useKioskStore((state) => state.addItem);
  const completeOrder = useKioskStore((state) => state.completeOrder);
  const resetSession = useKioskStore((state) => state.resetSession);
  const setVoiceReady = useKioskStore((state) => state.setVoiceReady);

  const title =
    accessibilityMode === "none"
      ? "MDonald Barrier-Free Kiosk"
      : accessibilityMode === "large-ui"
        ? "Generative UI Assist"
        : "Voice Assist";

  const completionScreen =
    lastOrderNumber ? (
      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-8 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">
          Mock payment complete
        </p>
        <h2 className="mt-4 text-5xl font-black tracking-tight">
          주문번호 {lastOrderNumber}
        </h2>
        <button
          type="button"
          onClick={resetSession}
          className="mt-8 rounded-full bg-white px-5 py-3 font-black text-slate-950"
        >
          처음으로
        </button>
      </section>
    ) : null;

  return (
    <main className="min-h-screen px-4 py-20 lg:px-8">
      <DifficultyDetector />
      <DebugToggle />
      <DebugPanel />
      <HelpOfferDialog />
      <LiveProgressPill />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <Header title={title} />

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#08111f]/90 p-6 shadow-2xl backdrop-blur">
            {isIdle ? <IdleScreen onStart={() => setIdle(false)} /> : null}

            {!isIdle && accessibilityMode === "none" && step === "order-type" ? (
              <OrderTypeScreen onSelect={setOrderType} />
            ) : null}

            {!isIdle && accessibilityMode === "none" && step === "menu" ? (
              <MenuGrid
                category={activeCategory}
                onSelect={(item) => addItem(item, activeCategory.korName)}
              />
            ) : null}

            {!isIdle &&
            accessibilityMode === "none" &&
            (step === "checkout" || step === "complete") ? (
              lastOrderNumber && step === "complete" ? (
                completionScreen
              ) : (
                <CheckoutScreen items={items} onComplete={completeOrder} />
              )
            ) : null}

            {!isIdle && accessibilityMode === "large-ui" ? (
              <BFLayout title="더 쉬운 순서로 다시 구성한 주문 화면">
                {lastOrderNumber ? (
                  completionScreen
                ) : step === "checkout" ? (
                  <BFCheckout items={items} onComplete={completeOrder} />
                ) : (
                  <GenUIScreen
                    difficultyScore={difficultyScore}
                    cart={items}
                    orderType={orderType}
                    onCheckout={() => setStep("checkout")}
                  />
                )}
              </BFLayout>
            ) : null}

            {!isIdle && accessibilityMode === "voice" && !voiceReady ? (
              lastOrderNumber ? (
                completionScreen
              ) : (
                <VoicePermissionGate onContinue={() => setVoiceReady(true)} />
              )
            ) : null}

            {!isIdle && accessibilityMode === "voice" && voiceReady ? (
              lastOrderNumber ? completionScreen : <VoiceOrderInterface />
            ) : null}
          </div>

          <div className="space-y-6">
            <CartSheet items={items} onCheckout={() => setStep("checkout")} />
            <section className="rounded-[1.75rem] border border-white/10 bg-[#08111e] p-5 shadow-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Continuous demoability
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                작업 중에도 항상 볼 수 있는 진행 상황
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                debug off에서는 일반/GenUI/voice 제품 흐름을 유지하고, debug on에서만
                calibration · score · logs · internal diagnostics를 오버레이로 노출합니다.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
