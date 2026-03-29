"use client";

import { useEffect, useRef } from "react";
import { computeDifficultyScore } from "@/features/difficulty/lib/scoring";
import { useKioskStore } from "@/store/kiosk";
import type { DifficultySignalBreakdown } from "@/types";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Landmark = { x: number; y: number; z?: number };

type MediapipeBundle = {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  FaceLandmarker: {
    createFromOptions(
      vision: unknown,
      options: {
        baseOptions: { modelAssetPath: string };
        runningMode: "VIDEO";
        outputFaceBlendshapes?: boolean;
        numFaces?: number;
      },
    ): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        faceLandmarks: Array<Landmark[]>;
        faceBlendshapes: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
      };
    }>;
  };
  HandLandmarker: {
    createFromOptions(
      vision: unknown,
      options: { baseOptions: { modelAssetPath: string }; runningMode: "VIDEO" },
    ): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        landmarks: Array<Landmark[]>;
      };
    }>;
  };
  PoseLandmarker: {
    createFromOptions(
      vision: unknown,
      options: { baseOptions: { modelAssetPath: string }; runningMode: "VIDEO" },
    ): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        landmarks: Array<Landmark[]>;
      };
    }>;
  };
};

function blendScore(
  categories: Array<{ categoryName: string; score: number }> | undefined,
  key: string,
) {
  return categories?.find((entry) => entry.categoryName === key)?.score ?? 0;
}

// 15-frame moving average for smoothing
function smoothReading(
  history: { current: DifficultySignalBreakdown[] },
  reading: DifficultySignalBreakdown,
) {
  history.current = [...history.current.slice(-14), reading];
  const bucket = history.current;
  const average = (key: keyof DifficultySignalBreakdown) =>
    bucket.reduce(
      (sum, entry) => sum + (typeof entry[key] === "number" ? (entry[key] as number) : 0),
      0,
    ) / bucket.length;

  return {
    faceScore: average("faceScore"),
    poseScore: average("poseScore"),
    handScore: average("handScore"),
    timeScore: average("timeScore"),
    gazeScore: average("gazeScore"),
    totalScore: Math.round(average("totalScore") * 10) / 10,
    source: reading.source,
  } satisfies DifficultySignalBreakdown;
}

// Eye landmark index groups for face mesh (468-point model)
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

