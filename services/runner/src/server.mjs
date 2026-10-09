import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export const MAX_REQUEST_BYTES = 768 * 1024;
export const MAX_SOURCE_BYTES = 32_000;
export const MAX_STDIN_BYTES = 8_192;
export const MAX_TEST_CASES = 12;
export const MAX_TOTAL_STDIN_BYTES = 64 * 1024;
export const MAX_SANDBOX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const SANDBOX_TIMEOUT_MS = 50_000;

const allowedStandards = new Set(["c++17", "c++20", "c++23"]);
const standardUtf8 = new TextEncoder();
const privateLessonRegistry = JSON.parse(readFileSync(new URL("../data/lesson-registry.json", import.meta.url), "utf8"));

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const apiToken = env.RUNNER_API_TOKEN?.trim() ?? "";
  const origins = (env.RUNNER_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const runtime = env.RUNNER_DOCKER_RUNTIME?.trim() || (production ? "" : "runc");
  const image = env.RUNNER_SANDBOX_IMAGE?.trim() || "cpp-mastery-sandbox:dev";
  const maxConcurrentJobs = Number(env.RUNNER_MAX_CONCURRENT_JOBS ?? 2);
  const port = Number(env.RUNNER_PORT ?? 8081);
  const host = env.RUNNER_HOST?.trim() || "127.0.0.1";

  if (apiToken.length < 32) throw new Error("RUNNER_API_TOKEN must contain at least 32 characters.");
  if (origins.length === 0 || origins.some((origin) => !isAllowedOrigin(origin, production))) {
    throw new Error("RUNNER_ALLOWED_ORIGINS must contain exact HTTPS origins (localhost HTTP is allowed in development).");
  }
  if (!Number.isInteger(maxConcurrentJobs) || maxConcurrentJobs < 1 || maxConcurrentJobs > 4) {
    throw new Error("RUNNER_MAX_CONCURRENT_JOBS must be an integer from 1 to 4.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65_535) throw new Error("RUNNER_PORT is invalid.");
  if (production) {
    if (runtime !== "runsc") throw new Error("Production requires the gVisor Docker runtime (`runsc`).");
    const hasRegistryDigest = /@sha256:[a-f0-9]{64}$/.test(image);
    const hasLocalImageId = /^sha256:[a-f0-9]{64}$/.test(image);
    if (!hasRegistryDigest && !hasLocalImageId) {
      throw new Error("Production requires a sandbox image pinned by a registry SHA-256 digest or local Docker image ID.");
    }
  }
  return { apiToken, origins: new Set(origins), runtime, image, maxConcurrentJobs, port, host, production };
}

function isAllowedOrigin(value, production) {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== value || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) return false;
    return parsed.protocol === "https:" || (!production && parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname));
  } catch {
    return false;
  }
}

export function validateJob(value) {
  if (!isRecord(value) || !hasExactKeys(value, ["source", "standard", "tests"])) {
    return { ok: false, message: "申請形式が正しくありません。" };
  }
  if (typeof value.source !== "string" || standardUtf8.encode(value.source).byteLength > MAX_SOURCE_BYTES) {
    return { ok: false, message: "ソースコードは32 KB以下にしてください。" };
  }
  if (typeof value.standard !== "string" || !allowedStandards.has(value.standard)) {
    return { ok: false, message: "C++17・C++20・C++23から標準を選んでください。" };
  }
  if (!Array.isArray(value.tests) || value.tests.length < 1 || value.tests.length > MAX_TEST_CASES) {
    return { ok: false, message: `テストは1〜${MAX_TEST_CASES}件にしてください。` };
  }
  let totalStdinBytes = 0;
  for (const test of value.tests) {
    if (!isRecord(test) || !hasExactKeys(test, ["stdin"]) || typeof test.stdin !== "string") {
      return { ok: false, message: "テスト入力の形式が正しくありません。" };
    }
    const stdinBytes = standardUtf8.encode(test.stdin).byteLength;
    if (stdinBytes > MAX_STDIN_BYTES) return { ok: false, message: "1件の標準入力は8 KB以下にしてください。" };
    totalStdinBytes += stdinBytes;
  }
  if (totalStdinBytes > MAX_TOTAL_STDIN_BYTES) return { ok: false, message: "標準入力の合計は64 KB以下にしてください。" };
  return { ok: true, job: { source: value.source, standard: value.standard, tests: value.tests } };
}

