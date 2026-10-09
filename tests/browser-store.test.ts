import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  exportLearnerState,
  clearRunnerApiToken,
  importLearnerState,
  isLearnerState,
  readLearnerState,
  readRunnerApiToken,
  recordSubmission,
  saveLessonDraft,
  saveQuizChoice,
  saveRunnerApiToken,
} from "../src/lib/browser-store";

describe("browser learner state", () => {
  it("saves code and only marks a lesson complete after a pass and correct quiz", async () => {
    const initial = await readLearnerState();
    expect(initial.schemaVersion).toBe(1);

    await saveLessonDraft("w1-d1", "int main() { return 0; }");
    await saveQuizChoice("w1-d1", 1, false);
    await recordSubmission({
      id: "submission-1",
      lessonId: "w1-d1",
      source: "int main() { return 0; }",
      submittedAt: new Date().toISOString(),
      status: "passed",
      score: 100,
    });

    let state = await readLearnerState();
    expect(state.lessons["w1-d1"].draft).toContain("int main");
    expect(state.lessons["w1-d1"].attempts).toBe(1);
    expect(state.lessons["w1-d1"].completedAt).toBeUndefined();

    await saveQuizChoice("w1-d1", 0, true);
    state = await readLearnerState();
    expect(state.lessons["w1-d1"].completedAt).toBeTruthy();
    expect(isLearnerState(state)).toBe(true);
  });

  it("round-trips an export and rejects malformed nested state and unsafe links", async () => {
    const backup = await exportLearnerState();
    const restored = await importLearnerState(backup);
    expect(restored.lessons["w1-d1"].attempts).toBe(1);

    const malformed = structuredClone(restored);
    malformed.settings.studyDaysPerWeek = 99;
    expect(isLearnerState(malformed)).toBe(false);
    await expect(importLearnerState(JSON.stringify(malformed))).rejects.toThrow();

    const unsafeLink = structuredClone(restored);
    unsafeLink.portfolio.push({
      id: "unsafe-link",
      title: "Test",
      summary: "Test",
      technologies: "C++",
      repositoryUrl: "javascript:alert(1)",
      updatedAt: new Date().toISOString(),
    });
    expect(isLearnerState(unsafeLink)).toBe(false);
  });

  it("keeps the runner token out of learner backups", async () => {
    const token = "private-runner-token-0123456789-abcdefghijklmnopqrstuvwxyz";
    await saveRunnerApiToken(token);
    expect(await readRunnerApiToken()).toBe(token);
    const backup = await exportLearnerState();
    expect(backup).not.toContain(token);
    await importLearnerState(backup);
    expect(await readRunnerApiToken()).toBe(token);
    await clearRunnerApiToken();
    expect(await readRunnerApiToken()).toBe("");
    await expect(saveRunnerApiToken("short")).rejects.toThrow(/32〜512文字/);
  });
});
