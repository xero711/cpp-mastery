import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRunnerServer, loadConfig, MAX_REQUEST_BYTES, validateJob } from "../src/server.mjs";

const token = "local-test-token-0123456789-abcdefghijklmnopqrstuvwxyz";
const origin = "http://localhost:3000";
const validJob = { source: "int main() {}", standard: "c++17", tests: [{ stdin: "" }] };

async function withServer({ executeJob, rateLimit, maxConcurrentJobs = 2 } = {}, run) {
  const config = { apiToken: token, origins: new Set([origin]), maxConcurrentJobs, runtime: "runc", image: "cpp-mastery-sandbox:dev" };
  const server = createRunnerServer({ config, executeJob, rateLimit });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(url, { body = validJob, authorization = `Bearer ${token}`, requestOrigin = origin, headers = {} } = {}) {
  return fetch(`${url}/v1/execute`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
      ...(requestOrigin ? { origin: requestOrigin } : {}),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("runner API security boundary", () => {
  it("requires a long token and production gVisor with an immutable image digest", () => {
    assert.throws(() => loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: "short-token",
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runsc",
      RUNNER_SANDBOX_IMAGE: `ghcr.io/example/sandbox@sha256:${"a".repeat(64)}`,
    }), /RUNNER_API_TOKEN/);
    assert.throws(() => loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: token,
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runc",
      RUNNER_SANDBOX_IMAGE: `ghcr.io/example/sandbox@sha256:${"a".repeat(64)}`,
    }), /gVisor/);
    assert.throws(() => loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: token,
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runsc",
      RUNNER_SANDBOX_IMAGE: "ghcr.io/example/sandbox:latest",
    }), /digest/);
    const config = loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: token,
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runsc",
      RUNNER_SANDBOX_IMAGE: `ghcr.io/example/sandbox@sha256:${"a".repeat(64)}`,
    });
    assert.equal(config.runtime, "runsc");
  });

  it("validates standards, source bytes, test count, and cumulative stdin bytes", () => {
    assert.equal(validateJob(validJob).ok, true);
    assert.equal(validateJob({ ...validJob, standard: "gnu++23" }).ok, false);
    assert.equal(validateJob({ ...validJob, source: "é".repeat(16_001) }).ok, false);
    assert.equal(validateJob({ ...validJob, tests: Array.from({ length: 13 }, () => ({ stdin: "" })) }).ok, false);
    assert.equal(validateJob({ ...validJob, tests: [{ stdin: "x".repeat(8193) }] }).ok, false);
    assert.equal(validateJob({ ...validJob, tests: Array.from({ length: 9 }, () => ({ stdin: "x".repeat(8192) })) }).ok, false);
    assert.equal(validateJob({ ...validJob, tests: [{ stdin: "", expected: "secret" }] }).ok, false);
    assert.equal(validateJob({ ...validJob, unexpected: true }).ok, false);
  });

  it("does not call the sandbox without authorization", async () => {
    let called = false;
    await withServer({ executeJob: async () => { called = true; return {}; } }, async (url) => {
      const response = await post(url, { authorization: "Bearer wrong" });
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("www-authenticate"), "Bearer");
      assert.equal(called, false);
    });
  });

  it("rejects foreign origins and answers an allowlisted preflight", async () => {
    await withServer({ executeJob: async () => ({ status: "ok", compilerOutput: "", cases: [{ stdout: "", stderr: "", exitCode: 0, durationMs: 1, timedOut: false, outputLimited: false }] }) }, async (url) => {
      const forbidden = await post(url, { requestOrigin: "https://attacker.example" });
      assert.equal(forbidden.status, 403);
      const preflight = await fetch(`${url}/v1/execute`, {
        method: "OPTIONS",
        headers: { origin, "access-control-request-method": "POST", "access-control-request-headers": "authorization,content-type" },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
      assert.match(preflight.headers.get("access-control-allow-headers"), /Authorization/);
    });
  });

  it("rejects malformed, oversized, and non-JSON requests before execution", async () => {
    let calls = 0;
    await withServer({ executeJob: async () => { calls += 1; return {}; } }, async (url) => {
      assert.equal((await post(url, { body: "{" })).status, 400);
      assert.equal((await post(url, { body: { ...validJob, standard: "c++26" } })).status, 400);
      assert.equal((await post(url, { body: { ...validJob, source: "a".repeat(32_001) } })).status, 400);
      assert.equal((await post(url, { body: JSON.stringify(validJob), headers: { "content-type": "text/plain" } })).status, 415);
      assert.equal(calls, 0);
    });
  });

  it("rejects a request over the byte limit before parsing JSON", async () => {
    await withServer({}, async (url) => {
      const response = await fetch(`${url}/v1/execute`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, origin, "content-type": "application/json" },
        body: " ".repeat(MAX_REQUEST_BYTES + 1),
      });
      assert.equal(response.status, 413);
      assert.match((await response.json()).error, /768 KB/);
    });
  });

  it("returns only the validated sandbox response", async () => {
    const expected = { status: "ok", compilerOutput: "", cases: [{ stdout: "42\n", stderr: "", exitCode: 0, durationMs: 7, timedOut: false, outputLimited: false }] };
    await withServer({ executeJob: async (job) => {
      assert.deepEqual(job, validJob);
      return expected;
    } }, async (url) => {
      const response = await post(url);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), expected);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    });
  });

  it("enforces per-minute request and concurrent job limits", async () => {
    await withServer({ rateLimit: 1, executeJob: async () => ({ status: "ok", compilerOutput: "", cases: [{ stdout: "", stderr: "", exitCode: 0, durationMs: 1, timedOut: false, outputLimited: false }] }) }, async (url) => {
      assert.equal((await post(url)).status, 200);
      const limited = await post(url);
      assert.equal(limited.status, 429);
      assert.equal(limited.headers.get("retry-after"), "60");
    });
  });

  it("reserves a job slot before starting sandbox work", async () => {
    let announceStart;
    let releaseJob;
    const started = new Promise((resolve) => { announceStart = resolve; });
    const blocked = new Promise((resolve) => { releaseJob = resolve; });
    const result = { status: "ok", compilerOutput: "", cases: [{ stdout: "", stderr: "", exitCode: 0, durationMs: 1, timedOut: false, outputLimited: false }] };
    await withServer({ maxConcurrentJobs: 1, executeJob: async () => { announceStart(); await blocked; return result; } }, async (url) => {
      const firstRequest = post(url);
      await started;
      const secondResponse = await post(url);
      assert.equal(secondResponse.status, 429);
      releaseJob();
      assert.equal((await firstRequest).status, 200);
    });
  });
});