export function validateGradeSubmission(value, registry = privateLessonRegistry) {
  if (!isRecord(value) || !hasExactKeys(value, ["source", "standard", "lessonId"])) {
    return { ok: false, message: "採点リクエストの形式が正しくありません。" };
  }
  const lessonId = typeof value.lessonId === "string" ? value.lessonId : "";
  const lesson = registry.find((item) => item.id === lessonId);
  if (!lesson) return { ok: false, message: "指定された課題が見つかりません。" };
  const tests = [...lesson.tests, ...lesson.hiddenTests];
  const validation = validateJob({ source: value.source, standard: value.standard, tests: tests.map(({ input }) => ({ stdin: input })) });
  if (!validation.ok) return validation;
  return { ok: true, lesson, publicTestCount: lesson.tests.length, job: validation.job };
}

export function validateQuizSubmission(value, registry = privateLessonRegistry) {
  if (!isRecord(value) || !hasExactKeys(value, ["lessonId", "choice"])) {
    return { ok: false, message: "クイズ回答の形式が正しくありません。" };
  }
  const lesson = registry.find((item) => item.id === value.lessonId);
  if (!lesson || !Number.isSafeInteger(value.choice) || value.choice < 0 || value.choice > 15) {
    return { ok: false, message: "クイズ回答を確認できませんでした。" };
  }
  return { ok: true, lesson, choice: value.choice };
}

export function validateRevealRequest(value, registry = privateLessonRegistry) {
  if (!isRecord(value) || !hasExactKeys(value, ["lessonId", "kind"])) {
    return { ok: false, message: "解答表示リクエストの形式が正しくありません。" };
  }
  const lesson = registry.find((item) => item.id === value.lessonId);
  if (!lesson || !["solution", "debug"].includes(value.kind)) {
    return { ok: false, message: "解答を確認できませんでした。" };
  }
  return { ok: true, lesson, kind: value.kind };
}

export async function runSandboxJob(job, config, options = {}) {
  const started = Date.now();
  const cases = [];
  let compilerOutput = "";
  for (const test of job.tests) {
    if (options.signal?.aborted) throw new Error("sandbox-aborted");
    const timeoutMs = SANDBOX_TIMEOUT_MS - (Date.now() - started);
    if (timeoutMs <= 0) throw new Error("sandbox-timeout");
    const result = await runSandboxCase({ ...job, tests: [test] }, config, { ...options, timeoutMs });
    if (result.status !== "ok") return { status: result.status, compilerOutput: result.compilerOutput, cases: [] };
    if (!compilerOutput) compilerOutput = result.compilerOutput;
    cases.push(result.cases[0]);
  }
  return { status: "ok", compilerOutput, cases };
}

