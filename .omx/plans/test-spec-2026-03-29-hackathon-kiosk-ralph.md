# Test Spec: Hackathon Barrier-Free Kiosk Ralph Plan

## Scope

This test spec verifies the risk-first MVP plan in `.omx/plans/prd-2026-03-29-hackathon-kiosk-ralph.md` against the clarified requirements in `.omx/specs/deep-interview-ralph-loop-kiosk.md`.

## Verification Principles

1. Prove the differentiators first: GenUI, MediaPipe difficulty detection, and voice mode.
2. Verify on the actual demo target first: MacBook Chrome fullscreen landscape.
3. Treat `debug off` and `debug on` as different presentation states of the same app.
4. Prefer repeatable demo-track checks over broad low-value coverage early.
5. Include stability confidence for a sustained 2-4 hour product runtime window on the target environment.
6. Require each major checkpoint to remain runnable and inspectable, not just theoretically mergeable.

## Test Matrix

### Unit tests

#### UT-01: Store transitions

Verify the Zustand store handles:
- normal mode state changes
- help offer visibility
- accessibility mode transitions
- cart mutations
- debug toggle state

Primary target:
- `src/store/kiosk.ts`

Pass criteria:
- All store actions are deterministic and idempotent where expected.

#### UT-02: Difficulty scoring logic

Verify pure scoring functions for:
- face score
- pose score
- hand score
- time score
- gaze score
- weighted total score

Primary target:
- `src/features/difficulty/lib/scoring.ts`

Pass criteria:
- Representative input fixtures produce expected score bands and threshold behavior.

#### UT-03: LLM response normalization

Verify parsing/normalization for:
- GenUI JSON responses
- voice action responses
- malformed or fenced output cleanup

Primary targets:
- `src/app/api/gen-ui/route.ts`
- `src/app/api/voice-order/route.ts`
- `src/lib/ai/client.ts`

Pass criteria:
- Parser returns valid app-shaped data or a safe fallback object without throwing uncaught errors.

### Integration tests

#### IT-01: Speech loop stability

Environment:
- MacBook Chrome fullscreen landscape

Verify:
- microphone permission request path
- STT start
- TTS response
- TTS completion -> STT restart
- retry behavior after one recognition failure

Pass criteria:
- Voice loop survives one failed recognition and continues without page reload.

Primary targets:
- `src/features/voice/hooks/useSTT.ts`
- `src/features/voice/hooks/useVoice.ts`
- `src/features/voice/components/VoiceOrderInterface.tsx`
- At least one happy-path recognition/TTS cycle completes successfully on the target environment before fallback behavior is considered acceptable.

#### IT-02: Difficulty detector -> help-offer path

Verify:
- MediaPipe loop can update `difficultyScore`
- help offer shows after threshold crossing
- rejecting help does not auto-switch modes
- accepting help transitions only after explicit user choice

Pass criteria:
- HITL rule is never violated.

Primary targets:
- `src/features/difficulty/components/DifficultyDetector.tsx`
- `src/features/difficulty/components/HelpOfferDialog.tsx`
- `src/store/kiosk.ts`

#### IT-03: GenUI adaptive rendering

Verify:
- difficulty score is included in the GenUI request
- different difficulty bands change option count/font size behavior
- returned screen renders in the large-ui client path

Pass criteria:
- At least two difficulty bands produce visibly different UI outputs.

Primary targets:
- `src/app/api/gen-ui/route.ts`
- `src/features/barrier-free/components/GenUIScreen.tsx`

#### IT-04: Debug overlay split

Verify:
- tiny debug toggle is always visible
- `debug off` hides diagnostics while keeping the same real product flows available
- `debug on` exposes score/log/diagnostic surfaces without breaking the main flow

Pass criteria:
- Same user flow remains usable in both states.

#### IT-04b: Visible running progress surface

Verify:
- the team can keep the current app open while Ralph continues working
- the visible surface reflects the latest runnable state rather than a stale mock

Pass criteria:
- At any checkpoint, the team can inspect a currently runnable product state without reconstructing it manually.

#### IT-05: Sustained product runtime stability

Environment:
- MacBook Chrome fullscreen landscape

Verify:
- speech loop remains recoverable over extended use
- difficulty detector does not wedge the session
- debug toggle can be used repeatedly without corrupting the main flow

Pass criteria:
- The app can survive a representative sustained 2-4 hour runtime window without requiring frequent full-page resets.

Primary targets:
- `src/features/debug/components/DebugPanel.tsx`
- `src/app/page.tsx`
- The tiny debug toggle remains visually neutral enough that `debug off` still feels like the same product rather than a technical console.

### End-to-end tests

#### E2E-01: Track A (GenUI spine)

Path:
- normal kiosk entry
- difficulty detection
- help offer
- user-approved GenUI transition
- adaptive menu selection
- cart
- mock order completion

Pass criteria:
- Full flow succeeds without manual developer intervention.

#### E2E-02: Track B (voice spine)

Path:
- normal kiosk entry
- difficulty detection
- help offer
- user-approved voice transition
- spoken interaction
- cart/order completion or safe handoff back to touch/GenUI

Pass criteria:
- At least one full happy-path order succeeds through voice on the target environment.
- Recovery behavior gracefully degrades while preserving order context when instability is introduced outside the happy path.

#### E2E-03: Debug-off presentation quality

Path:
- run the normal kiosk flow with debug disabled

Pass criteria:
- No technical overlays, raw scores, prompts, or diagnostics are visible.
- GenUI path and voice path remain available in the same product, with only internal calibration/logging surfaces hidden.

#### E2E-04: Debug-on judge narrative

Path:
- toggle debug on during the same session
- show internal score/log/adaptation state while keeping the product flow intact

Pass criteria:
- A presenter can explain the system decisions live without resetting the app.

## Manual Demo Checklist

1. Launch on MacBook Chrome fullscreen landscape.
2. Verify the tiny debug toggle is visible but not distracting.
3. Show product behavior with debug off, including access to normal mode, GenUI help, and voice help without internal diagnostics.
4. Trigger difficulty detection and show the help offer.
5. Accept help and show the GenUI path.
6. Reset and repeat with the voice path.
7. Toggle debug on and explain the score/log/adaptation signals.
8. Confirm payment completion is mock but coherent.
9. Run a longer stability pass to confirm the product does not degrade quickly under sustained repeated use.

## Failure Handling Expectations

### Speech failure

- User can retry voice input.
- User can fall back to touch.
- User can switch to GenUI help if needed.

### MediaPipe instability

- Debug mode exposes enough information to tune thresholds and cooldowns.
- Main demo can still proceed via a controlled reproducible trigger scenario.

### LLM malformed output

- App uses a safe fallback response shape.
- Failure is visible in debug mode, not as a broken screen in the normal mode.

## Exit Criteria For Ralph Completion

Ralph should not claim completion until all of the following are true:

1. Unit tests for store/scoring/parsing pass.
2. Integration checks for speech, detection, GenUI, and debug split pass.
3. Track A and Track B both pass on the target demo environment.
4. `debug off` preserves the same product behavior while hiding calibration, score, log, and internal diagnostic surfaces.
5. `debug on` is easy to operate live and supports the judge narrative.
6. The app demonstrates enough stability confidence for a sustained 2-4 hour product runtime window on the target environment.
7. Every major checkpoint remained runnable and demoable even if the loop had been stopped there.

## Observability Notes

- Log speech start/fail/restart events behind debug mode.
- Log GenUI request summaries and difficulty bands behind debug mode.
- Log mode transition approvals/rejections behind debug mode.
- Keep raw diagnostics hidden from `debug off`.
