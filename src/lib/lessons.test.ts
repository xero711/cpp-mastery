import { describe, expect, it } from "vitest";
import { lessons } from "./lessons";
import privateRegistry from "../../services/runner/data/lesson-registry.json";

describe("public lesson payload", () => {
  it("contains no code solution, debug fix, or hidden grading fields", () => {
    expect(lessons).toHaveLength(77);
    for (const lesson of lessons) {
      expect(Number.isInteger(lesson.quiz.answer)).toBe(true);
      expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(lesson.quiz.answer).toBeLessThan(lesson.quiz.choices.length);
      expect(lesson.exercise).not.toHaveProperty("solution");
      expect(lesson.exercise).not.toHaveProperty("hiddenTests");
      expect(lesson.debug).not.toHaveProperty("fix");
      expect(lesson.debug).not.toHaveProperty("explanation");
    }
  });

  it("keeps the authored first four weeks complete with public examples and hints", () => {
    const firstFourWeeks = lessons.filter((lesson) => lesson.week <= 4);
    expect(firstFourWeeks).toHaveLength(28);
    expect(firstFourWeeks.every((lesson) => lesson.exercise.tests.length > 0)).toBe(true);
    expect(firstFourWeeks.every((lesson) => lesson.exercise.hints.length === 3)).toBe(true);
    expect(firstFourWeeks.every((lesson) => Boolean(privateRegistry.find((item) => item.id === lesson.id)?.hiddenTests.length))).toBe(true);
    expect(lessons.every((lesson) => Boolean(privateRegistry.find((item) => item.id === lesson.id)?.hiddenTests.length))).toBe(true);
  });
});
