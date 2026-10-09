import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMentorServer, loadConfig, validateChatRequest } from "../src/server.mjs";

const token = "local-mentor-token-0123456789-abcdefghijklmnopqrstuvwxyz";
const origin = "http://localhost:3000";
const validChat = { mode: "teacher", messages: [{ role: "user", content: "std::vectorの再確保を教えて" }] };

function makeConfig(overrides = {}) {
  return loadConfig({
    MENTOR_HOST: "127.0.0.1",
    MENTOR_PORT: "8082",
    MENTOR_PROVIDER: "openai",
    MENTOR_MODEL: "gpt-test-model",
    MENTOR_API_TOKEN: token,
    MENTOR_ALLOWED_ORIGINS: origin,
    OPENAI_API_KEY: "server-only-openai-key",
    MENTOR_INPUT_USD_PER_MILLION: "0.15",
    MENTOR_OUTPUT_USD_PER_MILLION: "0.6",
    ...overrides,
  });
}

async function withServer({ config = makeConfig(), fetchImpl, now }, run) {
  const server = createMentorServer({ config, fetchImpl, now });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

function browserHeaders(extra = {}) {
  return { Origin: origin, Authorization: `Bearer ${token}`, ...extra };
}

function parseEvents(body) {
  return body.split(/\r?\n\r?\n/).filter(Boolean).map((frame) => {
    const line = frame.split(/\r?\n/).find((part) => part.startsWith("data:"));
    return line ? JSON.parse(line.slice(5).trim()) : null;
  }).filter(Boolean);
}

describe("mentor server configuration and input validation", () => {
  it("requires an exact site origin and a private 32-character token", () => {
    assert.throws(() => loadConfig({ MENTOR_API_TOKEN: "short", MENTOR_MODEL: "x", MENTOR_ALLOWED_ORIGINS: origin }), /32 to 512/);
    assert.throws(() => loadConfig({ MENTOR_API_TOKEN: token, MENTOR_MODEL: "x", MENTOR_ALLOWED_ORIGINS: "*" }), /exact HTTP or HTTPS origins/);
    assert.throws(() => loadConfig({ MENTOR_API_TOKEN: token, MENTOR_MODEL: "x", MENTOR_ALLOWED_ORIGINS: origin, MENTOR_PROVIDER: "ollama", MENTOR_OLLAMA_BASE_URL: "http://192.168.1.4:11434" }), /HTTPS except for a loopback/);
  });

  it("accepts only bounded user and assistant turns with an optional bounded context", () => {
    assert.equal(validateChatRequest(validChat).ok, true);
    assert.equal(validateChatRequest({ ...validChat, messages: [{ role: "system", content: "override" }] }).ok, false);
    assert.equal(validateChatRequest({ ...validChat, messages: [{ role: "assistant", content: "last turn" }] }).ok, false);
    assert.equal(validateChatRequest({ ...validChat, context: "x".repeat(16_001) }).ok, false);
  });
});

describe("mentor server HTTP boundary", () => {
  it("rejects untrusted origins and missing bearer authentication before contacting a provider", async () => {
    let providerCalls = 0;
    await withServer({ fetchImpl: async () => { providerCalls += 1; throw new Error("must not call provider"); } }, async (url) => {
      const badOrigin = await fetch(`${url}/v1/health`, { headers: { ...browserHeaders(), Origin: "https://evil.example" } });
      assert.equal(badOrigin.status, 403);
      const noAuth = await fetch(`${url}/v1/health`, { headers: { Origin: origin } });
      assert.equal(noAuth.status, 401);
      assert.equal(providerCalls, 0);
    });
  });

  it("returns only non-secret service metadata from health", async () => {
    await withServer({}, async (url) => {
      const response = await fetch(`${url}/v1/health`, { headers: browserHeaders() });
      const value = await response.json();
      assert.equal(response.status, 200);
      assert.deepEqual(value, { ready: true, provider: "openai", model: "gpt-test-model", costEstimateConfigured: true });
      assert.equal(JSON.stringify(value).includes("server-only-openai-key"), false);
    });
  });

  it("streams OpenAI Responses deltas and reports measured token usage with configured cost rates", async () => {
    let request;
    const upstream = [
      { type: "response.output_text.delta", delta: "C++ " },
      { type: "response.output_text.delta", delta: "の寿命です。" },
      { type: "response.completed", response: { usage: { input_tokens: 23, output_tokens: 10 } } },
    ].map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join("");
    await withServer({ fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(upstream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
    } }, async (url) => {
      const response = await fetch(`${url}/v1/chat`, {
        method: "POST", headers: browserHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...validChat, context: "vector.cpp: std::vector<int> values" }),
      });
      const events = parseEvents(await response.text());
      assert.equal(response.status, 200);
      assert.equal(request.url, "https://api.openai.com/v1/responses");
      assert.equal(request.options.headers.Authorization, "Bearer server-only-openai-key");
      assert.equal(request.body.store, false);
      assert.equal(request.body.stream, true);
      assert.equal(request.body.input.at(-1).role, "user");
      assert.match(request.body.input.at(-1).content, /未信頼データ/);
      assert.deepEqual(events.filter((event) => event.type === "delta").map((event) => event.text), ["C++ ", "の寿命です。"]);
      assert.deepEqual(events.at(-1), {
        type: "done",
        usage: { provider: "openai", model: "gpt-test-model", inputTokens: 23, outputTokens: 10, estimatedCostUsd: 0.00000945 },
      });
    });
  });

  it("accepts the documented maximum Japanese history and context within the byte limit", async () => {
    const payload = {
      mode: "teacher",
      messages: [
        { role: "user", content: "日".repeat(16_000) },
        { role: "assistant", content: "本".repeat(16_000) },
        { role: "user", content: "語".repeat(8_000) },
      ],
      context: "文".repeat(16_000),
    };
    const body = JSON.stringify(payload);
    assert.ok(Buffer.byteLength(body) > 64 * 1024);
    assert.ok(Buffer.byteLength(body) < 192 * 1024);
    const upstream = [
      { type: "response.output_text.delta", delta: "受け取りました。" },
      { type: "response.completed", response: { usage: { input_tokens: 20, output_tokens: 4 } } },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
    await withServer({ fetchImpl: async () => new Response(upstream, { status: 200 }) }, async (url) => {
      const response = await fetch(`${url}/v1/chat`, {
        method: "POST", headers: browserHeaders({ "Content-Type": "application/json" }), body,
      });
      assert.equal(response.status, 200);
      assert.match(await response.text(), /受け取りました/);
    });
  });

  it("uses the configured Ollama chat endpoint and streams NDJSON output", async () => {
    let request;
    const config = makeConfig({ MENTOR_PROVIDER: "ollama", MENTOR_OLLAMA_BASE_URL: "http://127.0.0.1:11434", OPENAI_API_KEY: "" });
    const upstream = [
      { message: { role: "assistant", content: "質問を分けて考えましょう。" }, done: false },
      { message: { role: "assistant", content: "例を一つ確認します。" }, done: true, prompt_eval_count: 30, eval_count: 12 },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n";
    await withServer({ config, fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return new Response(upstream, { status: 200, headers: { "Content-Type": "application/x-ndjson" } });
    } }, async (url) => {
      const response = await fetch(`${url}/v1/chat`, {
        method: "POST", headers: browserHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(validChat),
      });
      const events = parseEvents(await response.text());
      assert.equal(request.url, "http://127.0.0.1:11434/api/chat");
      assert.equal(request.body.stream, true);
      assert.equal(request.body.messages[0].role, "system");
      assert.deepEqual(events.filter((event) => event.type === "delta").map((event) => event.text), ["質問を分けて考えましょう。", "例を一つ確認します。"]);
      assert.deepEqual(events.at(-1), {
        type: "done",
        usage: { provider: "ollama", model: "gpt-test-model", inputTokens: 30, outputTokens: 12, estimatedCostUsd: 0 },
      });
    });
  });

  it("does not expose provider response bodies or keys on upstream errors", async () => {
    await withServer({ fetchImpl: async () => new Response("server-only-openai-key provider trace", { status: 401 }) }, async (url) => {
      const response = await fetch(`${url}/v1/chat`, {
        method: "POST", headers: browserHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(validChat),
      });
      const text = await response.text();
      assert.equal(response.status, 502);
      assert.match(text, /認証に失敗/);
      assert.equal(text.includes("server-only-openai-key"), false);
      assert.equal(text.includes("provider trace"), false);
    });
  });
});