async function runSandboxCase(job, config, { signal, dockerBinary, timeoutMs }) {
  const containerName = `cpp-mastery-${randomUUID()}`;
  const docker = dockerBinary ?? (process.platform === "win32" ? "docker.exe" : "docker");
  const args = [
    "run", "--rm", "--interactive", "--name", containerName,
    "--runtime", config.runtime,
    "--network", "none",
    "--read-only",
    "--memory", "512m",
    "--memory-swap", "512m",
    "--cpus", "1.0",
    "--pids-limit", "64",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges=true",
    "--security-opt", "seccomp=builtin",
    "--user", "65532:65532",
    "--workdir", "/work",
    "--tmpfs", "/work:rw,exec,nosuid,nodev,size=64m,mode=1777",
    "--ulimit", "core=0:0",
    "--ulimit", "nofile=64:64",
    "--env", "HOME=/work",
    "--env", "TMPDIR=/work",
    "--env", "PATH=/usr/local/bin:/usr/bin:/bin",
    config.image,
  ];

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(docker, args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      reject(error);
      return;
    }
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let timedOut = false;
    let responseOverflow = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    timer.unref?.();

    const abort = () => child.kill();
    signal?.addEventListener("abort", abort, { once: true });
    child.stdin.on("error", () => {});
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_SANDBOX_RESPONSE_BYTES) {
        responseOverflow = true;
        child.kill();
      } else stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      const current = Buffer.concat(stderr);
      const room = Math.max(0, 32_000 - current.length);
      if (room > 0) stderr.push(chunk.subarray(0, room));
    });
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(error);
    });
    child.once("close", async (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (timedOut || signal?.aborted) {
        await cleanupContainer(docker, containerName);
        reject(new Error(timedOut ? "sandbox-timeout" : "sandbox-aborted"));
        return;
      }
      if (responseOverflow) {
        await cleanupContainer(docker, containerName);
        reject(new Error("sandbox-response-too-large"));
        return;
      }
      const output = Buffer.concat(stdout).toString("utf8");
      const diagnostic = Buffer.concat(stderr).toString("utf8");
      if (exitCode !== 0) {
        reject(new Error(`sandbox-container-exit-${exitCode}: ${diagnostic.slice(0, 1000)}`));
        return;
      }
      try {
        const result = JSON.parse(output);
        if (!validateSandboxResponse(result, 1)) throw new Error("sandbox response validation failed");
        if (result.status === "runner_error" && diagnostic) {
          console.error("C++ sandbox worker diagnostic", diagnostic.split("\n", 1)[0].slice(0, 160));
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    if (signal?.aborted) {
      child.kill();
      return;
    }
    child.stdin.end(JSON.stringify(job));
  });
}

async function cleanupContainer(docker, containerName) {
  const kill = spawn(docker, ["kill", containerName], { windowsHide: true, stdio: "ignore" });
  kill.once("error", () => {});
  await Promise.race([new Promise((resolve) => kill.once("close", resolve)), delay(2_000)]);
  const remove = spawn(docker, ["rm", "--force", containerName], { windowsHide: true, stdio: "ignore" });
  remove.once("error", () => {});
  await Promise.race([new Promise((resolve) => remove.once("close", resolve)), delay(2_000)]);
}

export function createRunnerServer({ config, executeJob = (job, options) => runSandboxJob(job, config, options), lessonRegistry = privateLessonRegistry, rateLimit = 20 } = {}) {
  if (!config?.apiToken || !(config.origins instanceof Set)) throw new Error("Runner configuration is required.");
  let activeJobs = 0;
  let rateStart = Date.now();
  let rateCount = 0;

  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    const origin = request.headers.origin;
    if (origin && !config.origins.has(origin)) {
      rejectEarly(request, response, 403, { error: "このWebサイトからのリクエストは許可されていません。" });
      return;
    }
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }

    if (request.method === "OPTIONS") {
      if (!origin || !config.origins.has(origin)) {
        rejectEarly(request, response, 403, { error: "このWebサイトからのリクエストは許可されていません。" });
        return;
      }
      response.writeHead(204, {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
      });
      response.end();
      return;
    }
    if (request.method === "GET" && request.url === "/healthz") {
      writeJson(response, 200, { status: "ok" });
      return;
    }
    if (request.method !== "POST" || !["/v1/execute", "/v1/grade", "/v1/quiz", "/v1/reveal"].includes(request.url)) {
      rejectEarly(request, response, 404, { error: "指定されたAPIはありません。" });
      return;
    }
    if (Number(request.headers["content-length"] ?? 0) > MAX_REQUEST_BYTES) {
      rejectEarly(request, response, 413, { error: "実行リクエストは768 KB以下にしてください。" });
      return;
    }
    if (!isAuthorized(request.headers.authorization, config.apiToken)) {
      rejectEarly(request, response, 401, { error: "実行ワーカーの認証に失敗しました。" }, { "WWW-Authenticate": "Bearer" });
      return;
    }
    const contentType = request.headers["content-type"] ?? "";
    if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
      rejectEarly(request, response, 415, { error: "Content-Typeはapplication/jsonにしてください。" });
      return;
    }
    const contentEncoding = request.headers["content-encoding"];
    if (contentEncoding && contentEncoding !== "identity") {
      rejectEarly(request, response, 415, { error: "圧縮されたリクエストには対応していません。" });
      return;
    }

    let raw;
    try {
      raw = await readRequest(request, response);
    } catch (error) {
      if (error?.code === "BODY_TOO_LARGE") writeJson(response, 413, { error: "実行リクエストは768 KB以下にしてください。" });
      else if (!response.writableEnded) writeJson(response, 400, { error: "JSONリクエストを読み込めませんでした。" });
      return;
    }
    if (response.writableEnded) return;

    let parsed;
    try { parsed = JSON.parse(raw); } catch {
      writeJson(response, 400, { error: "JSONの形式が正しくありません。" });
      return;
    }
    if (Date.now() - rateStart >= 60_000) {
      rateStart = Date.now();
      rateCount = 0;
    }
    rateCount += 1;
    if (rateCount > rateLimit) {
      writeJson(response, 429, { error: "短時間の実行回数が上限に達しました。" }, { "Retry-After": "60" });
      return;
    }

    if (request.url === "/v1/quiz") {
      const validation = validateQuizSubmission(parsed, lessonRegistry);
      if (!validation.ok) {
        writeJson(response, 400, { error: validation.message });
        return;
      }
      writeJson(response, 200, { correct: validation.choice === validation.lesson.quizAnswer });
      return;
    }
    if (request.url === "/v1/reveal") {
      const validation = validateRevealRequest(parsed, lessonRegistry);
      if (!validation.ok) {
        writeJson(response, 400, { error: validation.message });
        return;
      }
      const body = validation.kind === "solution"
        ? { solution: validation.lesson.solution }
        : { fix: validation.lesson.debugFix, explanation: validation.lesson.debugExplanation };
      writeJson(response, 200, body);
      return;
    }

    const gradeSubmission = request.url === "/v1/grade";
    const validation = gradeSubmission
      ? validateGradeSubmission(parsed, lessonRegistry)
      : validateJob(parsed);
    if (!validation.ok) {
      writeJson(response, 400, { error: validation.message });
      return;
    }

    if (activeJobs >= config.maxConcurrentJobs) {
      writeJson(response, 429, { error: "実行ワーカーが混雑しています。少し待ってから再試行してください。" }, { "Retry-After": "3" });
      return;
    }
    const abortController = new AbortController();
    response.once("close", () => {
      if (!response.writableEnded) abortController.abort();
    });
    activeJobs += 1;
    try {
      const result = await executeJob(validation.job, { signal: abortController.signal });
      const body = gradeSubmission ? gradeSandboxResult(result, validation) : result;
      writeJson(response, body.status === "runner_error" ? 503 : 200, body);
    } catch (error) {
      if (!response.writableEnded && !abortController.signal.aborted) {
        const reason = error instanceof Error ? error.message : "unknown";
        const category = /^sandbox-[a-z0-9-]+/.exec(reason)?.[0] ?? "unknown";
        console.error("C++ sandbox infrastructure failure", {
          name: error instanceof Error ? error.name : "UnknownError",
          code: isRecord(error) && typeof error.code === "string" ? error.code : "UNKNOWN",
          category,
        });
        const message = reason === "sandbox-timeout"
          ? "実行ワーカーの制限時間を超えました。"
          : "隔離実行環境でエラーが発生しました。解答の正誤とは分けて確認してください。";
        writeJson(response, 503, { error: message });
      }
    } finally {
      activeJobs -= 1;
    }
  });
}

