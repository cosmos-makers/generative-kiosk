import { NextRequest, NextResponse } from "next/server";
import type { BFStep, KioskStep, VoiceOrderAction } from "@/types";
import { buildVoicePrompt } from "@/lib/ai/prompts";
import { generateVoiceAction } from "@/lib/ai/client";
import { getCategories, getDisplayName, findItemById } from "@/lib/menu";
import { buildFallbackVoiceAction } from "@/lib/fallbacks";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    transcript: string;
    difficultyScore: number;
    currentStep: BFStep | KioskStep;
    cartItems?: Array<{ id: number; quantity: number }>;
  };

  const fallback = buildFallbackVoiceAction(body);
  const prompt = buildVoicePrompt({
    transcript: body.transcript,
    difficultyScore: body.difficultyScore,
    currentStep: body.currentStep,
    categories: getCategories().map((category) => category.korName),
    items: getCategories()
      .flatMap((category) => category.items.slice(0, 2))
      .map((item) => getDisplayName(item)),
    cartSummary: body.cartItems?.map((item) => {
      const resolved = findItemById(item.id);
      return resolved
        ? `${getDisplayName(resolved)} x${item.quantity}`
        : `${item.id} x${item.quantity}`;
    }),
  });

  const generated = await generateVoiceAction(prompt, fallback);
  const targetItem = findItemById(generated.object.targetItemId);

  return NextResponse.json({
    ...generated.object,
    meta: {
      provider: generated.provider,
      status: generated.status,
      rawText: generated.rawText,
      prompt,
      resolvedItemName: targetItem ? getDisplayName(targetItem) : null,
    },
  });
}
