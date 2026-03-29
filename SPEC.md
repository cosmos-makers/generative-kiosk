# McDonald's 배리어프리 키오스크 — 제품 명세서 (처음부터 구현)

// AI:  배경을 추가하고싶어 이런식으로 초안을 작성했는데, 우리에게 가장 걸맞게 변경해주면 좋겠어. 
Adaptive Kiosk는 패스트푸드 키오스크 환경에서 디지털 소외 계층이 겪는 탐색 실패, 시야 문제, 시간 압박, 심리적 부담을 줄이기 위한 웹 기반 접근성 레이어다.  
핵심 아이디어는 사용자가 스스로 키오스크에 적응해야 하는 것이 아니라, 사용자의 멈춤, 반복 실수, 화면 왕복, 음성 요청을 실시간으로 수집한 뒤 어려움 감지 모듈로 UI를 더 쉬운 형태로 바꾸는 것이다. -- 행동 기반 적응을 우선한다, 실시간 로그 기반 해석이 가능해야 한다. 이런것들이 필요할지 검토해줘. 우리는 해커톤에 이제품을 제출하여 우승해야하기때문에 debug mode가 존재하고,debug mode에서는 사용자 어려움 감지 모듈과 행동 로그, ai의 분석이 실시간으로 잘 보여야하고, 이게 가짜가 아니라 실제로 동작해야만해. 결과물은 우선 한글로 만들거야. generative ui 라는 컨셉을 / llm과 agent들 의 처리 로직을 절대 패턴 매칭으로 하면 안되고, 자연어 기반으로 동작하도록 도와줘 / 우리가 참여하는 해커톤의 미션이야 AI Applications
Build an AI-powered application that solves a real problem. It doesn't have to be a fully autonomous agent — it just has to be useful, creative, and well-built. Think AI-native products that people would actually want to use. The focus is on craft, user experience, and shipping something polished. Think: proactive, agentic, long-running, factory, autonomous, multi-agent, workflow.


## 제품 개요

// AI: McDonald, 맥도날드가 상표권 문제가 있을 수 있어 전반적으로 MDonald라는 패러프레이징으로 전체 변경 필요.
McDonald 매장 내 터치스크린 자동 주문 키오스크. 일반 사용자는 기존 방식으로, 어려움이 감지된 사용자(시각 장애, 고령, 인지 장애 등)는 AI 음성 안내 또는 LLM 생성 큰 화면 UI로 독립적으로 주문할 수 있다. 카메라가 백그라운드에서 어려움 점수를 측정하여 70점 이상이면 자동으로 접근성 모드를 제안한다.

**기술 환경**: Next.js App Router, TypeScript, Zustand 상태 관리, Tailwind CSS v4, shadcn, Web Speech API(STT/TTS), Claude headless mode (Haiku 모델). 한국어 전용 UI.대화형 모드에 https://ui.elevenlabs.io/docs/components/orb 와 ,https://ui.elevenlabs.io/docs/components/live-waveform 적용

// AI: module화가 필요함,변경사항에 대해 유연하도록, A를 바꿀때 B까지 바꾸면안됨,  feature-sliced / focus on cliean code, modulization. 전체 디렉토리 구조가 없음.꼭 작성하고 진행해줘 어떤모듈들이 필요한지 검토하고 



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

