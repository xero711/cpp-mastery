import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkMentorHealth,
  getConfiguredMentorUrl,
  normalizeMentorUrl,
  saveMentorUrlOverride,
  streamMentorReply,
} from "../src/lib/mentor-client";

const token = "browser-mentor-token-0123456789-abcdefghijklmnopqrstuvwxyz";
const storage = new Map<string, string>();
const fakeWindow = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

afterEach(() => {
  storage.clear();
  vi.unstubAllGlobals();
});

describe("mentor browser client", () => {
  it("accepts HTTPS and loopback endpoints only", () => {
    expect(normalizeMentorUrl("https://mentor.example.com/")).toBe("https://mentor.example.com");
    expect(normalizeMentorUrl("http://127.0.0.1:8082")).toBe("http://127.0.0.1:8082");
    expect(normalizeMentorUrl("http://192.168.1.2:8082")).toBe("");
    expect(normalizeMentorUrl("https://user:pass@mentor.example.com")).toBe("");
  });

  it("stores the service URL in browser-local storage", () => {
    vi.stubGlobal("window", fakeWindow);
    expect(saveMentorUrlOverride("http://localhost:8082/")).toBe("http://localhost:8082");
    expect(getConfiguredMentorUrl()).toBe("http://localhost:8082");
    expect(fakeWindow.dispatchEvent).toHaveBeenCalledOnce();
  });

  it("checks service metadata using the stored bearer token without sending chat content", async () => {
    vi.stubGlobal("window", fakeWindow);
    saveMentorUrlOverride("http://127.0.0.1:8082");
    const fetchMock = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      expect(options?.headers).toEqual({ Authorization: `Bearer ${token}` });
      return new Response(JSON.stringify({ ready: true, provider: "ollama", model: "local-model", costEstimateConfigured: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(checkMentorHealth(token)).resolves.toMatchObject({ provider: "ollama", model: "local-model" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("messages");
  });

  it("parses SSE text deltas and completion usage", async () => {
    vi.stubGlobal("window", fakeWindow);
    saveMentorUrlOverride("http://127.0.0.1:8082");
    const streamBody = [
      { type: "delta", text: "vector " },
      { type: "delta", text: "reallocation" },
      { type: "done", usage: { provider: "openai", model: "gpt-test-model", inputTokens: 100, outputTokens: 25, estimatedCostUsd: 0.00003 } },
    ].map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join("");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(streamBody, { status: 200, headers: { "Content-Type": "text/event-stream" } })));
    const deltas: string[] = [];
    const usage = await streamMentorReply({
      messages: [{ role: "user", content: "Why does vector reallocate?" }],
      mode: "teacher", token, onDelta: (delta) => deltas.push(delta),
    });
    expect(deltas.join("")).toBe("vector reallocation");
    expect(usage).toMatchObject({ inputTokens: 100, outputTokens: 25, estimatedCostUsd: 0.00003 });
  });

  it("surfaces provider-safe stream errors to the learner", async () => {
    vi.stubGlobal("window", fakeWindow);
    saveMentorUrlOverride("http://127.0.0.1:8082");
    const streamBody = `data: ${JSON.stringify({ type: "error", message: "AIサービスに接続できません。" })}\n\n`;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(streamBody, { status: 200 })));
    await expect(streamMentorReply({
      messages: [{ role: "user", content: "質問" }], mode: "teacher", token, onDelta: () => {},
    })).rejects.toThrow("AIサービスに接続できません。");
  });
});
