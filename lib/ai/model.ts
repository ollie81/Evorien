import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-5.6-luna";

/**
 * Builds the OpenAI model Ollieen AI calls, reading OPENAI_API_KEY and AI_MODEL
 * from the environment at call time (never at module load) — so a missing key
 * only breaks an actual AI request, never `next build` or an unrelated page.
 *
 * OPENAI_API_KEY must never be exposed with a NEXT_PUBLIC_ prefix or read from
 * anything but this server-only file. See .env.example.
 */
export function getAiModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it as a server-side environment variable (see .env.example) before using Ollieen AI."
    );
  }

  const openai = createOpenAI({ apiKey });
  return openai(process.env.AI_MODEL ?? DEFAULT_MODEL);
}
