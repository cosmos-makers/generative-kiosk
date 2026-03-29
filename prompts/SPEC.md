# MDonald 배리어프리 키오스크 — 제품 명세서 (처음부터 구현)

## 배경

MDonald 배리어프리 키오스크는 패스트푸드 환경에서 디지털 소외 계층이 겪는 탐색 실패, 시야 문제, 시간 압박, 심리적 부담을 해소하기 위한 AI 네이티브 웹 키오스크다.

**핵심 아이디어**: AdaptForge 논문(Adaptive and Accessible User Interfaces for Seniors Through Model-Driven Engineering) 차용, ㄴ사용자가 키오스크에 맞추는 것이 아니라, 키오스크가 사용자에게 맞춰진다. 사용자의 멈춤, 반복 실수, 화면 왕복, 얼굴 표정을 실시간으로 분석한 뒤 Generative UI로 더 쉬운 화면을 즉석 생성한다.

**Generative UI 컨셉**: 고정된 UI 템플릿이 아니라, LLM이 현재 키오스크의 추상 UI 모델(PIM)을 분석하고 사용자 프로필을 주입하여 매 단계마다 새로운 UI를 생성한다. 모든 LLM 처리는 자연어 기반으로 동작하며 패턴 매칭이나 키워드 분기를 사용하지 않는다.

**Debug Mode**: MeidaPipe이용 해커톤 데모용 디버그 모드에서는 어려움 감지 점수, 행동 로그, AI의 PIM 분석 및 UI 생성 과정이 실시간으로 표시된다. 이는 실제로 동작하는 기능이며 가짜 데이터를 사용하지 않는다.

**해커톤 미션**: AI Applications — 현실 문제를 해결하는 wow-moment included AI 애플리케이션.

---

## 제품 개요

MDonald 매장 내 터치스크린 자동 주문 키오스크. 일반 사용자는 기존 방식으로, 어려움이 감지된 사용자(시각 장애, 고령, 인지 장애 등)는 AI 음성 안내 또는 LLM이 즉석 생성하는 큰 화면 UI로 독립적으로 주문할 수 있다. 카메라가 백그라운드에서 어려움 점수를 측정하여 70점 이상이면 자동으로 접근성 모드를 제안한다.

**기술 환경**: Next.js App Router, TypeScript, Zustand 상태 관리, Tailwind CSS v4, shadcn, Web Speech API(STT/TTS), ElevenLabs UI Components (Orb / LiveWaveform), Claude CLI headless mode 우선 (Haiku 모델). 한국어 전용 UI.

**AI 처리 원칙 (필수 준수)**:
- 모든 LLM/Agent 처리는 자연어 기반 — 패턴 매칭, if/else 키워드 분기 금지
- LLM이 사용자 의도를 자연어로 이해하고 action을 결정
- GenUI는 PIM 기반 적응 생성 + 사용자 프로필 주입 방식
- Claude 호출은 CLI headless mode 우선 (`claude -p`). 실패 시 원인 파악 후 `ANTHROPIC_API_KEY` 환경변수로 fallback

---

## 전체 디렉토리 구조

```
src/
├── app/                            # Next.js App Router
│   ├── api/
│   │   ├── gen-ui/route.ts         # Generative UI 생성 API
│   │   ├── voice-order/route.ts    # 음성 주문 처리 API
│   │   └── orders/route.ts         # 주문 제출 API
│   ├── layout.tsx
│   └── page.tsx                    # 루트 라우팅 로직
│
├── features/
│   ├── kiosk/                      # 일반 모드 (모듈 독립)
│   │   ├── components/
│   │   │   ├── IdleScreen.tsx
│   │   │   ├── OrderTypeScreen.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── CategoryTabs.tsx
│   │   │   ├── MenuCard.tsx
│   │   │   ├── MenuGrid.tsx
│   │   │   ├── MenuDetailDialog.tsx
│   │   │   ├── CartSheet.tsx
│   │   │   └── CheckoutScreen.tsx
│   │   └── hooks/
│   │       └── useIdleTimer.ts
│   │
│   ├── barrier-free/               # 배리어프리 모드 (모듈 독립)
│   │   ├── components/
│   │   │   ├── BFLayout.tsx
│   │   │   ├── GenUIScreen.tsx
│   │   │   └── BFCheckout.tsx
│   │   └── hooks/
│   │
│   ├── voice/                      # 음성 모듈 (독립 모듈)
│   │   ├── components/
│   │   │   ├── VoicePermissionGate.tsx
│   │   │   └── VoiceOrderInterface.tsx
│   │   └── hooks/
│   │       ├── useSTT.ts
│   │       └── useVoice.ts
│   │
│   ├── difficulty/                 # 어려움 감지 모듈 (독립)
│   │   ├── components/
│   │   │   ├── DifficultyDetector.tsx
│   │   │   └── HelpOfferDialog.tsx
│   │   └── lib/
│   │       └── scoring.ts          # 점수 산출 순수 로직
│   │
│   └── debug/                      # 디버그 패널 (독립)
│       └── components/
│           └── DebugPanel.tsx
│
├── store/
│   └── kiosk.ts                    # Zustand 단일 스토어
│
├── types/
│   └── index.ts                    # 전체 타입 정의
│
├── lib/
│   ├── ai/
│   │   ├── client.ts               # Claude 클라이언트 (CLI 우선)
│   │   └── prompts.ts              # 시스템 프롬프트 모음
│   ├── menu.ts                     # loadMenu() 함수
│   └── utils.ts                    # cn(), stripHtml() 등
│
└── data/
    └── menu.json
```

**모듈 경계 원칙**: 각 feature 모듈은 독립적으로 동작하며, 다른 feature 모듈을 직접 import하지 않는다. 공통 의존성은 `store`, `types`, `lib`를 통해서만 공유한다. A 모듈 변경이 B 모듈에 영향을 주지 않도록 경계를 명확히 유지한다.

---

## 1. 메뉴 데이터 구조

```
MenuData
└── categories: MenuCategory[]
    ├── seq: number          // 카테고리 순서 ID
    ├── korName: string      // 한국어 카테고리 이름
    ├── engName: string
    └── items: MenuItem[]
        ├── id: number
        ├── korName: string  // HTML 태그 포함 가능 → 렌더링 전 stripHtml 필요
        ├── engName: string
        ├── description: string
        ├── calorie: string  // 예: "590" 또는 "590-800"
        ├── imageUrl: string // https://www.mcdonalds.co.kr/upload/...
        └── newIcon: string  // "" 또는 "new"
```

카테고리 7개: 버거(seq:1), m런치(2), 해피스낙(3), 사이드&디저트(4), m모닝(5), 해피밀(6), 맥카페&음료(7). 메뉴 데이터는 `menu.json`에 정적으로 포함.

---

## 2. 전체 상태 구조 (Zustand 단일 스토어)