카테고리 7개: 버거(seq:1), 맥런치(2), 해피스낙(3), 사이드&디저트(4), 맥모닝(5), 해피밀(6), 맥카페&음료(7). 메뉴 데이터는 `menu.json`에 정적으로 포함.

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
  llmLogs: LLMLogEntry[]    // { ts, type: "gen-ui"|"voice", prompt, response }
  addLLMLog(entry) / clearLLMLogs()
}
```

---

## 3. 일반 모드 흐름

### 3.1 아이들 화면
- 60초간 입력 없으면 `isIdle = true` → 아이들 화면 표시
- 55초 시점에 화면에 "5초 후 처음 화면으로 돌아갑니다" 카운트다운 오버레이 표시
- 화면 터치 시 카운트다운 취소 + 타이머 리셋
- 아이들 화면: 맥도날드 로고 + "터치하여 시작" 펄스 애니메이션
- 터치 → `isIdle = false` → 주문 방법 선택 화면

### 3.2 주문 방법 선택 화면
- "매장에서 먹기" / "포장하기" 두 개의 큰 버튼
- 선택 → `setOrderType` → `step = "menu"`

### 3.3 메뉴 화면
- 상단 고정 헤더: 로고 + 이전(←) 버튼 + 장바구니 아이콘(수량 뱃지)
- 카테고리 탭 (가로 스크롤 고정): 탭 클릭 시 해당 카테고리로 스크롤
- 메뉴 카드 그리드 (2-4열 반응형): 이미지, 이름, 칼로리, 신상품 뱃지
- 카드 클릭 → 메뉴 상세 다이얼로그 (이미지, 이름, 설명, 칼로리, 수량 ±, "장바구니 담기")
- 장바구니 아이콘 클릭 → 우측 사이드 시트 (아이템 목록, 수량 ±, 삭제, "주문하기" 버튼)
- "주문하기" → `step = "checkout"`

### 3.4 주문 확인/결제 화면
- 주문 항목 전체 목록 (이름, 수량, 칼로리)
- "결제하기" 버튼 → `/api/orders` POST → 로딩 스피너 → 완료 화면
- "취소" 버튼 → `step = "menu"`

(AI: genUI방식으로 디지털 취약계층을 위한 키오스크 개선을 보여주려면 대비되는 기존 키오스크 방식을 보여주는 것이 꼭 필요함 , 결제 방식 선택도 많아서 카드결제/간편 결제 같은것도 보여줘야할 수 있음)
(AI: 결제하는데 API 호출할 필요 없을수도 있을거 같음. 아니면 로깅용도인지? (태림))

### 3.5 주문 완료 화면
- 주문 번호 크게 표시 (예: "주문번호 A-042")
- "처음으로" 버튼 → `clearCart()` + `step = "order-type"` + `isIdle = false`
- API 실패 시: "주문 처리 중 문제가 발생했습니다. 직원을 불러주세요." + 재시도 버튼

---

// AI: 어려움감지랑 나머지 진행시에 다 voice mode가 있는데 이걸 별도 모듈로 정의하면 좋겠고, headless mode나 vocie mode의 경우 패턴매칭으로 효율화 하려는경향이 있어서 지침을 추가해줘야할거 같음

## 4. 어려움 감지 시스템


### 4.1 DifficultyDetector
- 숨겨진 컴포넌트 (UI 없음), 일반/배리어프리 모드 모두에서 실행
- 아이들 상태이거나 `accessibilityMode !== "none"`이면 동작 중지
- 3초마다 카메라 프레임 캡처 (AI: 이거 너무 텀이 큰데 1초로 하면 어떨지?)
- `apiEndpoint` prop 있으면: POST `{frame: base64 jpeg}` → `{score: number}`
- 없으면 시뮬레이션: sine wave로 30초 주기 (0-55 정상 구간 ↔ 60-95 트리거 구간 교대)
- `score >= 70` → `setDifficultyScore(score)` + `setShowHelpOffer(true)`
- 카메라 권한 거부 시 조용히 무시

// AI: 어려움 감지 모듈에 대한 세부 구현은 difficulty-detector.md 에 기술해두어서 본 문서와 합치기 (충돌나지 않게 설계 구조 잘 잡기)

### 4.2 HelpOfferDialog
- `showHelpOffer === true`이면 표시
- **1단계**: "도움이 필요하신가요?" + "네, 도와주세요" / "아니오" 버튼 + 5초 자동 닫힘 카운트다운
- 닫히면 `setShowHelpOffer(false)`
- **2단계 (수락 시)**: "어떤 방식이 편하신가요?"
  - 🔊 "음성 안내" → `setAccessibilityMode("voice")`
  - 🔤 "큰 화면" → `setAccessibilityMode("large-ui")`

// AI: 이거 수락 받을 때도 시각장애인은 도와주세요 라고 말을 해도 받을 수 있어야해. 이에 맞게 스펙 수정해줘

---

## 5. 배리어프리 모드 공통

### 5.1 BFLayout
- `accessibilityMode !== "none"` 일 때 전체 화면 대체
- 배경: `#1A1A1A` (다크)
- 헤더 (`#FFBC0D` 노란색): 맥도날드 M 로고 + "음성 켜기/끄기" 토글 버튼
- 토글 버튼: 음성 모드 ↔ 큰 화면 모드 전환 가능
- 스텝 인디케이터 (헤더 아래 어두운 바): 주문방법 → 카테고리 → 메뉴 → 확인 4단계
  - 완료 단계: 노란색 체크, 현재 단계: 흰색 + 노란 링, 미완: 반투명
