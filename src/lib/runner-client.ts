import type { Lesson } from "@/lib/lessons";

export type RunnerCaseResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut?: boolean;
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
  cases: { passed: boolean; expected: string; actual: string; stderr: string; durationMs: number }[];
  score: number;
  durationMs: number;
};

const configuredRunner = process.env.NEXT_PUBLIC_CPP_RUNNER_URL?.trim().replace(/\/$/, "");
const sourceLimitBytes = 32_000;

function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

export async function gradeLessonCode(source: string, lesson: Lesson, standard: "c++17" | "c++20" | "c++23" = lesson.standard): Promise<GradeResult> {
  if (!configuredRunner) {
    return {
      status: "unavailable",
      message: "このGitHub PagesサイトにC++実行ワーカーが設定されていません。コードはブラウザー内に保存できますが、コンパイル・採点は停止中です。",
      cases: [],
      score: 0,
      durationMs: 0,
    };
  }
  if (new TextEncoder().encode(source).byteLength > sourceLimitBytes) {
    return { status: "runner_error", message: "提出コードは32 KB以下にしてください。", cases: [], score: 0, durationMs: 0 };
  }

  try {
    const response = await fetch(`${configuredRunner}/v1/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        standard,
        tests: lesson.exercise.tests.map((test) => ({ stdin: test.input })),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Runner responded with HTTP ${response.status}`);
    const result = await response.json() as RunnerResponse;
    if (!result || !["ok", "compile_error", "runner_error"].includes(result.status) || !Array.isArray(result.cases)) {
      throw new Error("Runner response did not match the protocol");
    }
    if (result.status === "compile_error") {
      return { status: "compile_error", message: "コンパイルエラーがあります。診断を確認してください。", compilerOutput: result.compilerOutput, cases: [], score: 0, durationMs: 0 };
    }
    if (result.status === "runner_error") {
      return { status: "runner_error", message: "実行環境でエラーが発生しました。解答の正誤とは分けて確認してください。", compilerOutput: result.compilerOutput, cases: [], score: 0, durationMs: 0 };
    }

    const cases = lesson.exercise.tests.map((test, index) => {
      const actual = result.cases[index];
      const stdout = actual?.stdout ?? "";
      const passed = actual?.exitCode === 0 && !actual?.timedOut && normalizeOutput(stdout) === normalizeOutput(test.output);
      return { passed, expected: test.output, actual: stdout, stderr: actual?.stderr ?? "", durationMs: actual?.durationMs ?? 0 };
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