```
KioskStore {
  // 아이들
  isIdle: boolean
  setIdle(v)

  // 일반 모드 흐름
  step: "order-type" | "menu" | "checkout"
  orderType: "dine-in" | "takeout" | null
  setStep(s) / setOrderType(t)

  // 장바구니
  items: CartItem[]   // { menuItem, quantity, categoryName }
  addItem(item, category) / removeItem(id) / updateQuantity(id, qty) / clearCart()
  totalCount(): number

  // 어려움 감지
  difficultyScore: number    // 0-100
  setDifficultyScore(n)
  showHelpOffer: boolean
  setShowHelpOffer(v)

  // 접근성 모드
  accessibilityMode: "none" | "large-ui" | "voice"
  setAccessibilityMode(m)

  // 배리어프리 단계 흐름
  bfStep: "order-type" | "category" | "items" | "item-detail" | "cart-review" | "checkout"
  bfOrderType: "dine-in" | "takeout" | null
  bfSelectedCategory: MenuCategory | null
  bfSelectedItem: MenuItem | null
  setBFStep(s) / setBFOrderType(t) / setBFCategory(c) / setBFItem(i) / resetBF()

  // LLM 로그 (디버그용)
  llmLogs: LLMLogEntry[]    // { ts, type: "gen-ui"|"voice", prompt, response, pimSnapshot? }
  addLLMLog(entry) / clearLLMLogs()
}
```

---

## 3. 일반 모드 흐름

### 3.1 아이들 화면
- 60초간 입력 없으면 `isIdle = true` → 아이들 화면 표시
- 55초 시점에 화면에 "5초 후 처음 화면으로 돌아갑니다" 카운트다운 오버레이 표시
- 화면 터치 시 카운트다운 취소 + 타이머 리셋
- 아이들 화면: MDonald M 로고 + "터치하여 시작" 펄스 애니메이션
- 터치 → `isIdle = false` → 주문 방법 선택 화면

### 3.2 주문 방법 선택 화면
- "매장에서 먹기" / "포장하기" 두 개의 큰 버튼
- 선택 → `setOrderType` → `step = "menu"`

### 3.3 메뉴 화면
- 상단 고정 헤더: 시간 + 검색 필드 + 언어 토글(EN/KO) + READY 상태 뱃지
- 좌측 카테고리 레일: 원형 glyph + 카테고리 이름, 활성 카테고리는 노란 배경으로 강조
- 메인 콘텐츠: 붉은/오렌지 프로모션 배너 + 흰색 메뉴 카드 그리드
- 메뉴 카드: 이미지, 메뉴 상태, 이름, 가격, "담기" CTA
- 하단 고정 주문 트레이: 주문 내역, 총 예상 금액, "주문 취소" / "주문 완료" 버튼
- "주문 완료" → `step = "checkout"`

### 3.4 주문 확인/결제 화면 (일반 모드)
- 주문 항목 전체 목록 (이름, 수량, 칼로리)
- 결제 수단 선택 UI: "카드 결제" / "간편 결제 (카카오페이, 네이버페이)" 탭 선택
- "결제하기" 버튼 → 로딩 스피너 → 완료 화면 (실제 결제 연동 없이 UI 시뮬레이션)
- "취소" 버튼 → `step = "menu"`

### 3.5 주문 완료 화면
- 주문 번호 크게 표시 (예: "주문번호 A-042")
- "처음으로" 버튼 → `clearCart()` + `step = "order-type"` + `isIdle = false`
- 결제 실패 시: "주문 처리 중 문제가 발생했습니다. 직원을 불러주세요." + 재시도 버튼

---

## 4. 어려움 감지 시스템

> 어려움 감지 모듈은 `features/difficulty/` 독립 모듈로 관리된다. `DifficultyDetector`는 headless 컴포넌트로 `page.tsx` 최상단에 마운트되어 전체 세션 동안 동작하며, 다른 feature 모듈과의 결합은 Zustand store를 통해서만 이루어진다.

### 4.1 아키텍처 위치

```
웹캠 스트림
    │
    ▼
DifficultyDetector (headless, 항상 마운트)
    │  MediaPipe (FaceLandmarker / PoseLandmarker / HandLandmarker)
    │
    ▼
difficultyScore: number  ──▶  Zustand (kiosk store)
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
           HelpOfferDialog              /api/gen-ui (GenUIScreen)
```

### 4.2 DifficultyDetector 컴포넌트

- 일반 모드 메뉴 탐색 단계(`step === "menu"`)에서만 자동 실행, `accessibilityMode !== "none"` 또는 idle 상태면 중지
- debug on에서는 우측 하단 오버레이에 카메라 프리뷰를 노출하고, `/debug` 페이지에서는 force-active 프리뷰를 별도 렌더링
- **1초마다** 카메라 프레임 캡처
- `apiEndpoint` prop 있으면: POST `{frame: base64 jpeg}` → `{score: number}`
- 없으면 시뮬레이션: sine wave 기반 smoothed fallback score + calibration metrics 생성
- `score >= threshold` 이고 `step === "menu"` + `orderType != null` 일 때만 `setShowHelpOffer(true)`
- 카메라 권한 거부 시 조용히 무시 (시뮬레이션 모드로 자동 전환)

### 4.3 종합 점수 공식

```
difficultyScore (0–100) =
  ( faceScore  × 0.30
  + poseScore  × 0.20
  + handScore  × 0.20
  + timeScore  × 0.15
  + gazeScore  × 0.15 ) × 100
```

5개 신호 각각 0–1 범위로 정규화 후 가중 합산. 점수 산출 로직은 `features/difficulty/lib/scoring.ts`에 순수 함수로 분리한다.

### 4.4 신호별 산출

**표정 `faceScore` — 가중치 30%**: MediaPipe FaceLandmarker Blendshapes로 혼란·불만 표정 감지
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

**자세 `poseScore` — 가중치 20%**: PoseLandmarker로 정지(머뭇거림)와 머리 흔들림(혼란) 감지
```
poseScore = stillnessScore × 0.4 + headUnstable × 0.6
```
- `stillnessScore`: 최근 20프레임 어깨 중앙점 총 이동 거리 (< 0.05 → 1.0)
- `headUnstable`: 최근 10프레임 머리 좌우 방향 변화 누적합 / 0.15

**손 `handScore` — 가중치 20%**: HandLandmarker로 망설임과 hovering 감지
```
handScore = hesitationScore × 0.5 + slowHover × 0.5
```
- `hesitationScore`: 최근 15프레임 손 이동 방향 전환 횟수 / 8
- `slowHover`: 손이 화면 상단 (wrist.y < 0.6) + 평균 속도 < 0.02 일 때

**체류 시간 `timeScore` — 가중치 15%**
```
sensMult = 0.6 + (sensitivity / 10) × 0.8
baseTime  = 60 / sensMult
timeScore = clamp((elapsed - 8) / baseTime, 0, 1)
```
첫 감지 후 8초까지 0, 이후 선형 증가. 민감도 5 기준 약 48초에서 1.0 도달.

**시선 불안정 `gazeScore` — 가중치 15%**
```
gazeX = noseTip.x - eyeCenter.x
gazeScore = (최근 15프레임 방향 전환 횟수, 변화량 > 0.002 필터) / 6
```

### 4.5 기술 스택

| 항목 | 내용 |
|---|---|
| 추론 라이브러리 | MediaPipe Tasks Vision 0.10.18 (CDN, WASM/GPU) |
| FaceLandmarker | float16, GPU, Blendshapes 출력, 얼굴 1개 |
| PoseLandmarker | pose_landmarker_lite float16, GPU, 포즈 1개 |
| HandLandmarker | float16, GPU, 손 최대 2개 |
| 해상도 | 1280×720 (ideal) |
| 실행 모드 | VIDEO (프레임 단위 추론) |

### 4.6 설정값

| 항목 | 기본값 | 영향 |
|---|---|---|
| `sensitivity` | 5 (1-10) | faceScore 배율, timeScore baseTime |
| `threshold` | 45% (20-80%) | 내부 오버레이 표시 기준 |
| `helpCooldownMs` | 15,000ms | 도움 메시지 재표시 억제 시간 |

