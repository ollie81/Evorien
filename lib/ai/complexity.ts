// Pure, deterministic — no model call to decide whether a request is
// "complex." A second LLM call just to classify the first would add its own
// latency and cost, defeating the point. This is a plain, explainable
// heuristic in the same spirit as lib/matching/score.ts: transparent, never
// a black box, easy to tune.

const DETAIL_KEYWORDS = [
  "detailed",
  "in detail",
  "in-depth",
  "comprehensive",
  "thorough",
  "step by step",
  "step-by-step",
  "full plan",
  "write a plan",
  "long answer",
  "essay",
  "elaborate",
  "walk me through",
  "explain everything",
  "analyze",
  "analysis",
];

const LONG_MESSAGE_THRESHOLD = 280;

/** Whether this message is asking for something long/thorough rather than a normal quick question. */
export function wantsDetailedResponse(message: string): boolean {
  if (message.length > LONG_MESSAGE_THRESHOLD) return true;
  const lower = message.toLowerCase();
  return DETAIL_KEYWORDS.some((keyword) => lower.includes(keyword));
}
