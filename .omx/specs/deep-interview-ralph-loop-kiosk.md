# Deep Interview Spec: Hackathon Kiosk Ralph Intake

## Metadata

- Profile: `standard`
- Rounds completed: `8+`
- Final ambiguity: `0.06`
- Threshold: `0.20`
- Context type: `greenfield with draft specs`
- Context snapshot: `.omx/context/deep-interview-ralph-loop-kiosk-20260329T020753Z.md`
- Transcript summary: `.omx/interviews/ralph-loop-kiosk-20260329T022529Z.md`

## Clarity breakdown

| Dimension | Score | Note |
| --- | --- | --- |
| Intent | 0.98 | Clear hackathon goal: build a winning AI-native barrier-free kiosk demo. |
| Outcome | 0.92 | Clear enough for execution: a working demo with real AI and real sensing in the critical path. |
| Scope | 0.88 | Priorities are clear even if not every edge detail is frozen. |
| Constraints | 0.95 | Strong constraints around real-vs-mock, human approval, device/browser, and presentation mode. |
| Success criteria | 0.90 | Main demo tracks and demo environment are sufficiently specified. |

## Intent

Build a hackathon-winning AI-native kiosk that does not merely expose an accessibility mode, but proactively detects difficulty, asks permission to help, and then genuinely adapts the interface through real LLM-powered Generative UI and real voice interaction.

The product should feel like a normal kiosk in user-facing mode while still supporting a compelling technical demo mode for judges and development.

## Desired outcome

Deliver a robust demo on MacBook Chrome fullscreen landscape that can also be shown in recordings and presentation screens. The demo must prove:

1. Real difficulty detection with MediaPipe
2. Real LLM-backed Generative UI
3. Real voice mode
4. Human-in-the-loop accessibility transitions
5. Clean separation between normal kiosk mode and debug/demo mode

## In scope

- Normal kiosk entry flow
- Real-time difficulty detection using MediaPipe
- Help-offer UX triggered by detected difficulty
- Human-approved transition into accessibility help
- GenUI-first accessibility track
- Voice mode as a critical second track
- Mock order submission / mock payment completion
- Debug on/off split
- Landscape-first responsive web layout
- Continuous doc updates as ambiguity is resolved during the build

## Out of scope / non-goals

- Real payment integration
- Automatic mode switching without user approval
- iPad portrait as the primary target surface
- Debug-only technical surfaces leaking into `debug off`
- Relying on pattern matching for natural-language intent resolution

## Decision boundaries

OMX may decide without confirmation:

- Internal implementation sequencing
- Subagent delegation strategy
- Exact UI composition details, so long as they preserve the agreed product behavior
- Which fallback behaviors are acceptable outside the core “must be real” requirements
- Responsive layout details for presentation and recording contexts

OMX must not decide unilaterally:

- Switching the user into a new help mode without explicit approval
- Replacing real LLM handling or real GenUI with a fake stand-in
- Replacing real MediaPipe detection with fake scoring in the main hackathon path
- Turning `debug off` into a visibly technical demo surface

## Constraints

- LLM processing must be real
- Generative UI must be real
- Difficulty detection must be real and based on calibrated MediaPipe behavior
- Voice mode is important and must work, not exist as a stub
- Payment is mock-only
- Demo target is MacBook Chrome fullscreen landscape
- Layout must still adapt to recording and presentation screens
- `debug off` must resemble a normal kiosk
- `debug on` may expose internals for explanation and judging
- All natural-language interpretation should be handled by the LLM, not keyword matching

## Priority order

1. Real GenUI
2. Real difficulty detection
3. Real voice mode
4. Human-in-the-loop help UX
5. Debug on/off separation
6. Landscape-first responsive presentation quality
7. General mode polish

## Main demo tracks

### Track A: General autonomous ordering centered on GenUI

Normal kiosk flow begins in a standard kiosk-looking interface. When difficulty is detected and the user accepts help, the system transitions into a GenUI-led adaptive ordering experience where the interface is genuinely regenerated for the user’s needs.