### 4.7 HelpOfferDialog

`showHelpOffer === true`이면 표시. **음성과 터치 모두 수락 가능**.

- **1단계**: "도움이 필요하신가요?" + "네, 도와주세요" / "아니오" 버튼 + 5초 자동 닫힘 카운트다운
  - 버튼 터치 외에도, STT가 수동 청취 중 사용자가 "도와주세요", "네", "응" 등을 발화하면 수락으로 처리
  - STT 청취는 다이얼로그 표시 즉시 시작 (VoicePermissionGate 우회하지 않음 — 이미 마이크 권한 있을 때만)
  - 닫히면 `setShowHelpOffer(false)`
- **2단계 (수락 시)**: "어떤 방식이 편하신가요?"
  - 🔊 "음성 안내" → `setAccessibilityMode("voice")`
  - 🔤 "큰 화면" → `setAccessibilityMode("large-ui")`
  - 음성으로도 선택 가능: "음성으로", "큰 화면으로" 등 자연어 발화 처리

### 4.8 HelpOfferDialog 트리거 조건

| 조건 | 동작 |
|---|---|
| `difficultyScore ≥ 70` | `showHelpOffer = true` → 다이얼로그 표시 |
| 다이얼로그 표시 후 15초 쿨다운 | 재표시 억제 |
| `difficultyScore < 42` | 다이얼로그 숨김 |

---

## 5. 배리어프리 모드 공통

### 5.1 BFLayout
- `accessibilityMode !== "none"` 일 때 전체 화면 대체
- 배경: `#1A1A1A` (다크)
- 헤더 (`#FFBC0D` 노란색): MDonald M 로고 + "음성 켜기/끄기" 토글 버튼
- 토글 버튼: 음성 모드 ↔ 큰 화면 모드 전환 가능
- 스텝 인디케이터 (헤더 아래 어두운 바): 주문방법 → 카테고리 → 메뉴 → 확인 4단계
  - 완료 단계: 노란색 체크, 현재 단계: 흰색 + 노란 링, 미완: 반투명
- 메인 영역: `accessibilityMode === "voice"` → VoiceOrderInterface, `"large-ui"` → GenUIScreen

---

## 6. 음성 모듈

> 음성 관련 컴포넌트와 훅은 `features/voice/` 독립 모듈로 분리한다. 배리어프리 레이아웃이나 HelpOfferDialog에서 음성 기능이 필요할 경우 이 모듈의 훅을 사용한다. 음성 모듈은 특정 UI나 주문 흐름을 모르며, transcript와 callback만 처리한다.

**자연어 처리 원칙**: 음성 처리의 모든 의도 분석은 LLM이 자연어로 수행한다. 발화 텍스트를 특정 키워드로 매칭하거나(`if (transcript.includes("빅맥"))`) 정규식으로 파싱하는 방식을 사용하지 않는다. transcript를 그대로 `/api/voice-order`에 전달하고, LLM이 컨텍스트와 함께 의도를 해석하여 action을 결정한다.

### 6.1 VoicePermissionGate
- 음성 모드 최초 진입 시 표시 (이후 `voiceUnlocked` 상태로 관리)
- 마이크 아이콘 + "버튼을 눌러 시작" 안내
- 버튼 클릭 (같은 콜스택 내에서):
  1. `speechSynthesis.speak(new SpeechSynthesisUtterance(""))` + 즉시 `cancel()` → TTS 자동재생 권한 우회
  2. `navigator.mediaDevices.getUserMedia({ audio: true })` → 마이크 권한 요청
  3. `voiceUnlocked = true`

### 6.2 VoiceOrderInterface
**레이아웃 (위→아래)**
- 현재 주문 컨텍스트 뱃지 (선택된 주문 방식, 카테고리, 장바구니 요약)
- Claude 응답 말풍선 (M 로고 + 마지막 TTS 텍스트)
- 사용자 발화 텍스트 (실시간 인터림 + 최종 텍스트, 5초 후 자동 사라짐)
- **ElevenLabs LiveWaveform**: 마이크 입력 실시간 파형 시각화 (듣는 중 표시)
- **ElevenLabs Orb**: 대기/처리 상태 시각화 (대기=노란색, 처리 중=애니메이션)
- 마이크 버튼 (128×128px 원형): 대기=노란색, 듣는 중=빨간색 pulse, 처리 중=회색+스피너
- 상태 텍스트: "🔴 듣고 있어요" / "⏳ 처리 중"

**동작 루프**
1. 마운트 시 300ms 후 STT 자동 시작
2. 인삿말 TTS: "안녕하세요! MDonald입니다. 매장에서 드실 건가요, 포장하실 건가요?"
3. 사용자 발화 최종 인식 → `/api/voice-order` POST
4. 응답 action으로 상태 전환 + speech TTS 재생
5. TTS 완료 후 자동 STT 재시작

**STT 오류 복구**
- `status === "error"` → TTS "죄송합니다, 잘 듣지 못했어요. 다시 말씀해 주세요." → 자동 재시작
- 빈 transcript(무음) → 조용히 재시작만
- API 오류 → TTS fallback "죄송합니다. 잠시 오류가 발생했습니다. 다시 시도해 주세요."
- 연속 3회 오류 → TTS "잠시 후 다시 시도해 주시거나 직원에게 문의해 주세요." → 마이크 60초 비활성화

**대화 연속성**: sessionId를 클라이언트가 보관하여 매 호출에 전달

### 6.3 STT Hook (`useSTT`)
- `window.SpeechRecognition || window.webkitSpeechRecognition`
- 설정: `lang = "ko-KR"`, `continuous = false`, `interimResults = true`
- 반환: `{ transcript, interimTranscript, status, start(), stop() }`
- `status`: `"idle" | "listening" | "processing" | "error" | "unsupported"`

### 6.4 TTS 유틸 (`useVoice` / `ttsSpeak`)
- `speechSynthesis.cancel()` + `speechSynthesis.resume()` → 이전 발화 중단
- `getVoices()`에서 `lang.startsWith("ko")` 음성 우선 선택
- voices 미로드 시 `onvoiceschanged` 이벤트 대기 후 speak
- `rate = 0.88`, `lang = "ko-KR"`
- `onend` 콜백으로 완료 통보

---

## 7. 큰 화면 모드 (Generative UI — PIM + AdaptForge)

큰 화면 모드는 단순히 폰트를 키우는 것이 아니라, 현재 키오스크 UI를 분석하여 추상 UI 모델(PIM)을 생성하고, 시니어 사용자 프로필을 주입한 뒤 AdaptForge로 완전히 새로운 UI를 생성하는 방식이다. 매 단계마다 LLM이 새로운 화면을 생성하기 때문에 화면이 매번 다르게 나타나며, 이것이 Generative UI임을 명확히 보여준다.

**GenUI 시각적 차별화**: 화면 전환 시 "🤖 AI가 화면을 맞춤 생성하고 있어요..." 스켈레톤과 함께 생성 중임을 명시한다. 생성된 화면에는 작은 "AI 생성" 뱃지를 표시한다. 속도와 시각적 임팩트 균형을 위해 스트리밍 방식으로 옵션을 순차적으로 렌더링한다.

### 7.1 GenUIScreen

