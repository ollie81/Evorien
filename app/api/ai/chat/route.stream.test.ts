import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  checkAiRateLimit: vi.fn(),
  recordAiUsage: vi.fn(),
  ensureConversation: vi.fn(),
  loadConversationMessages: vi.fn(),
  appendMessage: vi.fn(),
  getAiModel: vi.fn(),
  buildEvorienAiTools: vi.fn(),
  streamText: vi.fn(),
  getMemorySettings: vi.fn(),
  buildMemoryContext: vi.fn(),
  getMyPlan: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getUserId: mocks.getUserId }));
vi.mock("@/lib/ai/rate-limit", () => ({
  checkAiRateLimit: mocks.checkAiRateLimit,
  recordAiUsage: mocks.recordAiUsage,
}));
vi.mock("@/lib/ai/conversation", () => ({
  ensureConversation: mocks.ensureConversation,
  loadConversationMessages: mocks.loadConversationMessages,
  appendMessage: mocks.appendMessage,
}));
vi.mock("@/lib/ai/model", () => ({ getAiModel: mocks.getAiModel }));
vi.mock("@/lib/ai/tools", () => ({ buildEvorienAiTools: mocks.buildEvorienAiTools }));
vi.mock("@/lib/ai/identity", () => ({ EVORIEN_AI_IDENTITY: "test identity" }));
vi.mock("@/lib/ai/memory", () => ({
  getMemorySettings: mocks.getMemorySettings,
  buildMemoryContext: mocks.buildMemoryContext,
}));
// entitlements.ts is server-only (RSC-only import) and unreachable under Vitest's
// node environment — mock it purely so the module graph resolves; resolveModelTier
// only ever calls getMyPlan for messages that ask for something detailed, which
// none of the existing fixtures below do.
vi.mock("@/lib/billing/entitlements", () => ({ getMyPlan: mocks.getMyPlan }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: mocks.streamText };
});

import { POST } from "./route";

interface FakeResultOptions {
  chunks: string[];
  text: string;
  usage: { inputTokens?: number; outputTokens?: number };
  toolResults: Array<{ toolName: string; output: unknown }>;
  failText?: boolean;
  finishReason?: string;
}

function makeStreamTextResult({
  chunks,
  text,
  usage,
  toolResults,
  failText,
  finishReason = "stop",
}: FakeResultOptions) {
  return {
    textStream: (async function* () {
      for (const chunk of chunks) yield chunk;
      if (failText) throw new Error("mock generation failure");
    })(),
    text: failText ? Promise.reject(new Error("mock generation failure")) : Promise.resolve(text),
    usage: Promise.resolve(usage),
    toolResults: Promise.resolve(toolResults),
    finishReason: Promise.resolve(finishReason),
  };
}

async function readAllEvents(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: Array<{ type: string; text?: string; draft?: unknown; message?: string }> = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line) events.push(JSON.parse(line));
    }
  }
  return events;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/ai/chat", { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserId.mockResolvedValue("user-1");
  mocks.checkAiRateLimit.mockResolvedValue({ allowed: true, used: 0, remaining: 29, limit: 30 });
  mocks.ensureConversation.mockResolvedValue("conv-1");
  mocks.loadConversationMessages.mockResolvedValue([]);
  mocks.appendMessage.mockResolvedValue(undefined);
  mocks.recordAiUsage.mockResolvedValue(undefined);
  mocks.getAiModel.mockReturnValue({});
  mocks.buildEvorienAiTools.mockReturnValue({});
  mocks.getMemorySettings.mockResolvedValue(true);
  mocks.buildMemoryContext.mockResolvedValue("");
  mocks.getMyPlan.mockResolvedValue("FREE");
});

