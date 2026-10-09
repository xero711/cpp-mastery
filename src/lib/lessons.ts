import publicLessons from "./lessons.public.json";

export type Lesson = {
  id: string;
  version: 1;
  week: number;
  day: number;
  title: string;
  subject: string;
  difficulty: "入門" | "基礎";
  prerequisites: string[];
  goal: string;
  minutes: number;
  explanation: string;
  example: string;
  exampleOutput: string;
  commonMistake: string;
  quiz: { question: string; choices: string[]; answer: number; explanation: string };
  exercise: {
    prompt: string;
    starter: string;
    input: string;
    expectedOutput: string;
    tests: { input: string; output: string }[];
    hints: [string, string, string];
  };
  debug: { code: string };
  standard: "c++17";
};

export const lessons = publicLessons as unknown as Lesson[];

export function findLesson(week: number, day: number) {
  return lessons.find((lesson) => lesson.week === week && lesson.day === day);
}
