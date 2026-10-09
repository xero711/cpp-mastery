import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRunnerServer, loadConfig, MAX_REQUEST_BYTES, validateGradeSubmission, validateJob, validateQuizSubmission, validateRevealRequest } from "../src/server.mjs";

const token = "local-test-token-0123456789-abcdefghijklmnopqrstuvwxyz";
const origin = "http://localhost:3000";
const validJob = { source: "int main() {}", standard: "c++17", tests: [{ stdin: "" }] };
const privateLessonRegistry = [{
  id: "w1-d1",
  solution: "SECRET_SOLUTION",
  quizAnswer: 2,
  debugFix: "SECRET_DEBUG_FIX",
  debugExplanation: "SECRET_DEBUG_EXPLANATION",
  tests: [{ input: "public-input\n", output: "public-output" }],
  hiddenTests: [{ input: "hidden-input-secret\n", output: "hidden-output-secret" }],
}];

async function withServer({ executeJob, rateLimit, maxConcurrentJobs = 2, lessonRegistry = privateLessonRegistry } = {}, run) {
  const config = { apiToken: token, origins: new Set([origin]), maxConcurrentJobs, runtime: "runc", image: "cpp-mastery-sandbox:dev" };
  const server = createRunnerServer({ config, executeJob, lessonRegistry, rateLimit });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(url, { path = "/v1/execute", body = validJob, authorization = `Bearer ${token}`, requestOrigin = origin, headers = {} } = {}) {
  return fetch(`${url}${path}`, {
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
  it("requires a long token and production gVisor with an immutable SHA-256 image reference", () => {
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
    }), /SHA-256 digest or local Docker image ID/);
    const config = loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: token,
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runsc",
      RUNNER_SANDBOX_IMAGE: `ghcr.io/example/sandbox@sha256:${"a".repeat(64)}`,
    });
    assert.equal(config.runtime, "runsc");

    const localImage = `sha256:${"b".repeat(64)}`;
    const localImageConfig = loadConfig({
      NODE_ENV: "production",
      RUNNER_API_TOKEN: token,
      RUNNER_ALLOWED_ORIGINS: "https://cpp.example",
      RUNNER_DOCKER_RUNTIME: "runsc",
      RUNNER_SANDBOX_IMAGE: localImage,
    });
    assert.equal(localImageConfig.image, localImage);
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

  it("builds grading jobs only from the runner-owned registry", () => {
    const valid = validateGradeSubmission({ lessonId: "w1-d1", source: "int main() {}", standard: "c++17" }, privateLessonRegistry);
    assert.equal(valid.ok, true);
    assert.deepEqual(valid.job.tests, [{ stdin: "public-input\n" }, { stdin: "hidden-input-secret\n" }]);
    assert.equal(valid.publicTestCount, 1);
    assert.equal(validateGradeSubmission({ lessonId: "w1-d1", source: "", standard: "c++17", tests: [] }, privateLessonRegistry).ok, false);
    assert.equal(validateGradeSubmission({ lessonId: "missing", source: "", standard: "c++17" }, privateLessonRegistry).ok, false);
    assert.equal(validateQuizSubmission({ lessonId: "w1-d1", choice: 2 }, privateLessonRegistry).ok, true);
    assert.equal(validateRevealRequest({ lessonId: "w1-d1", kind: "solution" }, privateLessonRegistry).ok, true);
  });

  it("grades public and hidden cases server-side without returning hidden inputs or expected outputs", async () => {
    const executeJob = async (job) => {
      assert.deepEqual(job.tests, [{ stdin: "public-input\n" }, { stdin: "hidden-input-secret\n" }]);
      return {
        status: "ok",
        compilerOutput: "",
        cases: ["public-output", "hidden-output-secret"].map((stdout) => ({ stdout, stderr: "", exitCode: 0, durationMs: 3, timedOut: false, outputLimited: false })),
      };
    };
    await withServer({ executeJob }, async (url) => {
      const response = await post(url, { path: "/v1/grade", body: { lessonId: "w1-d1", source: "int main() {}", standard: "c++17" } });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.status, "passed");
      assert.equal(result.score, 100);
      assert.equal(result.cases.length, 1);
      assert.equal(result.cases[0].passed, true);
      const serialized = JSON.stringify(result);
      assert.equal(serialized.includes("hidden-input-secret"), false);
      assert.equal(serialized.includes("hidden-output-secret"), false);
      assert.equal(serialized.includes("SECRET_SOLUTION"), false);
    });
  });

  it("fails a submission that passes public cases but fails a hidden case", async () => {
    await withServer({ executeJob: async () => ({
      status: "ok",
      compilerOutput: "",
      cases: ["public-output", "wrong-hidden-output"].map((stdout) => ({ stdout, stderr: "", exitCode: 0, durationMs: 3, timedOut: false, outputLimited: false })),
    }) }, async (url) => {
      const response = await post(url, { path: "/v1/grade", body: { lessonId: "w1-d1", source: "int main() {}", standard: "c++17" } });
      const result = await response.json();
      assert.equal(result.status, "failed");
      assert.equal(result.score, 50);
      assert.equal(result.cases.length, 1);
      assert.equal(result.cases[0].passed, true);
      assert.equal(JSON.stringify(result).includes("wrong-hidden-output"), false);
    });
  });

  it("reveals quiz grading and answer content only through explicit authenticated calls", async () => {
    await withServer({ executeJob: async () => { throw new Error("sandbox should not run"); } }, async (url) => {
      const quiz = await post(url, { path: "/v1/quiz", body: { lessonId: "w1-d1", choice: 2 } });
      assert.deepEqual(await quiz.json(), { correct: true });
      const solution = await post(url, { path: "/v1/reveal", body: { lessonId: "w1-d1", kind: "solution" } });
      assert.deepEqual(await solution.json(), { solution: "SECRET_SOLUTION" });
      const debug = await post(url, { path: "/v1/reveal", body: { lessonId: "w1-d1", kind: "debug" } });
      assert.deepEqual(await debug.json(), { fix: "SECRET_DEBUG_FIX", explanation: "SECRET_DEBUG_EXPLANATION" });
    });
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