- `bfStep` 변경마다 `/api/gen-ui` 호출하여 화면 데이터 수신
- 로딩 중 이전 화면 존재 시: 이전 화면 40% opacity + "🤖 AI가 맞춤 화면을 생성하고 있어요..." 오버레이
- 로딩 중 이전 화면 없을 시: 스켈레톤 + "화면을 준비하고 있어요..."
- `show_more` 페이지네이션: 기존 화면 유지, 하단에만 로딩 표시
- 생성 완료된 화면 우상단에 소형 "✨ AI 생성" 뱃지 표시

**화면 렌더링 구조**
- 제목 (fontSize에 따른 크기)
- 부제목 (선택사항)
- 힌트 배너 (선택사항): 노란색 반투명 배경 `💡 ...`
- 페이지 정보 (선택사항): "2/5" 등
- 옵션 배열: `layout === "grid"` → 2열 정사각 카드, `"list"` → 전폭 가로 버튼

**옵션 버튼**
- 주요 옵션: 흰색 반투명 배경 → hover 시 노란색 (`#FFBC0D`) + 텍스트 어두운색
- 보조 옵션 (`go_back`, `show_more`): 더 투명한 배경
- 구성: emoji (선택) + label (bold) + sublabel (선택, 보조 텍스트)
- 그리드 레이아웃: `aspect-square`, 중앙 정렬
- 리스트 레이아웃: `px-7 py-5`, 좌측 정렬

**화면 전환 애니메이션**
- 화면 전체: `fade-in slide-in-from-bottom-6 duration-500 ease-out`
- 옵션 버튼 개별: 60ms stagger, `fill-mode-both`
- `go_back` 옵션이 없으면 좌하단에 "← 이전으로" 자동 추가 (order-type 단계 제외)

**action 처리**
- `select_order_type`: `setBFOrderType(params.orderType)` → bfStep = "category"
- `select_category`: `setBFCategory(cat)` → bfStep = "items"
- `select_item`: `setBFItem(item)` → bfStep = "item-detail"
- `add_to_cart`: `addItem(item, cat)` → bfStep = "cart-review"
- `go_to_cart`: bfStep = "cart-review"
- `checkout`: bfStep = "checkout"
- `go_back`: 이전 단계 맵에 따라 bfStep 이동
- `show_more`: page + 1로 재요청
- `reset_all`: `clearCart()` + `resetBF()` + `setAccessibilityMode("none")` + `step = "order-type"`

### 7.2 배리어프리 결제 완료 (큰 화면 모드)
- `bfStep === "checkout"` 진입 시 자동 `/api/orders` POST 호출
- 성공 시 orderId를 컨텍스트에 포함하여 `/api/gen-ui` 요청 (LLM이 완료 화면 생성)
- LLM 완료 화면: 주문번호, 감사 메시지, "처음으로" 버튼
- "처음으로" action(`reset_all`) → 초기화

---

## 8. API 명세

### 8.1 POST /api/gen-ui

```
요청 (GenUIRequest):
{
  step: string
  difficultyScore: number
  context: {
    orderType: string | null
    selectedCategory: { seq, korName } | null
    selectedItem: { id, korName } | null
    cart: [{ name, quantity }]
    availableCategories: [{ seq, korName }]
    availableItems: [{ id, name, calorie }]
    page?: number
    orderId?: string      // checkout 단계 완료 시
  }
}

응답 (GenUIScreen):
{
  title: string
  subtitle?: string
  layout: "grid" | "list"
  fontSize: "base" | "lg" | "xl" | "2xl"
  options: [{
    id: string
    emoji?: string
    label: string
    sublabel?: string
    action: string
    params: object
  }]
  hint?: string
  pageInfo?: string
}
```

**시스템 프롬프트 — PIM 기반 AdaptForge 원칙**

LLM은 다음 순서로 UI를 생성한다:
1. **PIM 분석**: 현재 키오스크의 메뉴 구조, 주문 흐름, 선택 가능한 항목을 추상 UI 모델로 파악
2. **사용자 프로필 주입**: difficultyScore를 기반으로 시니어 사용자 프로필 적용
   - score < 70: 일반 사용자 — 최대 6개 옵션, lg 폰트
   - score 70-84: 어려움 감지 — 최대 4개 옵션, xl 폰트, 단순한 언어
   - score 85+: 높은 어려움 — 최대 2-3개 옵션, 2xl 폰트, 가장 단순한 선택지
3. **AdaptForge 생성**: 사용자 프로필에 맞게 옵션 수, 언어 난이도, 시각적 힌트를 조정하여 UI 생성
4. 레이블: 쉬운 한국어, emoji 적극 활용, 영어 병기 가능
5. hint: 1문장, 친근하고 명확하게
6. 순수 JSON 출력 (마크다운 코드블록 없이)

**모델**: Claude Haiku (claude-haiku-4-5-20251001)
**인증 우선순위**:
1. Claude CLI headless mode (`claude -p`) — 기본
2. `ANTHROPIC_API_KEY` 환경변수
3. macOS 키체인 (`security find-generic-password -s "Claude Code-credentials" -w`)
4. 위 모두 실패 시 명확한 에러 throw

### 8.2 POST /api/voice-order

```
요청 (VoiceOrderRequest):
{
  transcript: string
  sessionId?: string
  state: {
    bfStep: string
    bfOrderType: string | null
    bfSelectedCategory: { seq, korName } | null
    cart: [{ id, name, quantity }]
    availableCategories: [{ seq, korName }]
    availableItems: [{ id, name, calorie }]
  }
}

응답 (VoiceOrderResponse):
{
  action: string
  params: { orderType?, categorySeq?, itemId? }
  speech: string        // TTS로 읽힐 텍스트 (2-3문장, 자연스러운 한국어)
  sessionId?: string
}
```

**구현 — Claude CLI headless mode 우선**:
- 기본: `claude -p "..." --output-format json [--resume sessionId] --max-turns 1 --model haiku`
  - 첫 턴: `--system-prompt` 포함
  - 이후 턴: `--resume sessionId` (대화 히스토리 자동 유지)
  - `execFile` 비동기, 30초 타임아웃
- CLI 실패 시: `getAnthropicClient()` SDK fallback 후 에러 로그
- CLI 실패 원인 파악 로직: exit code, stderr를 로깅하여 디버그 패널에 노출

**시스템 프롬프트 핵심 (자연어 기반 — 패턴 매칭 금지)**
- LLM이 transcript 전체를 자연어로 이해하여 의도 파악
- 키워드 매칭이나 if/else 분기 없이 현재 bfStep 컨텍스트와 함께 적절한 action 결정
- 현재 bfStep에 맞는 action만 수행
- speech는 TTS로 자연스럽게 읽힐 텍스트
- 응답은 순수 JSON만

**action 종류**: select_order_type, select_category, select_item, add_to_cart, go_to_cart, checkout, go_back, speak_only

### 8.3 POST /api/orders

```
요청:
{
  orderType: "dine-in" | "takeout"
  items: [{ menuItemId: number, quantity: number, menuItemName: string }]
  totalCount: number
}

응답:
{
  orderId: string    // 예: "A-042" (알파벳 + 숫자 3자리)
  status: "accepted"
}

오류: items 빈 배열 → 400
```
- 주문 목록은 서버 메모리 Map에 저장 (재시작 시 초기화)
- orderId는 매 요청마다 고유값 (카운터 기반)

---

## 9. 디버그 패널

### 9.1 활성화
- 메인 화면 우상단 `debug off / debug on` pill 버튼으로 토글
- `debug on` 시 우측 고정 오버레이 패널 + 우하단 카메라 프리뷰가 동시에 열림
- 별도 개발자 관측 페이지 `/debug` 제공

