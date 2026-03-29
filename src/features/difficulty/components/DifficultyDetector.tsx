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

type MediapipeBundle = {
  FilesetResolver: {
    forVisionTasks(path: string): Promise<unknown>;
  };
  FaceLandmarker: {
    createFromModelPath(vision: unknown, path: string): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        faceLandmarks: Array<Array<{ x: number; y: number }>>;
        faceBlendshapes: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
      };
    }>;
  };
  HandLandmarker: {
    createFromModelPath(vision: unknown, path: string): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        landmarks: Array<Array<{ x: number; y: number }>>;
      };
    }>;
  };
  PoseLandmarker: {
    createFromModelPath(vision: unknown, path: string): Promise<{
      detectForVideo(frame: HTMLVideoElement, timestamp: number): {
        landmarks: Array<Array<{ x: number; y: number; visibility?: number }>>;
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

function smoothReading(
  history: { current: DifficultySignalBreakdown[] },
  reading: DifficultySignalBreakdown,
) {
  history.current = [...history.current.slice(-3), reading];
  const bucket = history.current;
  const average = (key: keyof DifficultySignalBreakdown) =>
    bucket.reduce((sum, entry) => sum + (typeof entry[key] === "number" ? (entry[key] as number) : 0), 0) /
    bucket.length;

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

export function DifficultyDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAt = useRef(Date.now());
  const historyRef = useRef<DifficultySignalBreakdown[]>([]);
  const setDifficultyReading = useKioskStore((s) => s.setDifficultyReading);
  const setDetectorStatus = useKioskStore((s) => s.setDetectorStatus);
  const sensitivity = useKioskStore((s) => s.diagnostics.sensitivity);
  const accessibilityMode = useKioskStore((s) => s.accessibilityMode);
  const isIdle = useKioskStore((s) => s.isIdle);

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
        setDifficultyReading(
          smoothReading(historyRef, { ...reading, source: "simulated" }),
        );
      }, 1200);
    }

    async function startMediapipeLoop() {
      if (!videoRef.current || !navigator.mediaDevices?.getUserMedia) {
        await startFallbackLoop();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (cancelled) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const visionModule = (await import("@mediapipe/tasks-vision")) as MediapipeBundle;
        const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_ROOT);
        const [face, hand, pose] = await Promise.all([
          visionModule.FaceLandmarker.createFromModelPath(vision, FACE_MODEL),
          visionModule.HandLandmarker.createFromModelPath(vision, HAND_MODEL),
          visionModule.PoseLandmarker.createFromModelPath(vision, POSE_MODEL),
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

          const categories = faceResult.faceBlendshapes?.[0]?.categories;
          const poseLandmarks = poseResult.landmarks?.[0] ?? [];
          const leftShoulder = poseLandmarks[11];
          const rightShoulder = poseLandmarks[12];
          const nose = poseLandmarks[0];
          const shoulderSpan =
            leftShoulder && rightShoulder
              ? Math.abs(leftShoulder.x - rightShoulder.x)
              : 0.1;

          const hands = handResult.landmarks ?? [];
          const firstHand = hands[0] ?? [];
          const wrist = firstHand[0];
          const pointer = firstHand[8];
          const hasSignal =
            Boolean(categories?.length) ||
            poseLandmarks.length > 0 ||
            hands.length > 0;

          const reading = computeDifficultyScore({
            browDownAvg:
              (blendScore(categories, "browDownLeft") +
                blendScore(categories, "browDownRight")) /
              2,
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
            stillnessMove: shoulderSpan,
            headUnstable:
              nose && leftShoulder && rightShoulder
                ? Math.abs(nose.x - (leftShoulder.x + rightShoulder.x) / 2)
                : 0,
            hesitationTurns:
              wrist && pointer ? Math.abs(pointer.x - wrist.x) * 12 : 0,
            hoverActive: Boolean(wrist && wrist.y < 0.65),
            hoverSpeed:
              wrist && pointer ? Math.abs(pointer.y - wrist.y) : 1,
            elapsedSeconds,
            gazeSwitches:
              nose && leftShoulder && rightShoulder
                ? Math.abs(nose.x - (leftShoulder.x + rightShoulder.x) / 2) * 10
                : 0,
          });

          const nextReading = smoothReading(historyRef, {
            ...reading,
            source: hasSignal ? "mediapipe" : "fallback",
          });
          setDetectorStatus(
            hasSignal
              ? "MediaPipe detector active — live camera scoring"
              : "MediaPipe signal weak — using smoothed fallback scoring",
          );
          setDifficultyReading(nextReading);
        }, 1400);
      } catch {
        await startFallbackLoop();
      }
    }

    if (isIdle || accessibilityMode !== "none") {
      setDetectorStatus(
        isIdle ? "Idle — detector paused" : "Adaptive mode active — detector paused",
      );
      return;
    }

    void startMediapipeLoop();

    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [accessibilityMode, isIdle, sensitivity, setDetectorStatus, setDifficultyReading]);

  return <video ref={videoRef} className="hidden" muted playsInline />;
}
