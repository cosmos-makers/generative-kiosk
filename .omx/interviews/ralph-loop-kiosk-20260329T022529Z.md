# Deep Interview Transcript Summary

- Interview id: `deep-interview-ralph-loop-kiosk-20260329T020753Z`
- Profile: `standard`
- Context type: `greenfield with draft specs`
- Final ambiguity: `0.06`
- Threshold: `0.20`

## Condensed transcript

1. The user asked for a deep interview to prepare a Ralph loop around `prompts/SPEC.md` and `difficulty-detector.md`, plus any necessary subagent and AGENTS support for a hackathon build.
2. The first pressure question focused on what must be real in the demo versus what can be simulated.
3. The user clarified that LLM-backed processing and Generative UI must be genuinely live.
4. The user set a north star: ambiguity should be resolved during the build, with docs updated continuously.
5. The interview reframed from explicit non-goals toward priority ordering because the user wants a winning build and sees most major areas as necessary.
6. The user clarified that recommendation-like utterances and complaint/confusion moments are still natural-language phenomena, but the first product response should be the help-offer flow rather than many bespoke conversational branches.
7. UX pressure testing showed that repeated difficulty detections should not silently auto-switch the interface.
8. The user explicitly required human-in-the-loop behavior: the system may detect and suggest, but it must not change modes on its own.
9. The delivery surface shifted from iPad portrait toward web landscape because browser speech issues make landscape web delivery more reliable.
10. The demo environment was fixed to MacBook Chrome fullscreen landscape, with responsive behavior still required for recording and presentation displays.
11. The user clarified that `debug off` should look like a normal kiosk, not a technical demo.
12. The main demo path was fixed as two linked tracks: the general autonomous ordering track centered on GenUI, and the track that emerges when difficulty detection is applied, including voice mode.

## Pressure-pass note

The key pressure pass revisited the earlier suggestion of automatic escalation after repeated difficulty detections. That idea was rejected because it violated the product principle that accessibility changes must remain human-in-the-loop. This materially changed the requirements.
