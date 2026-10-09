import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../src/lib/lessons";

const token = "test-runner-token-0123456789-abcdef";
const publicCase = (stdout: string, passed: boolean) => ({
  passed,
  stdout,
  stderr: "",
  exitCode: 0,
  durationMs: 18,
  timedOut: false,
  outputLimited: false,
});

describe("runner client privacy boundary", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("allows HTTPS runners and HTTP only on loopback", async () => {
    const { normalizeRunnerUrl } = await import("../src/lib/runner-client");

    expect(normalizeRunnerUrl("https://runner.example.com/")).toBe("https://runner.example.com");
    expect(normalizeRunnerUrl("http://127.0.0.1:8081")).toBe("http://127.0.0.1:8081");
    expect(normalizeRunnerUrl("http://localhost:8081")).toBe("http://localhost:8081");
    expect(normalizeRunnerUrl("http://[::1]:8081")).toBe("http://[::1]:8081");
    expect(normalizeRunnerUrl("http://192.168.1.8:8081")).toBe("");
    expect(normalizeRunnerUrl("http://localhost.example.com:8081")).toBe("");
    expect(normalizeRunnerUrl("https://user:password@runner.example.com")).toBe("");
    expect(normalizeRunnerUrl("https://runner.example.com?token=secret")).toBe("");
  });

  it("uses the browser-local runner URL override before the build default", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => key === "cpp-mastery-runner-url" ? "http://127.0.0.1:8081" : null },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "passed",
      message: "採点成功",
      compilerOutput: "",
      cases: [publicCase(`${lessons[0].exercise.expectedOutput}\n`, true)],
      score: 100,
      durationMs: 4,
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { gradeLessonCode } = await import("../src/lib/runner-client");
    expect((await gradeLessonCode("source", lessons[0], "c++17", token)).status).toBe("passed");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:8081/v1/grade");
  });

  it("sends only source, lesson id, and standard to server-owned grading", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "passed",
      message: "公開テストと非公開テストにすべて通りました。",
      compilerOutput: "build succeeded",
      cases: [publicCase(`${lessons[0].exercise.expectedOutput}\r\n`, true)],
      score: 100,
      durationMs: 18,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const result = await gradeLessonCode("user source", lessons[0], "c++17", token);

    expect(result.status).toBe("passed");
    expect(result.score).toBe(100);
    expect(result.cases[0].passed).toBe(true);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://runner.example/v1/grade");
    expect(JSON.parse(String(request.body))).toEqual({ lessonId: lessons[0].id, source: "user source", standard: "c++17" });
    expect(new Headers(request.headers).get("authorization")).toBe(`Bearer ${token}`);
  });

  it("preserves server verdicts for wrong output, compile errors, and runner failures", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "failed", message: "1件の公開テストに不一致があります。", compilerOutput: "", cases: [publicCase("wrong\n", false)], score: 0, durationMs: 8,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "compile_error", message: "コンパイルエラーがあります。", compilerOutput: "missing semicolon", cases: [], score: 0, durationMs: 0,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: "runner_error", message: "隔離実行環境でエラーが発生しました。", compilerOutput: "", cases: [], score: 0, durationMs: 0,
      }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const { gradeLessonCode } = await import("../src/lib/runner-client");
    expect((await gradeLessonCode("source", lessons[0], "c++17", token)).status).toBe("failed");
    expect((await gradeLessonCode("source", lessons[0], "c++17", token)).status).toBe("compile_error");
    expect((await gradeLessonCode("source", lessons[0], "c++17", token)).status).toBe("runner_error");
  });

  it("requires an access token before making a request", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { gradeLessonCode } = await import("../src/lib/runner-client");

    const missing = await gradeLessonCode("source", lessons[0]);
    expect(missing.status).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses an explicit endpoint only when revealing a private answer", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ solution: "shown after click" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { revealLessonAnswer } = await import("../src/lib/runner-client");

    expect(await revealLessonAnswer("w1-d1", "solution", token)).toEqual({ solution: "shown after click" });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["https://runner.example/v1/reveal"]);
  });
});