### 9.2 섹션 구성 (펼쳤을 때)
- **Camera / Calibration**: 실시간 프리뷰, detector status, source, cooldown, calibration status
- **Difficulty Score**: face/pose/hand/time/gaze meter + 총점 숫자
- **Manual Trigger**: threshold / sensitivity range slider, "도움 제안", "안정 상태"
- **LLM Logs**: 최근 GenUI/voice 로그 목록 + clear 버튼
- **Voice Transcript**: 사용자/assistant 음성 턴 목록
- **Session Events**: 최근 상태 이벤트
- `/debug` 페이지는 위 정보를 넓은 레이아웃으로 재구성해 개발자가 시나리오 중 data flow를 계속 관찰할 수 있게 한다

---

## 10. 디자인 시스템

### 색상
- 주색: `#FFBC0D` (McDonald yellow)
- 헤더/트레이 다크 톤: `#1F1F1F` ~ `#2A2A2A`
- 메인 캔버스/카드 배경: `#FFFFFF`, `#FFF8EF`, `#EFEAE1`
- 프로모션 배너 레드/오렌지: `#7B1F0F`, `#C23818`, `#FF9433`
- 주문 완료 / 결제 강조 그린: `#7BC769` / `#BFD8B3`
- 본문 텍스트: `#1F1D18`, 보조 텍스트: `#6C6456`

### 타이포그래피
- 한국어: 시스템 sans (`Apple SD Gothic Neo`, `Pretendard`, `Inter` fallback)
- 제목: font-black(900), 버튼: font-black(700~900), 본문: font-medium(500)
- BF 폰트 레벨: base / lg / xl / 2xl

### 상호작용
- 일반 모드: 큰 rounded card / pill 버튼, hover 시 약한 lift
- BF 화면 전환: adaptive skeleton → card reveal 흐름
- Voice/GenUI 로그는 디버그 또는 adaptive 화면에서 실시간으로 누적

---

## 11. 화면 진입 라우팅 로직 (page.tsx)

```
isIdle = true → <IdleScreen>

`/debug` → camera preview + calibration console + log/event observatory

일반 모드:
  step === "order-type" → <OrderTypeScreen> + promo banner
  step === "menu"       → <Header> + left category rail + <MenuGrid> + sticky <CartSheet>
  step === "checkout"   → <CheckoutScreen>
  (모든 일반 모드 화면에 HelpOfferDialog + DifficultyDetector + DebugPanel 포함)

accessibilityMode === "large-ui" → <BFLayout> + <GenUIScreen>/<BFCheckout>
accessibilityMode === "voice"    → <VoicePermissionGate>/<VoiceOrderInterface>
```

---

## 12. User Stories (Ralph 실행 순서)

> 아래의 모든 User Story는 섹션 1–11의 전체 스펙을 반영한다. 스펙에 명시된 내용 중 아래 Story에 포함되지 않은 내용은 없다. 각 Story는 독립적으로 구현되고 검증된 후 다음으로 진행한다.

---

### US-001: 프로젝트 기반 설정 및 타입/스토어 구축

**설명**: Next.js App Router 프로젝트의 기반을 설정한다. 전체 디렉토리 구조, 타입, Zustand 스토어, 유틸리티를 구현한다.

**구현 범위**
- 디렉토리 구조 전체 생성 (섹션 전체 디렉토리 구조 기준)
- `src/types/index.ts`: MenuItem, MenuCategory, MenuData, CartItem, OrderType, KioskStep, BFStep, AccessibilityMode, LLMLogEntry 인터페이스 정의
- `src/lib/utils.ts`: `cn()` (clsx + tailwind-merge), `stripHtml()` 유틸
- `src/store/kiosk.ts`: 섹션 2의 전체 KioskStore Zustand 스토어 구현 (모든 상태 + 액션 + LLM 로그 포함)
- `src/lib/menu.ts`: `loadMenu()` 함수 — `src/data/menu.json` 정적 import
- `next.config.ts`: `images.remotePatterns`에 `https://www.mcdonalds.co.kr/**` 허가

**수락 기준**
- TypeScript 오류 없음 (`npx tsc --noEmit`)
- `useKioskStore()` 훅으로 모든 상태/액션 접근 가능
- `loadMenu()`가 MenuData 반환
- `npm run build` 성공

---

### US-002: Claude 클라이언트 구현 (CLI headless mode 우선)

**설명**: Claude AI를 호출하기 위한 공통 클라이언트를 구현한다. Claude CLI headless mode를 기본으로 하며, 실패 시 SDK fallback으로 전환한다.

**구현 범위**
- `src/lib/ai/client.ts`:
  - `callClaudeCLI(prompt, options)`: `claude -p` 실행, `execFile` 비동기, 30초 타임아웃
    - 옵션: `--output-format json`, `--resume sessionId`, `--model haiku`, `--system-prompt`
    - 성공 시 stdout 반환, 실패 시 exit code + stderr 로깅 후 에러 throw
  - `getAnthropicClient()`: SDK fallback 클라이언트
    - `ANTHROPIC_API_KEY` 환경변수 우선
    - 없으면 `security find-generic-password -s "Claude Code-credentials" -w` → JSON → `creds.claudeAiOauth.accessToken`
    - 둘 다 없으면 명확한 에러 throw
  - `callClaude(prompt, options)`: CLI 시도 → 실패 시 SDK fallback 자동 전환
- `src/lib/ai/prompts.ts`: gen-ui, voice-order 시스템 프롬프트 상수
- CLI 동작 테스트: `claude --version` 실행 확인 후 사용 가능 여부 로그

**수락 기준**
- `claude --version` 실행 가능한 환경에서 CLI 호출 성공
- CLI 없는 환경에서 SDK fallback 자동 작동
- `npm run build` 성공

---

### US-003: 아이들 타이머 훅 및 아이들/주문타입 화면 구현

**설명**: 60초 아이들 타이머와 아이들 화면, 주문 방법 선택 화면을 구현한다.

**구현 범위**
- `src/features/kiosk/hooks/useIdleTimer.ts`: `useIdleTimer(onIdle, onWarning, onActive)` 훅
  - 이벤트 감지: mousemove, mousedown, keydown, touchstart, scroll, click
  - 55초 시점: `onWarning()`, 60초 시점: `onIdle()`, 활동 감지: `onActive()` + 리셋
- `src/features/kiosk/components/IdleScreen.tsx`: 다크 배경, MDonald M 로고, "화면을 터치하여 시작하세요", 펄스 애니메이션 원
- `src/features/kiosk/components/OrderTypeScreen.tsx`: "매장에서 먹기" / "포장하기" 큰 버튼 (이모지 + 텍스트)
- `src/app/page.tsx` 기본 구조: isIdle 시 IdleScreen, 아이들 해제 시 OrderTypeScreen
  - 55초 카운트다운 오버레이: 화면 중앙 반투명 다크 오버레이, 큰 숫자 + "초 후 처음 화면으로 돌아갑니다"

**수락 기준**
- 55초 후 카운트다운 오버레이 표시
- 터치 시 오버레이 사라짐
- 60초 후 아이들 화면 표시
- 주문 타입 선택 후 `step = "menu"` (화면 변화 확인 가능)

---

### US-004: 메뉴 화면 (헤더, 카테고리 탭, 메뉴 그리드) 구현

**설명**: 일반 모드의 메뉴 탐색 화면을 구현한다.

