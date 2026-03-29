# 어려움 감지 모듈 (Difficulty Detector) 스펙

> genui-kiosk 전체 스펙의 하위 섹션. 카메라 기반 실시간 사용자 어려움 점수를 산출해 HelpOfferDialog 트리거 및 GenUI 적응 수준 결정에 사용된다.

---

## 역할

키오스크 앞에 선 사용자의 얼굴·자세·손·체류 시간을 실시간으로 분석해 **어려움 점수(0–100)** 를 Zustand 스토어(`difficultyScore`)에 지속적으로 기록한다.
이 값은 두 가지 하위 시스템에서 소비된다:

| 소비자 | 사용 방식 |
|---|---|
| `HelpOfferDialog` | `difficultyScore ≥ 70` 이면 도움 제안 다이얼로그 표시 |
| `/api/gen-ui` | `difficultyScore`를 요청 바디에 포함 → AdaptForge 적응 수준 결정 (폰트 크기, 옵션 수) |

---

## 아키텍처상 위치

```
웹캠 스트림
    │
    ▼
DifficultyDetector (컴포넌트, 항상 마운트)
    │  MediaPipe (FaceLandmarker / PoseLandmarker / HandLandmarker)
    │
    ▼
difficultyScore: number  ──▶  Zustand (kiosk store)
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
           HelpOfferDialog              /api/gen-ui (GenUIScreen)
```

`DifficultyDetector`는 UI를 렌더링하지 않는 headless 컴포넌트로 `page.tsx` 최상단에 마운트되어 전체 세션 동안 동작한다.

---

## 종합 점수 공식

```
difficultyScore (0–100) =
  ( faceScore  × 0.30
  + poseScore  × 0.20
  + handScore  × 0.20
  + timeScore  × 0.15
  + gazeScore  × 0.15 ) × 100
```

5개 신호 각각 0–1 범위로 정규화된 후 가중 합산.

---

## 신호별 산출

### 1. 표정 `faceScore` — 가중치 30%

MediaPipe **FaceLandmarker Blendshapes**로 혼란·불만 표정 감지.

```
rawScore =
  browDownAvg    × 0.25   // 눈썹 찌푸림
  + browInnerUp  × 0.15   // 눈썹 치켜올림
  + mouthFrownAvg× 0.20   // 입꼬리 내려감
  + eyeSquintAvg × 0.10   // 눈 찡그림
  + noseWrinkleAvg×0.10   // 콧잔등 찡그림
  + mouthPressAvg× 0.10   // 입술 꽉 다뭄
  + min(jawOpen × 0.5, 0.10)  // 입 벌림(놀람)

sensMult = 0.6 + (sensitivity / 10) × 0.8
faceScore = min(1, rawScore × sensMult × 3)
```

최근 15프레임 이동 평균으로 스무딩.

---

### 2. 자세 `poseScore` — 가중치 20%

PoseLandmarker로 **정지(머뭇거림)** 와 **머리 흔들림(혼란)** 감지.

```
poseScore = stillnessScore × 0.4 + headUnstable × 0.6
```

- **stillnessScore**: 최근 20프레임 어깨 중앙점 총 이동 거리
  - `totalMove < 0.05` → 1.0 (완전 정지), `> 0.05` → 비례 감소
- **headUnstable**: 최근 10프레임 머리 좌우 방향 변화 누적합 / 0.15

---

### 3. 손 `handScore` — 가중치 20%

HandLandmarker로 **망설임** 과 **hovering** 감지.

```
handScore = hesitationScore × 0.5 + slowHover × 0.5
```

- **hesitationScore**: 최근 15프레임 손 이동 방향 전환 횟수 / 8
- **slowHover**: 손이 화면 상단 (`wrist.y < 0.6`) 에 있고 평균 속도 < 0.02 일 때

---

### 4. 체류 시간 `timeScore` — 가중치 15%

```
sensMult = 0.6 + (sensitivity / 10) × 0.8
baseTime  = 60 / sensMult
timeScore = clamp((elapsed - 8) / baseTime, 0, 1)
```

- 첫 감지 후 **8초까지 0**, 이후 선형 증가
- 민감도 5(기본값) 기준: **약 48초**에서 1.0 도달

---

### 5. 시선 불안정 `gazeScore` — 가중치 15%

FaceLandmarker 랜드마크로 코끝–눈 중앙 상대 위치로 시선 방향 추정.

```
gazeX = noseTip.x - eyeCenter.x
gazeScore = (최근 15프레임 방향 전환 횟수, 변화량 > 0.002 필터) / 6
```

---

## HelpOfferDialog 트리거 조건

| 조건 | 동작 |
|---|---|
| `difficultyScore ≥ 70` | `showHelpOffer = true` → 다이얼로그 표시 |
| 다이얼로그 표시 후 15초 쿨다운 | 재표시 억제 |
| `difficultyScore < 42` (threshold × 0.6) | 다이얼로그 숨김 |

---

## GenUI 적응 수준 매핑

`/api/gen-ui`는 `difficultyScore`를 받아 아래 규칙으로 화면을 생성한다:

| difficultyScore | 폰트 크기 | 최대 옵션 수 |
|---|---|---|
| 85 이상 | 2xl | 2–3개 |
| 70–84 | xl | 4개 |
| 70 미만 | lg | 6개 |

---

## 설정값 (사용자 조정 가능)

| 항목 | 기본값 | 범위 | 영향 |
|---|---|---|---|
| `sensitivity` | 5 | 1–10 | faceScore 배율, timeScore baseTime |
| `threshold` | 45% | 20–80% | HelpOfferDialog 트리거 기준 (개발/운영 환경별 조정) |
| `helpCooldownMs` | 15,000ms | — | 도움 메시지 재표시 억제 시간 |

> `threshold`는 `difficultyScore ≥ 70` 기준과 별도로 DifficultyDetector 내부의 오버레이 표시 기준에도 사용된다. 실제 HelpOfferDialog 트리거는 Zustand 스토어의 `showHelpOffer` 로직에서 70 고정값을 사용한다.

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 추론 라이브러리 | MediaPipe Tasks Vision 0.10.18 (CDN, WASM/GPU) |
| FaceLandmarker | float16, GPU, Blendshapes 출력, 얼굴 1개 |
| PoseLandmarker | pose_landmarker_lite float16, GPU, 포즈 1개 |
| HandLandmarker | float16, GPU, 손 최대 2개 |
| 해상도 | 1280×720 (ideal) |
| 실행 모드 | `VIDEO` (프레임 단위 추론) |

---

## 인터페이스 계약

```typescript
// Zustand kiosk store (기존)
interface KioskStore {
  difficultyScore: number;       // 0–100, DifficultyDetector가 지속 업데이트
  showHelpOffer: boolean;        // difficultyScore >= 70 시 true
  setDifficultyScore: (score: number) => void;
}

// /api/gen-ui 요청 바디 (기존)
interface GenUIRequest {
  difficultyScore: number;       // 0–100
  step: BFStep;
  context: OrderContext;
}
```

`DifficultyDetector`는 `setDifficultyScore()`만 호출하며, HelpOfferDialog 트리거 및 GenUI 호출은 각 컴포넌트가 스토어를 구독해 독립적으로 처리한다.
