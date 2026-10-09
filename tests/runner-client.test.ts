import { afterEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../src/lib/lessons";

describe("runner grading protocol", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("scores returned stdout against the lesson's expected output", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      compilerOutput: "build succeeded",
      cases: [{ stdout: `${lessons[0].exercise.expectedOutput}\r\n`, stderr: "", exitCode: 0, durationMs: 18, timedOut: false, outputLimited: false }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const result = await gradeLessonCode(lessons[0].exercise.solution, lessons[0], "c++17", "test-runner-token-0123456789-abcdef");

    expect(result.status).toBe("passed");
    expect(result.score).toBe(100);
    expect(result.cases[0].passed).toBe(true);
  });

  it("keeps wrong output separate from compile and infrastructure errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      compilerOutput: "build succeeded",
      cases: [{ stdout: "wrong\n", stderr: "", exitCode: 0, durationMs: 8, timedOut: false, outputLimited: false }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const wrong = await gradeLessonCode("source", lessons[0], "c++17", "test-runner-token-0123456789-abcdef");
    expect(wrong.status).toBe("failed");
    expect(wrong.score).toBe(0);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "compile_error", compilerOutput: "missing semicolon", cases: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const compileError = await gradeLessonCode("source", lessons[0], "c++17", "test-runner-token-0123456789-abcdef");
    expect(compileError.status).toBe("compile_error");
    expect(compileError.score).toBe(0);
  });

  it("never awards points for a time-limited or output-limited case", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      compilerOutput: "",
      cases: [{ stdout: lessons[0].exercise.expectedOutput, stderr: "", exitCode: 0, durationMs: 100, timedOut: true, outputLimited: false }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const result = await gradeLessonCode("source", lessons[0], "c++17", "test-runner-token-0123456789-abcdef");
    expect(result.status).toBe("failed");
    expect(result.score).toBe(0);
  });

  it("requires an access token and sends it only as a bearer header", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok", compilerOutput: "", cases: [{ stdout: lessons[0].exercise.expectedOutput, stderr: "", exitCode: 0, durationMs: 1, timedOut: false, outputLimited: false }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const missing = await gradeLessonCode("source", lessons[0]);
    expect(missing.status).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();

    await gradeLessonCode("source", lessons[0], "c++17", "test-runner-token-0123456789-abcdef");
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(request.headers).get("authorization")).toBe("Bearer test-runner-token-0123456789-abcdef");
    expect(String(request.body)).not.toContain("test-runner-token");
  });
});
