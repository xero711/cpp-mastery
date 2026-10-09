import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../services/runner/data/lesson-source.ts";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputRoot = join(root, "out");
const assets = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(?:html|js|json)$/.test(entry.name)) assets.push(path);
  }
}

await walk(outputRoot);
const payload = (await Promise.all(assets.map((path) => readFile(path, "utf8")))).join("\n");
const publicJson = await readFile(join(root, "src", "lib", "lessons.public.json"), "utf8");
const publicLessons = JSON.parse(publicJson);

assert.equal(publicLessons.length, lessons.length);
for (const lesson of publicLessons) {
  assert.equal(Object.hasOwn(lesson.quiz, "answer"), false, `${lesson.id} quiz answer leaked into public JSON`);
  assert.equal(Object.hasOwn(lesson.exercise, "solution"), false, `${lesson.id} solution leaked into public JSON`);
  assert.equal(Object.hasOwn(lesson.exercise, "hiddenTests"), false, `${lesson.id} hidden tests leaked into public JSON`);
  assert.equal(Object.hasOwn(lesson.debug, "fix"), false, `${lesson.id} debug fix leaked into public JSON`);
  assert.equal(Object.hasOwn(lesson.debug, "explanation"), false, `${lesson.id} debug explanation leaked into public JSON`);
}

for (const lesson of lessons) {
  for (const secret of [lesson.exercise.solution, lesson.debug.fix]) {
    const encoded = JSON.stringify(secret).slice(1, -1);
    if (secret.length >= 24) assert.equal(payload.includes(secret) || payload.includes(encoded), false, `${lesson.id} private answer leaked into GitHub Pages assets`);
  }
  for (const test of lesson.exercise.hiddenTests) {
    const encodedCase = JSON.stringify(test);
    assert.equal(payload.includes(encodedCase), false, `${lesson.id} hidden test leaked into GitHub Pages assets`);
  }
}

console.log(`Verified ${assets.length} GitHub Pages assets contain no private answers or hidden grading cases.`);
