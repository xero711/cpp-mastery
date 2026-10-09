import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { lessons } from "../services/runner/data/lesson-source.ts";

if (process.platform !== "win32") {
  console.error("This check requires Windows and Visual Studio C++ Build Tools.");
  process.exit(2);
}

if (!process.env.VCToolsInstallDir) {
  console.error("The Visual Studio developer environment was not initialized.");
  process.exit(2);
}

const tempRoot = mkdtempSync(join(tmpdir(), "cpp-mastery-lesson-check-"));
const resolvedTempRoot = resolve(tempRoot);
const allowedTempRoot = `${resolve(tmpdir())}${sep}`;
if (!resolvedTempRoot.startsWith(allowedTempRoot)) throw new Error("Temporary workspace escaped the OS temp directory.");

const normalize = (value) => value.replace(/\r\n/g, "\n").trimEnd();
const failures = [];
let verifiedExamples = 0;

try {
  for (const lesson of lessons) {
    if (/\b(system|popen|CreateProcess|WinExec|ShellExecute)\s*\(/i.test(lesson.exercise.solution)) {
      failures.push(`${lesson.id}: blocked unsafe reference solution`);
      continue;
    }

    const sourcePath = join(tempRoot, `${lesson.id}.cpp`);
    const executablePath = join(tempRoot, `${lesson.id}.exe`);
    writeFileSync(sourcePath, lesson.exercise.solution, "utf8");
    const compile = spawnSync(
      "cl.exe",
      ["/nologo", "/std:c++17", "/EHsc", `/Fe:${executablePath}`, sourcePath],
      { cwd: tempRoot, encoding: "utf8", timeout: 60_000, maxBuffer: 64_000, windowsHide: true },
    );
    if (compile.error || compile.status !== 0 || !existsSync(executablePath)) {
      failures.push(`${lesson.id}: compile failed\n${compile.stderr ?? ""}${compile.stdout ?? ""}`);
      continue;
    }

    const tests = [...lesson.exercise.tests, ...lesson.exercise.hiddenTests];
    for (const [index, test] of tests.entries()) {
      const run = spawnSync(executablePath, [], {
        cwd: tempRoot,
        input: test.input,
        encoding: "utf8",
        timeout: 3000,
        maxBuffer: 32_000,
        windowsHide: true,
      });
      if (run.error || run.status !== 0 || normalize(run.stdout ?? "") !== normalize(test.output)) {
        failures.push(`${lesson.id} test ${index + 1}: expected ${JSON.stringify(test.output)}, got ${JSON.stringify(run.stdout ?? "")}\n${run.stderr ?? run.error?.message ?? ""}`);
      }
    }

    // Week 9 onward uses complete standalone programs; earlier weeks also use illustrative snippets.
    if (lesson.week >= 9) {
      if (/\b(system|popen|CreateProcess|WinExec|ShellExecute)\s*\(/i.test(lesson.example)) {
        failures.push(`${lesson.id}: blocked unsafe example`);
        continue;
      }

      const exampleSourcePath = join(tempRoot, `${lesson.id}-example.cpp`);
      const exampleExecutablePath = join(tempRoot, `${lesson.id}-example.exe`);
      writeFileSync(exampleSourcePath, lesson.example, "utf8");
      const exampleCompile = spawnSync(
        "cl.exe",
        ["/nologo", "/std:c++17", "/EHsc", `/Fe:${exampleExecutablePath}`, exampleSourcePath],
        { cwd: tempRoot, encoding: "utf8", timeout: 60_000, maxBuffer: 64_000, windowsHide: true },
      );
      if (exampleCompile.error || exampleCompile.status !== 0 || !existsSync(exampleExecutablePath)) {
        failures.push(`${lesson.id} example: compile failed\n${exampleCompile.stderr ?? ""}${exampleCompile.stdout ?? ""}`);
        continue;
      }

      const exampleRun = spawnSync(exampleExecutablePath, [], {
        cwd: tempRoot,
        encoding: "utf8",
        timeout: 3000,
        maxBuffer: 32_000,
        windowsHide: true,
      });
      if (exampleRun.error || exampleRun.status !== 0 || normalize(exampleRun.stdout ?? "") !== normalize(lesson.exampleOutput)) {
        failures.push(`${lesson.id} example: expected ${JSON.stringify(lesson.exampleOutput)}, got ${JSON.stringify(exampleRun.stdout ?? "")}\n${exampleRun.stderr ?? exampleRun.error?.message ?? ""}`);
      } else {
        verifiedExamples += 1;
      }
    }
  }
} finally {
  if (resolvedTempRoot.startsWith(allowedTempRoot)) rmSync(resolvedTempRoot, { recursive: true, force: true });
}

if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`Verified ${lessons.length} reference solutions, ${verifiedExamples} standalone Week 9–15 examples, and ${lessons.reduce((count, lesson) => count + lesson.exercise.tests.length, 0)} public plus ${lessons.reduce((count, lesson) => count + lesson.exercise.hiddenTests.length, 0)} hidden test cases with Visual Studio C++.`);