- 메인 영역: `accessibilityMode === "voice"` → VoiceOrderInterface, `"large-ui"` → GenUIScreen

---

## 6. 음성 모드

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
- 마이크 버튼 (128×128px 원형): 대기=노란색, 듣는 중=빨간색 pulse 애니메이션, 처리 중=회색+스피너
- 상태 텍스트: "🔴 듣고 있어요" / "⏳ 처리 중"

**동작 루프**
1. 마운트 시 300ms 후 STT 자동 시작
2. 인삿말 TTS: "안녕하세요! 맥도날드입니다. 매장에서 드실 건가요, 포장하실 건가요?"
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

### 6.4 TTS 유틸 (`ttsSpeak`)
- `speechSynthesis.cancel()` + `speechSynthesis.resume()` → 이전 발화 중단
- `getVoices()`에서 `lang.startsWith("ko")` 음성 우선 선택
- voices 미로드 시 `onvoiceschanged` 이벤트 대기 후 speak
- `rate = 0.88`, `lang = "ko-KR"`
- `onend` 콜백으로 완료 통보

---

## 7. 큰 화면 모드 (Generative UI)
// AI: 큰 화면 모드(배리어프리모드)를 "현재 프로젝트의 키오스크를 분석해서 추상 UI 모델 (PIM)을 만들고, 시니어 사용자 프로필 각각 주입하여 adaptforge 를 적용한 새로운 UI를 만들어줘"로 구현되도록 스펙 수정해줘
### 7.1 GenUIScreen
- `bfStep` 변경마다 `/api/gen-ui` 호출하여 화면 데이터 수신
- 로딩 중 이전 화면 존재 시: 이전 화면 40% opacity 유지 + 로딩 스피너 오버레이
- 로딩 중 이전 화면 없을 시: 스켈레톤 (스피너 + "화면을 준비하고 있어요...")
- `show_more` 페이지네이션 시: 기존 화면 유지, 하단에만 로딩 표시

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

### 7.2 배리어프리 결제 완료 (큰 화면 모드)
- `bfStep === "checkout"` 진입 시 자동 `/api/orders` POST 호출
- 성공 시 orderId를 컨텍스트에 포함하여 `/api/gen-ui` 요청 (LLM이 완료 화면 생성)
- LLM 완료 화면: 주문번호, 감사 메시지, "처음으로" 버튼
- "처음으로" action → `clearCart()` + `resetBF()` + `setAccessibilityMode("none")` + `isIdle = false` + `step = "order-type"`

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

**시스템 프롬프트 핵심 (AdaptForge 원칙)**
- difficulty < 70: 최대 6개 옵션, lg 폰트
- difficulty 70-84: 최대 4개 옵션, xl 폰트
- difficulty 85+: 최대 2-3개 옵션, 2xl 폰트
- 레이블: 쉬운 한국어, 영어 병기 가능, emoji 적극 활용
- hint: 1문장, 친근하고 명확하게
- 순수 JSON 출력 (마크다운 코드블록 없이)

**모델**: Claude Haiku (claude-haiku-4-5-20251001)
**인증**: claude headless mode Claude Code OAuth 토큰 우선, 없으면 `ANTHROPIC_API_KEY` 환경변수, 없으면 macOS 키체인의 Claude Code OAuth 토큰 (`security find-generic-password -s "Claude Code-credentials" -w`)

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

**구현**: Claude Code CLI headless mode (`claude -p "..." --output-format json [--resume sessionId] --max-turns 1 --tools "" --model haiku`)
- 첫 턴: `--system-prompt` 포함
- 이후 턴: `--resume sessionId` (대화 히스토리 자동 유지)
- `execFile` 비동기, 30초 타임아웃

**시스템 프롬프트 핵심**
- 현재 bfStep에 맞는 action만 수행
- speech는 TTS로 자연스럽게 읽힐 텍스트
- 응답은 순수 JSON만
- 단계별 허용 action 명시

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
- orderId는 매 요청마다 고유값 (카운터 또는 랜덤)

---

## 9. 디버그 패널

### 9.1 활성화
- `NODE_ENV === "development"` 또는 URL `?debug=1`
- 화면 좌하단 고정, z-index 최상위
- 토글 버튼으로 열기/닫기

