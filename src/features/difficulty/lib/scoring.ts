import { clamp } from "@/lib/utils";

export interface ScoreInputs {
  browDownAvg?: number;
  browInnerUp?: number;
  mouthFrownAvg?: number;
  eyeSquintAvg?: number;
  noseWrinkleAvg?: number;
  mouthPressAvg?: number;
  jawOpen?: number;
  stillnessMove?: number;
  headUnstable?: number;
  hesitationTurns?: number;
  hoverActive?: boolean;
  hoverSpeed?: number;
  elapsedSeconds?: number;
  gazeSwitches?: number;
  sensitivity?: number;
}

// 얼굴 표정: 당황/곤란 블렌드쉐이프 가중합 — 민감도 부스트 증가
export const computeFaceScore = ({
  browDownAvg = 0,
  browInnerUp = 0,
  mouthFrownAvg = 0,
  eyeSquintAvg = 0,
  noseWrinkleAvg = 0,
  mouthPressAvg = 0,
  jawOpen = 0,
  sensitivity = 5,
}: ScoreInputs) => {
  const raw =
    browDownAvg * 0.28 +
    browInnerUp * 0.18 +
    mouthFrownAvg * 0.22 +
    eyeSquintAvg * 0.12 +
    noseWrinkleAvg * 0.1 +
    mouthPressAvg * 0.1 +
    Math.min(jawOpen * 0.5, 0.1);
  const boost = 0.8 + (sensitivity / 10) * 1.6; // 기존 0.6 + 0.8x → 0.8 + 1.6x
  return clamp(raw * boost * 5); // 기존 *3 → *5
};

// 자세: 정지(얼어붙음) + 머리 기울기
export const computePoseScore = ({
  stillnessMove = 0.1,
  headUnstable = 0,
}: ScoreInputs) => {
  const stillness = clamp(1 - stillnessMove / 0.03); // 기존 /0.05 → /0.03 (더 민감)
  const headTilt = clamp(headUnstable / 0.1);         // 기존 /0.15 → /0.1
  return clamp(stillness * 0.45 + headTilt * 0.55);
};

// 손: 방향 전환(망설임) + 호버
export const computeHandScore = ({
  hesitationTurns = 0,
  hoverActive = false,
  hoverSpeed = 1,
}: ScoreInputs) => {
  const hesitation = clamp(hesitationTurns / 5); // 기존 /8 → /5
  const hover =
    hoverActive && hoverSpeed < 0.03
      ? 1
      : clamp(1 - hoverSpeed / 0.1);            // 기존 /0.08 → /0.1
  return clamp(hesitation * 0.6 + hover * 0.4);
};

// 체류 시간: 게이트 4초, 20초 안에 1.0 도달
export const computeTimeScore = ({
  elapsedSeconds = 0,
  sensitivity = 5,
}: ScoreInputs) => {
  const gate = 4;                                  // 기존 8초 → 4초
  const ramp = 20 / (0.6 + (sensitivity / 10) * 0.8); // 기존 60 → 20
  return clamp((elapsedSeconds - gate) / ramp);
};

// 시선 전환: 3번이면 1.0 (기존 6번)
export const computeGazeScore = ({ gazeSwitches = 0 }: ScoreInputs) =>
  clamp(gazeSwitches / 3);

export function computeDifficultyScore(inputs: ScoreInputs) {
  const faceScore = computeFaceScore(inputs);
  const poseScore = computePoseScore(inputs);
  const handScore = computeHandScore(inputs);
  const timeScore = computeTimeScore(inputs);
  const gazeScore = computeGazeScore(inputs);
  const totalScore =
    (faceScore * 0.3 + poseScore * 0.2 + handScore * 0.2 + timeScore * 0.15 + gazeScore * 0.15) *
    100;
  return {
    faceScore,
    poseScore,
    handScore,
    timeScore,
    gazeScore,
    totalScore: Math.round(totalScore * 10) / 10,
  };
}
