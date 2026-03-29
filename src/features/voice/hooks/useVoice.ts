"use client";
import { useCallback, useMemo, useState } from "react";
import { useKioskStore } from "@/store/kiosk";

type SpeechWindow = Window & {
  speechSynthesis?: SpeechSynthesis;
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
};

export function useVoice() {
  const addVoiceTurn = useKioskStore((state) => state.addVoiceTurn);
  const addLLMLog = useKioskStore((state) => state.addLLMLog);
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      addVoiceTurn({ role: "assistant", text });
      addLLMLog({
        type: "voice",
        prompt: "tts",
        response: text,
        summary: text.slice(0, 60),
      });

      const speechWindow = window as SpeechWindow;
      const SynthUtterance = speechWindow.SpeechSynthesisUtterance;
      const synth = speechWindow.speechSynthesis;

      if (!SynthUtterance || !synth) {
        setSpeaking(false);
        onEnd?.();
        return;
      }

      const utterance = new SynthUtterance(text);
      utterance.lang = "ko-KR";
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onEnd?.();
      };

      synth.cancel();
      synth.speak(utterance);
    },
    [addLLMLog, addVoiceTurn],
  );

  return useMemo(() => ({ speak, speaking }), [speak, speaking]);
}
