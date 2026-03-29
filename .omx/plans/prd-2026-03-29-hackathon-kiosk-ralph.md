# PRD: Hackathon Barrier-Free Kiosk Ralph Plan

## Requirements Summary

Build a hackathon-ready AI-native barrier-free kiosk demo from the existing draft artifacts, with the highest priority on real Generative UI, real MediaPipe-based difficulty detection, and real voice mode. Accessibility transitions must remain human-in-the-loop. Payment remains mock-only. The demo target is MacBook Chrome fullscreen landscape, while remaining presentation-friendly for recording and large displays.

### Grounding references

- [Deep interview spec](/Users/user/generative-kiosk/.omx/specs/deep-interview-ralph-loop-kiosk.md#L23) defines the winning-product intent and the must-be-real constraints.
- [Deep interview spec](/Users/user/generative-kiosk/.omx/specs/deep-interview-ralph-loop-kiosk.md#L31) defines the desired outcome: real difficulty detection, real GenUI, real voice mode, HITL transitions, and clean debug separation.
- [Deep interview spec](/Users/user/generative-kiosk/.omx/specs/deep-interview-ralph-loop-kiosk.md#L90) fixes the priority order: GenUI, difficulty detection, voice, HITL help UX, debug split, responsive landscape, general polish.
- [SPEC draft](/Users/user/generative-kiosk/prompts/SPEC.md#L31) provides the intended app structure and module boundaries.
- [SPEC draft](/Users/user/generative-kiosk/prompts/SPEC.md#L225) and [difficulty detector spec](/Users/user/generative-kiosk/difficulty-detector.md#L130) define the sensing formulas, thresholds, and integration points.
- [Deep interview spec](/Users/user/generative-kiosk/.omx/specs/deep-interview-ralph-loop-kiosk.md#L159) records the current repo reality: implementation tree does not yet exist.

## Acceptance Criteria

1. Demo Track A works end-to-end: normal kiosk entry -> difficulty detection -> help offer -> user-approved GenUI transition -> menu/cart/order completion.
2. Demo Track B works end-to-end: normal kiosk entry -> difficulty detection -> help offer -> user-approved voice mode -> spoken guidance/order flow -> order completion.
3. The main demo path uses real LLM-backed GenUI and real MediaPipe-based detection on the MacBook Chrome target environment.
4. Voice mode is real and functional, not stubbed, and can complete at least one full happy-path order via voice on the target environment; fallback back to touch/GenUI exists only as recovery for instability outside that happy path.
5. `debug off` looks like a normal kiosk; `debug on` can be toggled from an always-visible small control and exposes diagnostics without breaking the main experience.
6. Payment remains clearly mock but visually coherent.
7. All major behaviors are verifiable through the test spec in `.omx/plans/test-spec-2026-03-29-hackathon-kiosk-ralph.md`.
8. Each major implementation checkpoint leaves the app in a runnable, demoable state even if Ralph is stopped mid-execution.
9. A visible running progress surface remains available during execution so the team can continuously inspect the current product state.

## RALPLAN-DR Summary

### Principles

1. Make the differentiators real: GenUI, sensing, and voice are the core proof points.
2. Preserve user agency: difficulty detection may suggest, never silently switch.
3. Design for the actual demo environment first: MacBook Chrome fullscreen landscape.
4. Separate product experience from explanation experience: debug on/off must coexist without contaminating the normal kiosk surface.
5. Burn risks early before broad implementation.

### Decision Drivers

1. Hackathon judging value comes from credible AI adaptation, not from generic kiosk polish.
2. The repo has only draft specs today, so early overbuilding would amplify rework.
3. Browser speech and MediaPipe calibration are the highest technical failure risks.

### Viable Options

#### Option A: Full-spec sequential build from `prompts/SPEC.md`

Pros:
- Maximum alignment with the existing comprehensive draft
- Straightforward mapping to the 14 listed user stories

Cons:
- Too broad for the current repo state
- Delays validation of the riskiest technology assumptions
- High chance of spending time on low-value general-mode polish before core proof points are stable

#### Option B: Risk-first dual-track MVP with GenUI + voice as the demo spine

Pros:
- Matches the clarified priorities from the deep interview
- Validates speech and sensing before full UI breadth
- Produces a Ralph-ready sequence with clear verification gates

Cons:
- Requires discipline to defer lower-value polish
- Needs strong debug/presentation thinking early to keep the demo coherent

#### Option C: Voice-first conversational demo with GenUI treated as secondary

Pros:
- Simpler initial UX surface
- Voice can feel magical in a live demo

Cons:
- Conflicts with the user’s stated priority order
- Weakens the visual impact of Generative UI
- Higher exposure to browser speech instability as the single dominant path

### Chosen Direction

Choose **Option B**.

### Invalidation Rationale

- Reject Option A as the default path because the current repo does not contain the implementation tree yet, so full-spec breadth would produce unnecessary early spread.
- Reject Option C as the main path because it contradicts the agreed priority order where GenUI leads and voice remains a critical second pillar.

## Implementation Steps

### Step 1: Reusable risk-burn lane for speech and sensing

Create minimal but reusable proof slices inside the future app structure to validate:
- Web Speech API start/stop/restart behavior on MacBook Chrome
- TTS -> STT handoff stability
- MediaPipe camera permissions, frame processing, and score trend visibility
- Help-offer trigger cadence with cooldown and no auto-switching
- Product-grade stability over a sustained 2-4 hour runtime window

Primary files:
- `src/features/voice/hooks/useSTT.ts`
- `src/features/voice/hooks/useVoice.ts`
- `src/features/difficulty/components/DifficultyDetector.tsx`
- `src/features/difficulty/lib/scoring.ts`
- `src/features/debug/components/DebugPanel.tsx`

Acceptance criteria:
- Speech loop can recover from at least one failed recognition attempt without breaking the session.
- MediaPipe score can be made to cross the help threshold in a reproducible demo scenario.
- The spike outputs are reusable in later implementation rather than being discarded entirely.
- Risks, tuning knobs, and confirmed blockers are documented in the PRD changelog and mirrored into the test spec before moving to broad UI work.
- This lane produces enough runtime confidence that the product can keep operating for a sustained 2-4 hour window on the target environment.

### Step 2: Foundation scaffold for the actual app structure

Create the concrete Next.js App Router structure described by the draft specs:
- `src/app`, `src/features/*`, `src/store`, `src/types`, `src/lib`, `src/data`
- Base types, single Zustand store, menu loading, utilities, and top-level page routing skeleton
- Always-visible small debug toggle with panel shell and `debug off` default behavior
- A thin visible Track A shell so the app gains presentable end-to-end shape early
- A persistent developer-visible running surface so the team can keep the current app state open while Ralph continues iterating

Primary files:
- `src/app/page.tsx`
- `src/types/index.ts`
- `src/store/kiosk.ts`
- `src/lib/menu.ts`
- `src/lib/utils.ts`
- `src/data/menu.json`

Acceptance criteria:
- Typecheck passes with the scaffolded structure.
- `page.tsx` can render a basic normal-mode shell with a hidden debug panel and a persistent small toggle that remains visually neutral in `debug off`.
- Menu JSON is available through app utilities.
- A presenter can already show the opening normal-mode flow and where GenUI adaptation attaches, even before full adaptive logic is complete.
- Stopping after this step still leaves behind a coherent runnable shell rather than a broken scaffold.

### Step 3: Implement the normal-mode + HITL help-offer spine

Build the general kiosk baseline and the human-in-the-loop accessibility offer:
- Idle/order-type/menu/cart/checkout skeleton
- Difficulty detector mounted headlessly
- Help offer dialog with user approval required before any mode transition
- Rejection path that avoids repetitive intrusive popups

Primary files:
- `src/features/kiosk/components/IdleScreen.tsx`
- `src/features/kiosk/components/OrderTypeScreen.tsx`
- `src/features/kiosk/components/MenuGrid.tsx`
- `src/features/kiosk/components/CartSheet.tsx`
- `src/features/kiosk/components/CheckoutScreen.tsx`
- `src/features/difficulty/components/HelpOfferDialog.tsx`
- `src/app/page.tsx`

Acceptance criteria:
- A user can complete a mocked order through the normal path.
- Difficulty detection can raise the help offer in the demo environment.
- Rejecting help does not auto-switch the mode.
- Stopping after this step still leaves a coherent normal-mode product slice that can be shown live.

### Step 4: Implement the two core adaptive tracks

Track A:
- Real GenUI route, prompt shaping, client render path, context propagation, and adaptive option limits/font sizing.

Track B:
- Real voice mode with transcript handling, LLM interpretation, spoken responses, and safe handoff back to touch/GenUI.

Primary files:
- `src/app/api/gen-ui/route.ts`
- `src/app/api/voice-order/route.ts`
- `src/features/barrier-free/components/BFLayout.tsx`
- `src/features/barrier-free/components/GenUIScreen.tsx`
- `src/features/barrier-free/components/BFCheckout.tsx`
- `src/features/voice/components/VoicePermissionGate.tsx`
- `src/features/voice/components/VoiceOrderInterface.tsx`
- `src/lib/ai/client.ts`
- `src/lib/ai/prompts.ts`

Acceptance criteria:
- Track A completes a full order through a real GenUI response path.
- Track B completes at least one full happy-path order through a real voice path on MacBook Chrome fullscreen landscape.
- Outside the happy path, voice failures gracefully degrade back to touch while preserving context.
- No pattern matching drives the main natural-language decisions.
- Stopping after this step still leaves at least one usable adaptive track available for live inspection.

### Step 5: Demo hardening, debug/presentation polish, and verification

Unify the product/demo experience for judging:
- Responsive landscape tuning for fullscreen laptop and large display presentation
- `debug on/off` polish
- LLM log visibility, difficulty visualizations, and status surfaces only behind debug
- End-to-end verification of the two main demo tracks
- Stability passes aimed at proving the product does not require frequent manual resets during a sustained 2-4 hour runtime window

Primary files:
- `src/features/debug/components/DebugPanel.tsx`
- `src/app/page.tsx`
- `src/features/barrier-free/components/BFLayout.tsx`
- `.omx/plans/prd-2026-03-29-hackathon-kiosk-ralph.md`
- `.omx/plans/test-spec-2026-03-29-hackathon-kiosk-ralph.md`

Acceptance criteria:
- `debug off` feels like a normal kiosk.
- `debug on` is easy to manipulate live and exposes enough explanation for judges.
- The final scripted demo can be run repeatedly on MacBook Chrome fullscreen landscape.
- Any ambiguity resolved during implementation is reflected back into the PRD/test spec before Ralph claims completion.
- The team can keep a visible running app/progress surface open during execution to observe the latest working state continuously.

## Risks and Mitigations

### Risk 1: Browser speech instability

Mitigation:
- Burn this risk in Step 1 before broad UI work
- Keep explicit fallback controls in voice mode: retry, switch to touch, switch to GenUI

### Risk 2: MediaPipe calibration drift or noisy triggering

Mitigation:
- Expose tuning parameters in debug mode
- Validate repeatable trigger scenarios before polishing UI breadth

### Risk 3: Help UX becomes intrusive or confusing

Mitigation:
- Keep human-in-the-loop transitions mandatory
- Use escalation in wording only; do not auto-switch
- Retain a small re-entry help control after a rejection instead of spamming modal prompts

### Risk 4: Debug surfaces contaminate the product feel

Mitigation:
- Keep the debug toggle tiny and persistent
- Keep diagnostics panel fully collapsed in `debug off`
- Treat the debug panel as an overlay, not a co-equal permanent pane

## Verification Steps

1. Run typecheck/build checks after scaffold and after each major lane.
2. Verify Speech API behavior manually on MacBook Chrome fullscreen landscape before broad implementation.
3. Verify MediaPipe threshold crossing and help-offer cadence manually with debug enabled.
4. Run end-to-end checks for both main demo tracks before marking the app Ralph-ready.
5. Confirm `debug off` screenshots/readouts look like a normal kiosk and `debug on` readouts are judge-friendly.

## ADR

### Decision

Adopt a **risk-first dual-track MVP** plan that hardens speech and sensing early, then builds the GenUI-led and voice-enabled accessibility paths on top of a minimal normal kiosk baseline.

### Drivers

- The user explicitly prioritized GenUI, difficulty detection, and voice mode.
- The core repo currently holds only planning artifacts, not implementation.
- The biggest demo risks are technical runtime issues, not lack of broad feature ambition.

### Alternatives considered

- Full-spec breadth-first build from `prompts/SPEC.md`
- Voice-first demo with GenUI secondary

### Why chosen

This option preserves the agreed differentiators, minimizes early rework, and gives Ralph a bounded sequence with clear go/no-go checkpoints.

### Consequences

- General-mode polish is intentionally later than core AI/sensing work.
- Some broad draft-spec breadth may be deferred until the two adaptive tracks are stable.
- The team must stay disciplined about the priority order.

### Follow-ups

- Keep the companion test spec synchronized as implementation resolves ambiguity
- Use this PRD plus the deep-interview spec as the Ralph execution source of truth

## Available Agent Types Roster

- `planner`
- `architect`
- `critic`
- `designer`
- `executor`
- `debugger`
- `test-engineer`
- `verifier`
- `writer`
- `code-reviewer`

## Staffing Guidance

### Ralph path

- `executor` — `high`: owns main implementation lane
- `debugger` — `high`: owns speech/runtime/MediaPipe failures as they appear
- `test-engineer` — `medium`: keeps demo-track verification current
- `verifier` — `high`: confirms each track before completion claims
- `designer` — `medium`: consulted when help-offer/debug split decisions create UX ambiguity

### Team path

- Lane 1: `executor` — scaffold + normal-mode baseline
- Lane 2: `debugger` — speech and MediaPipe validation/hardening
- Lane 3: `designer` — help-offer UX, debug on/off, presentation layout
- Lane 4: `test-engineer` — demo-track tests and manual verification scripts
- Final gate: `verifier`

## Team Verification Path

1. Team lanes prove their local acceptance criteria.
2. `test-engineer` runs the integrated track checks.
3. `verifier` confirms both Track A and Track B against the acceptance criteria.
4. Only after verification passes should the team hand back to Ralph/final delivery.

## Launch Hints

### Ralph

Use this PRD plus the test spec and deep-interview spec as context for sequential execution.

Suggested kickoff:

```bash
$ralph ".omx/plans/prd-2026-03-29-hackathon-kiosk-ralph.md"
```

Execution context to preserve:
- `.omx/plans/test-spec-2026-03-29-hackathon-kiosk-ralph.md`
- `.omx/specs/deep-interview-ralph-loop-kiosk.md`

### Team

Use this PRD to split lanes by write scope:
- foundation shell
- sensing/speech risk lane
- adaptive UI lane
- verification lane

Suggested kickoff:

```bash
$team ".omx/plans/prd-2026-03-29-hackathon-kiosk-ralph.md"
```

## Changelog

- Grounded the plan in the deep-interview artifacts and existing draft specs.
- Front-loaded risk burn for speech and MediaPipe instead of breadth-first implementation.
- Preserved human-in-the-loop behavior as a non-negotiable rule.