### 9.2 섹션 구성 (펼쳤을 때)
- **Camera**: 실시간 카메라 미리보기 (160×90, 좌우 반전), LIVE 뱃지, 얼굴 감지 수
- **Difficulty Score**: 프로그레스 바 + 숫자 (녹색<40, 노란40-69, 빨간70+)
- **Manual Trigger**: "Score 75" / "Help 팝업" / "Reset" 버튼
- **State**: isIdle, step, bfStep, accessibilityMode, showHelpOffer 테이블
- **Quick Switch**: none / large-ui / voice 버튼 (현재 모드 강조)
- **LLM Logs**: 스크롤 가능 로그창 (최근 50개), 새 로그 시 자동 스크롤
  - 각 항목: `[HH:MM:SS]` + 타입 뱃지(gen-ui=파란색, voice=보라색) + 프롬프트 요약 + `→` 응답 요약
  - "clear" 버튼

---

## 10. 디자인 시스템

### 색상
- 주색: `#FFBC0D` (맥도날드 노란색)
- 다크 배경: `#1A1A1A`
- 카드 배경: `#27251F`
- 강조 빨간색: `#DB0007`
- 텍스트: 흰색, 보조: `rgba(255,255,255,0.6)`

### 타이포그래피
- 한국어: Noto Sans KR
- 제목: font-black(900), 버튼: font-bold(700), 본문: font-medium(500)
- BF 폰트 레벨: base / lg / xl / 2xl

### 상호작용
- 모든 버튼: `active:scale-95` 터치 피드백
- BF 화면 전환: fade-in + slide-from-bottom (500ms ease-out)
- BF 옵션 stagger: 60ms 간격 순차 등장

---

## 11. 화면 진입 라우팅 로직 (page.tsx)

```
isIdle = true → <IdleScreen>

accessibilityMode !== "none" → <BFLayout> (+ HelpOfferDialog + DifficultyDetector + DebugPanel)

일반 모드:
  step === "order-type" → <OrderTypeScreen>
  step === "menu" → <Header> + <CategoryTabs> + <MenuGrid> + <CartSheet>
  step === "checkout" → <CheckoutScreen>
  (모든 일반 모드 화면에 HelpOfferDialog + DifficultyDetector + DebugPanel 포함)
```

---

## 12. User Stories (Ralph 실행 순서)

// AI : 위에 여러 스펙들이 나오는데 그것들도 ralph 작업에 다 반영되어야하는데, 왜 아래의 것들만 있는지 궁금해. 만약에 위의 내용들을 제외하게 되는 플랜이라면 그렇지 않고 모든 내용을 다 랄프에 반영하여 작업하도록 개선이 필요해.

---

### US-001: 프로젝트 기반 설정 및 타입/스토어 구축

**설명**: Next.js App Router 프로젝트의 기반을 설정한다. 메뉴 타입, Zustand 스토어 전체, 유틸리티 함수를 구현한다.

**구현 범위**
- `src/types/menu.ts`: MenuItem, MenuCategory, MenuData, CartItem, OrderType, KioskStep, BFStep, AccessibilityMode, LLMLogEntry 인터페이스 정의
- `src/lib/utils.ts`: `cn()` 유틸 (clsx + tailwind-merge)
- `src/store/kiosk.ts`: 섹션 2의 전체 KioskStore Zustand 스토어 구현 (모든 상태 + 액션 포함, LLM 로그 포함)
- `src/lib/api.ts`: `loadMenu()` 함수 — `src/lib/menu.json` 정적 import

**수락 기준**
- TypeScript 오류 없음 (`npx tsc --noEmit`)
- `useKioskStore()` 훅으로 모든 상태/액션 접근 가능
- `loadMenu()`가 MenuData 반환

---

// AI : Claude  cli headless mode로 호출할건데, 자꾸 여러 문서에서 api key로 되어있어 우리는 api key가 없어서 cli를우선으로 실행해줘, 만약 잘안된다면 테스트하고 원인파악하여 수정을 거치는 것도 명시해줘.
### US-002: Anthropic 클라이언트 및 공통 유틸 구현

**설명**: Claude AI API를 호출하기 위한 공통 클라이언트를 구현한다.

**구현 범위**
- `src/lib/anthropic.ts`: `getAnthropicClient()` 비동기 함수
  - `ANTHROPIC_API_KEY` 환경변수 있으면 `new Anthropic({ apiKey })`
  - 없으면 `security find-generic-password -s "Claude Code-credentials" -w` 실행 → JSON 파싱 → `creds.claudeAiOauth.accessToken` 추출 → `new Anthropic({ authToken })`
  - 클라이언트 싱글턴 캐시 (모듈 변수 `_client`)
