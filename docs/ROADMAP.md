# Roadmap

## Phase 0 — architecture and product boundary

- [x] Confirm repository state and installed toolchain.
- [x] Choose a static Next.js export so GitHub Pages can host it.
- [x] Define browser-local persistence and an external runner boundary.
- [x] Create architecture, requirements, curriculum, data, security, and progress docs.

## Phase 1 — static foundation

- [x] Japanese application shell and navigation.
- [x] Static export and GitHub Pages workflow.
- [ ] Verify build and preview all routes.
- [ ] Responsive and accessibility review.

## Phase 2 — learning core

- [x] Full 104-week plan and seven day slots per week.
- [ ] Author and review all 28 lessons for Weeks 1–4.
- [ ] Persist in-progress state and completed learning locally.
- [ ] Add assessment, review schedule, and data-driven analytics.

## Phase 3 — compile/run

- [ ] Implement the external runner protocol as a separate service.
- [ ] Add strict resource limits, isolated execution, timeout/cancel, and output caps.
- [ ] Validate on Docker Desktop/WSL2; the current host has neither Docker CLI nor a WSL distribution.
- [ ] Deploy runner independently over HTTPS and test cross-origin access from GitHub Pages.

## Phase 4 — AI and adaptive instruction

- [ ] Add a server-side provider adapter with optional OpenAI/local-provider support.
- [ ] Add structured lesson generation and validation jobs.
- [ ] Add context-limited mentor modes and user-confirmed plan changes.

## Phase 5 — projects and career practice

- [ ] Project task/review workflow.
- [ ] Portfolio entries and Markdown export.
- [ ] Skill evidence, confidence, and periodic assessments.
- [ ] Interview and timed exercise modes.

## Phase 6 — synchronization and production readiness

- [ ] Optional authenticated multi-device sync and database migrations.
- [ ] Add comprehensive unit, integration, and end-to-end coverage.
- [ ] Backup/restore drills, accessibility, privacy, and security review.
- [ ] Verify the published GitHub Pages URL and configured runner on the exact repository.
