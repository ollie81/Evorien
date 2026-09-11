import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

export type ModelTier = "standard" | "complex";

/**
 * Builds the OpenAI model Ollieen AI calls, reading OPENAI_API_KEY and
 * AI_MODEL/AI_MODEL_COMPLEX from the environment at call time (never at
 * module load) — so a missing key only breaks an actual AI request, never
 * `next build` or an unrelated page.
 *
 * Two cost tiers, not one: "standard" (AI_MODEL) is used for ordinary
 * conversation — the overwhelming majority of requests. "complex" is only
 * ever requested by the route for a message that actually asks for
 * something long/thorough (see lib/ai/complexity.ts), and only for members
 * whose plan allows it. AI_MODEL_COMPLEX defaults to the same value as
 * AI_MODEL when unset, so nothing changes cost-wise until an operator
 * deliberately configures a distinct, stronger model for it.
 *
 * OPENAI_API_KEY must never be exposed with a NEXT_PUBLIC_ prefix or read from
 * anything but this server-only file. See .env.example.
 */
export function getAiModel(tier: ModelTier = "standard") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it as a server-side environment variable (see .env.example) before using Ollieen AI."
    );
  }

  const standardModel = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const modelName = tier === "complex" ? (process.env.AI_MODEL_COMPLEX ?? standardModel) : standardModel;

  const openai = createOpenAI({ apiKey });
  return openai(modelName);
}