- `next.config.ts`: images.remotePatterns에 `https://www.mcdonalds.co.kr/**` 허가

**수락 기준**
- `getAnthropicClient()` 호출 시 Anthropic 인스턴스 반환
- API 키 없고 키체인도 없으면 명확한 에러 throw
- `npm run build` 성공

---

### US-003: 아이들 타이머 훅 및 아이들/주문타입 화면 구현

**설명**: 60초 아이들 타이머와 아이들 화면, 주문 방법 선택 화면을 구현한다.

**구현 범위**
- `src/hooks/useIdleTimer.ts`: `useIdleTimer(onIdle, onWarning, onActive)` 훅
  - 이벤트 감지: mousemove, mousedown, keydown, touchstart, scroll, click
  - 55초 시점: `onWarning()` 호출
  - 60초 시점: `onIdle()` 호출
  - 활동 감지: `onActive()` + 타이머 리셋
- `src/components/kiosk/IdleScreen.tsx`: 다크 배경, 맥도날드 로고(M), "화면을 터치하여 시작하세요" 텍스트, 펄스 애니메이션 원
- `src/components/kiosk/OrderTypeScreen.tsx`: "매장에서 먹기" / "포장하기" 두 큰 버튼 (이모지 + 텍스트), 클릭 시 각각 setOrderType
- `src/app/page.tsx` 기본 구조: isIdle 시 IdleScreen, 아이들 해제 시 OrderTypeScreen
  - 55초 카운트다운 오버레이: 화면 중앙 반투명 다크 오버레이, 큰 숫자 + "초 후 처음 화면으로 돌아갑니다"

**수락 기준**
- 55초 후 카운트다운 오버레이 표시
- 터치 시 오버레이 사라짐
- 60초 후 아이들 화면 표시
- 주문 타입 선택 후 step = "menu" (화면 변화 확인 가능)

---

### US-004: 메뉴 화면 (헤더, 카테고리 탭, 메뉴 그리드) 구현

**설명**: 일반 모드의 메뉴 탐색 화면을 구현한다.

**구현 범위**
- `src/components/kiosk/Header.tsx`: 맥도날드 로고, 이전 버튼 (step="order-type"로), 장바구니 아이콘 + totalCount 뱃지
- `src/components/kiosk/CategoryTabs.tsx`: 가로 스크롤 탭 바, 카테고리별 탭, 클릭 시 해당 섹션으로 smooth scroll
- `src/components/kiosk/MenuCard.tsx`: 아이템 카드 — next/image 이미지(mcdonalds.co.kr), korName(stripHtml), calorie, newIcon 뱃지
- `src/components/kiosk/MenuGrid.tsx`: 카테고리별 섹션 + MenuCard 그리드 (2열 기본, sm:3열)
- `src/app/page.tsx` step="menu" 분기: Header + CategoryTabs + MenuGrid 조합

**수락 기준**
- 메뉴 카드가 카테고리별로 그루핑되어 표시됨
- 카테고리 탭 클릭 시 해당 섹션으로 스크롤됨
- 이미지 로드 실패 시 fallback 표시

---

### US-005: 메뉴 상세 다이얼로그 및 장바구니 구현

**설명**: 메뉴 카드 클릭 시 상세 팝업과 우측 장바구니 시트를 구현한다.

**구현 범위**
- `src/components/kiosk/MenuDetailDialog.tsx`: 다이얼로그 — 이미지, korName, description, calorie, 수량 선택(±), "장바구니 담기" 버튼 → `addItem()` 호출
- `src/components/kiosk/CartSheet.tsx`: 우측 드로어 — 아이템 목록(이름, 수량±, 삭제), totalCount, "주문하기" 버튼 → step="checkout"
- MenuCard에 클릭 핸들러 추가 (selectedItem 상태로 다이얼로그 열기)
- Header의 장바구니 아이콘 클릭 시 CartSheet 열기

**수락 기준**
- 메뉴 카드 클릭 → 상세 다이얼로그 열림
- 수량 선택 후 "장바구니 담기" → 장바구니 아이콘 수량 업데이트
- CartSheet에서 수량 ± 및 삭제 동작
- "주문하기" → step = "checkout"

---


// AI: 이게 일반모드인지 genUI 모드인지 전혀 없잖아

### US-006: 주문 제출 API 및 결제/완료 화면 구현

**설명**: 주문 API 엔드포인트와 결제 확인 화면, 주문 완료 화면을 구현한다.

