# Manual Device Verification Checklist

Target: **MacBook Chrome fullscreen landscape**

## 1. Launch
- Run `npm run dev -- --port 3105`
- Run `npm run open:chrome -- 3105`
- Confirm the small `debug off` pill is visible

## 2. Debug-off product check
- Keep `debug off`
- Confirm no calibration / score / logs / internal diagnostics are visible
- Start a normal order flow and verify the main product UI is intact

## 3. Difficulty/help offer check
- Toggle `debug on`
- Use `도움 제안`
- Confirm the help dialog appears without forcing a mode switch
- Reject once and confirm the app stays in the normal flow

## 4. GenUI check
- Trigger `도움 제안` again
- Choose `큰 글씨 AI 화면`
- Select order type
- Add an item from the adaptive cards
- Complete checkout
- Confirm order completion screen and `처음으로` reset

## 5. Voice real-device check
- Trigger `도움 제안`
- Choose `음성 안내 주문`
- Accept microphone permission
- Speak a real command such as `빅맥 세트 담아줘`
- Confirm spoken or visible assistant response
- Speak `이제 결제할게`
- Confirm the order can complete or safely recover

## 6. Camera/sensor check
- Grant camera permission
- Confirm detector status changes in debug overlay
- Confirm score/source/status update without breaking the product flow

## 7. Replay stability check
- Repeat GenUI flow once
- Repeat voice flow once
- Use `처음으로` between runs
- Confirm mode state does not leak across replays

## 8. Long-run soak check
- Leave the app running in Chrome fullscreen
- Perform light interaction every few minutes
- Watch for:
  - frozen UI
  - lost debug toggle
  - broken help dialog
  - voice loop failing to recover
  - camera permission/session loss

## Automated companions
- `npm run verify:all`
- `npm run test:e2e`
- `npm run verify:runtime`
- `npm run verify:runtime:soak`
- `npm run verify:runtime:report`

## Evidence artifacts
- Latest runtime report: `test-results/runtime-verify-report.json`
- Runtime history log: `.omx/logs/runtime-verify-history.json`
- History summary: `npm run verify:runtime:history-summary`
- Manual verification log template: `scripts/templates/manual-device-verification-template.md`
- Create a timestamped manual log: `npm run init:manual-log`
