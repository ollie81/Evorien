import { generateText, stepCountIs } from "ai";
import { getUserId } from "@/lib/auth";
import { getAiModel } from "@/lib/ai/model";
import { EVORIEN_AI_IDENTITY } from "@/lib/ai/identity";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai/rate-limit";
import { buildEvorienAiTools } from "@/lib/ai/tools";
import { appendMessage, ensureConversation, loadConversationMessages } from "@/lib/ai/conversation";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_STEPS = 6;

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
  const requestedConversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;

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

  let conversationId: string;
  try {
    conversationId = await ensureConversation(userId, requestedConversationId, message);
  } catch (error) {
    console.error("Evorien AI could not start a conversation:", error);
    return Response.json({ error: "Could not start a conversation. Please try again." }, { status: 500 });
  }

  const history = await loadConversationMessages(conversationId);
  await appendMessage(conversationId, "user", message);

  try {
    const result = await generateText({
      model,
      instructions: EVORIEN_AI_IDENTITY,
      messages: [...history, { role: "user" as const, content: message }],
      tools: buildEvorienAiTools(userId),
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
    });

    await appendMessage(conversationId, "assistant", result.text);

    await recordAiUsage({
      userId,
      model: modelName,
      promptTokens: result.usage?.inputTokens,
      completionTokens: result.usage?.outputTokens,
      conversationId,
    });

    const draftResult = result.toolResults.find((r) => r.toolName === "create_project_draft");

    return Response.json({
      conversationId,
      reply: result.text,
      draft: draftResult ? (draftResult.output as { draft: unknown }).draft : null,
      remaining: Math.max(0, rateLimit.remaining - 1),
      limit: rateLimit.limit,
    });
  } catch (error) {
    console.error("Evorien AI request failed:", error);
    return Response.json({ error: "Evorien AI couldn't respond just now. Please try again." }, { status: 502 });
  }
}
