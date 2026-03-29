import { NextRequest, NextResponse } from "next/server";
import type { AdaptiveUIResponse, BFStep } from "@/types";
import { getCategories } from "@/lib/menu";
import { buildGenUIPrompt } from "@/lib/ai/prompts";
import { generateAdaptiveUI } from "@/lib/ai/client";
import { buildFallbackGenUIResponse } from "@/lib/fallbacks";

export async function POST(request: NextRequest) {
  const body = ((await request
    .json()
    .catch(() => ({}))) ?? {}) as {
    difficultyScore: number;
    step: BFStep;
    context?: {
      category?: string;
      categorySeq?: number | null;
      orderType?: "dine-in" | "takeout" | null;
      cartSummary?: string[];
    };
  };

  const fallback = buildFallbackGenUIResponse({
    difficultyScore: body.difficultyScore ?? 72,
    step: body.step ?? "items",
    categorySeq: body.context?.categorySeq ?? null,
    orderType: body.context?.orderType ?? null,
    cartSummary: body.context?.cartSummary,
  });

  const prompt = buildGenUIPrompt({
    difficultyScore: body.difficultyScore ?? 72,
    step: body.step ?? "items",
    orderType: null,
    summary: body.context?.category ?? "사용자가 쉬운 단계 안내를 원하고 있습니다.",
    categories: getCategories().map((category) => category.korName),
    items: fallback.cards.map((card) => card.title),
    cartSummary: body.context?.cartSummary,
  });

  const generated = await generateAdaptiveUI(prompt, fallback);

  return NextResponse.json({
    ...generated.object,
    meta: {
      provider: generated.provider,
      status: generated.status,
      rawText: generated.rawText,
      prompt,
    },
  });
}
