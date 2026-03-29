import { create } from "zustand";
import { formatOrderNumber } from "@/lib/utils";
import type {
  AccessibilityMode,
  BFStep,
  CartItem,
  DiagnosticsState,
  DifficultySignalBreakdown,
  KioskStep,
  LLMLogEntry,
  MenuCategory,
  MenuItem,
  ProgressCheckpoint,
  SessionEvent,
  VoiceTurn,
} from "@/types";

const emptySignals: DifficultySignalBreakdown = {
  faceScore: 0,
  poseScore: 0,
  handScore: 0,
  timeScore: 0,
  gazeScore: 0,
  totalScore: 0,
  source: "fallback",
};

const defaultDiagnostics: DiagnosticsState = {
  ...emptySignals,
  threshold: 70,
  sensitivity: 5,
  activeMode: "normal",
  cameraReady: false,
  message: "Detector warming up",
};

const defaultProgress: ProgressCheckpoint = {
  phase: "checkpoint",
  label: "Core kiosk flow stable",
  lastUpdated: new Date().toISOString(),
  stability: "stable",
};

const createEvent = (label: string, detail: string): SessionEvent => ({
  id: crypto.randomUUID(),
  ts: new Date().toISOString(),
  label,
  detail,
});

interface Store {
  isIdle: boolean;
  step: KioskStep;
  orderType: "dine-in" | "takeout" | null;
  items: CartItem[];
  difficultyScore: number;
  difficultySignals: DifficultySignalBreakdown;
  diagnostics: DiagnosticsState;
  showHelpOffer: boolean;
  helpCooldownUntil: number;
  accessibilityMode: AccessibilityMode;
  bfStep: BFStep;
  bfSelectedCategory: MenuCategory | null;
  bfSelectedItem: MenuItem | null;
  debugEnabled: boolean;
  llmLogs: LLMLogEntry[];
  liveProgress: ProgressCheckpoint;
  presenterNote: string;
  sessionEvents: SessionEvent[];
  voiceTranscript: VoiceTurn[];
  lastOrderNumber: string | null;
  detectorStatus: string;
  voiceReady: boolean;
  setIdle(v: boolean): void;
  setStep(step: KioskStep): void;
  setOrderType(type: "dine-in" | "takeout"): void;
  addItem(item: MenuItem, categoryName: string, quantity?: number): void;
  totalCount(): number;
  setDifficultyReading(signals: DifficultySignalBreakdown): void;
  setDifficultyScore(score: number): void;
  setDetectionConfig(
    config: Partial<Pick<DiagnosticsState, "threshold" | "sensitivity">>,
  ): void;
  setShowHelpOffer(v: boolean): void;
  rejectHelpOffer(): void;
  acceptHelpMode(mode: Exclude<AccessibilityMode, "none">): void;
  resetBF(): void;
  setVoiceReady(ready: boolean): void;
  toggleDebug(): void;
  addLLMLog(entry: Omit<LLMLogEntry, "id" | "ts">): void;
  clearLLMLogs(): void;
  addVoiceTurn(turn: Omit<VoiceTurn, "ts">): void;
  setLiveProgress(progress: Partial<ProgressCheckpoint>): void;
  completeOrder(orderNumber?: string): void;
  resetSession(): void;
  restart(): void;
  setDetectorStatus(status: string): void;
}

