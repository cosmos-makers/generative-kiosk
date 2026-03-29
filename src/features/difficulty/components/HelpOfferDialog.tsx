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
      <div className="help-offer-shell w-full max-w-3xl rounded-[34px] border border-[var(--mcd-border)] bg-white p-8 text-[var(--mcd-charcoal)] shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--mcd-red)]">
          help offer
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">
          더 쉬운 주문 방법을 도와드릴까요?
        </h2>
        <p className="mt-4 text-lg leading-8 text-[var(--mcd-muted)]">
          사용자의 현재 맥락에 맞춰 화면 구조가 부드럽게 다시 짜여집니다.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <button
            data-testid="help-mode-large-ui"
            className="help-mode-card liquid-glass-button rounded-[24px] border border-[var(--mcd-border)] bg-[var(--mcd-paper)] px-5 py-5 text-left genui-card-enter active:scale-[0.99]"
            onClick={() => acceptHelpMode("large-ui")}
            type="button"
            style={{ animationDelay: "40ms" }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-red)]">
              AdaptForge
            </p>
            <p className="mt-3 text-2xl font-black">시니어 맞춤 큰 글씨 화면</p>
            <p className="mt-3 text-sm leading-6 text-[var(--mcd-muted)]">
              큰 카드와 고정 요약 패널이 살아나듯 펼쳐집니다.
            </p>
          </button>
          <button
            data-testid="help-mode-voice"
            className="help-mode-card liquid-glass-button rounded-[24px] bg-[var(--mcd-charcoal)] px-5 py-5 text-left text-white genui-card-enter active:scale-[0.99]"
            onClick={() => acceptHelpMode("voice")}
            type="button"
            style={{ animationDelay: "110ms" }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-yellow)]">
              Voice
            </p>
            <p className="mt-3 text-2xl font-black">음성 안내 주문</p>
            <p className="mt-3 text-sm leading-6 text-white/68">
              화면 대신 음성 문맥이 앞으로 나오도록 전환합니다.
            </p>
          </button>
          <button
            data-testid="help-mode-normal"
            className="help-mode-card rounded-[24px] border border-[var(--mcd-border)] bg-white px-5 py-5 text-left genui-card-enter"
            onClick={rejectHelpOffer}
            type="button"
            style={{ animationDelay: "180ms" }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--mcd-muted)]">
              Normal
            </p>
            <p className="mt-3 text-2xl font-black">지금은 괜찮아요</p>
            <p className="mt-3 text-sm leading-6 text-[var(--mcd-muted)]">
              현재 일반 키오스크 화면을 그대로 유지합니다.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