export async function verifyDocker(config, dockerBinary) {
  const binary = dockerBinary ?? (process.platform === "win32" ? "docker.exe" : "docker");
  const runtimeResult = await spawnCapture(binary, ["info", "--format", "{{json .Runtimes}}"], 8_000);
  if (runtimeResult.exitCode !== 0) throw new Error("Docker daemon is unavailable.");
  const runtimes = JSON.parse(runtimeResult.stdout);
  if (!isRecord(runtimes) || !Object.hasOwn(runtimes, config.runtime)) throw new Error(`Docker runtime '${config.runtime}' is not installed.`);
  const imageResult = await spawnCapture(binary, ["image", "inspect", config.image], 8_000);
  if (imageResult.exitCode !== 0) throw new Error("Configured C++ sandbox image is not available locally.");
}

function gradeSandboxResult(result, submission) {
  if (result.status !== "ok") {
    return {
      status: result.status,
      message: result.status === "compile_error"
        ? "コンパイルエラーがあります。診断を確認してください。"
        : "隔離実行環境でエラーが発生しました。解答の正誤とは分けて確認してください。",
      compilerOutput: result.compilerOutput,
      cases: [],
      score: 0,
      durationMs: 0,
    };
  }

  const tests = [...submission.lesson.tests, ...submission.lesson.hiddenTests];
  const evaluated = tests.map((test, index) => {
    const actual = result.cases[index];
    const passed = actual.exitCode === 0 && !actual.timedOut && !actual.outputLimited
      && actual.stdout.replace(/\r\n/g, "\n").trimEnd() === test.output.replace(/\r\n/g, "\n").trimEnd();
    return { passed, ...actual };
  });
  const publicCases = evaluated.slice(0, submission.publicTestCount);
  const passedCount = evaluated.filter((test) => test.passed).length;
  const score = evaluated.length ? Math.round((passedCount / evaluated.length) * 100) : 0;
  return {
    status: score === 100 ? "passed" : "failed",
    message: score === 100
      ? "公開テストと非公開テストにすべて通りました。"
      : `${publicCases.filter((test) => !test.passed).length}件の公開テストに不一致があります。非公開テストの結果も採点に含まれています。`,
    compilerOutput: result.compilerOutput,
    cases: publicCases,
    score,
    durationMs: evaluated.reduce((total, test) => total + test.durationMs, 0),
  };
}