export const useKioskStore = create<Store>((set, get) => ({
  isIdle: false,
  step: "order-type",
  orderType: null,
  items: [],
  difficultyScore: 0,
  difficultySignals: emptySignals,
  diagnostics: defaultDiagnostics,
  showHelpOffer: false,
  helpCooldownUntil: 0,
  accessibilityMode: "none",
  bfStep: "order-type",
  bfSelectedCategory: null,
  bfSelectedItem: null,
  debugEnabled: false,
  llmLogs: [],
  liveProgress: defaultProgress,
  presenterNote:
    "debug off는 제품 흐름을 유지하고 debug on은 내부 정보만 보여줍니다.",
  sessionEvents: [createEvent("checkpoint", "Fresh session ready")],
  voiceTranscript: [],
  lastOrderNumber: null,
  detectorStatus: "Booting detector…",
  voiceReady: false,
  setIdle: (isIdle) => set({ isIdle }),
  setStep: (step) => set({ step, isIdle: false }),
  setOrderType: (orderType) =>
    set((state) => ({
      orderType,
      step: "menu",
      isIdle: false,
      liveProgress: {
        ...state.liveProgress,
        phase: "order-type",
        label: orderType === "takeout" ? "포장 주문 시작" : "매장 주문 시작",
        lastUpdated: new Date().toISOString(),
        stability: "stable",
      },
      sessionEvents: [
        createEvent(
          "order-type",
          orderType === "takeout"
            ? "Takeout order selected"
            : "Dine-in order selected",
        ),
        ...state.sessionEvents,
      ].slice(0, 20),
    })),
  addItem: (menuItem, categoryName, quantity = 1) =>
    set((state) => {
      const existing = state.items.find(
        (item) => item.menuItem.id === menuItem.id,
      );
      const items = existing
        ? state.items.map((item) =>
            item.menuItem.id === menuItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...state.items, { menuItem, quantity, categoryName }];

      return {
        items,
        liveProgress: {
          ...state.liveProgress,
          phase: "cart",
          label: `${menuItem.korName} ${quantity}개 추가`,
          lastUpdated: new Date().toISOString(),
          stability: "stable",
        },
        sessionEvents: [
          createEvent("cart", `${menuItem.korName} ${quantity}개 added`),
          ...state.sessionEvents,
        ].slice(0, 20),
      };
    }),
  totalCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
  setDifficultyReading: (signals) =>
    set((state) => {
      const threshold = state.diagnostics.threshold;
      const allowHelp = Date.now() >= state.helpCooldownUntil;
      const shouldShow =
        state.accessibilityMode === "none" &&
        allowHelp &&
        signals.totalScore >= threshold;
      const shouldHide = signals.totalScore < threshold * 0.6;

      return {
        difficultyScore: signals.totalScore,
        difficultySignals: signals,
        diagnostics: {
          ...state.diagnostics,
          ...signals,
          activeMode: state.accessibilityMode,
          cameraReady: signals.source === "mediapipe",
          message: `${signals.source} detector active`,
        },
        showHelpOffer: shouldShow ? true : shouldHide ? false : state.showHelpOffer,
        sessionEvents:
          shouldShow && !state.showHelpOffer
            ? [
                createEvent(
                  "help",
                  "Difficulty threshold crossed — help offer shown",
                ),
                ...state.sessionEvents,
              ].slice(0, 20)
            : state.sessionEvents,
      };
    }),
  setDifficultyScore: (score) =>
    set((state) => ({
      difficultyScore: score,
      difficultySignals: {
        ...state.difficultySignals,
        totalScore: score,
        source: "manual",
      },
      diagnostics: {
        ...state.diagnostics,
        totalScore: score,
        message: "Manual override",
      },
      showHelpOffer:
        state.accessibilityMode === "none" &&
        Date.now() >= state.helpCooldownUntil &&
        score >= state.diagnostics.threshold,
    })),
  setDetectionConfig: (config) =>
    set((state) => ({
      diagnostics: {
        ...state.diagnostics,
        ...config,
        message: `Calibration updated (threshold ${config.threshold ?? state.diagnostics.threshold}, sensitivity ${config.sensitivity ?? state.diagnostics.sensitivity})`,
      },
      sessionEvents: [
        createEvent(
          "calibration",
          `threshold ${config.threshold ?? state.diagnostics.threshold} / sensitivity ${config.sensitivity ?? state.diagnostics.sensitivity}`,
        ),
        ...state.sessionEvents,
      ].slice(0, 20),
    })),
  setShowHelpOffer: (showHelpOffer) => set({ showHelpOffer }),
  rejectHelpOffer: () =>
    set((state) => ({
      showHelpOffer: false,
      helpCooldownUntil: Date.now() + 15000,
      sessionEvents: [
        createEvent("help", "User dismissed help offer"),
        ...state.sessionEvents,
      ].slice(0, 20),
    })),
  acceptHelpMode: (mode) =>
    set((state) => ({
      showHelpOffer: false,
      accessibilityMode: mode,
      voiceReady: mode === "voice" ? state.voiceReady : false,
      sessionEvents: [
        createEvent("help", `${mode} mode accepted`),
        ...state.sessionEvents,
      ].slice(0, 20),
      liveProgress: {
        phase: mode,
        label:
          mode === "voice"
            ? "Voice helper path active"
            : "Generative large-UI path active",
        lastUpdated: new Date().toISOString(),
        stability: "stable",
      },
    })),
  resetBF: () =>
    set({
      accessibilityMode: "none",
      bfStep: "order-type",
      bfSelectedCategory: null,
      bfSelectedItem: null,
      voiceReady: false,
    }),
  setVoiceReady: (voiceReady) => set({ voiceReady }),
  toggleDebug: () =>
    set((state) => ({
      debugEnabled: !state.debugEnabled,
    })),
  addLLMLog: (entry) =>
    set((state) => ({
      llmLogs: [
        {
          ...entry,
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          summary: entry.summary ?? entry.response.slice(0, 60),
        },
        ...state.llmLogs,
      ].slice(0, 12),
    })),
  clearLLMLogs: () => set({ llmLogs: [] }),
  addVoiceTurn: (turn) =>
    set((state) => ({
      voiceTranscript: [
        ...state.voiceTranscript,
        { ...turn, ts: new Date().toISOString() },
      ].slice(-12),
    })),
  setLiveProgress: (progress) =>
    set((state) => ({
      liveProgress: {
        ...state.liveProgress,
        ...progress,
        lastUpdated: new Date().toISOString(),
      },
    })),
  completeOrder: (orderNumber) =>
    set((state) => ({
      step: "complete",
      bfStep: "complete",
      lastOrderNumber: orderNumber ?? formatOrderNumber(),
      liveProgress: {
        phase: "order-complete",
        label: "Mock payment complete — session ready to replay",
        lastUpdated: new Date().toISOString(),
        stability: "stable",
      },
      sessionEvents: [
        createEvent("order", "Mock payment completed"),
        ...state.sessionEvents,
      ].slice(0, 20),
    })),
  resetSession: () =>
    set({
      isIdle: false,
      step: "order-type",
      orderType: null,
      items: [],
      difficultyScore: 0,
      difficultySignals: emptySignals,
      diagnostics: defaultDiagnostics,
      showHelpOffer: false,
      helpCooldownUntil: 0,
      accessibilityMode: "none",
      bfStep: "order-type",
      bfSelectedCategory: null,
      bfSelectedItem: null,
      voiceTranscript: [],
      lastOrderNumber: null,
      voiceReady: false,
      liveProgress: {
        phase: "checkpoint",
        label: "Fresh session ready — demo path preserved",
        lastUpdated: new Date().toISOString(),
        stability: "stable",
      },
    }),
  restart: () => get().resetSession(),
  setDetectorStatus: (detectorStatus) => set({ detectorStatus }),
}));