**구현 범위**
- `src/app/api/orders/route.ts`: POST 핸들러 구현 (섹션 8.3 명세 기준)
  - 주문번호 생성: 알파벳 1자 + 숫자 3자리 (예: A-042, 카운터 기반)
  - 인메모리 Map 저장
  - items 빈 배열 → 400 에러
- `src/components/kiosk/CheckoutScreen.tsx`: 주문 요약 + "결제하기" (로딩 스피너) + "취소"
  - 결제하기 → `/api/orders` POST → orderId 수신 → 완료 화면 상태 전환
  - 완료 화면: "주문번호 A-042" 크게 + "처음으로" 버튼
  - API 실패: 오류 메시지 + 재시도 버튼
- `src/app/page.tsx` step="checkout" 분기 추가

**수락 기준**
- "결제하기" 클릭 후 로딩 → 주문번호 표시됨
- "처음으로" → 장바구니 초기화 + step="order-type"
- API 실패 시 오류 메시지 표시

---

### US-007: 어려움 감지 + 도움 팝업 구현

**설명**: 카메라 기반 어려움 감지 컴포넌트와 도움 제안 팝업을 구현한다.

**구현 범위**
- `src/components/kiosk/DifficultyDetector.tsx`: 섹션 4.1 명세 기준
  - hidden 컴포넌트, 카메라 스트림, 3초 인터벌, 시뮬레이션 모드
  - props: `apiEndpoint?: string`
- `src/components/kiosk/HelpOfferDialog.tsx`: 섹션 4.2 명세 기준
  - 1단계 + 2단계 흐름, 5초 카운트다운
- `src/app/page.tsx`: DifficultyDetector + HelpOfferDialog 포함
  - accessibilityMode 변경 시 BFLayout 전환 (컴포넌트 임포트만, 구현은 US-008에서)

**수락 기준**
- DebugPanel 없이도 약 30초 후 시뮬레이션으로 도움 팝업이 뜸
- 2단계에서 "큰 화면" 또는 "음성 안내" 선택 시 accessibilityMode 변경됨
- "아니오" 또는 카운트다운 완료 시 팝업 닫힘

---


// AI: 배리어프리 모드에 이렇게 항상 같은 UI가 노출되면, genUI인것이 잘 안보일거같아. 속도는 너무 느리지는 않으면서 genUI 컨셉을 잘 보여줄 수 있는 방법을 고민해봐줘. 

### US-008: 배리어프리 레이아웃 및 기본 단계 화면 구현

**설명**: 배리어프리 모드의 공통 레이아웃과 touch 기반 단계별 화면을 구현한다.

**구현 범위**
- `src/components/barrier-free/BFLayout.tsx`: 섹션 5.1 명세 기준
  - voiceUnlocked 상태 관리
  - accessibilityMode에 따라 VoicePermissionGate/VoiceOrderInterface/GenUIScreen 렌더링 (VoiceOrderInterface, GenUIScreen은 빈 placeholder 컴포넌트로 임시 처리)
- 스텝 인디케이터 내부 컴포넌트
- `src/components/barrier-free/BFOrderType.tsx`: 큰 버튼 2개 (🪑 매장 / 🛍️ 포장)
- `src/components/barrier-free/BFCategorySelect.tsx`: 카테고리 2열 그리드, 각 카테고리 emoji + 이름
- `src/components/barrier-free/BFItemList.tsx`: 2열 그리드, 페이지당 4개, 이전/다음 페이지 버튼
- `src/components/barrier-free/BFItemDetail.tsx`: 전체 화면 아이템 상세, 수량 ± 큰 버튼, "담기" 버튼
- `src/components/barrier-free/BFCartReview.tsx`: 장바구니 목록, "결제하기" 버튼 → bfStep="checkout"
- `src/components/barrier-free/BFCheckout.tsx`: checkout 진입 시 `/api/orders` 자동 호출, 주문번호 표시, TTS "주문이 완료되었습니다..." (Web Speech API 직접 사용), "처음으로" 버튼
- `src/app/page.tsx`: accessibilityMode !== "none" 시 BFLayout 렌더링

**수락 기준**
- large-ui 모드 진입 시 BFLayout 표시됨
- 단계별 화면 전환 (order-type → category → items → item-detail → cart-review → checkout) 동작
- checkout 완료 후 주문번호 표시 + 처음으로 초기화

---