### Track B: Difficulty-detected help path with voice mode

When difficulty detection activates and the user opts into help, voice mode must also function as a serious path, not a decorative extra. It should support the accessibility story as a real second pillar alongside GenUI.

## Help-offer UX policy

- The system may detect difficulty automatically.
- The system may offer help proactively.
- The system must never change the help mode on its own.
- Repeated detections may strengthen the wording or visibility of the suggestion.
- Repeated detections must not cause silent automatic mode changes.
- In `debug off`, the help UX should still feel like part of a normal kiosk.

## Debug mode policy

### Debug off

- Looks like a standard kiosk
- No exposed difficulty scores
- No LLM prompt/response raw traces
- No visible internal state tables
- No visible MediaPipe debug visualization by default

### Debug on

- May expose difficulty scoring
- May expose inference/logging traces
- May expose PIM/GenUI generation context
- May expose sensor/developer diagnostics useful for judging and development

## Testable acceptance criteria

- The main hackathon path uses real LLM calls for GenUI
- The main hackathon path uses real MediaPipe-based difficulty detection
- Voice mode works end-to-end on the demo environment
- Accessibility transitions require explicit user approval
- Payment completion is clearly mocked but functionally coherent
- `debug off` presents as a normal kiosk
- `debug on` can explain how the system is deciding and adapting
- The system works on MacBook Chrome fullscreen landscape
- The UI remains usable for video/demo capture and large display presentation

## Assumptions exposed and resolved

- Assumption: everything in the spec must be equally polished to win the hackathon
  - Resolution: priorities matter; GenUI, difficulty detection, and voice mode are the pillars
- Assumption: repeated difficulty should automatically force easier modes
  - Resolution: rejected; accessibility changes remain human-in-the-loop
- Assumption: portrait tablet delivery is still primary
  - Resolution: rejected; landscape web delivery is the reliable demo target
- Assumption: recommendation/complaint intents require fully separate bespoke flows first
  - Resolution: first version routes those moments into the help-offer system rather than exploding feature scope

## Brownfield evidence vs inference

- Evidence: `prompts/SPEC.md` already defines detailed user stories and architecture
- Evidence: `difficulty-detector.md` defines a separate sub-spec for the sensing system
- Evidence: implementation files described in the spec are not present yet in the repo
- Inference: Ralph should not start execution directly from the raw draft spec without a plan artifact because the repo’s AGENTS contract already expects plan/test-spec style execution gates

## Technical context findings

- Existing repo already has an AGENTS contract; a new top-level AGENTS file is not required before planning
- Existing Codex role prompts are available for `planner`, `executor`, `debugger`, `designer`, `test-engineer`, and `verifier`
- The current need is not more orchestration surface, but a cleaner handoff artifact and a recommended execution lane

## Recommended subagent composition

- `planner`: convert this clarified brief into canonical PRD + test spec artifacts
- `designer`: refine help-offer UX, debug on/off surface split, and landscape-first responsive layout decisions
- `executor`: implement the core app and integrations
- `debugger`: own MediaPipe/speech/runtime reliability issues
- `test-engineer`: define verification around the two main demo tracks
- `verifier`: confirm the main demo tracks satisfy the clarified success criteria

## Recommended execution bridge

### Recommended path

`$ralplan` first, then `$ralph`

Reason:

- The repo contract explicitly prefers plan artifacts before persistent execution loops.
- This spec is now clear enough to drive planning without reopening discovery.
- The project still needs canonical `prd-*.md` and `test-spec-*.md` artifacts before a disciplined Ralph loop should begin.

### Invocation contract

- Input artifact: `.omx/specs/deep-interview-ralph-loop-kiosk.md`
- Next action: create plan artifacts under `.omx/plans/`
- After planning artifacts exist: start the Ralph loop against those artifacts, preserving this spec as the requirements source of truth
