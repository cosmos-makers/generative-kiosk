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
