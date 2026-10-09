# Requirements and current scope

## Learner profile

Japanese game-programming student starting from C fundamentals, studying about six days per week for two years, with Windows as the main development platform. The curriculum is evidence-based: elapsed time alone never implies professional readiness.

## Product requirements

- Japanese-first interface; desktop IDE layout and responsive review screens.
- 104 weeks with seven day records each; clear lesson, exercise, grading, and progress boundaries.
- First four weeks contain authored lesson material, examples, quizzes, practice prompts, hints, reference solutions, and expected output.
- Persist drafts, answers, submissions, and completed lessons locally; provide portable JSON backup.
- Display real compiler/test results distinctly from explanations.
- Do not show invented progress or skill scores.
- Keep AI optional and keep all provider credentials server-side.
- Never execute submitted C++ in the static site or in the Next.js build/runtime.
- Publish the static frontend through GitHub Pages Actions.

## GitHub Pages constraint

Pages serves static HTML, CSS, and JavaScript. It does not host the app's API, database, C++ toolchain, or private AI keys. Learner data is therefore browser-local in this phase. Real C++ compile/run is conditional on a separately deployed sandbox worker configured by the repository owner. With no worker URL, the site must report that execution is unavailable rather than showing simulated results.

## Current delivery boundary

The static product, curriculum, browser persistence, first lessons, isolated C++ runner implementation, and a separately configured AI mentor service are implemented. The runner and mentor are not publicly hosted from this repository. Mentor provider transport is covered with mocked tests; a real local Ollama CPU-only inference succeeded, but GPU inference failed during CUDA startup, OpenAI has not been called, and a public per-user access boundary is not configured. Account sync and the remaining learning modules are tracked in `ROADMAP.md` and `NEXT_STEPS.md` and are not represented as complete.