**구현 범위**
- `src/features/kiosk/components/Header.tsx`: MDonald 로고, 이전 버튼 (step="order-type"로), 장바구니 아이콘 + totalCount 뱃지
- `src/features/kiosk/components/CategoryTabs.tsx`: 가로 스크롤 탭 바, 클릭 시 해당 섹션으로 smooth scroll
- `src/features/kiosk/components/MenuCard.tsx`: next/image 이미지, korName(stripHtml), calorie, newIcon 뱃지
- `src/features/kiosk/components/MenuGrid.tsx`: 카테고리별 섹션 + MenuCard 그리드 (2열 기본, sm:3열)
- `src/app/page.tsx` step="menu" 분기: Header + CategoryTabs + MenuGrid 조합

**수락 기준**
- 메뉴 카드가 카테고리별로 그루핑되어 표시됨
- 카테고리 탭 클릭 시 해당 섹션으로 스크롤됨
- 이미지 로드 실패 시 fallback 표시

---

### US-005: 메뉴 상세 다이얼로그 및 장바구니 구현

**설명**: 메뉴 카드 클릭 시 상세 팝업과 우측 장바구니 시트를 구현한다.

**구현 범위**
- `src/features/kiosk/components/MenuDetailDialog.tsx`: 다이얼로그 — 이미지, korName, description, calorie, 수량(±), "장바구니 담기" → `addItem()`
- `src/features/kiosk/components/CartSheet.tsx`: 우측 드로어 — 아이템 목록(이름, 수량±, 삭제), totalCount, "주문하기" → step="checkout"
- MenuCard에 클릭 핸들러 추가
- Header의 장바구니 아이콘 클릭 시 CartSheet 열기

**수락 기준**
- 메뉴 카드 클릭 → 상세 다이얼로그 열림
- 수량 선택 후 "장바구니 담기" → 장바구니 아이콘 수량 업데이트
- CartSheet에서 수량 ± 및 삭제 동작
- "주문하기" → step = "checkout"

---

### US-006: 일반 모드 주문 제출 API 및 결제/완료 화면 구현

**설명**: 일반 모드의 주문 API 엔드포인트, 결제 수단 선택 화면, 주문 완료 화면을 구현한다. (배리어프리 모드 결제는 US-013에서 별도 구현)

**구현 범위**
- `src/app/api/orders/route.ts`: POST 핸들러 (섹션 8.3 명세 기준)
  - 주문번호 생성: 알파벳 1자 + 숫자 3자리 (카운터 기반)
  - 인메모리 Map 저장, items 빈 배열 → 400 에러
- `src/features/kiosk/components/CheckoutScreen.tsx`: **일반 모드 결제 화면**
  - 주문 요약 (항목, 수량, 칼로리)
  - 결제 수단 탭: "카드 결제" / "간편 결제 (카카오페이, 네이버페이)" UI 선택 (실제 연동 없음)
  - "결제하기" → 로딩 스피너 → `/api/orders` POST → orderId 수신 → 완료 화면
  - 완료 화면: "주문번호 A-042" 크게 + "처음으로" 버튼
  - API 실패: 오류 메시지 + 재시도 버튼
  - "취소" → step="menu"
- `src/app/page.tsx` step="checkout" 분기 추가

**수락 기준**
- "결제하기" 클릭 후 로딩 → 주문번호 표시됨
- 결제 수단 탭 UI 동작
- "처음으로" → 장바구니 초기화 + step="order-type"
- API 실패 시 오류 메시지 표시

---

### US-007: 어려움 감지 모듈 + 도움 팝업 구현

**설명**: 카메라 기반 어려움 감지 컴포넌트와 도움 제안 팝업을 구현한다. 도움 팝업은 터치와 음성 모두 수락 가능하다.

**구현 범위**
- `src/features/difficulty/lib/scoring.ts`: 섹션 4.3–4.4의 점수 산출 순수 함수 (faceScore, poseScore, handScore, timeScore, gazeScore, 종합 합산)
- `src/features/difficulty/components/DifficultyDetector.tsx`: 섹션 4.2 명세 기준
  - hidden 컴포넌트, MediaPipe 통합, **1초 인터벌**
  - apiEndpoint 없을 시 시뮬레이션 모드 (sine wave)
  - props: `apiEndpoint?: string`
- `src/features/difficulty/components/HelpOfferDialog.tsx`: 섹션 4.7 명세 기준
  - 1단계 + 2단계 흐름, 5초 카운트다운
  - 다이얼로그 열릴 때 STT 청취 시작 (마이크 권한 있을 경우), 자연어 발화로 수락/거부 처리
  - 2단계에서도 "음성으로", "큰 화면으로" 발화 처리
- `src/app/page.tsx`: DifficultyDetector + HelpOfferDialog 포함

**수락 기준**
- 약 30초 후 시뮬레이션으로 도움 팝업이 뜸
- 버튼 터치 및 "도와주세요" 음성 발화 모두 수락으로 처리됨
- 2단계에서 "큰 화면" 또는 "음성 안내" 선택/발화 시 accessibilityMode 변경
- "아니오" 또는 카운트다운 완료 시 팝업 닫힘

---

### US-008: 배리어프리 레이아웃 구현 (GenUI 시각적 차별화 포함)

**설명**: 배리어프리 모드의 공통 레이아웃을 구현한다. GenUI 컨셉이 명확히 드러나도록 AI 생성 중임을 시각적으로 표현한다.

**구현 범위**
- `src/features/barrier-free/components/BFLayout.tsx`: 섹션 5.1 명세 기준
  - voiceUnlocked 상태 관리
  - accessibilityMode에 따라 VoicePermissionGate / VoiceOrderInterface / GenUIScreen 렌더링 (빈 placeholder로 임시 처리)
  - 스텝 인디케이터 내부 컴포넌트
- `src/features/barrier-free/components/GenUIScreen.tsx`: 기본 구조 (placeholder)
  - 로딩 상태: "🤖 AI가 맞춤 화면을 생성하고 있어요..." 스켈레톤 표시
  - 생성 완료 후 우상단 "✨ AI 생성" 뱃지 표시 (US-012에서 완성)
- `src/app/page.tsx`: `accessibilityMode !== "none"` 시 BFLayout 렌더링

**수락 기준**
- large-ui 모드 진입 시 BFLayout + "AI 생성 중" 스켈레톤 표시됨
- voice 모드 진입 시 VoicePermissionGate 표시됨
- 스텝 인디케이터 단계 표시 정확

---

### US-009: 음성 모듈 — STT/TTS 훅 및 VoiceOrderInterface 구현

**설명**: 음성 주문 모드의 STT 훅, TTS 유틸, 메인 인터페이스 컴포넌트를 구현한다. ElevenLabs Orb/LiveWaveform을 적용한다.