function spawnCapture(binary, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("close", (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") });
    });
  });
}

function readRequest(request, response) {
  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    response.setHeader("Connection", "close");
    request.resume();
    return Promise.reject(Object.assign(new Error("body too large"), { code: "BODY_TOO_LARGE" }));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    let rejected = false;
    request.on("data", (chunk) => {
      length += chunk.length;
      if (length > MAX_REQUEST_BYTES && !rejected) {
        rejected = true;
        response.setHeader("Connection", "close");
        response.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "実行リクエストは768 KB以下にしてください。" }));
        request.resume();
        reject(Object.assign(new Error("body too large"), { code: "BODY_TOO_LARGE" }));
        return;
      }
      if (!rejected) chunks.push(chunk);
    });
    request.once("end", () => { if (!rejected) resolve(Buffer.concat(chunks).toString("utf8")); });
    request.once("error", (error) => { if (!rejected) reject(error); });
    request.once("aborted", () => { if (!rejected) reject(new Error("request aborted")); });
  });
}

function rejectEarly(request, response, statusCode, body, extraHeaders = {}) {
  response.setHeader("Connection", "close");
  request.resume();
  writeJson(response, statusCode, body, extraHeaders);
}

function isAuthorized(header, token) {
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const supplied = createHash("sha256").update(header.slice(7)).digest();
  const expected = createHash("sha256").update(token).digest();
  return timingSafeEqual(supplied, expected) && header.slice(7).length > 0;
}

function validateSandboxResponse(value, expectedCases) {
  if (!isRecord(value) || !["ok", "compile_error", "runner_error"].includes(value.status)) return false;
  if (typeof value.compilerOutput !== "string" || value.compilerOutput.length > MAX_COMPILER_OUTPUT_LENGTH) return false;
  if (!Array.isArray(value.cases)) return false;
  if (value.status !== "ok") return value.cases.length === 0;
  if (value.cases.length !== expectedCases) return false;
  return value.cases.every((result) => isRecord(result)
    && typeof result.stdout === "string" && result.stdout.length <= MAX_CASE_OUTPUT_LENGTH
    && typeof result.stderr === "string" && result.stderr.length <= MAX_CASE_OUTPUT_LENGTH
    && (result.exitCode === null || Number.isSafeInteger(result.exitCode))
    && Number.isFinite(result.durationMs) && result.durationMs >= 0
    && typeof result.timedOut === "boolean"
    && typeof result.outputLimited === "boolean");
}

const MAX_COMPILER_OUTPUT_LENGTH = 32_000;
const MAX_CASE_OUTPUT_LENGTH = 8_192;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasExactKeys(value, keys) {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function writeJson(response, statusCode, body, extraHeaders = {}) {
  if (response.writableEnded || response.destroyed) return;
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", ...extraHeaders });
  response.end(JSON.stringify(body));
}

export async function startRunnerService(env = process.env) {
  const config = loadConfig(env);
  await verifyDocker(config);
  const server = createRunnerServer({ config });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });
  server.requestTimeout = 20_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.timeout = 60_000;
  return server;
}

const mainFile = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (mainFile) {
  startRunnerService().then((server) => {
    const address = server.address();
    console.info(`C++ runner listening on ${typeof address === "object" && address ? `${address.address}:${address.port}` : "unknown"}`);
    const close = () => server.close(() => process.exit(0));
    process.once("SIGINT", close);
    process.once("SIGTERM", close);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : "Runner startup failed.");
    process.exitCode = 1;
  });
}
