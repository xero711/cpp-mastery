# Roadmap

## Phase 0 — architecture and product boundary

- [x] Confirm repository state and installed toolchain.
- [x] Choose a static Next.js export so GitHub Pages can host it.
- [x] Define browser-local persistence and an external runner boundary.
- [x] Create architecture, requirements, curriculum, data, security, and progress docs.

## Phase 1 — static foundation

- [x] Japanese application shell and navigation.
- [x] Static export and GitHub Pages workflow.
- [x] Build and prerender all 743 routes; dashboard and lesson browser flows were reviewed locally.
- [ ] Responsive and accessibility review.

## Phase 2 — learning core

- [x] Full 104-week plan and seven day slots per week.
- [x] Author 28 lessons for Weeks 1–4 and compile/run their reference answers against all 28 public cases.
- [x] Persist drafts, quiz answers, submissions, lesson completion, and portable JSON backup/restore locally.
- [x] Add quiz/exercise assessment and a browser-local spaced review schedule.

## Phase 3 — compile/run

- [x] Implement the external runner protocol as a separate authenticated Node service.
- [x] Implement disposable Docker execution, no-network/non-root/read-only sandbox flags, and request, CPU, memory, process, address-space, timeout, and output limits.
- [x] Pass Docker-backed compile/run and isolation integration tests in GitHub Actions; the current host has neither Docker CLI nor a WSL distribution.
- [x] Keep reference solutions, debug fixes, and hidden tests out of the GitHub Pages payload; run multiple-choice checks from pre-authored lesson data so they work offline.
- [ ] Deploy runner independently with gVisor over HTTPS and verify cross-origin access from GitHub Pages.

## Phase 4 — AI and adaptive instruction

- [x] Add a separate streaming service for OpenAI Responses API and Ollama; keep provider keys server-side.
- [x] Add eight selectable mentor modes, explicit optional context attachment, local chat history, and usage/cost reporting.
- [x] Cover auth, Origin allowlisting, bounded inputs, provider streaming, and response privacy with automated tests.
- [ ] Deploy the mentor behind HTTPS with per-user authorization, budget limits, monitoring, and abuse response before public access.
- [ ] Add structured lesson generation and validation jobs.
- [ ] Add learner-confirmed plan changes; the current Planner mode only proposes changes in conversation.

## Phase 5 — projects and career practice

- [ ] Project task/review workflow.
- [ ] Portfolio entries and Markdown export.
- [ ] Skill evidence, confidence, and periodic assessments.
- [ ] Interview and timed exercise modes.

## Phase 6 — synchronization and production readiness

- [ ] Optional authenticated multi-device sync and database migrations.
- [ ] Add comprehensive browser end-to-end coverage for compile/grade/reveal against the deployed runner.
- [ ] Backup/restore drills, accessibility, privacy, and security review.
- [ ] Verify the published GitHub Pages URL and configured runner on the exact repository.