function drawFaceOverlay(
  canvas: HTMLCanvasElement,
  faceLandmarks: Landmark[],
  handLandmarks: Landmark[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (faceLandmarks.length === 0 && handLandmarks.length === 0) return;

  const px = (x: number) => x * w;
  const py = (y: number) => y * h;

  // Face mesh: every 4th point as tiny green dots
  ctx.fillStyle = "rgba(0,255,128,0.35)";
  for (let i = 0; i < faceLandmarks.length; i += 4) {
    const lm = faceLandmarks[i];
    ctx.beginPath();
    ctx.arc(px(lm.x), py(lm.y), 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye contours in cyan
  for (const indices of [LEFT_EYE_INDICES, RIGHT_EYE_INDICES]) {
    ctx.beginPath();
    indices.forEach((idx, i) => {
      const lm = faceLandmarks[idx];
      if (!lm) return;
      if (i === 0) ctx.moveTo(px(lm.x), py(lm.y));
      else ctx.lineTo(px(lm.x), py(lm.y));
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(0,220,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,220,255,0.08)";
    ctx.fill();
  }

  // Eye corner dots
  for (const idx of [33, 133, 263, 362]) {
    const lm = faceLandmarks[idx];
    if (!lm) continue;
    ctx.beginPath();
    ctx.arc(px(lm.x), py(lm.y), 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,220,255,0.9)";
    ctx.fill();
  }

  // Nose tip crosshair
  const noseTip = faceLandmarks[4];
  if (noseTip) {
    const nx = px(noseTip.x);
    const ny = py(noseTip.y);
    ctx.strokeStyle = "rgba(255,200,0,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nx - 7, ny); ctx.lineTo(nx + 7, ny);
    ctx.moveTo(nx, ny - 7); ctx.lineTo(nx, ny + 7);
    ctx.stroke();
  }

  // Hand pointer ring
  const pointer = handLandmarks[8];
  if (pointer) {
    ctx.beginPath();
    ctx.arc(px(pointer.x), py(pointer.y), 9, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,80,80,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function DifficultyDetector({ inline = false }: { inline?: boolean } = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(Date.now());
  const historyRef = useRef<DifficultySignalBreakdown[]>([]);
  // pose: 20-frame shoulder midpoint history for stillnessMove
  const shoulderHistoryRef = useRef<Array<{ x: number; y: number }>>([]);
  // hand: 15-frame pointer.x history for hesitation direction changes
  const handXHistoryRef = useRef<number[]>([]);
  // gaze: 15-frame (noseTip.x - eyeCenter.x) history for direction changes
  const gazeHistoryRef = useRef<number[]>([]);

  const setDifficultyReading = useKioskStore((state) => state.setDifficultyReading);
  const setDetectorStatus = useKioskStore((state) => state.setDetectorStatus);
  const setCalibration = useKioskStore((state) => state.setCalibration);
  const sensitivity = useKioskStore((state) => state.diagnostics.sensitivity);
  const accessibilityMode = useKioskStore((state) => state.accessibilityMode);
  const debugEnabled = useKioskStore((state) => state.debugEnabled);
  const isIdle = useKioskStore((state) => state.isIdle);

  useEffect(() => {
    let cancelled = false;

    async function startFallbackLoop() {
      setDetectorStatus("Fallback detector active — preserving stable product loop");
      intervalRef.current = window.setInterval(() => {
        const elapsedSeconds = (Date.now() - startedAt.current) / 1000;
        const wave = (Math.sin(elapsedSeconds / 4) + 1) / 2;
        const reading = computeDifficultyScore({
          browDownAvg: wave * 0.4,
          browInnerUp: wave * 0.32,
          mouthFrownAvg: wave * 0.24,
          eyeSquintAvg: wave * 0.18,
          noseWrinkleAvg: wave * 0.12,
          mouthPressAvg: wave * 0.2,
          jawOpen: wave * 0.1,
          sensitivity,
          stillnessMove: 0.05 - wave * 0.025,
          headUnstable: wave * 0.08,
          hesitationTurns: 2 + wave * 4,
          hoverActive: wave > 0.6,
          hoverSpeed: 0.05 - wave * 0.04,
          elapsedSeconds,
          gazeSwitches: 1 + wave * 4,
        });

        setCalibration({
          faceVisible: true,
          poseVisible: true,
          handVisible: wave > 0.35,
          signalStrength: wave,
          shoulderSpan: 0.05 - wave * 0.025,
          headOffset: wave * 0.08,
          pointerGap: 0.05 - wave * 0.04,
          elapsedSeconds,
          gazeSwitches: 1 + wave * 4,
          status: "Simulated calibration running",
        });
        setDifficultyReading(smoothReading(historyRef, { ...reading, source: "simulated" }));
      }, 200);
    }

    async function startMediapipeLoop() {
      if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
        await startFallbackLoop();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        if (cancelled) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const visionModule = (await import("@mediapipe/tasks-vision")) as MediapipeBundle;
        const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_ROOT);
        const [face, hand, pose] = await Promise.all([
          visionModule.FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL },
            runningMode: "VIDEO",
            outputFaceBlendshapes: true,
            numFaces: 1,
          }),
          visionModule.HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL },
            runningMode: "VIDEO",
          }),
          visionModule.PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL },
            runningMode: "VIDEO",
          }),
        ]);

        if (cancelled) return;
        setDetectorStatus("MediaPipe detector active — live camera scoring");

        intervalRef.current = window.setInterval(() => {
          if (!videoRef.current) return;

          const now = performance.now();
          const faceResult = face.detectForVideo(videoRef.current, now);
          const handResult = hand.detectForVideo(videoRef.current, now);
          const poseResult = pose.detectForVideo(videoRef.current, now);
          const elapsedSeconds = (Date.now() - startedAt.current) / 1000;

          // Blendshapes for faceScore
          const categories = faceResult.faceBlendshapes?.[0]?.categories;

          // Pose landmarks
          const poseLandmarks = poseResult.landmarks?.[0] ?? [];
          const leftShoulder = poseLandmarks[11];
          const rightShoulder = poseLandmarks[12];
          const nose = poseLandmarks[0];
          const shoulderSpan =
            leftShoulder && rightShoulder
              ? Math.abs(leftShoulder.x - rightShoulder.x)
              : 0.1;
          const headOffset =
            nose && leftShoulder && rightShoulder
              ? Math.abs(nose.x - (leftShoulder.x + rightShoulder.x) / 2)
              : 0;

          // === poseScore: stillnessMove = total shoulder midpoint travel over 20 frames ===
          if (leftShoulder && rightShoulder) {
            const midX = (leftShoulder.x + rightShoulder.x) / 2;
            const midY = (leftShoulder.y + rightShoulder.y) / 2;
            shoulderHistoryRef.current = [
              ...shoulderHistoryRef.current.slice(-19),
              { x: midX, y: midY },
            ];
          }
          const shoulderHistory = shoulderHistoryRef.current;
          let totalMove = 0;
          for (let i = 1; i < shoulderHistory.length; i++) {
            const dx = shoulderHistory[i].x - shoulderHistory[i - 1].x;
            const dy = shoulderHistory[i].y - shoulderHistory[i - 1].y;
            totalMove += Math.sqrt(dx * dx + dy * dy);
          }

          // Hand landmarks
          const hands = handResult.landmarks ?? [];
          const firstHand = hands[0] ?? [];
          const wrist = firstHand[0];
          const pointer = firstHand[8];
          const pointerGap = wrist && pointer ? Math.abs(pointer.y - wrist.y) : 1;

          // === handScore: hesitationTurns = pointer.x direction changes over 15 frames ===
          if (pointer) {
            handXHistoryRef.current = [
              ...handXHistoryRef.current.slice(-14),
              pointer.x,
            ];
          }
          const handXHistory = handXHistoryRef.current;
          let hesitationTurns = 0;
          for (let i = 2; i < handXHistory.length; i++) {
            const prev = handXHistory[i - 1] - handXHistory[i - 2];
            const curr = handXHistory[i] - handXHistory[i - 1];
            if (prev !== 0 && curr !== 0 && Math.sign(prev) !== Math.sign(curr)) {
              hesitationTurns++;
            }
          }

          // === gazeScore: noseTip.x - eyeCenter.x direction changes over 15 frames (delta > 0.002) ===
          const faceLandmarks = faceResult.faceLandmarks?.[0] ?? [];
          const noseTip = faceLandmarks[4];        // nose tip (468-point mesh)
          const leftEyeCorner = faceLandmarks[33]; // left eye outer corner
          const rightEyeCorner = faceLandmarks[263]; // right eye outer corner
          if (noseTip && leftEyeCorner && rightEyeCorner) {
            const eyeCenterX = (leftEyeCorner.x + rightEyeCorner.x) / 2;
            gazeHistoryRef.current = [
              ...gazeHistoryRef.current.slice(-14),
              noseTip.x - eyeCenterX,
            ];
          }
          const gazeHistory = gazeHistoryRef.current;
          let gazeSwitches = 0;
          for (let i = 2; i < gazeHistory.length; i++) {
            const prevDelta = gazeHistory[i - 1] - gazeHistory[i - 2];
            const currDelta = gazeHistory[i] - gazeHistory[i - 1];
            if (
              Math.abs(currDelta) > 0.002 &&
              prevDelta !== 0 &&
              Math.sign(prevDelta) !== Math.sign(currDelta)
            ) {
              gazeSwitches++;
            }
          }

          const hasSignal =
            Boolean(categories?.length) || poseLandmarks.length > 0 || hands.length > 0;

          const reading = computeDifficultyScore({
            browDownAvg:
              (blendScore(categories, "browDownLeft") + blendScore(categories, "browDownRight")) / 2,
            browInnerUp: blendScore(categories, "browInnerUp"),
            mouthFrownAvg:
              (blendScore(categories, "mouthFrownLeft") +
                blendScore(categories, "mouthFrownRight")) /
              2,
            eyeSquintAvg:
              (blendScore(categories, "eyeSquintLeft") +
                blendScore(categories, "eyeSquintRight")) /
              2,
            noseWrinkleAvg: blendScore(categories, "noseSneerLeft"),
            mouthPressAvg: blendScore(categories, "mouthPressLeft"),
            jawOpen: blendScore(categories, "jawOpen"),
            sensitivity,
            stillnessMove: totalMove,
            headUnstable: headOffset,
            hesitationTurns,
            hoverActive: Boolean(wrist && wrist.y < 0.6),
            hoverSpeed: pointerGap,
            elapsedSeconds,
            gazeSwitches,
          });

          setCalibration({
            faceVisible: Boolean(categories?.length),
            poseVisible: poseLandmarks.length > 0,
            handVisible: hands.length > 0,
            signalStrength: hasSignal ? 0.92 : 0.28,
            shoulderSpan,
            headOffset,
            pointerGap,
            elapsedSeconds,
            gazeSwitches,
            status: hasSignal
              ? "Live MediaPipe calibration active"
              : "Signal weak — fallback smoothing applied",
          });

          setDifficultyReading(
            smoothReading(historyRef, {
              ...reading,
              source: hasSignal ? "mediapipe" : "fallback",
            }),
          );

          // Canvas overlay: draw face mesh + eye tracking
          if (canvasRef.current && videoRef.current) {
            const vid = videoRef.current;
            canvasRef.current.width = vid.clientWidth || 268;
            canvasRef.current.height = vid.clientHeight || 180;
            drawFaceOverlay(
              canvasRef.current,
              faceResult.faceLandmarks?.[0] ?? [],
              handResult.landmarks?.[0] ?? [],
            );
          }
        }, 200);
      } catch {
        await startFallbackLoop();
      }
    }

    if (
      (!inline && (isIdle || accessibilityMode !== "none")) ||
      (inline && accessibilityMode !== "none")
    ) {
      setDetectorStatus(
        isIdle
          ? "Idle — detector paused"
          : "Adaptive mode active — detector paused",
      );
      return;
    }

    startedAt.current = Date.now();
    void startMediapipeLoop();

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [
    accessibilityMode,
    debugEnabled,
    inline,
    isIdle,
    sensitivity,
    setCalibration,
    setDetectorStatus,
    setDifficultyReading,
  ]);

  return (
    <div
      data-testid="debug-camera-preview"
      className={inline ? "block" : "pointer-events-none h-0 w-0 overflow-hidden"}
    >
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#111111] p-2 text-white">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/40">
          <span>camera preview</span>
          <span>mediapipe</span>
        </div>
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-[12px] bg-black object-cover"
            style={{ height: "180px" }}
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 rounded-[12px] pointer-events-none"
            style={{ width: "100%", height: "180px" }}
          />
        </div>
      </div>
    </div>
  );
}
