/**
 * Gemini Flash 3 Preview client wrapper.
 * Locked: response_mime_type=application/json, exponential backoff, system prompt pinned.
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { GoogleGenAI } from "@google/genai";

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
  systemInstruction: string;
  maxRetries?: number;
  baseBackoffMs?: number;
}

export interface GenerateJSONRequest {
  userMessage: string;
  temperature?: number;
}

export class GeminiTranslator {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly systemInstruction: string;
  private readonly maxRetries: number;
  private readonly baseBackoffMs: number;

  constructor(opts: GeminiClientOptions) {
    if (!opts.apiKey) throw new Error("GOOGLE_AI_API_KEY is required");
    this.ai = new GoogleGenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.systemInstruction = opts.systemInstruction;
    this.maxRetries = opts.maxRetries ?? 5;
    this.baseBackoffMs = opts.baseBackoffMs ?? 1500;
  }

  async generateJSON(req: GenerateJSONRequest): Promise<unknown> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: [{ role: "user", parts: [{ text: req.userMessage }] }],
          config: {
            systemInstruction: this.systemInstruction,
            responseMimeType: "application/json",
            temperature: req.temperature ?? 0.2,
            maxOutputTokens: 65536,
          },
        });

        const text = extractText(response);
        if (!text) throw new Error("Empty response from Gemini");

        try {
          return JSON.parse(text);
        } catch (parseErr) {
          const stripped = stripFence(text);
          return JSON.parse(stripped);
        }
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err) || attempt === this.maxRetries) break;
        const backoff = this.baseBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[gemini] retry ${attempt + 1}/${this.maxRetries} after ${Math.round(backoff)}ms — ${errMsg(err)}`);
        await sleep(backoff);
      }
    }
    throw new Error(`Gemini call failed after ${this.maxRetries} retries: ${errMsg(lastErr)}`);
  }
}

function extractText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const r = response as Record<string, unknown>;
  if (typeof r.text === "string") return r.text;
  if (typeof r.text === "function") {
    try {
      const fn = r.text as () => string;
      const v = fn.call(response);
      if (typeof v === "string") return v;
    } catch {}
  }
  const candidates = r.candidates;
  if (Array.isArray(candidates) && candidates.length > 0) {
    const first = candidates[0] as Record<string, unknown>;
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
    if (parts && parts.length > 0) {
      return parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
    }
  }
  return "";
}

function stripFence(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function isRetryable(err: unknown): boolean {
  const msg = errMsg(err).toLowerCase();
  if (msg.includes("429")) return true;
  if (msg.includes("rate")) return true;
  if (msg.includes("timeout")) return true;
  if (msg.includes("503") || msg.includes("502") || msg.includes("500")) return true;
  if (msg.includes("unavailable") || msg.includes("overloaded")) return true;
  if (msg.includes("fetch failed")) return true;
  if (msg.includes("econnreset") || msg.includes("econnrefused") || msg.includes("etimedout")) return true;
  if (msg.includes("network") || msg.includes("socket")) return true;
  if (msg.includes("unterminated string")) return true;
  if (msg.includes("expected ',' or '}'")) return true;
  if (msg.includes("expected ',' or ']'")) return true;
  if (msg.includes("unexpected end of json")) return true;
  if (msg.includes("empty response")) return true;
  return false;
}

function errMsg(err: unknown): string {
  if (!err) return "unknown";
  if (err instanceof Error) return err.message;
  return String(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
