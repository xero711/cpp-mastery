import { afterEach, describe, expect, it, vi } from "vitest";
import { lessons } from "../src/lib/lessons";

describe("runner grading protocol", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("scores returned stdout against the lesson's expected output", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      compilerOutput: "build succeeded",
      cases: [{ stdout: `${lessons[0].exercise.expectedOutput}\r\n`, stderr: "", exitCode: 0, durationMs: 18 }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const result = await gradeLessonCode(lessons[0].exercise.solution, lessons[0]);

    expect(result.status).toBe("passed");
    expect(result.score).toBe(100);
    expect(result.cases[0].passed).toBe(true);
  });

  it("keeps wrong output separate from compile and infrastructure errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_CPP_RUNNER_URL", "https://runner.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      compilerOutput: "build succeeded",
      cases: [{ stdout: "wrong\n", stderr: "", exitCode: 0, durationMs: 8 }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const { gradeLessonCode } = await import("../src/lib/runner-client");
    const wrong = await gradeLessonCode("source", lessons[0]);
    expect(wrong.status).toBe("failed");
    expect(wrong.score).toBe(0);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "compile_error", compilerOutput: "missing semicolon", cases: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const compileError = await gradeLessonCode("source", lessons[0]);
    expect(compileError.status).toBe("compile_error");
    expect(compileError.score).toBe(0);
  });
});
