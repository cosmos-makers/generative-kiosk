Task statement

Start a deep interview that reads the draft `prompts/SPEC.md` and `difficulty-detector.md` closely, clarifies them sentence by sentence where needed, and prepares the project to start a disciplined Ralph loop for a hackathon build.

Desired outcome

Produce an execution-ready requirements artifact that removes ambiguity around what must be built, what may be simulated, how Ralph should sequence work, which subagents should be used, and which supporting repo artifacts are still needed.

Stated solution

Use the `deep-interview` workflow first, then hand off into the Ralph pipeline with the right supporting specs, plans, and agent structure.

Probable intent hypothesis

The user wants to avoid a vague or overambitious hackathon build. They want a requirements source of truth that is strict enough for autonomous execution and subagent delegation, while still being realistic for demo constraints and time pressure.

Known facts / evidence

- `prompts/SPEC.md` defines a full product spec with 14 user stories, acceptance criteria, verification steps, and Ralph sequencing guidance.
- `difficulty-detector.md` defines a standalone sub-spec for the difficulty scoring module.
- The repository currently contains draft specs and menu data, but not the implementation tree described in `prompts/SPEC.md`.
- The spec states that debug mode must use real data, not fake data.
- The spec also allows a simulation fallback in `DifficultyDetector` when no API endpoint is provided or camera permission is denied.
- The spec states LLM and agent decisions must be natural-language based with no pattern matching.
- The HelpOfferDialog draft includes examples that look like explicit phrase matching for spoken acceptance.
- The difficulty trigger logic is inconsistent across drafts: configurable threshold language appears alongside a fixed `difficultyScore >= 70` help trigger.

Constraints

- Hackathon scope and time pressure matter.
- The build is intended to be AI-native and demoable.
- Korean-only UI is required by the draft spec.
- Claude CLI headless mode is preferred for AI calls, with fallback behavior documented.
- Deep-interview mode must not implement directly; it should clarify requirements and produce handoff artifacts.

Unknowns / open questions

- What "complete for the hackathon" means operationally: full spec, demo-critical subset, or staged completeness.
- Which parts must be genuinely live in the demo and which may be simulated without violating the team's claim.
- Whether the repository should treat `prompts/SPEC.md` as canonical, or split it into PRD, test spec, execution plan, and child-agent guidance artifacts.
- Whether the user wants Ralph as the main executor, or wants a ralplan-first pipeline with Ralph after planning artifacts exist.
- Which subagents should be formalized now versus chosen dynamically later.

Decision-boundary unknowns

- What OMX may decide autonomously about architecture, sequencing, and agent delegation.
- Which deviations from the draft spec require explicit user confirmation.
- Whether simulation fallbacks are acceptable in production demo paths.

Likely codebase touchpoints

- `prompts/SPEC.md`
- `difficulty-detector.md`
- `.omx/plans/`
- `.omx/specs/`
- `AGENTS.md`
- `prompts/`

Interview updates

- User clarified that LLM-backed processing and Generative UI must be genuinely live in the hackathon demo.
- Everything else may be decided during the build, provided the result works reliably in the demo.
- The user's north star is to resolve ambiguity during the build while continuously updating docs rather than freezing every detail upfront.
- Debug mode on/off must change the experience and exposed information.
- MediaPipe-based difficulty detection is intended to be real, not simulated, assuming calibration is tuned adequately.
- The representative accessibility flow should center GenUI first, while voice mode remains important and must also work well.
- Payment integration is explicitly mock-only for the hackathon.
- The top-priority required pillars are: Generative UI, difficulty detection, and voice mode.
- User prefers priority framing over explicit non-goal framing because all major areas feel necessary for a winning hackathon build.
- Interview should now optimize for execution ordering and demo survivability rather than forcing hard exclusions prematurely.
- Natural-language handling must go beyond narrow order commands: recommendation requests, complaints, and other open-ended utterances should be handled by the LLM.
- Pattern matching remains explicitly disallowed; these cases must be resolved through genuine natural-language interpretation.
- User clarified a pragmatic first version boundary: recommendation/confusion/complaint moments are primarily deflected into the "도움을 드릴까요?" help-offer flow via the difficulty-detection module, rather than each becoming a separate bespoke conversational capability first.
- Accessibility changes must remain human-in-the-loop; the system may detect and suggest, but must not switch modes on its own.
- The device/layout direction has shifted from iPad portrait toward web landscape optimization because browser speech constraints make the latter more reliable for the demo.
- Canonical demo environment: MacBook Chrome in fullscreen landscape.
- The product still needs responsive behavior suitable for demo video capture and large presentation displays, not only a single fixed viewport.
- In `debug off`, the product should look like a normal kiosk experience rather than a technical demo or AI control panel.
- Debug mode on/off must materially change what is exposed to the viewer.
- The primary demo lane is GenUI first.
- MediaPipe-based real sensor processing is intended to be real, not mocked, assuming calibration is tuned well enough.