### US-009: STT/TTS 훅 및 음성 모드 VoiceOrderInterface 구현

**설명**: 음성 주문 모드의 STT 훅, TTS 유틸, 메인 인터페이스 컴포넌트를 구현한다.



**구현 범위**
- `src/hooks/useSTT.ts`: 섹션 6.3 명세 기준
- `src/hooks/useVoice.ts`: `speak(text)` + `cancel()` 래퍼 (accessibilityMode="voice"일 때만 동작)
- `src/components/barrier-free/VoicePermissionGate.tsx` (또는 BFLayout 내부): 섹션 6.1 명세
- `src/components/barrier-free/VoiceOrderInterface.tsx`: 섹션 6.2 명세 (STT 오류 복구 포함)
  - ttsSpeak 내부 유틸 함수 구현 (섹션 6.4)
  - 모든 오류 복구 케이스 처리
  - sessionIdRef로 대화 연속성 유지
- BFLayout에서 VoicePermissionGate + VoiceOrderInterface 연결

**수락 기준**
- voice 모드 진입 후 "화면을 눌러 시작" 버튼 표시
- 버튼 클릭 후 인삿말 TTS 재생 + 자동 STT 시작
- 발화 후 Claude 응답 TTS 재생 + 자동 재청취
- 마이크 버튼 시각적 상태 변화 (노란/빨간/회색)

---

### US-010: 음성 주문 API 구현

**설명**: 음성 주문 처리를 위한 서버 API 엔드포인트를 구현한다.

**구현 범위**
- `src/app/api/voice-order/route.ts`: 섹션 8.2 명세 기준
  - Claude Code CLI headless mode 방식
  - 첫 턴: --system-prompt 포함 전체 메뉴 컨텍스트
  - 이후 턴: --resume sessionId
  - 응답 파싱: stdout JSON → result 필드 → JSON 추출 (markdown 코드블록 제거)
  - FALLBACK 응답 정의 및 에러 시 반환
  - SYSTEM_PROMPT: 전체 메뉴(compact), 단계별 허용 action, 응답 형식

**수락 기준**
- voice 모드에서 "빅맥 주세요" 발화 시 적절한 action 반환
- sessionId가 응답에 포함되고 다음 요청에 --resume으로 전달됨
- API 오류 시 FALLBACK 응답 반환

---

### US-011: Generative UI API 구현

**설명**: 큰 화면 모드를 위한 LLM 기반 UI 생성 API를 구현한다.

**구현 범위**
- `src/app/api/gen-ui/route.ts`: 섹션 8.1 명세 기준
  - getAnthropicClient() 사용 (SDK 직접 호출)
  - MENU_COMPACT 전처리 (stripHtml, description 60자 제한)
  - SYSTEM_PROMPT: AdaptForge 원칙, 전체 메뉴, JSON 스키마, difficulty별 옵션 수 제한
  - userPrompt: 단계, difficultyScore, 적응 레벨 텍스트, 컨텍스트 상태
  - 응답 파싱: text → JSON 추출
  - FALLBACK: `{ title: "화면을 불러오는 중...", layout: "list", fontSize: "xl", options: [] }`

**수락 기준**
- large-ui 모드에서 각 단계마다 고유한 화면이 생성됨
- difficultyScore=85에서 옵션 2-3개 + 2xl 폰트
- difficultyScore=50에서 옵션 6개 이하 + lg 폰트

---

### US-012: GenUIScreen 컴포넌트 구현

**설명**: /api/gen-ui 응답을 렌더링하는 클라이언트 컴포넌트를 구현한다.

**구현 범위**
- `src/components/barrier-free/GenUIScreen.tsx`: 섹션 7.1 명세 전체 구현
  - useCallback으로 fetchScreen 정의 (bfStep, context 의존성)
  - bfStep 변경 시 useEffect로 fetchScreen(0) 호출
  - 로딩 중 이전 화면 유지 (opacity-40 + 스피너 오버레이)
  - 첫 로드 시 스켈레톤
  - 전체 화면 + 옵션 stagger 애니메이션
  - handleOption으로 모든 action 처리
  - page 상태로 show_more 페이지네이션
  - go_back 없을 때 자동 추가
- BFLayout에서 large-ui 모드 시 GenUIScreen 렌더링 (기존 placeholder 교체)
- LLM 로그: 각 응답 후 `addLLMLog({ type: "gen-ui", prompt: "step:X score:Y", response: '"title" | N개 옵션 [fontSize]' })`

