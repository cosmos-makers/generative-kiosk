export type KioskStep = "order-type" | "menu" | "checkout" | "complete";
export type AccessibilityMode = "none" | "large-ui" | "voice";
export type BFStep = "order-type" | "category" | "items" | "item-detail" | "cart-review" | "checkout" | "complete";

export interface MenuItem { id: number; korName: string; engName: string; description: string; calorie: string; imageUrl: string; menuStatus?: string; newIcon?: string; }
export interface MenuCategory { seq: number; korName: string; engName: string; items: MenuItem[]; }
export interface MenuData { categories: MenuCategory[]; }
export interface CartItem { menuItem: MenuItem; quantity: number; categoryName: string; }
export interface DifficultySignalBreakdown { faceScore: number; poseScore: number; handScore: number; timeScore: number; gazeScore: number; totalScore: number; source: "simulated" | "mediapipe" | "fallback" | "manual"; }
export interface DiagnosticsState extends DifficultySignalBreakdown { threshold: number; sensitivity: number; activeMode: string; cameraReady: boolean; message: string; }
export interface SessionEvent { id: string; ts: string; label: string; detail: string; }
export interface ProgressCheckpoint { phase: string; label: string; lastUpdated: string; stability: "stable" | "watching" | "recovering"; }
export interface LLMLogEntry { id: string; ts: string; type: "gen-ui" | "voice" | "system"; prompt: string; response: string; summary?: string; }
export interface AdaptiveCard {
  id: string;
  title: string;
  subtitle: string;
  helper: string;
  emphasis?: "primary" | "secondary" | "neutral";
  itemId?: number;
  categorySeq?: number;
  actionLabel?: string;
}
export interface AdaptiveUIResponse { title: string; description: string; fontScale: "lg" | "xl" | "2xl"; maxOptions: number; cards: AdaptiveCard[]; ctaLabel: string; narration: string; meta?: { provider?: string; status?: string; rawText?: string; prompt?: string; }; }
export interface VoiceOrderAction { reply: string; nextStep: BFStep | KioskStep; action: "ask-order-type" | "recommend" | "add-item" | "go-cart" | "checkout" | "fallback"; targetItemId?: number; targetCategorySeq?: number; quantity?: number; orderType?: OrderType; meta?: { provider?: string; status?: string; rawText?: string; prompt?: string; }; }
export interface VoiceTurn { role: "assistant" | "user"; text: string; ts: string; }

export type OrderType = "dine-in" | "takeout";
