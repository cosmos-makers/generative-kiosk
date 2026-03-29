# Generative Kiosk

## Meta
- **Topic**: Generative UI를 적용한 배리어-프리 키오스크 MVP
- **Target Audience**: 랄프톤 서울 참가자 및 심사위원
- **Tone/Mood**: 기술적이지만 공감 가는, 피치 중심, 간결하고 강렬하게
- **Slide Count**: 7 slides
- **Aspect Ratio**: 16:9

## Slide Composition

### Slide 1 - Cover
- **Type**: Cover
- **Title**: Generative Kiosk
- **Subtitle**: 사용자에 맞게 스스로 모습을 바꾸는 키오스크
- **Details**:
  - 팀명 / 팀원 / GitHub (placeholder)

### Slide 2 - SWE 3.0: Generative UI란?
- **Type**: Concept / Section Opener
- **Key Message**: LLM이 맥락에 따라 UI를 동적으로 생성하는 시대가 왔다
- **Details**:
  - Claude Artifacts — 인터랙티브 UI로 응답하는 기능 (소개 이미지)
  - SWE 2.0 vs SWE 3.0 대비
    - 2.0: 한 번 만들어 배포, 변하지 않는 소프트웨어
    - 3.0: 토큰만 정의하면 LLM이 맥락에 맞게 UI 자동 생성
  - 예시: 네이버 플레이스 — "미용실 예약" vs "NAVER D2SF 강남 안내" → 다른 UI

### Slide 3 - 문제: 키오스크는 늘었는데, 쓸 수 있는 사람은 늘지 않았다
- **Type**: Statistics / Problem
- **Key Message**: 키오스크 보급은 폭발했지만 디지털 소외계층은 여전히 배제되고 있다
- **Details**:
  - 국내 키오스크 설치 대수 **53만 6천 대** 돌파 (과기정통부, 2023)
  - 75세 이상 노인 중 키오스크로 주문 가능: **10% 미만** (서울신문, 2024)
  - 고령층(75세+) 키오스크 불편 경험: **76.6%** (서울디지털재단, 2023)
  - 불편 1위 이유: "뒷사람 눈치가 보인다" (53.6%)
  - 시각장애인의 **72.3%** 는 직원을 통해 주문 선호 (보건복지부, 2024)

### Slide 4 - 솔루션: 배리어-프리 Generative UI 키오스크
- **Type**: Solution
- **Key Message**: 살아있는 문제에 GenUI를 먼저 적용한다 — 여기서 동작하면 어디서든 동작한다
- **Details**:
  - 대상: 노년층, 시각장애인, 디지털 인터페이스 미숙 사용자
  - 한 문장 정의: "사용자가 곤란해지는 순간 UI가 스스로 바뀌는 키오스크"
  - 구현 비용이 낮아진 시대에 살아있는 문제를 고른 이유
  - 일종의 MVP — GenUI의 가장 뾰족한 테스트베드

### Slide 5 - 프로덕트: 어떻게 동작하는가
- **Type**: Workflow / Product Demo
- **Key Message**: 카메라가 사용자를 감지하고, LLM이 UI를 실시간으로 재구성한다
- **Details**:
  - 플로우 다이어그램 (tldraw):
    1. 기존 엠도날드 키오스크 화면 (일반 UI)
    2. 카메라 → Visual Recognition → 망설임/곤란 표정 감지 → 점수 산출
    3. 기준치 초과 시 → 팝업 + 음성 안내 등장
    4. 분기:
       - 시각장애인 → 보이스 모드 (음성 대화)
       - UI 미숙 사용자 → LLM이 UI를 단순하고 크게 실시간 재구성

### Slide 6 - 랄프 역량: AI & 기술 스택
- **Type**: Ralph Setup / AI Capability
- **Key Message**: GenUI + Vision + Voice — 세 AI 축으로 구현
- **Details**:
  - Visual Recognition: 표정/행동 분석 모델
  - Generative UI: LLM 기반 실시간 UI 생성
  - Voice Mode: 음성 입출력 인터페이스
  - 지속 전략: Google Analytics 연동 → 데이터 기반 자기 개선 에이전트 (Un-Harness Engineering)

### Slide 7 - Closing
- **Type**: Closing
- **Message**: GenUI의 가능성을 증명했다면 성공. 레슨런 + 네트워킹이 목표였으니 만족합니다.
- **Details**:
  - "여기서 동작하면 어디서든 동작한다"
  - 잘 놀다갑니다 🙌
