"use client";

import { useKioskStore } from "@/store/kiosk";

export function HelpOfferDialog() {
  const showHelpOffer = useKioskStore((state) => state.showHelpOffer);
  const acceptHelpMode = useKioskStore((state) => state.acceptHelpMode);
  const rejectHelpOffer = useKioskStore((state) => state.rejectHelpOffer);

  if (!showHelpOffer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#111111]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[34px] border border-[var(--mcd-border)] bg-white p-8 text-[var(--mcd-charcoal)] shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--mcd-red)]">
          help offer
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">
          더 쉬운 주문 방법을 도와드릴까요?
        </h2>
        <p className="mt-4 text-lg leading-8 text-[var(--mcd-muted)]">
          원하실 때만 큰 글씨 GenUI 화면이나 음성 안내 주문으로 전환됩니다.
          자동으로 바뀌지는 않습니다.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <button
            data-testid="help-mode-large-ui"
            className="rounded-[24px] border border-[var(--mcd-border)] bg-[var(--mcd-paper)] px-5 py-5 text-left"
            onClick={() => acceptHelpMode("large-ui")}
            type="button"
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-red)]">
              GenUI
            </p>
            <p className="mt-3 text-2xl font-black">큰 글씨 AI 화면</p>
          </button>
          <button
            data-testid="help-mode-voice"
            className="rounded-[24px] bg-[var(--mcd-charcoal)] px-5 py-5 text-left text-white"
            onClick={() => acceptHelpMode("voice")}
            type="button"
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-yellow)]">
              Voice
            </p>
            <p className="mt-3 text-2xl font-black">음성 안내 주문</p>
          </button>
          <button
            data-testid="help-mode-normal"
            className="rounded-[24px] border border-[var(--mcd-border)] bg-white px-5 py-5 text-left"
            onClick={rejectHelpOffer}
            type="button"
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-muted)]">
              Normal
            </p>
            <p className="mt-3 text-2xl font-black">지금은 괜찮아요</p>
          </button>
        </div>
      </div>
    </div>
  );
}
