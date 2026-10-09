import { describe, expect, it } from "vitest";
import { curriculumDays, curriculumWeeks } from "../src/lib/curriculum";
import { lessons } from "../src/lib/lessons";

describe("curriculum and authored lesson set", () => {
  it("contains 104 weeks and 728 scheduled learning days", () => {
    expect(curriculumWeeks).toHaveLength(104);
    expect(curriculumDays).toHaveLength(728);
    expect(curriculumWeeks.every((week) => week.days.length === 7)).toBe(true);
  });

  it("provides complete lesson records for each of the first 28 days", () => {
    expect(lessons).toHaveLength(28);
    expect(lessons.map((lesson) => lesson.id)).toEqual(
      Array.from({ length: 28 }, (_, index) => `w${Math.floor(index / 7) + 1}-d${index % 7 + 1}`),
    );
    for (const lesson of lessons) {
      expect(lesson.explanation.trim()).not.toBe("");
      expect(lesson.example.trim()).not.toBe("");
      expect(lesson.quiz.choices.length).toBeGreaterThan(1);
      expect(lesson.quiz.answer).toBeGreaterThanOrEqual(0);
      expect(lesson.quiz.answer).toBeLessThan(lesson.quiz.choices.length);
      expect(lesson.exercise.tests.length).toBeGreaterThan(0);
      expect(typeof lesson.exercise.expectedOutput).toBe("string");
      expect(lesson.exercise.tests[0].output).toBe(lesson.exercise.expectedOutput);
      expect(lesson.exercise.hints).toHaveLength(3);
    }
  });
});