describe("POST /api/ai/chat streaming", () => {
  it("streams deltas progressively and persists the final text exactly once", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["Hello", " ", "world"],
        text: "Hello world",
        usage: { inputTokens: 10, outputTokens: 5 },
        toolResults: [],
      })
    );

    const res = await POST(makeRequest({ message: "hi" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Conversation-Id")).toBe("conv-1");
    expect(res.headers.get("X-Ai-Remaining")).toBe("28");

    const events = await readAllEvents(res);
    expect(events.filter((e) => e.type === "delta").map((e) => e.text).join("")).toBe("Hello world");
    expect(events.at(-1)).toEqual({ type: "done", draft: null, memorySaved: null, truncated: false });

    expect(mocks.appendMessage).toHaveBeenCalledTimes(2);
    expect(mocks.appendMessage).toHaveBeenLastCalledWith("conv-1", "assistant", "Hello world");
    expect(mocks.recordAiUsage).toHaveBeenCalledTimes(1);
    expect(mocks.recordAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", conversationId: "conv-1", promptTokens: 10, completionTokens: 5 })
    );
  });

  it("surfaces a project draft from tool results in the done event, never as raw text", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["Here's a draft for you."],
        text: "Here's a draft for you.",
        usage: { inputTokens: 20, outputTokens: 8 },
        toolResults: [{ toolName: "create_project_draft", output: { draft: { name: "Mock Project" } } }],
      })
    );

    const res = await POST(makeRequest({ message: "build something" }));
    const events = await readAllEvents(res);

    expect(events.filter((e) => e.type === "delta").every((e) => !e.text?.includes("{"))).toBe(true);
    expect(events.at(-1)).toEqual({
      type: "done",
      draft: { name: "Mock Project" },
      memorySaved: null,
      truncated: false,
    });
  });

  it("surfaces a saved memory's content in the done event when save_memory was called", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["Got it, noted."],
        text: "Got it, noted.",
        usage: { inputTokens: 15, outputTokens: 6 },
        toolResults: [
          {
            toolName: "save_memory",
            input: { memoryType: "GOAL", content: "Wants to launch a renewable-energy project." },
            output: { saved: true },
          } as unknown as { toolName: string; output: unknown },
        ],
      })
    );

    const res = await POST(makeRequest({ message: "I'm building a renewable-energy project" }));
    const events = await readAllEvents(res);

    expect(events.at(-1)).toEqual({
      type: "done",
      draft: null,
      memorySaved: "Wants to launch a renewable-energy project.",
      truncated: false,
    });
  });

  it("does not surface memorySaved when save_memory declined to save (e.g. cap reached)", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["Okay."],
        text: "Okay.",
        usage: { inputTokens: 10, outputTokens: 3 },
        toolResults: [
          {
            toolName: "save_memory",
            input: { memoryType: "GOAL", content: "Something" },
            output: { saved: false, reason: "Memory is full." },
          } as unknown as { toolName: string; output: unknown },
        ],
      })
    );

    const res = await POST(makeRequest({ message: "hi" }));
    const events = await readAllEvents(res);

    expect(events.at(-1)).toEqual({ type: "done", draft: null, memorySaved: null, truncated: false });
  });

  it("surfaces truncated: true when the model stops because it hit its output-token budget", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["This got cut"],
        text: "This got cut",
        usage: { inputTokens: 10, outputTokens: 500 },
        toolResults: [],
        finishReason: "length",
      })
    );

    const res = await POST(makeRequest({ message: "hi" }));
    const events = await readAllEvents(res);

    expect(events.at(-1)).toEqual({ type: "done", draft: null, memorySaved: null, truncated: true });
  });

  it("keeps generating and still persists + records usage after the client disconnects mid-stream", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    mocks.streamText.mockReturnValue({
      textStream: (async function* () {
        yield "partial";
        await gate;
        yield " continues after disconnect";
      })(),
      text: Promise.resolve("partial continues after disconnect"),
      usage: Promise.resolve({ inputTokens: 12, outputTokens: 6 }),
      toolResults: Promise.resolve([]),
    });

    const res = await POST(makeRequest({ message: "hi" }));
    const reader = res.body!.getReader();
    await reader.read();
    await reader.cancel();

    release();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(mocks.appendMessage).toHaveBeenLastCalledWith("conv-1", "assistant", "partial continues after disconnect");
    expect(mocks.recordAiUsage).toHaveBeenCalledTimes(1);
  });

  it("sends an error event and skips persistence when generation fails", async () => {
    mocks.streamText.mockReturnValue(
      makeStreamTextResult({
        chunks: ["oops"],
        text: "",
        usage: {},
        toolResults: [],
        failText: true,
      })
    );

    const res = await POST(makeRequest({ message: "hi" }));
    const events = await readAllEvents(res);

    expect(events.at(-1)?.type).toBe("error");
    expect(mocks.recordAiUsage).not.toHaveBeenCalled();
    expect(mocks.appendMessage).toHaveBeenCalledTimes(1); // only the user message
  });
});
