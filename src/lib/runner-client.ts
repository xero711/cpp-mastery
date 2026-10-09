import type { Lesson } from "@/lib/lessons";

export type RunnerCaseResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
  outputLimited: boolean;
};

export type RunnerResponse = {
  status: "ok" | "compile_error" | "runner_error";
  compilerOutput: string;
  cases: RunnerCaseResult[];
};

export type GradeResult = {
  status: "passed" | "failed" | "compile_error" | "unavailable" | "runner_error";
  message: string;
  compilerOutput?: string;
  cases: { passed: boolean; expected: string; actual: string; stderr: string; durationMs: number; timedOut?: boolean; outputLimited?: boolean }[];
  score: number;
  durationMs: number;
};

const configuredRunner = resolveRunnerUrl(process.env.NEXT_PUBLIC_CPP_RUNNER_URL);
const sourceLimitBytes = 32_000;
const responseLimitBytes = 2 * 1024 * 1024;

function resolveRunnerUrl(value: string | undefined) {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    const localDevelopment = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((!localDevelopment && url.protocol !== "https:") || url.username || url.password || url.search || url.hash) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRunnerCase(value: unknown): value is RunnerCaseResult {
  if (!isRecord(value)) return false;
  return typeof value.stdout === "string" && value.stdout.length <= 8_192
    && typeof value.stderr === "string" && value.stderr.length <= 8_192
    && (value.exitCode === null || Number.isSafeInteger(value.exitCode))
    && typeof value.durationMs === "number" && Number.isFinite(value.durationMs) && value.durationMs >= 0
    && typeof value.timedOut === "boolean"
    && typeof value.outputLimited === "boolean";
}

function isRunnerResponse(value: unknown, expectedCases: number): value is RunnerResponse {
  if (!isRecord(value) || !["ok", "compile_error", "runner_error"].includes(String(value.status))) return false;
  if (typeof value.compilerOutput !== "string" || value.compilerOutput.length > 32_000 || !Array.isArray(value.cases)) return false;
  if (value.status === "ok") return value.cases.length === expectedCases && value.cases.every(isRunnerCase);
  return value.cases.length === 0;
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

export async function gradeLessonCode(
  source: string,
  lesson: Lesson,
  standard: "c++17" | "c++20" | "c++23" = lesson.standard,
  apiToken = "",
): Promise<GradeResult> {
  if (!configuredRunner) {
    return unavailable("このGitHub PagesサイトにC++実行ワーカーのURLが設定されていません。コードはブラウザー内に保存できますが、コンパイル・採点は停止中です。");
  }
  if (!apiToken.trim()) return unavailable("設定画面で実行ワーカーのアクセストークンを登録してください。トークンはこのブラウザーだけに保存されます。");
  if (new TextEncoder().encode(source).byteLength > sourceLimitBytes) {
    return { status: "runner_error", message: "提出コードは32 KB以下にしてください。", cases: [], score: 0, durationMs: 0 };
  }

  try {
    const response = await fetch(`${configuredRunner}/v1/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken.trim()}` },
      body: JSON.stringify({
        source,
        standard,
        tests: lesson.exercise.tests.map((test) => ({ stdin: test.input })),
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const raw = await readJsonLimited(response);
    if (response.status === 503 && isRunnerResponse(raw, lesson.exercise.tests.length) && raw.status === "runner_error") {
      return { status: "runner_error", message: "隔離実行環境でエラーが発生しました。解答の正誤とは分けて確認してください。", compilerOutput: raw.compilerOutput, cases: [], score: 0, durationMs: 0 };
    }
    if (!response.ok) throw new Error(`Runner responded with HTTP ${response.status}`);
    if (!isRunnerResponse(raw, lesson.exercise.tests.length)) throw new Error("Runner response did not match the protocol");
    const result = raw;
    if (result.status === "compile_error") {
      return { status: "compile_error", message: "コンパイルエラーがあります。診断を確認してください。", compilerOutput: result.compilerOutput, cases: [], score: 0, durationMs: 0 };
    }
    if (result.status === "runner_error") {
      return { status: "runner_error", message: "隔離実行環境でエラーが発生しました。解答の正誤とは分けて確認してください。", compilerOutput: result.compilerOutput, cases: [], score: 0, durationMs: 0 };
    }

    const cases = lesson.exercise.tests.map((test, index) => {
      const actual = result.cases[index];
      const passed = actual.exitCode === 0 && !actual.timedOut && !actual.outputLimited
        && normalizeOutput(actual.stdout) === normalizeOutput(test.output);
      return {
        passed,
        expected: test.output,
        actual: actual.stdout,
        stderr: actual.stderr,
        durationMs: actual.durationMs,
        timedOut: actual.timedOut,
        outputLimited: actual.outputLimited,
      };
    });
    const passedCount = cases.filter((test) => test.passed).length;
    const score = cases.length ? Math.round((passedCount / cases.length) * 100) : 0;
    return {
      status: score === 100 ? "passed" : "failed",
      message: score === 100 ? "すべての公開テストに通りました。" : `${cases.length - passedCount}件のテストが一致しませんでした。出力を見直してください。`,
      compilerOutput: result.compilerOutput,
      cases,
      score,
      durationMs: cases.reduce((total, test) => total + test.durationMs, 0),
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

export function hasConfiguredRunner() {
  return Boolean(configuredRunner);
}
