"use client";

import { Activity, Eye, Sparkles, Waves } from "lucide-react";
import { useKioskStore } from "@/store/kiosk";

export function DebugToggle() {
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const toggleDebug = useKioskStore((state) => state.toggleDebug);

  return (
    <button
      type="button"
      onClick={toggleDebug}
      className="fixed right-4 top-4 z-40 rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg backdrop-blur"
    >
      {debugEnabled ? "debug on" : "debug off"}
    </button>
  );
}

export function DebugPanel() {
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const diagnostics = useKioskStore((state) => state.diagnostics);
  const detectorStatus = useKioskStore((state) => state.detectorStatus);
  const llmLogs = useKioskStore((state) => state.llmLogs);
  const sessionEvents = useKioskStore((state) => state.sessionEvents);
  const presenterNote = useKioskStore((state) => state.presenterNote);
  const voiceTranscript = useKioskStore((state) => state.voiceTranscript);
  const helpCooldownUntil = useKioskStore((state) => state.helpCooldownUntil);
  const setShowHelpOffer = useKioskStore((state) => state.setShowHelpOffer);
  const setDifficultyScore = useKioskStore((state) => state.setDifficultyScore);
  const setDetectionConfig = useKioskStore((state) => state.setDetectionConfig);

  if (!debugEnabled) {
    return null;
  }

  const cooldownSeconds = Math.max(0, Math.ceil((helpCooldownUntil - Date.now()) / 1000));

  return (
    <aside className="fixed inset-y-20 right-4 z-40 hidden w-[380px] max-w-[calc(100vw-2rem)] rounded-[30px] border border-white/10 bg-[#07101c]/92 p-5 text-sm text-white shadow-2xl backdrop-blur-xl xl:block">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.32em] text-amber-300">
          Debug overlay
        </p>
        <h3 className="mt-2 text-xl font-black">제품은 그대로, 내부 정보만 오버레이</h3>
      </div>

      <div className="grid gap-3">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Activity className="size-4" /> 난이도 센서
          </div>
          <p className="text-3xl font-black">{Math.round(diagnostics.totalScore)}</p>
          <p className="mt-2 text-xs text-white/60">
            source {diagnostics.source} · camera {diagnostics.cameraReady ? "ready" : "fallback"} ·
            cooldown {cooldownSeconds}s
          </p>
          <p className="mt-1 text-xs text-white/50">{diagnostics.message}</p>
          <p className="mt-1 text-xs text-emerald-200/70">{detectorStatus}</p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs text-white/60">
              threshold {Math.round(diagnostics.threshold)}
              <input
                type="range"
                min="40"
                max="90"
                value={diagnostics.threshold}
                onChange={(event) =>
                  setDetectionConfig({ threshold: Number(event.currentTarget.value) })
                }
                className="mt-2 w-full"
              />
            </label>

            <label className="block text-xs text-white/60">
              sensitivity {diagnostics.sensitivity.toFixed(0)}
              <input
                type="range"
                min="1"
                max="10"
                value={diagnostics.sensitivity}
                onChange={(event) =>
                  setDetectionConfig({ sensitivity: Number(event.currentTarget.value) })
                }
                className="mt-2 w-full"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDifficultyScore(82);
                  setShowHelpOffer(true);
                }}
                className="rounded-full border border-white/10 px-3 py-2 text-xs"
              >
                도움 제안
              </button>
              <button
                type="button"
                onClick={() => setDifficultyScore(18)}
                className="rounded-full border border-white/10 px-3 py-2 text-xs"
              >
                안정 상태
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-300">
            <Sparkles className="size-4" /> Live progress
          </div>
          <p className="text-xs leading-6 text-white/60">{presenterNote}</p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-sky-300">
            <Waves className="size-4" /> LLM traces
          </div>
          <div className="space-y-2 text-xs text-white/60">
            {llmLogs.length ? (
              llmLogs.map((log) => <div key={log.id}>{log.summary ?? log.response}</div>)
            ) : (
              <p>아직 LLM 요청이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-cyan-300">
            <Waves className="size-4" /> Voice transcript
          </div>
          <div className="space-y-2 text-xs text-white/60">
            {voiceTranscript.length ? (
              voiceTranscript.map((turn) => (
                <div key={turn.ts}>
                  <span className="text-white/40">{turn.role}</span>: {turn.text}
                </div>
              ))
            ) : (
              <p>아직 음성 대화가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-pink-300">
            <Eye className="size-4" /> Session events
          </div>
          <div className="space-y-2 text-xs text-white/60">
            {sessionEvents.map((event) => (
              <div key={event.id}>
                {event.label}: {event.detail}
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
