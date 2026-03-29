import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AdaptiveUIResponse, VoiceOrderAction } from "@/types";

const execFileAsync = promisify(execFile);
const PROVIDER_TIMEOUT_MS = 2500;
const adaptiveSchema = z.object({ title:z.string(), description:z.string(), fontScale:z.enum(["lg","xl","2xl"]), maxOptions:z.number().int().min(1).max(6), cards:z.array(z.object({ id:z.string(), title:z.string(), subtitle:z.string(), helper:z.string(), emphasis:z.enum(["primary","secondary","neutral"]).optional(), itemId:z.number().optional(), categorySeq:z.number().optional(), actionLabel:z.string().optional() })), ctaLabel:z.string(), narration:z.string() });
const voiceSchema = z.object({ reply:z.string(), nextStep:z.enum(["order-type","menu","checkout","category","items","item-detail","cart-review","complete"]), action:z.enum(["ask-order-type","recommend","add-item","go-cart","checkout","fallback"]), targetItemId:z.number().optional(), targetCategorySeq:z.number().optional() });
const extractJson = (text:string) => { const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]; const envelope=fenced ?? text; try { const parsed=JSON.parse(envelope); if(parsed && typeof parsed === "object" && "result" in parsed && typeof parsed.result === "string") return extractJson(parsed.result); return parsed; } catch { const start=envelope.indexOf("{"); const end=envelope.lastIndexOf("}"); if(start===-1||end===-1||end<=start) throw new Error("No JSON object found"); return JSON.parse(envelope.slice(start,end+1)); } };
function withTimeout<T>(promise: Promise<T>, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), PROVIDER_TIMEOUT_MS),
    ),
  ]);
}

async function callClaudeCli(prompt:string){
  const { stdout } = await execFileAsync("claude", ["-p", prompt], {
    maxBuffer: 1024*1024*4,
    env: process.env,
    timeout: PROVIDER_TIMEOUT_MS,
  });
  return stdout.trim();
}

async function callAnthropic(prompt: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await withTimeout(client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
    max_tokens: 900,
    messages: [{ role: "user", content: prompt }],
  }), "anthropic");

  return response.content
    .map((block) => ("text" in block ? block.text : ""))
    .join("\n")
    .trim();
}

async function structured<T>(prompt:string, schema:z.ZodSchema<T>, fallback:T){
  const attempts: Array<{ provider: "anthropic" | "claude-cli"; run: () => Promise<string> }> = [
    { provider: "claude-cli", run: () => callClaudeCli(prompt) },
    { provider: "anthropic", run: () => callAnthropic(prompt) },
  ];

  for (const attempt of attempts) {
    try {
      const rawText = await withTimeout(attempt.run(), attempt.provider);
      const parsed = schema.parse(extractJson(rawText));
      return { object: parsed, provider: attempt.provider, rawText, status: "ok" as const };
    } catch {
      continue;
    }
  }

  return {
    object: fallback,
    provider: "fallback" as const,
    rawText: JSON.stringify(fallback, null, 2),
    status: "fallback" as const,
  };
}
export const generateAdaptiveUI = (prompt:string, fallback:AdaptiveUIResponse) => structured(prompt, adaptiveSchema, fallback);
export const generateVoiceAction = (prompt:string, fallback:VoiceOrderAction) => structured(prompt, voiceSchema, fallback);
