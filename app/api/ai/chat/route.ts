import { streamText, stepCountIs } from "ai";
import { getUserId } from "@/lib/auth";
import { getAiModel } from "@/lib/ai/model";
import { EVORIEN_AI_IDENTITY } from "@/lib/ai/identity";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai/rate-limit";
import { buildEvorienAiTools } from "@/lib/ai/tools";
import { appendMessage, ensureConversation, loadConversationMessages } from "@/lib/ai/conversation";
import { buildMemoryContext, getMemorySettings } from "@/lib/ai/memory";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_STEPS = 6;

/**
 * Each line of the response body is one JSON event: {type:"delta",text} while
 * the reply streams in, then exactly one {type:"done",draft} or
 * {type:"error",message} to close it out. Plain NDJSON (not SSE/UI-message
 * chunks) keeps the client parse trivial and guarantees raw tool JSON can
 * never leak into the visible message, since the client only ever renders
 * the `text` field of a `delta` event.
 */
function ndjson(event: Record<string, unknown>) {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to use Ollieen AI." }, { status: 401 });
  }

  const rateLimit = await checkAiRateLimit(userId);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `You've reached today's Ollieen AI limit (${rateLimit.limit} messages). It resets at midnight UTC.` },
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
    console.error("Ollieen AI is not configured:", error);
    return Response.json({ error: "Ollieen AI isn't configured yet. Try again later." }, { status: 503 });
  }

  let conversationId: string;
  try {
    conversationId = await ensureConversation(userId, requestedConversationId, message);
  } catch (error) {
    console.error("Ollieen AI could not start a conversation:", error);
    return Response.json({ error: "Could not start a conversation. Please try again." }, { status: 500 });
  }

  const history = await loadConversationMessages(conversationId);
  await appendMessage(conversationId, "user", message);

  const memoryEnabled = await getMemorySettings(userId);
  const memoryContext = memoryEnabled ? await buildMemoryContext(userId) : "";

  const result = streamText({
    model,
    instructions: memoryContext ? `${EVORIEN_AI_IDENTITY}\n\n${memoryContext}` : EVORIEN_AI_IDENTITY,
    messages: [
      ...history.map(({ role, content }) => ({ role, content })),
      { role: "user" as const, content: message },
    ],
    tools: buildEvorienAiTools(userId, conversationId, { memoryEnabled }),
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
    onError: ({ error }) => {
      console.error("Ollieen AI model call failed:", error);
    },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Swallows enqueue failures (client disconnected) instead of throwing,
      // so the loop below keeps draining `textStream` and the model call
      // still runs to completion server-side — persistence and usage
      // recording must happen regardless of whether anyone is still reading.
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(ndjson(event)));
        } catch {
          // client gone; ignored on purpose
        }
      };

      try {
        for await (const delta of result.textStream) {
          send({ type: "delta", text: delta });
        }
      } catch (error) {
        console.error("Ollieen AI text stream failed:", error);
      }

      try {
        const [text, usage, toolResults] = await Promise.all([result.text, result.usage, result.toolResults]);

        await appendMessage(conversationId, "assistant", text);
        await recordAiUsage({
          userId,
          model: modelName,
          promptTokens: usage?.inputTokens,
          completionTokens: usage?.outputTokens,
          conversationId,
        });

        const draftResult = toolResults.find((r) => r.toolName === "create_project_draft");
        const memoryResult = toolResults.find((r) => r.toolName === "save_memory");
        const memorySaved =
          memoryResult && (memoryResult.output as { saved: boolean }).saved
            ? (memoryResult.input as { content: string }).content
            : null;

        send({
          type: "done",
          draft: draftResult ? (draftResult.output as { draft: unknown }).draft : null,
          memorySaved,
        });
      } catch (error) {
        console.error("Ollieen AI request failed:", error);
        send({ type: "error", message: "Ollieen AI couldn't finish responding. Please try again." });
      }

      try {
        controller.close();
      } catch {
        // already closed from the client side
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": conversationId,
      "X-Ai-Remaining": String(Math.max(0, rateLimit.remaining - 1)),
      "X-Ai-Limit": String(rateLimit.limit),
    },
  });
}
