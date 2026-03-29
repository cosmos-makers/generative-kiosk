# Generative Kiosk — 랄프톤 서울 중간발표

## Meta
- **Topic**: AI-native 키오스크 접근성 — 어려움을 감지하고 인터페이스를 재생성
- **Target Audience**: 랄프톤 서울 심사위원 및 참가자
- **Tone/Mood**: 피치 중심 · 강렬 · 문제 중심 · 기술 신뢰감
- **Slide Count**: 5 slides
- **Aspect Ratio**: 16:9

---

## Slide Composition

### Slide 1 - Cover
- **Type**: Cover
- **Title**: Generative Kiosk
- **Subtitle**: 키오스크가 사람에게 맞춰야 한다
- **Details**:
  - 팀명: cosmos makers
  - 팀원: 오제관(리더), 김은란, 신태림
  - GitHub: https://github.com/cosmos-makers/generative-kiosk

---

### Slide 2 - 문제 정의
- **Type**: Statistics + Quote
- **Key Message**: 키오스크는 늘었고, 사람은 포기했다
- **Details**:
  - 국내 키오스크 **53만 대** (2023) — 2년 새 2.5배 증가
  - 65세 이상 **5명 중 4명**, 키오스크 있는 식당 방문을 **포기**
  - 75세 이상 **76.6%** 키오스크 이용에 불편함 경험
  - 키오스크를 사용할 수 있는 노인은 **17.9%** 뿐
  - 인용: *"나이 먹으면 죽으라는 거야?"* — 키오스크 앞 노인의 외침 (2023)
  - 핵심 고통: 뒤에 줄 선 사람 눈치, 글씨 작음, 단계 많음, 도움 요청하면 무시

---

### Slide 3 - 솔루션
- **Type**: Content + Flow
- **Key Message**: 키오스크가 먼저 감지하고, 사용자가 OK하면, 인터페이스가 바뀐다
- **One-line definition**: *어려움을 실시간 감지하고, 사용자 동의 하에 LLM이 인터페이스를 재생성하는 AI-native 키오스크*
- **Details**:
  - **Track A**: 일반 키오스크 시작 → MediaPipe 어려움 감지 → 도움 제안 → 사용자 OK → LLM GenUI로 인터페이스 재생성 (큰 글씨, 단순화, 맞춤형 카드)
  - **Track B**: 어려움 감지 → 음성 모드 전환 → 자연어로 주문 완료
  - **핵심 원칙**: 자동 전환 없음 — 항상 사람이 동의해야 바뀐다

---

### Slide 4 - 나의 랄프 세팅
- **Type**: Content + Diagram
- **Key Message**: Claude가 설계하고, Claude가 코딩하고, Claude가 감시한다
- **Details**:
  - **AI Stack**:
    - Claude API (Anthropic SDK) — GenUI 생성, 음성 인텐트 해석
    - Claude CLI — 로컬 fallback (2.5ms 이내 응답 실패 시)
    - MediaPipe Tasks Vision — 실시간 difficulty detection
    - Web Speech API — 음성 입출력
  - **랄프 운영 방식 (OMC — Opus Multi-Claude)**:
    - `planner` → `executor` → `debugger` → `designer` → `test-engineer` → `verifier`
    - 각 서브에이전트가 병렬 작업, `.omx/` 디렉토리로 context 공유
    - 실행 중 항상 데모 가능 상태 유지 (broken state 금지)

---

### Slide 5 - 현재 진행 상황
- **Type**: Closing / Progress
- **Key Message**: 코어 AI 파이프라인 완성, 데모 진행 중
- **Details**:
  - GenUI 생성 파이프라인 구현 완료 (Claude API + fallback)
  - MediaPipe difficulty detector 통합 완료
  - Human-in-the-loop 접근성 전환 UX 구현 중
  - 음성 모드 통합 진행 중
  - 목표: MacBook Chrome fullscreen landscape 데모
