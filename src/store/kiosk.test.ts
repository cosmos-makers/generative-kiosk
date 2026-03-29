import { beforeEach, describe, expect, it } from "vitest";
import { useKioskStore } from "@/store/kiosk";
import type { MenuItem } from "@/types";

beforeEach(() => {
  useKioskStore.getState().restart();
});

const menuItem: MenuItem = {
  id: 999,
  korName: "테스트 메뉴",
  engName: "Test Item",
  description: "desc",
  calorie: "500",
  imageUrl: "https://example.com/item.png",
};

describe("kiosk store", () => {
  it("shows help offer when score crosses threshold in normal mode", () => {
    useKioskStore.getState().setDifficultyScore(75);
    expect(useKioskStore.getState().showHelpOffer).toBe(true);
  });

  it("applies cooldown after rejecting help offer", () => {
    useKioskStore.getState().setDifficultyScore(75);
    useKioskStore.getState().rejectHelpOffer();
    useKioskStore.getState().setDifficultyReading({
      faceScore: 0.8,
      poseScore: 0.8,
      handScore: 0.8,
      timeScore: 0.8,
      gazeScore: 0.8,
      totalScore: 80,
      source: "simulated",
    });

    expect(useKioskStore.getState().showHelpOffer).toBe(false);
  });

  it("updates calibration config used by detector heuristics", () => {
    useKioskStore.getState().setDetectionConfig({ threshold: 82, sensitivity: 7 });

    expect(useKioskStore.getState().diagnostics.threshold).toBe(82);
    expect(useKioskStore.getState().diagnostics.sensitivity).toBe(7);
  });

  it("tracks order type selection in progress state", () => {
    useKioskStore.getState().setOrderType("takeout");

    expect(useKioskStore.getState().liveProgress.label).toContain("포장");
  });

  it("records voice transcript entries", () => {
    useKioskStore.getState().addVoiceTurn({ role: "user", text: "빅맥 세트 담아줘" });

    expect(useKioskStore.getState().voiceTranscript.at(-1)?.text).toBe(
      "빅맥 세트 담아줘",
    );
  });

  it("resets voice readiness when the session resets", () => {
    useKioskStore.getState().setVoiceReady(true);
    useKioskStore.getState().resetSession();

    expect(useKioskStore.getState().voiceReady).toBe(false);
  });

  it("accumulates quantity when the same menu is added twice", () => {
    useKioskStore.getState().addItem(menuItem, "버거", 2);
    useKioskStore.getState().addItem(menuItem, "버거", 1);

    expect(useKioskStore.getState().items[0]?.quantity).toBe(3);
  });

  it("completes the mock order", () => {
    useKioskStore.getState().completeOrder();

    expect(useKioskStore.getState().lastOrderNumber).toMatch(/^A-/);
  });
});
