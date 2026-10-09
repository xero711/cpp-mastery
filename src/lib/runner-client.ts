import type { Lesson } from "@/lib/lessons";
import { useSyncExternalStore } from "react";

export type GradeResult = {
  status: "passed" | "failed" | "compile_error" | "unavailable" | "runner_error";
  message: string;
  compilerOutput?: string;
  cases: { passed: boolean; expected: string; actual: string; stderr: string; durationMs: number; timedOut?: boolean; outputLimited?: boolean }[];
  score: number;
  durationMs: number;
};

type ApiGradeResult = {
  status: "passed" | "failed" | "compile_error" | "runner_error";
  message: string;
  compilerOutput: string;
  cases: { passed: boolean; stdout: string; stderr: string; durationMs: number; timedOut: boolean; outputLimited: boolean; exitCode: number | null }[];
  score: number;
  durationMs: number;
};

const configuredRunner = normalizeRunnerUrl(process.env.NEXT_PUBLIC_CPP_RUNNER_URL);
const runnerUrlStorageKey = "cpp-mastery-runner-url";
const runnerUrlChangedEvent = "cpp-mastery-runner-url-changed";
const sourceLimitBytes = 32_000;
const responseLimitBytes = 2 * 1024 * 1024;

export function normalizeRunnerUrl(value: string | undefined) {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    const localDevelopment = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((!localDevelopment && url.protocol !== "https:") || url.username || url.password || url.search || url.hash) return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function getRunnerUrlOverride() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeRunnerUrl(window.localStorage.getItem(runnerUrlStorageKey) ?? undefined);
  } catch {
    return "";
  }
}

export function getConfiguredRunnerUrl() {
  return getRunnerUrlOverride() || configuredRunner;
}

export function saveRunnerUrlOverride(value: string) {
  const normalized = normalizeRunnerUrl(value);
  if (!normalized) throw new Error("URLはHTTPSで入力してください。HTTPを使えるのはlocalhost、127.0.0.1、または[::1]だけです。");
  if (typeof window === "undefined") throw new Error("ブラウザーからURLを保存してください。");
  window.localStorage.setItem(runnerUrlStorageKey, normalized);
  window.dispatchEvent(new Event(runnerUrlChangedEvent));
  return normalized;
}

export function clearRunnerUrlOverride() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(runnerUrlStorageKey);
  window.dispatchEvent(new Event(runnerUrlChangedEvent));
}

function subscribeRunnerUrl(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(runnerUrlChangedEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(runnerUrlChangedEvent, onChange);
  };
}

export function useRunnerConfigured() {
  return useSyncExternalStore(subscribeRunnerUrl, () => Boolean(getConfiguredRunnerUrl()), () => Boolean(configuredRunner));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonLimited(response: Response): Promise<unknown> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > responseLimitBytes) throw new Error("Runner response too large");
  if (!response.body) return JSON.parse(await response.text()) as unknown;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > responseLimitBytes) {
        await reader.cancel();
        throw new Error("Runner response too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function unavailable(message: string): GradeResult {
  return { status: "unavailable", message, cases: [], score: 0, durationMs: 0 };
}

async function postRunner(path: string, body: unknown, apiToken: string) {
  const runnerUrl = getConfiguredRunnerUrl();
  if (!runnerUrl) return { ok: false as const, message: "設定画面で実行ワーカーのURLを登録してください。" };
  if (!apiToken.trim()) return { ok: false as const, message: "設定画面で実行ワーカーのアクセストークンを登録してください。トークンはこのブラウザーだけに保存されます。" };
  const response = await fetch(`${runnerUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken.trim()}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const raw = await readJsonLimited(response);
  if (!isRecord(raw)) return { ok: false as const, message: "実行ワーカーから形式の正しい応答を受け取れませんでした。" };
  if (!response.ok) {
    return { ok: false as const, message: typeof raw.message === "string" ? raw.message : typeof raw.error === "string" ? raw.error : `Runner responded with HTTP ${response.status}` };
  }
  return { ok: true as const, raw };
}

function isApiGradeResult(value: unknown, expectedPublicCases: number): value is ApiGradeResult {
  if (!isRecord(value) || !["passed", "failed", "compile_error", "runner_error"].includes(String(value.status))) return false;
  if (typeof value.message !== "string" || typeof value.compilerOutput !== "string" || value.compilerOutput.length > 32_000) return false;
  if (!Array.isArray(value.cases) || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 0 || value.score > 100) return false;
  if (typeof value.durationMs !== "number" || !Number.isFinite(value.durationMs) || value.durationMs < 0) return false;
  if (["passed", "failed"].includes(String(value.status)) && value.cases.length !== expectedPublicCases) return false;
  if (["compile_error", "runner_error"].includes(String(value.status)) && value.cases.length !== 0) return false;
  return value.cases.every((test) => isRecord(test)
    && typeof test.passed === "boolean"
    && typeof test.stdout === "string" && test.stdout.length <= 8_192
    && typeof test.stderr === "string" && test.stderr.length <= 8_192
    && typeof test.durationMs === "number" && Number.isFinite(test.durationMs) && test.durationMs >= 0
    && typeof test.timedOut === "boolean"
    && typeof test.outputLimited === "boolean"
    && (test.exitCode === null || Number.isSafeInteger(test.exitCode)));
}

export async function gradeLessonCode(
  source: string,
  lesson: Lesson,
  standard: "c++17" | "c++20" | "c++23" = lesson.standard,
  apiToken = "",
): Promise<GradeResult> {
  if (!getConfiguredRunnerUrl()) return unavailable("設定画面で実行ワーカーのURLを登録してください。コードはブラウザー内に保存できますが、コンパイル・採点は停止中です。");
  if (!apiToken.trim()) return unavailable("設定画面で実行ワーカーのアクセストークンを登録してください。トークンはこのブラウザーだけに保存されます。");
  if (new TextEncoder().encode(source).byteLength > sourceLimitBytes) {
    return { status: "runner_error", message: "提出コードは32 KB以下にしてください。", cases: [], score: 0, durationMs: 0 };
  }

  try {
    const response = await postRunner("/v1/grade", { lessonId: lesson.id, source, standard }, apiToken);
    if (!response.ok) return { status: "runner_error", message: response.message, cases: [], score: 0, durationMs: 0 };
    if (!isApiGradeResult(response.raw, lesson.exercise.tests.length)) {
      return { status: "runner_error", message: "採点応答の形式を確認できませんでした。", cases: [], score: 0, durationMs: 0 };
    }
    const result = response.raw;
    return {
      status: result.status,
      message: result.message,
      compilerOutput: result.compilerOutput,
      cases: result.cases.map((test, index) => ({
        passed: test.passed,
        expected: lesson.exercise.tests[index]?.output ?? "",
        actual: test.stdout,
        stderr: test.stderr,
        durationMs: test.durationMs,
        timedOut: test.timedOut,
        outputLimited: test.outputLimited,
      })),
      score: result.score,
      durationMs: result.durationMs,
    };
  } catch (error) {
    return {
      status: "runner_error",
      message: error instanceof Error && error.name === "TimeoutError"
        ? "実行ワーカーへの応答がタイムアウトしました。"
        : "実行ワーカーへ接続できません。解答の誤りとは区別しています。",
      cases: [],
      score: 0,
      durationMs: 0,
    };
  }
}

export async function revealLessonAnswer(lessonId: string, kind: "solution" | "debug", apiToken: string) {
  const response = await postRunner("/v1/reveal", { lessonId, kind }, apiToken);
  if (!response.ok) throw new Error(response.message);
  return response.raw;
}
