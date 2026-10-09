import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../services/runner/data/lesson-source.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicLessons = lessons.map((lesson) => {
  return {
    id: lesson.id,
    version: lesson.version,
    week: lesson.week,
    day: lesson.day,
    title: lesson.title,
    subject: lesson.subject,
    difficulty: lesson.difficulty,
    prerequisites: lesson.prerequisites,
    goal: lesson.goal,
    minutes: lesson.minutes,
    explanation: lesson.explanation,
    example: lesson.example,
    exampleOutput: lesson.exampleOutput,
    commonMistake: lesson.commonMistake,
    quiz: { question: lesson.quiz.question, choices: lesson.quiz.choices, answer: lesson.quiz.answer, explanation: lesson.quiz.explanation },
    exercise: {
      prompt: lesson.exercise.prompt,
      starter: lesson.exercise.starter,
      input: lesson.exercise.input,
      expectedOutput: lesson.exercise.expectedOutput,
      tests: lesson.exercise.tests,
      hints: lesson.exercise.hints,
    },
    debug: { code: lesson.debug.code },
  };
});
const privateLessons = lessons.map((lesson) => ({
  id: lesson.id,
  standard: lesson.standard,
  solution: lesson.exercise.solution,
  debugFix: lesson.debug.fix,
  debugExplanation: lesson.debug.explanation,
  tests: lesson.exercise.tests,
  hiddenTests: lesson.exercise.hiddenTests,
}));

async function writeJson(path, value) {
  const output = resolve(root, path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

await Promise.all([
  writeJson("src/lib/lessons.public.json", publicLessons),
  writeJson("services/runner/data/lesson-registry.json", privateLessons),
]);
console.log(`Generated ${publicLessons.length} public lessons and private grading records.`);
