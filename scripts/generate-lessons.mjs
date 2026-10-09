import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../services/runner/data/lesson-source.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicLessons = lessons.map((lesson) => {
  const { quiz, exercise, debug, ...publicLesson } = lesson;
  return {
    ...publicLesson,
    quiz: { question: quiz.question, choices: quiz.choices, answer: quiz.answer, explanation: quiz.explanation },
    exercise: {
      prompt: exercise.prompt,
      starter: exercise.starter,
      input: exercise.input,
      expectedOutput: exercise.expectedOutput,
      tests: exercise.tests,
      hints: exercise.hints,
    },
    debug: { code: debug.code },
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
