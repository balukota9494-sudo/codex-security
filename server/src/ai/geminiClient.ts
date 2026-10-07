import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { LIMITS } from "@trustguard/shared";
import type { ZodType } from "zod";
import { logger } from "../lib/logger.js";

export const aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateStructured<T>(opts: {
  systemInstruction: string;
  userContent: string; // pre-redacted untrusted input
  jsonSchema: Record<string, unknown>;
  zodSchema: ZodType<T>;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await aiClient.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: opts.userContent }] }],
      config: {
        systemInstruction: opts.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: opts.jsonSchema as any,
        temperature: 0.2,
        maxOutputTokens: opts.maxOutputTokens ?? LIMITS.aiMaxOutputTokens,
        abortSignal: controller.signal,
      },
    });

    const rawText = response.text || "";
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (parseErr) {
      logger.warn({ parseErr }, "Failed to parse JSON from AI model response");
      throw new Error("AI returned malformed non-JSON output.");
    }

    // Strictly re-validate against Zod schema - never trust model output directly
    return opts.zodSchema.parse(parsedJson);
  } finally {
    clearTimeout(timer);
  }
}
