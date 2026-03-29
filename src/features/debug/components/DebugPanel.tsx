"use client";

import {
  Camera,
  Eye,
  Sparkles,
  SlidersHorizontal,
  Waves,
  Crosshair,
} from "lucide-react";
import { useKioskStore } from "@/store/kiosk";

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/40">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300"
          style={{ width: `${Math.max(6, Math.round(value * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function DebugToggle({ inline = false }: { inline?: boolean } = {}) {
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const toggleDebug = useKioskStore((state) => state.toggleDebug);

  return (
    <button
      type="button"
      onClick={toggleDebug}
      className={
        inline
          ? "rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg backdrop-blur"
          : "fixed right-4 top-4 z-40 rounded-full border border-white/15 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg backdrop-blur"
      }
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
  const voiceTranscript = useKioskStore((state) => state.voiceTranscript);
  const helpCooldownUntil = useKioskStore((state) => state.helpCooldownUntil);
  const setShowHelpOffer = useKioskStore((state) => state.setShowHelpOffer);
  const setDifficultyScore = useKioskStore((state) => state.setDifficultyScore);
  const setDetectionConfig = useKioskStore((state) => state.setDetectionConfig);
  const clearLLMLogs = useKioskStore((state) => state.clearLLMLogs);

  if (!debugEnabled) {
    return null;
  }

  const cooldownSeconds = Math.max(0, Math.ceil((helpCooldownUntil - Date.now()) / 1000));

  return (
    <aside
      data-testid="debug-panel"
      className="fixed top-20 right-4 z-40 hidden h-[400px] w-[400px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[30px] border border-white/20 bg-slate-900 p-5 text-sm text-slate-100 shadow-2xl xl:block"
    >
      <div className="grid gap-3">
        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <Camera className="size-4" /> 카메라/캘리브레이션
          </div>
          <p className="text-3xl font-black">{Math.round(diagnostics.totalScore)}</p>
          <p className="mt-2 text-xs text-white/60">
            source {diagnostics.source} · {diagnostics.cameraReady ? "camera ready" : "fallback"} · cooldown {cooldownSeconds}s
          </p>
          <p className="mt-1 text-xs text-white/50">{diagnostics.message}</p>
          <p className="mt-1 text-xs text-emerald-200/80">{diagnostics.calibration.status}</p>
          <p className="mt-1 text-xs text-emerald-200/60">{detectorStatus}</p>

          <div className="mt-4 space-y-3">
            <Meter label="face" value={diagnostics.faceScore} />
            <Meter label="pose" value={diagnostics.poseScore} />
            <Meter label="hand" value={diagnostics.handScore} />
            <Meter label="time" value={diagnostics.timeScore} />
            <Meter label="gaze" value={diagnostics.gazeScore} />
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-3 flex items-center gap-2 text-violet-300">
            <Crosshair className="size-4" /> MediaPipe 캘리브레이션
          </div>
          {/* Detection status badges */}
          <div className="mb-3 flex gap-2">
            {(
              [
                { key: "faceVisible", label: "얼굴" },
                { key: "poseVisible", label: "포즈" },
                { key: "handVisible", label: "손" },
              ] as const
            ).map(({ key, label }) => (
              <span
                key={key}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  diagnostics.calibration[key]
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {label} {diagnostics.calibration[key] ? "ON" : "—"}
              </span>
            ))}
          </div>
          {/* Landmark metrics */}
          <div className="space-y-3 text-xs">
            {/* Head offset — face center X relative to shoulders */}
            <div>
              <div className="mb-1 flex justify-between text-white/50">
                <span>얼굴 위치 (head offset)</span>
                <span>{diagnostics.calibration.headOffset.toFixed(3)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                <div
                  className="absolute h-full w-2 rounded-full bg-violet-400"
                  style={{
                    left: `calc(50% + ${diagnostics.calibration.headOffset * 300}% - 4px)`,
                  }}
                />
              </div>
            </div>
            {/* Shoulder span — body distance/width */}
            <div>
              <div className="mb-1 flex justify-between text-white/50">
                <span>어깨 폭 (shoulder span)</span>
                <span>{diagnostics.calibration.shoulderSpan.toFixed(3)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${Math.min(100, diagnostics.calibration.shoulderSpan * 300)}%` }}
                />
              </div>
            </div>
            {/* Pointer gap — hand/finger extension */}
            <div>
              <div className="mb-1 flex justify-between text-white/50">
                <span>포인터 간격 (pointer gap)</span>
                <span>{diagnostics.calibration.pointerGap.toFixed(3)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.min(100, diagnostics.calibration.pointerGap * 100)}%` }}
                />
              </div>
            </div>
            {/* Gaze switches */}
            <div className="flex justify-between text-white/50">
              <span>시선 전환 (gaze switches)</span>
              <span className="font-mono text-violet-300">
                {diagnostics.calibration.gazeSwitches.toFixed(1)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-black/15 p-4">
          <div className="mb-2 flex items-center gap-2 text-cyan-300">
            <SlidersHorizontal className="size-4" /> Calibration controls
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
              <div className="rounded-[16px] bg-white/[0.04] p-3">
                <p className="uppercase tracking-[0.24em] text-white/35">signal</p>
                <p className="mt-2 text-lg font-black text-white">{Math.round(diagnostics.calibration.signalStrength * 100)}%</p>
              </div>
              <div className="rounded-[16px] bg-white/[0.04] p-3">
                <p className="uppercase tracking-[0.24em] text-white/35">elapsed</p>
                <p className="mt-2 text-lg font-black text-white">{Math.round(diagnostics.calibration.elapsedSeconds)}s</p>
              </div>
            </div>
            <label className="block text-xs text-white/60">
              threshold {Math.round(diagnostics.threshold)}
              <input
                type="range"
                min="50"
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
            <Sparkles className="size-4" /> LLM traces
          </div>
          <div className="space-y-2 text-xs text-white/60">
            {llmLogs.length ? (
              llmLogs.map((log) => (
                <div key={log.id} className="rounded-[16px] bg-white/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">{log.type}</p>
                  <p className="mt-2 text-white/75">{log.summary ?? log.response}</p>
                </div>
              ))
            ) : (
              <p>아직 LLM 요청이 없습니다.</p>
            )}
          </div>
          <button
            type="button"
            onClick={clearLLMLogs}
            className="mt-3 rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
          >
            로그 비우기
          </button>
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
            {sessionEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-[14px] bg-white/[0.04] p-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">{event.label}</p>
                <p className="mt-1 leading-6 text-white/75">{event.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
