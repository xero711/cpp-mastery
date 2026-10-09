import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  buildReviewQueue,
  countDueReviews,
  createInitialReviewSchedule,
  isReviewSchedule,
  recordReviewEvidence,
} from "../src/lib/review-schedule";

describe("spaced review schedule", () => {
  it("starts failures tomorrow and advances only after a fresh correct quiz and passed exercise", () => {
    const first = createInitialReviewSchedule("2026-10-09");
    expect(first).toEqual({ dueOn: "2026-10-10", intervalDays: 1, repetitions: 0, lapses: 0 });
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");

    const quiz = recordReviewEvidence(first, { kind: "quiz", correct: true }, "2026-10-10");
    expect(quiz?.dueOn).toBe("2026-10-10");
    expect(quiz?.reviewQuizCorrect).toBe(true);
    expect(quiz?.reviewExercisePassed).toBe(false);

    const passed = recordReviewEvidence(quiz, { kind: "exercise", correct: true }, "2026-10-10");
    expect(passed).toEqual({ dueOn: "2026-10-13", intervalDays: 3, repetitions: 1, lapses: 0, lastReviewedOn: "2026-10-10" });

    const nextQuiz = recordReviewEvidence(passed, { kind: "quiz", correct: true }, "2026-10-13");
    const nextPass = recordReviewEvidence(nextQuiz, { kind: "exercise", correct: true }, "2026-10-13");
    expect(nextPass).toMatchObject({ dueOn: "2026-10-20", intervalDays: 7, repetitions: 2 });
  });

  it("resets the interval after a miss and counts at most one lapse per day", () => {
    const schedule = { dueOn: "2026-10-10", intervalDays: 7, repetitions: 2, lapses: 0, lastReviewedOn: "2026-10-03" };
    const missed = recordReviewEvidence(schedule, { kind: "quiz", correct: false }, "2026-10-12");
    expect(missed).toEqual({
      dueOn: "2026-10-13",
      intervalDays: 1,
      repetitions: 0,
      lapses: 1,
      lastReviewedOn: "2026-10-03",
      lastMissedOn: "2026-10-12",
    });
    expect(recordReviewEvidence(missed, { kind: "exercise", correct: false }, "2026-10-12")?.lapses).toBe(1);
    expect(isReviewSchedule(missed)).toBe(true);
    expect(isReviewSchedule({ ...missed, dueOn: "2026-02-30" })).toBe(false);
  });

  it("keeps upcoming reviews, deduplicates failed submissions, and includes legacy failures as due", () => {
    const lessons = {
      "w1-d1": { lessonId: "w1-d1", draft: "", attempts: 1, reviewSchedule: createInitialReviewSchedule("2026-10-09") },
    };
    const submissions = [
      { id: "old", lessonId: "w1-d1", source: "old", submittedAt: "2026-10-08T00:00:00.000Z", status: "failed" as const, stdout: "old" },
      { id: "new", lessonId: "w1-d1", source: "new", submittedAt: "2026-10-09T00:00:00.000Z", status: "compile_error" as const, compilerOutput: "latest" },
      { id: "legacy", lessonId: "w1-d2", source: "bad", submittedAt: "2026-10-09T00:00:00.000Z", status: "failed" as const },
      { id: "recovered", lessonId: "w1-d3", source: "fixed", submittedAt: "2026-10-09T01:00:00.000Z", status: "passed" as const },
      { id: "old-failure", lessonId: "w1-d3", source: "bad", submittedAt: "2026-10-08T00:00:00.000Z", status: "failed" as const },
    ];
    const queue = buildReviewQueue(lessons, submissions, "2026-10-09");
    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({ lessonId: "w1-d2", dueOn: "2026-10-09", legacy: true });
    expect(queue[1]).toMatchObject({ lessonId: "w1-d1", dueOn: "2026-10-10", latestIssue: { compilerOutput: "latest" } });
    expect(countDueReviews(lessons, submissions, "2026-10-09")).toBe(1);
  });
});
