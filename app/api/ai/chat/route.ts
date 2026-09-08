import { generateText } from "ai";
import { getUserId } from "@/lib/auth";
import { getAiModel } from "@/lib/ai/model";
import { EVORIEN_AI_IDENTITY } from "@/lib/ai/identity";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai/rate-limit";

const MAX_MESSAGE_LENGTH = 4000;

/**
 * Stage 2 of Evorien AI: prove secure server-to-OpenAI integration works,
 * with per-user rate limiting and usage tracking from the first request.
 *
 * Deliberately single-turn (no conversation history, no context engine,
 * no tools) — those are Stage 3+. This is a Route Handler, not a Server
 * Action, so unlike every other authorized write in this app it does NOT
 * get the (app) layout's redirect-based protection: it must check auth
 * itself, on every request.
 */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to use Evorien AI." }, { status: 401 });
  }

  const rateLimit = await checkAiRateLimit(userId);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `You've reached today's Evorien AI limit (${rateLimit.limit} messages). It resets at midnight UTC.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `That message is too long (${MAX_MESSAGE_LENGTH.toLocaleString()} character limit).` },
      { status: 400 }
    );
  }

  const modelName = process.env.AI_MODEL ?? "gpt-5.6-luna";
  let model: ReturnType<typeof getAiModel>;
  try {
    model = getAiModel();
  } catch (error) {
    console.error("Evorien AI is not configured:", error);
    return Response.json({ error: "Evorien AI isn't configured yet. Try again later." }, { status: 503 });
  }

  try {
    const result = await generateText({
      model,
      instructions: EVORIEN_AI_IDENTITY,
      messages: [{ role: "user", content: message }],
    });

    await recordAiUsage({
      userId,
      model: modelName,
      promptTokens: result.usage?.inputTokens,
      completionTokens: result.usage?.outputTokens,
    });

    return Response.json({
      reply: result.text,
      remaining: Math.max(0, rateLimit.remaining - 1),
      limit: rateLimit.limit,
    });
  } catch (error) {
    console.error("Evorien AI request failed:", error);
    return Response.json({ error: "Evorien AI couldn't respond just now. Please try again." }, { status: 502 });
  }
}
