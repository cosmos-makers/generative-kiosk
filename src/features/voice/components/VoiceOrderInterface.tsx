"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VoiceOrderAction } from "@/types";
import { useSTT } from "@/features/voice/hooks/useSTT";
import { useVoice } from "@/features/voice/hooks/useVoice";
import { buildFallbackVoiceAction } from "@/lib/fallbacks";
import { findItemById, loadMenu } from "@/lib/menu";
import { stripHtml } from "@/lib/utils";
import { useKioskStore } from "@/store/kiosk";

export function VoiceOrderInterface() {
  const menu = useMemo(() => loadMenu(), []);
  const [lastUserText, setLastUserText] = useState("");
  const [lastAssistantText, setLastAssistantText] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const transcriptHandlerRef = useRef<(text: string) => void>(() => {});

  const addItem = useKioskStore((state) => state.addItem);
  const items = useKioskStore((state) => state.items);
  const orderType = useKioskStore((state) => state.orderType);
  const completeOrder = useKioskStore((state) => state.completeOrder);
  const resetBF = useKioskStore((state) => state.resetBF);
  const addVoiceTurn = useKioskStore((state) => state.addVoiceTurn);
  const setOrderType = useKioskStore((state) => state.setOrderType);
  const setLiveProgress = useKioskStore((state) => state.setLiveProgress);
  const addLLMLog = useKioskStore((state) => state.addLLMLog);
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const { speak, speaking } = useVoice();
  const { listening, start, stop, supported } = useSTT({
    onTranscript: (text) => transcriptHandlerRef.current(text),
  });

  const resumeListening = useCallback(() => {
    if (supported) {
      start();
    }
  }, [start, supported]);

  const applyAction = useCallback(
    (action: VoiceOrderAction) => {
      if (action.targetItemId) {
        const item = findItemById(action.targetItemId);
        const category = menu.categories.find((entry) =>
          entry.items.some((candidate) => candidate.id === action.targetItemId),
        );

        if (item && category) {
          addItem(item, category.korName, action.quantity ?? 1);
          setLiveProgress({
            phase: "voice",
            label: `${stripHtml(item.korName)} ${action.quantity ?? 1}개 담기 성공`,
            stability: "stable",
          });
        }
      }

      if (action.action === "go-cart") {
        setCheckoutReady(true);
        setLiveProgress({
          phase: "voice",
          label: "Voice cart review requested",
          stability: "stable",
        });
      }

      if (action.action === "recommend") {
        setCheckoutReady(false);
      }

      if (action.orderType) {
        setOrderType(action.orderType);
        setLiveProgress({
          phase: "voice",
          label:
            action.orderType === "takeout"
              ? "포장 주문 맥락으로 전환"
              : "매장 주문 맥락으로 전환",
          stability: "stable",
        });
      }

      if (action.action === "checkout") {
        completeOrder();
        setCheckoutReady(false);
      }
    },
    [addItem, completeOrder, menu.categories, setLiveProgress, setOrderType],
  );

  const runTranscript = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      setLastUserText(trimmed);
      addVoiceTurn({ role: "user", text: trimmed });

      try {
        const response = await fetch("/api/voice-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: trimmed,
            difficultyScore: useKioskStore.getState().difficultyScore,
            currentStep: "items",
            cartItems: useKioskStore.getState().items.map((item) => ({
              id: item.menuItem.id,
              quantity: item.quantity,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`voice-order ${response.status}`);
        }

        const action = (await response.json()) as VoiceOrderAction;
        addLLMLog({
          type: "voice",
          prompt: action.meta?.prompt ?? trimmed,
          response: JSON.stringify(action),
          summary: `${action.meta?.provider ?? "fallback"} · ${action.reply}`,
        });
        applyAction(action);
        setLastAssistantText(action.reply);
        speak(action.reply, () => {
          if (action.action !== "checkout") {
            resumeListening();
          }
        });
      } catch {
        const fallback = buildFallbackVoiceAction({
          transcript: trimmed,
          currentStep: "items",
          cartItems: useKioskStore.getState().items.map((item) => ({
            id: item.menuItem.id,
            quantity: item.quantity,
          })),
        });
        applyAction(fallback);
        setLastAssistantText(fallback.reply);
        speak(fallback.reply, () => {
          resumeListening();
        });
      }
    },
    [addLLMLog, addVoiceTurn, applyAction, resumeListening, speak],
  );

  const runTypedCommand = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      setLastUserText(trimmed);
      addVoiceTurn({ role: "user", text: trimmed });
      const fallback = buildFallbackVoiceAction({
        transcript: trimmed,
        currentStep: "items",
        cartItems: useKioskStore.getState().items.map((item) => ({
          id: item.menuItem.id,
          quantity: item.quantity,
        })),
      });
      applyAction(fallback);
      setLastAssistantText(fallback.reply);
      speak(fallback.reply, () => {
        resumeListening();
      });
    },
    [addVoiceTurn, applyAction, resumeListening, speak],
  );

  transcriptHandlerRef.current = runTranscript;

  useEffect(() => {
    speak("원하시는 메뉴나 카테고리를 말씀해 주세요. 예: 빅맥 세트 담아줘.", () => {
      resumeListening();
    });
  }, [resumeListening, speak]);

  const canUseTypedFallback = debugEnabled || !supported;

  return (
    <section className="rounded-[2rem] border border-sky-200/20 bg-[#08111f] p-6 text-white shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-sky-100/70">
            Adaptive Track B
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            음성 주문 도우미
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            data-testid="voice-return-touch"
            onClick={resetBF}
            className="rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white/70"
          >
            터치 화면으로 복귀
          </button>
          <button
            type="button"
            data-testid="voice-listen-toggle"
            onClick={listening ? stop : start}
            disabled={!supported}
            className="rounded-full bg-sky-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
          >
            {listening ? "듣는 중지" : "말하기 시작"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm font-semibold text-white/70">실시간 대화</p>
        <p className="mt-3 text-xl leading-8">
          {lastUserText || "‘빅맥 세트 담아줘’처럼 말해보세요."}
        </p>
        <p className="mt-3 text-base leading-7 text-sky-100/80">
          {lastAssistantText || "음성 응답이 여기 누적됩니다."}
        </p>
        <p className="mt-4 text-sm text-white/60">
          {speaking ? "음성 응답 중" : "대기 중"}
        </p>
        <p className="mt-2 text-sm text-white/50">
          현재 주문 방식:{" "}
          {orderType === "takeout"
            ? "포장"
            : orderType === "dine-in"
              ? "매장"
              : "아직 선택 전"}
        </p>
        {!supported ? (
          <p className="mt-2 text-sm text-amber-100/80">
            이 브라우저에서는 음성 인식이 비활성화되어 있어 아래 입력창으로 같은 흐름을
            확인할 수 있습니다.
          </p>
        ) : null}
      </div>

      {canUseTypedFallback ? (
        <form
          className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const next = typedCommand.trim();
            if (!next) {
              return;
            }
            setTypedCommand("");
            runTypedCommand(next);
          }}
        >
          <label className="text-sm font-semibold text-white/70">
            {debugEnabled ? "디버그용 음성 시뮬레이터" : "대체 입력"}
          </label>
          <div className="mt-3 flex gap-3">
            <input
              data-testid="voice-typed-input"
              value={typedCommand}
              onChange={(event) => setTypedCommand(event.currentTarget.value)}
              placeholder="예: 빅맥 세트 담아줘 / 이제 결제할게"
              className="flex-1 rounded-full border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-white/35"
            />
            <button
              type="submit"
              data-testid="voice-typed-submit"
              className="rounded-full bg-white px-5 py-3 font-bold text-slate-950"
            >
              실행
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item.menuItem.id}
            className="rounded-xl border border-white/10 px-3 py-3 text-white"
          >
            <h3 className="font-bold">{stripHtml(item.menuItem.korName)}</h3>
            <p className="mt-1 text-sm text-white/60">수량 {item.quantity}</p>
          </div>
        ))}
      </div>

      {checkoutReady && items.length ? (
        <button
          type="button"
          data-testid="voice-complete-order"
          onClick={() => completeOrder()}
          className="mt-6 rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950"
        >
          장바구니 확인 후 바로 주문 완료
        </button>
      ) : null}
    </section>
  );
}