**구현 범위**
- `src/features/voice/hooks/useSTT.ts`: 섹션 6.3 명세 기준
- `src/features/voice/hooks/useVoice.ts`: `speak(text)` + `cancel()` 래퍼, ttsSpeak 내부 구현 (섹션 6.4)
- `src/features/voice/components/VoicePermissionGate.tsx`: 섹션 6.1 명세
- `src/features/voice/components/VoiceOrderInterface.tsx`: 섹션 6.2 명세
  - ElevenLabs `<Orb />` 컴포넌트: 대기/처리 상태 시각화 (https://ui.elevenlabs.io/docs/components/orb)
  - ElevenLabs `<LiveWaveform />` 컴포넌트: 듣는 중 파형 표시 (https://ui.elevenlabs.io/docs/components/live-waveform)
  - 모든 STT 오류 복구 케이스 처리
  - sessionIdRef로 대화 연속성 유지
- BFLayout에서 voice 모드 시 VoicePermissionGate + VoiceOrderInterface 연결

**수락 기준**
- voice 모드 진입 후 "화면을 눌러 시작" 버튼 표시
- 버튼 클릭 후 인삿말 TTS 재생 + 자동 STT 시작
- 발화 중 LiveWaveform 파형 표시, 처리 중 Orb 애니메이션 표시
- 마이크 버튼 시각적 상태 변화 (노란/빨간/회색)

---

### US-010: 음성 주문 API 구현

**설명**: 음성 주문 처리를 위한 서버 API 엔드포인트를 구현한다. CLI headless mode 우선으로 동작한다.

**구현 범위**
- `src/app/api/voice-order/route.ts`: 섹션 8.2 명세 기준
  - `callClaude()` 사용 (CLI 우선, SDK fallback)
  - 첫 턴: system-prompt 포함 전체 메뉴 컨텍스트
  - 이후 턴: --resume sessionId (CLI) 또는 메시지 히스토리 유지 (SDK)
  - 응답 파싱: stdout JSON → result 필드 → JSON 추출 (markdown 코드블록 제거)
  - FALLBACK 응답 정의 및 에러 시 반환
  - SYSTEM_PROMPT: 전체 메뉴(compact), 단계별 허용 action, **자연어 의도 파악 지시 (패턴 매칭 금지)**

**수락 기준**
- voice 모드에서 "빅맥 주세요" 발화 시 적절한 action 반환
- sessionId가 응답에 포함되고 다음 요청에 전달됨
- API 오류 시 FALLBACK 응답 반환
- CLI 실패 시 SDK fallback 동작

---

### US-011: Generative UI API 구현 (PIM + AdaptForge)

**설명**: 큰 화면 모드를 위한 PIM 기반 LLM UI 생성 API를 구현한다.

**구현 범위**
- `src/app/api/gen-ui/route.ts`: 섹션 8.1 명세 기준
  - `callClaude()` 사용 (CLI 우선, SDK fallback — SDK의 경우 `getAnthropicClient()` 사용)
  - MENU_COMPACT 전처리 (stripHtml, description 60자 제한)
  - SYSTEM_PROMPT (섹션 8.1 PIM 기반 AdaptForge 원칙):
    1. PIM 분석 지시: 현재 키오스크 구조를 추상 UI 모델로 파악
    2. 사용자 프로필 주입: difficultyScore → 시니어 프로필 적용
    3. AdaptForge 생성 규칙 (옵션 수, 폰트, 언어 단순화)
  - userPrompt: 단계, difficultyScore, 적응 레벨 텍스트, 컨텍스트 상태
  - 응답 파싱: text → JSON 추출
  - FALLBACK: `{ title: "화면을 불러오는 중...", layout: "list", fontSize: "xl", options: [] }`
  - LLM 로그에 pimSnapshot 포함 (디버그 패널용)

**수락 기준**
- large-ui 모드에서 각 단계마다 고유한 화면 생성됨
- difficultyScore=85에서 옵션 2-3개 + 2xl 폰트
- difficultyScore=50에서 옵션 6개 이하 + lg 폰트
- 같은 단계 반복 호출 시 LLM이 매번 다른 표현으로 화면 생성 가능

---

### US-012: GenUIScreen 컴포넌트 완성

**설명**: /api/gen-ui 응답을 렌더링하는 클라이언트 컴포넌트를 완성한다.

**구현 범위**
- `src/features/barrier-free/components/GenUIScreen.tsx`: 섹션 7.1 명세 전체 구현
  - useCallback으로 fetchScreen 정의 (bfStep, context 의존성)
  - bfStep 변경 시 useEffect로 fetchScreen(0) 호출
  - 로딩 중 이전 화면 유지 (opacity-40 + "🤖 AI가 맞춤 화면을 생성하고 있어요..." 오버레이)
  - 첫 로드: 스켈레톤 + "화면을 준비하고 있어요..."
  - 생성 완료 화면 우상단 "✨ AI 생성" 뱃지
  - 전체 화면 + 옵션 stagger 애니메이션 (60ms)
  - handleOption으로 모든 action 처리 (reset_all 포함)
  - page 상태로 show_more 페이지네이션
  - go_back 없을 때 자동 추가
- BFLayout에서 large-ui 모드 시 GenUIScreen 렌더링 (placeholder 교체)
- LLM 로그: 각 응답 후 `addLLMLog({ type: "gen-ui", prompt: "step:X score:Y", response: '"title" | N개 옵션 [fontSize]', pimSnapshot })`

**수락 기준**
- large-ui 모드에서 단계 전환 시 애니메이션 + "AI 생성 중" 메시지 + 완료 후 "✨ AI 생성" 뱃지
- 로딩 중 이전 화면이 흐릿하게 유지됨
- show_more 시 페이지 증가하여 다른 옵션 표시
- 각 단계마다 고유한 화면 (GenUI임이 명확히 보임)

---

### US-013: 배리어프리 결제 완료 흐름 통합

**설명**: 음성 모드와 큰 화면 모드의 결제 완료 흐름을 완성한다.

**구현 범위**
- `src/features/barrier-free/components/BFCheckout.tsx`:
  - **큰 화면 모드 (large-ui)**: checkout 진입 시 자동 `/api/orders` 호출 → orderId를 컨텍스트에 담아 `/api/gen-ui` 요청 → LLM 완료 화면 렌더링 (주문번호 + 감사 메시지 + "처음으로")
  - **음성 모드 (voice)**: checkout 진입 시 자동 `/api/orders` 호출 → TTS "주문이 완료되었습니다. 주문 번호는 [번호]입니다." + 화면에 주문번호 표시
  - "처음으로" 또는 완료 후 초기화: `clearCart()` + `resetBF()` + `setAccessibilityMode("none")` + `step = "order-type"` + `isIdle = false`
- GenUIScreen action 처리에 `reset_all` 포함 확인

**수락 기준**
- voice 모드: checkout 단계에서 TTS로 주문번호 읽어줌
- large-ui 모드: LLM이 생성한 완료 화면에 주문번호 표시됨
- 두 모드 모두: "처음으로" 후 일반 모드 주문 타입 선택 화면으로 돌아감

---

### US-014: 디버그 패널 구현

**설명**: 개발 및 데모용 디버그 패널을 구현한다. 모든 데이터는 실제 동작 기반이다.

**구현 범위**
- `src/features/debug/components/DebugPanel.tsx`: 섹션 9 명세 전체 구현
  - 카메라 미리보기 스트림 (DifficultyDetector와 별개)
  - difficulty 프로그레스 바 (색상 조건부)
  - Manual Trigger 버튼 3개
  - State 테이블
  - Quick Switch 버튼
  - LLM Logs 스크롤 창 (llmLogs 구독, 자동 스크롤, clear 버튼)
    - gen-ui 항목: pimSnapshot 토글 가능 (사용자 프로필, AdaptForge 규칙 표시)
  - CLI Status 섹션: CLI 성공/실패, fallback 여부 실시간 표시
  - 폰트: 모노스페이스, 10px
  - `NODE_ENV === "development"` 또는 `?debug=1` 활성화
- VoiceOrderInterface에서 API 응답 후 `addLLMLog` 호출
- `src/app/page.tsx`에 DebugPanel 포함

**수락 기준**
- 개발 모드에서 좌하단에 패널 표시
- Score 75 버튼 클릭 시 difficulty 바 빨간색으로 변함
- gen-ui 호출 후 LLM Logs에 pimSnapshot 포함 항목 추가됨
- CLI Status에서 CLI/SDK fallback 여부 확인 가능
- clear 버튼 클릭 시 로그 비워짐

---

## 13. 전체 검증 방법 + 테스트

### 13.1 수동 검증 (매 Story 완료 후)

1. `npm run dev` 실행
2. `http://localhost:3000?debug=1` 접속
3. **일반 모드**: 주문 타입 선택 → 메뉴 탐색 → 장바구니 → 결제 수단 선택 → 주문번호 확인
4. **어려움 감지**: DebugPanel "Score 75" + "Help 팝업" → 터치 수락 + 음성 수락 각각 확인
5. **큰 화면 모드**: 단계별 화면 생성 확인, "✨ AI 생성" 뱃지 표시, difficultyScore=85 후 옵션 2-3개 확인
6. **음성 모드**: 마이크 권한 승인 → 발화 ("빅맥 하나 주세요") → Orb/LiveWaveform 동작 → 응답 TTS 확인
7. **결제 완료**: 양 모드에서 checkout 단계까지 → 주문번호 표시 확인
8. **아이들**: 55초 대기 → 카운트다운 표시 → 60초 → 아이들 화면
9. `npm run build` 빌드 오류 없음
10. `npx tsc --noEmit` TypeScript 오류 없음

### 13.2 자동 테스트 (각 Story에 포함)

각 Story 구현 시 해당 모듈의 단위 테스트를 함께 작성한다. **테스트 커버리지 목표: 60% 이상**.

**테스트 스택**: Vitest + React Testing Library + Playwright (E2E)

**단위 테스트 (Vitest)**
- `scoring.ts`: 각 신호 점수 산출 함수 (입력값 → 기대 점수 범위 검증)
- `kiosk.ts` store: 각 action (addItem, removeItem, setDifficultyScore 등)
- `utils.ts`: `stripHtml()`, `cn()` 유틸
- API route handlers: mock request/response로 응답 스키마 검증

**E2E 테스트 (Playwright)**
- `e2e/scenario-matrix.spec.ts`: 실사용 50개 + demo/debug 50개를 한 파일에서 생성하는 100개 시나리오 매트릭스
- `e2e/smoke.spec.ts`: 메인 쉘/디버그 페이지 스모크
- 전체 합계: **102 Playwright tests**

실행 순서:
1. `npx playwright test e2e/scenario-matrix.spec.ts --list` 로 100개 시나리오 수 확인
2. `npx playwright test e2e/scenario-matrix.spec.ts`
3. `npx playwright test e2e/smoke.spec.ts`
4. 관찰용 브라우저 오픈: `node scripts/open-chrome.mjs 3104`

**커버리지 측정**: `npm run test:coverage` 로 현재 커버리지 확인. 60% 미달 시 해당 Story를 완료 처리하지 않는다.

---

## 14. Ralph 실행 지침

> Ralph는 아래 지침에 따라 각 Story를 순서대로 실행한다. 최소 4시간 이상의 세션을 가정하며, 매 Story마다 철저한 검증을 거친 후 다음으로 진행한다.

### 14.1 기본 실행 원칙

1. **순서 준수**: US-001 → US-002 → ... → US-014 순서로 진행. 이전 Story의 수락 기준을 모두 통과하지 않으면 다음으로 진행하지 않는다.
2. **검증 후 진행**: 각 Story 완료 후 반드시 `npx tsc --noEmit` + `npm run build` + 수락 기준 확인. 하나라도 실패 시 수정 후 재검증.
3. **수정 루프**: 검증 실패 시 원인 분석 → 수정 → 재검증 → 통과 후 다음으로. 동일 오류 3회 이상 반복 시 접근법 변경.
4. **모듈 경계 유지**: 구현 중 다른 모듈을 수정해야 할 상황이 생기면 해당 모듈의 Story에서 처리. 현재 Story 범위를 벗어나지 않는다.

### 14.2 Claude CLI 검증

US-002 완료 후 반드시 CLI 동작을 검증한다:
```bash
claude --version                          # CLI 설치 확인
claude -p "hello" --output-format json    # 기본 호출 확인
```
실패 시: exit code와 stderr를 분석하여 원인 파악 → 환경 변수 / PATH / 권한 문제 해결 → 해결 불가 시 SDK fallback으로 전환하되 CLI 재시도 로직은 유지.

### 14.3 GenUI 동작 검증

US-011 완료 후 반드시 GenUI가 실제 LLM 호출로 동작함을 확인한다:
```bash
curl -X POST http://localhost:3000/api/gen-ui \
  -H "Content-Type: application/json" \
  -d '{"step":"category","difficultyScore":50,"context":{"cart":[],"availableCategories":[{"seq":1,"korName":"버거"}]}}'
```
응답이 고정값이 아닌 LLM 생성 JSON인지 확인. 동일 요청 2회 반복 시 응답이 다를 수 있음 (자연어 생성).

### 14.4 Story별 예상 소요 시간

| Story | 예상 시간 | 주요 위험 |
|---|---|---|
| US-001 | 20분 | 타입 설계 누락 |
| US-002 | 30분 | CLI 환경 문제 |
| US-003 | 25분 | 타이머 엣지케이스 |
| US-004–005 | 40분 | next/image remotePatterns |
| US-006 | 20분 | API 응답 스키마 |
| US-007 | 45분 | MediaPipe WASM 로드 |
| US-008 | 20분 | BFLayout 분기 |
| US-009 | 40분 | Web Speech API + ElevenLabs |
| US-010 | 30분 | CLI sessionId 관리 |
| US-011 | 35분 | PIM 프롬프트 설계 |
| US-012 | 30분 | 애니메이션 + action 처리 |
| US-013 | 20분 | 두 모드 분기 |
| US-014 | 25분 | 로그 구독 + 자동 스크롤 |

## 2026-03-29 구현 동기화 메모

- 일반 모드가 기본값으로 유지되며, 도움 제안은 일반 주문 화면(`step === "menu"`)에서 체류/난이도 조건을 넘은 뒤에만 표시되도록 보정함.
- 디자인 시스템은 `mdonaldkiosk.png`를 기준으로 어두운 상단 디바이스 크롬, 검색 필, 오렌지/레드 프로모션 배너, 밝은 메뉴 캔버스, 좌측 카테고리 레일, 하단 장바구니 액션 바 테마로 동기화함.
- Debug On에서는 카메라 프리뷰, 캘리브레이션 슬라이더, MediaPipe/시뮬레이션 점수, LLM trace, voice transcript를 우측 오버레이로 노출하고, Debug Off에서는 동일 세션의 제품 화면만 유지함.
- GenUI 진입 후에는 화면 내부에서 Adaptive trace / narration / skeleton state가 보이도록 구현해, 적응형 선택 결과와 공급자 상태를 시각적으로 확인할 수 있게 함.
- E2E 자동화는 사용자 시나리오 50개 + 데모 시나리오 50개 이상을 목표로 `e2e/scenario-matrix.spec.ts`에서 관리하며, `npx playwright test e2e/scenario-matrix.spec.ts --list` 기준 100개 시나리오가 노출되도록 유지함.