**수락 기준**
- large-ui 모드에서 단계 전환 시 애니메이션과 함께 새 화면 표시
- 로딩 중 이전 화면이 흐릿하게 유지됨
- show_more 시 페이지 증가하여 다른 옵션 표시

---

### US-013: 배리어프리 결제 완료 흐름 통합

**설명**: 음성 모드와 큰 화면 모드의 결제 완료 흐름을 완성한다.

**구현 범위**
- `src/components/barrier-free/BFCheckout.tsx` 완성 (US-008에서 만든 것 보완):
  - **큰 화면 모드 (large-ui)**: checkout 단계 진입 시 자동 `/api/orders` 호출 → orderId를 컨텍스트에 담아 `/api/gen-ui` 요청 → LLM 완료 화면 렌더링 (주문번호 + 감사 메시지 + "처음으로" 버튼)
  - **음성 모드 (voice)**: checkout 단계 진입 시 자동 `/api/orders` 호출 → TTS "주문이 완료되었습니다. 주문 번호는 [번호]입니다." + 화면에 주문번호 표시
  - "처음으로" 또는 완료 후 자동 초기화: `clearCart()` + `resetBF()` + `setAccessibilityMode("none")` + `step = "order-type"` + `isIdle = false`
- GenUIScreen의 action 처리에 `reset_all` action 추가 (LLM이 생성한 완료 화면에서 처음으로 버튼용)

**수락 기준**
- voice 모드: checkout 단계에서 TTS로 주문번호 읽어줌
- large-ui 모드: LLM이 생성한 완료 화면에 주문번호 표시됨
- 두 모드 모두: "처음으로" 후 일반 모드 주문 타입 선택 화면으로 돌아감

---

### US-014: 디버그 패널 구현

**설명**: 개발 및 데모용 디버그 패널을 구현한다.

**구현 범위**
- `src/components/kiosk/DebugPanel.tsx`: 섹션 9 명세 전체 구현
  - 카메라 미리보기 스트림 (DifficultyDetector와 별개)
  - difficulty 프로그레스 바 (색상 조건부)
  - Manual Trigger 버튼 3개
  - State 테이블
  - Quick Switch 버튼
  - LLM Logs 스크롤 창 (llmLogs 구독, 자동 스크롤, clear 버튼)
  - 폰트: 모노스페이스, 텍스트 tiny (10px)
  - `NODE_ENV === "development"` 또는 `?debug=1` 활성화
- VoiceOrderInterface에서 API 응답 후 `addLLMLog` 호출 추가
- `src/app/page.tsx`에 DebugPanel 포함

**수락 기준**
- 개발 모드에서 좌하단에 패널 표시
- Score 75 버튼 클릭 시 difficulty 바 빨간색으로 변함
- gen-ui 또는 voice 호출 후 LLM Logs에 항목 추가됨
- clear 버튼 클릭 시 로그 비워짐

---

// AI; ralph를 최소 4시간 이상 돌릴 수있도록 정말 꼼꼼한 검증이 필요해. 매 차례 구현을 검증하고 안되는 부분을 수정하면서 이전 것들이 모두 잘 될때 다음 것을 실행할 수 있도록 기본 지침을 작성해줘.

## 13. 전체 검증 방법

각 Story 완성 후:
1. `npm run dev` 실행
2. `http://localhost:3000?debug=1` 접속
3. **일반 모드**: 주문 타입 선택 → 메뉴 탐색 → 장바구니 → 결제 → 주문번호 확인
4. **어려움 감지**: DebugPanel "Score 75" + "Help 팝업" → 접근성 모드 선택
5. **큰 화면 모드**: 단계별 화면 생성 확인, difficultyScore=85 설정 후 옵션 2-3개 확인
6. **음성 모드**: 마이크 권한 승인 → 발화 ("빅맥 하나 주세요") → 응답 TTS 확인
7. **결제 완료**: 양 모드에서 checkout 단계까지 진행 → 주문번호 표시 확인
8. **아이들**: 55초 대기 → 카운트다운 표시 → 60초 → 아이들 화면
9. `npm run build` 빌드 오류 없음
10. `npx tsc --noEmit` TypeScript 오류 없음


(AI: 랄프 모드로 돌리면, 매턴 잘 구현되었는지 검증을 해야할 것 같은데. unit / e2e 테스트를 만들고 테스트 커버리지는 60% 이상이면 좋겠어. 이 내용도 문서에 반영해줘)