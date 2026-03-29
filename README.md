# generative-kiosk

Barrier-free kiosk demo for the hackathon track.

## Live run

```bash
npm run dev -- --port 3105
npm run open:chrome -- 3105
```

- dev runtime uses `.next-dev`
- production build uses `.next`
- Playwright uses `.next-e2e`
- runtime verification uses `.next-runtime`

## Core verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test e2e/adaptive-flows.spec.ts
npm run verify:runtime
```

## Soak / evidence

```bash
npm run verify:runtime:soak
npm run verify:runtime:report
npm run verify:runtime:history-summary
npm run verify:evidence-summary
npm run verify:readiness-report
npm run write:readiness-report
npm run collect:evidence-bundle
npm run verify:all
```

Artifacts:

- latest runtime report: `test-results/runtime-verify-report.json`
- runtime history: `.omx/logs/runtime-verify-history.json`
- latest readiness report: `test-results/readiness-report-latest.md`
- latest handoff note: `test-results/handoff-note-latest.md`
- evidence bundles: `test-results/evidence-bundles/`
- manual device log template: `scripts/templates/manual-device-verification-template.md`
- initialize a manual log file: `npm run init:manual-log`
- manual checklist: `scripts/manual-device-checklist.md`

## Current automated proof

- debug-off / debug-on split preserved
- GenUI adaptive checkout flow works
- voice typed fallback flow works
- replay/reset state remains stable
- runtime soak history is recorded

## Remaining manual proof

- Mac Chrome real microphone path
- Mac Chrome real camera permission path
- long physical 2–4 hour device soak



$ralph "AI 엔지니어 및 QA 자동화 프롬프트
현재 프로젝트는 맥도날드 키오스크를 대상으로 한 Digital Transformation 및 GenUI 적용 해커톤 과제입니다. 아래 지침에 따라 개발 현황을 진단하고, 디자인 시스템 고안, 기능 구현, 그리고 대규모 시나리오 테스트를 수행하세요.

1. 디자인 시스템 및 UI/UX 정교화
   디자인 정렬: mdonaldkiosk.png 이미지를 분석하여 톤앤매너가 완벽히 일치하는 디자인 시스템을 구축하세요. 추측하지 말고 이미지의 색상, 타이포그래피, 버튼 스타일을 그대로 반영하십시오.

일반 모드 구현: 현재 '배리어 프리'로 즉시 실행되는 문제를 해결하고, 실제 키오스크와 동일한 사용성을 가진 일반 모드를 기본값으로 구현하세요.

GenUI 고도화: GenUI가 적용된 것이 시각적으로 드러나도록 Codepen 및 Awwwards 스타일의 세련된 스켈레톤 UI와 애니메이션을 적용하세요. GenUI가 선택되는 과정의 로그를 화면에서 확인할 수 있어야 합니다.

2. 디버그 모드 및 MediaPipe 최적화
   카메라 프리뷰 활성화: 현재 디버그 모드에서 카메라 프리뷰가 보이지 않는 결함을 해결하세요.

캘리브레이션 시각화: MediaPipe를 활용하여 카메라와 사용자 간의 캘리브레이션 현황이 실시간으로 드러나는 디버깅 페이지를 제작하세요. 개발자가 시나리오별로 데이터 흐름을 추적할 수 있어야 합니다.

3. 대규모 시나리오 생성 및 테스트 수행 (Total 100+)
   아래 조건에 맞는 시나리오들을 각각 50개 이상 생성하고 이를 playwright를 통해 테스트하세요.

사용 시나리오 (50개 이상): 실사용자 관점의 흐름

예: [매장 식사 -> 햄버거 단품 선택 -> 사이드 변경 -> 장바구니 -> 결제]

예: [포장 주문 -> 언어 변경(영어) -> 해피밀 선택 -> 장난감 선택 -> 결제 취소]

데모 시나리오 (50개 이상): 개발 및 디버그 관점의 특수 흐름 (Voice, GenUI, Debug 중심)

예: [Debug On -> 카메라 인식 확인 -> 음성 모드 진입 -> STT "치즈버거 하나 줘" -> GenUI 스켈레톤 노출 -> TTS 안내 -> 장바구니 확인]

예: [캘리브레이션 실패 시나리오 -> 에러 로그 노출 확인 -> GenUI 재수행 -> 해결]

4. Playwright + Open 기반 E2E 테스트 실행
   생성된 모든 시나리오를 playwright를 활용하여 실행하세요.

특히 개발자가 실제 동작 과정을 관찰할 수 있도록 npx playwright test --debug 또는 브라우저가 실행되는 open 명령어를 연동하여 순차적으로 테스트를 진행하세요.

5. SPEC.md 동기화 및 Ralph 루프 재개
   테스트 과정에서 발견된 실제 구현체와 prompts/SPEC.md 사이의 불일치 사항을 모두 정리하세요.

정리된 모순점들을 하나씩 해결하여 코드를 수정하고, 최종 변경사항을 prompts/SPEC.md에 반영하십시오.

모든 업데이트가 완료되면 Ralph 루프를 가동하여 제품의 완성도를 최종적으로 높이세요.

위 요청사항을 즉시 실행하고 결과물을 보고해줘."