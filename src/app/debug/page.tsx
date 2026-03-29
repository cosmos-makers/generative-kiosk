"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DifficultyDetector } from "@/features/difficulty/components/DifficultyDetector";
import { useKioskStore } from "@/store/kiosk";

export default function DebugCalibrationPage() {
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const toggleDebug = useKioskStore((state) => state.toggleDebug);
  const diagnostics = useKioskStore((state) => state.diagnostics);
  const llmLogs = useKioskStore((state) => state.llmLogs);
  const sessionEvents = useKioskStore((state) => state.sessionEvents);

  useEffect(() => {
    if (!debugEnabled) toggleDebug();
  }, [debugEnabled, toggleDebug]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#27364a_0%,#141414_65%,#090909_100%)] px-4 py-8 text-white lg:px-6">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/25 px-6 py-5 shadow-[0_24px_40px_rgba(0,0,0,0.24)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#7dd3fc]">debug calibration page</p>
            <h1 className="mt-3 text-[2.8rem] font-black tracking-[-0.05em]">MediaPipe + GenUI 데이터 흐름 관측실</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/70">
              카메라 프리뷰, 난이도 신호, GenUI/Voice 로그, 세션 이벤트를 한 화면에서 확인하도록 만든 개발자용 페이지입니다.
            </p>
          </div>
          <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.24em] text-white/85">
            back to kiosk
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#07101c]/94 p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.32em] text-amber-300">camera preview</p>
            <div className="mt-4">
              <DifficultyDetector inline />
            </div>
          </section>

          <section className="space-y-4 rounded-[2rem] border border-white/10 bg-[#07101c]/94 p-5 shadow-2xl">
            <div className="rounded-[1.4rem] bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">live diagnostics</p>
              <p className="mt-3 text-3xl font-black">{Math.round(diagnostics.totalScore)}</p>
              <p className="mt-2 text-sm text-white/65">
                source {diagnostics.source} · camera {diagnostics.cameraReady ? "ready" : "pending"}
              </p>
              <p className="mt-1 text-sm text-white/65">{diagnostics.message}</p>
            </div>

            <div className="rounded-[1.4rem] bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">LLM logs</p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                {llmLogs.length ? llmLogs.map((log) => <div key={log.id}>{log.summary ?? log.response}</div>) : <p>아직 로그가 없습니다.</p>}
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">session events</p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                {sessionEvents.map((event) => <div key={event.id}>{event.label}: {event.detail}</div>)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
