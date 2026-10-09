# Progress

## 2026-10-09 — initial implementation session

- Read the full product specification in the referenced attachment.
- Confirmed the workspace was empty and not a Git checkout.
- Scaffolded Next.js 16.4 / React 19.3 / TypeScript 5.9 with pnpm; added Monaco and Lucide dependencies.
- Changed the delivery target to a static GitHub Pages export after the hosting requirement arrived.
- Confirmed GitHub Pages cannot provide server APIs or run the C++ compiler. The host lacks Docker and a WSL distribution; Visual Studio C++ exists but is not used to execute learner code without isolation.
- Implemented the responsive Japanese learning shell, 104-week / 728-day curriculum, 28 authored Week 1–4 lessons, Monaco editor, local progress and backup/restore, and the optional runner client. Week 4 content was corrected to seven days after the curriculum test found an extra lesson.
- Added the GitHub Pages Actions workflow, static export, dynamic project `basePath`, and generated Monaco asset copy. No repository remote was present when implementation began.
- Added Vitest coverage for curriculum counts and lesson shapes, IndexedDB progress/completion, import validation, and runner response scoring using mocked worker responses.
- `pnpm lint`: passed after excluding generated Monaco vendor files.
- `pnpm test`: passed (3 files, 6 tests).
- `pnpm verify:lessons`: passed; Visual Studio C++ compiled and ran all 28 authored reference solutions against all 28 public test cases.
- `pnpm build`: passed and generated all 743 static pages/routes. A build with `GITHUB_REPOSITORY=xero711/cpp-mastery` emitted `/cpp-mastery/`-prefixed links, Next assets, and favicon paths.
- Browser review at `http://localhost:3000/`: dashboard and Week 1 Day 1 rendered; a C++ draft and correct quiz answer survived reload; no browser console errors; the unconfigured runner state appeared as unavailable and did not assign a score.
- Created and pushed the public repository `https://github.com/xero711/cpp-mastery`; the existing `xero711.github.io` user-site repository was not changed.
- GitHub Pages is configured for workflow deployment. Runs `37899850352` and `37900037385` completed successfully; the workflow uses pinned Ubuntu 24.04 and current Node 24 action runtimes. GitHub Pages reports `http://xero-x.me/cpp-mastery/` and `https_enforced=false`. `https://xero711.github.io/cpp-mastery/` redirects to that custom-domain path, where Cloudflare's browser challenge prevented automated content inspection. Enabling GitHub's HTTPS enforcement was rejected because the Pages certificate does not exist yet.
- Real learner-code compile/run, detailed Week 5–104 lessons, AI mentor, and account sync remain unimplemented. The local machine has no Docker or WSL distribution, and no runner URL is configured.

## Acceptance evidence

Verified: static export, lint, current automated tests, 56 authored C++ reference solutions against 110 public test cases, root and project-prefix asset/link generation, local browser rendering, IndexedDB draft/quiz persistence across reload, honest runner-unavailable behavior, public repository push, and successful GitHub Pages workflow deployments.

Not yet accepted: learner code compiled and graded through an isolated service, public-page content in a normal browser (Cloudflare challenge blocked this environment), enforced HTTPS for the project Pages site, the full unit/integration/E2E suite from the product brief, and detailed lesson content after Week 8.

## 2026-10-09 — isolated runner implementation

- Added a separate Node.js runner API and one-shot Python compile/execute worker. The browser calls the API with a bearer token and receives bounded compiler and execution output; the browser keeps expected outputs and compares the public lesson cases locally.
- Added a digest-pinned official GCC 16.2 sandbox image. Every public test case gets its own container with no network or host mounts, read-only root filesystem, a 64 MB work tmpfs, UID/GID 65532, dropped capabilities, no-new-privileges, the built-in seccomp profile, Docker memory/CPU/PID limits, process limits, output caps, and compile/run timeouts. UBSan and libstdc++ assertions are enabled. AddressSanitizer is not exposed yet.
- Production configuration fails closed unless Docker has gVisor `runsc`, the image uses a SHA-256 digest, the site origin is HTTPS and explicitly allowed, and the API token is at least 32 characters. Docker-backed CI is allowed to use `runc` only on the isolated GitHub-hosted test VM; this is not production deployment evidence.
- Added per-user browser token entry in Settings. It is stored in a separate IndexedDB object store and excluded from progress backups. UI inspection on `http://localhost:3001/settings/` confirmed the token field, save/delete controls, unset URL status, and local-storage warning render in Japanese.
- Expanded automated coverage: `pnpm test` passed (3 Vitest files / 9 tests and 9 Node API tests); `pnpm lint` passed; `pnpm build` passed and generated 743 static pages. `git diff --check` found no whitespace errors. The Docker integration suite covers C++17/20/23, compiler errors, timeout, output limit, network isolation, identity, memory, and per-case filesystem isolation.
- GitHub Actions runner run [37903323633](https://github.com/xero711/cpp-mastery/actions/runs/37903323633) passed on Ubuntu 24.04: pinned image build, API tests, and actual C++17/20/23 compile/run plus error, timeout, output, network, UID/GID, memory, and per-case filesystem checks. The CI Docker runtime is `runc` on GitHub's isolated test VM; this is CI evidence, not production gVisor acceptance.
- Pages run [37903323684](https://github.com/xero711/cpp-mastery/actions/runs/37903323684) passed lint, application/API tests, static build, and deployment. The GitHub Pages API still reports `https_enforced=false` and `http://xero-x.me/cpp-mastery/`; the Cloudflare challenge and certificate limitation recorded above remain.
- Docker integration has not run on this PC because Docker Desktop and a WSL distribution are absent. The public runner remains undeployed; no Linux host, gVisor runtime, HTTPS endpoint, or cloud credentials are available here.

Acceptance evidence for this implementation: local browser rendering of the runner credential controls, frontend and API unit tests, lint, static build, production-configuration rejection tests, successful GitHub Docker integration, and a successful Pages deployment. Pending: a production gVisor deployment, end-to-end C++ execution through the hosted site, HTTPS enforcement for the custom-domain Pages URL, and live public-page inspection beyond the Cloudflare challenge.

## 2026-10-09 — browser-local spaced review

- Added a persisted review schedule for failed understanding checks and failed/compile-error submissions. Initial misses are due the next day. After the due date, the schedule advances only when a fresh quiz answer is correct and a public test submission passes; successful intervals are 1, 3, 7, 14, 30, and 60 days, while a miss resets the interval to one day.
- The Review Center now shows due and upcoming items, the next review date, interval, recent compiler/test evidence, and a link back to the lesson. The dashboard count uses the same due queue. Old backup records remain valid because review data is optional; new review schedules round-trip through existing exports.
- `pnpm test`: passed (4 Vitest files / 14 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `git diff --check`: passed.
- Local browser review confirmed that answering Week 6 Day 1 incorrectly saves a next-day review and renders it as an upcoming item in Review Center. Unit tests confirmed both quiz and passed exercise are required to advance the interval, a miss resets it, queue items are deduplicated, and legacy failures stay due until reviewed.
- Browser-local scheduling is implemented. Full multi-day E2E replay and independent user accounts are not yet verified; state remains local to each browser profile.

## 2026-10-09 — Week 5 daily lessons

- Authored all seven Week 5 lessons on function declarations, arguments, return values, boolean predicates, local scope, combined functions, and a short review challenge. Each lesson includes Japanese instruction, worked code/output, a quiz, a coding task and solution, hints, and a debugging task. Public test cases cover representative inputs; the review score is capped at 100.
- The course now contains 35 complete daily lesson records with 35 reference solutions and 47 public test cases. The code exercise week filter is generated from authored lesson data and displays Week 5 only when it has lessons.
- `pnpm test`: passed (3 Vitest files / 9 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `pnpm verify:lessons`: passed; Visual Studio C++ compiled all 35 reference programs and checked all 47 public cases.
- Local browser review confirmed Week 5 Day 1 lesson content and that the practice week filter offers Week 5 with seven Week 5 tasks.
- Commit `32f3595` was deployed successfully by the GitHub Pages workflow ([run 37904617941](https://github.com/xero711/cpp-mastery/actions/runs/37904617941)); lint, application/API tests, static export, artifact upload, and deployment all passed.
- At this Week 5 checkpoint, Weeks 6–104 still had planned topics and daily templates but no complete authored lessons. The isolated runner passed Docker integration in GitHub Actions, but no production gVisor service was deployed.

## 2026-10-09 — Week 6 daily lessons

- Authored all seven lessons on `std::array` indexing and traversal, `std::string`, line input with `std::getline`, pointer addresses and dereferencing, pointer traversal, and passing a pointer plus element count to a function.
- The course now contains 42 complete daily lessons and reference solutions, with 68 public test cases. Lessons explain array bounds, the one-past pointer rule, pointer lifetime, and why a raw pointer does not carry an element count.
- `pnpm test`: passed (3 Vitest files / 9 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `pnpm verify:lessons`: passed; Visual Studio C++ compiled all 42 reference programs and checked all 68 public cases.
- Local browser review confirmed the Week 6 Day 1 Japanese lesson, C++ example, quiz, debugging task, exercise, public-test count, and editor loaded. The runner-unavailable state remains explicit because no production runner endpoint is configured.
- Weeks 7–104 still have weekly topics and daily templates, not authored daily lessons. No production gVisor runner is deployed.

## 2026-10-09 — Week 7 daily lessons

- Authored all seven lessons on reference aliases, multiple references to one object, const references, value-copy parameters, mutable reference parameters, parameter intent, and a weekly score-update exercise.
- The course now contains 49 complete daily lessons and reference solutions, with 89 public test cases. The exercises distinguish caller-visible changes from local copies and use `const std::string&` for read-only string parameters.
- `pnpm test`: passed (4 Vitest files / 14 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `pnpm verify:lessons`: passed; Visual Studio C++ compiled all 49 reference programs and checked all 89 public cases. `git diff --check`: passed.
- Local browser review confirmed the Week 7 Day 1 Japanese lesson, code example, quiz, debugging task, exercise, public-test count, and editor loaded. The practice page offered Week 7 and filtering it displayed exactly seven tasks.
- The site continues to publish through GitHub Pages. Commit `a988ed9` deployed successfully in [run 37906719970](https://github.com/xero711/cpp-mastery/actions/runs/37906719970); lint, application/API tests, static export, artifact upload, and deployment all passed.
- A fresh browser check of `https://xero711.github.io/cpp-mastery/` redirected to the custom domain and displayed Cloudflare's security challenge, so the deployed lesson content could not be inspected in this environment. GitHub reports `https_enforced=false`.
- At this Week 7 checkpoint, Weeks 8–104 still had weekly topics and daily templates, not authored daily lessons. No production gVisor runner was deployed.

## 2026-10-09 — Week 8 daily lessons

- Authored seven lessons on `struct` members and aggregate initialization, `enum class`, namespaces, deriving a typed state from a struct, returning a small struct by value, and combining the types in a game combat example.
- The course now contains 56 complete daily lessons and reference solutions, with 110 public test cases. The week emphasizes named state, explicit enum mappings, namespace qualification, and value-return versus reference mutation.
- `pnpm test`: passed (4 Vitest files / 14 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `pnpm verify:lessons`: passed; Visual Studio C++ compiled all 56 reference programs and checked all 110 public cases.
- Local browser review confirmed the Week 8 Day 7 Japanese lesson, typed quiz, debugging task, integrated combat exercise, and editor rendered. The practice page listed Week 8 and filtering it showed seven tasks.
- Commit `e9bc15f` deployed successfully to GitHub Pages in [run 37907927815](https://github.com/xero711/cpp-mastery/actions/runs/37907927815); lint, application/API tests, static export, artifact upload, and deployment all passed.
- Weeks 9–104 still have weekly topics and daily templates, not authored daily lessons. No production gVisor runner is deployed; current GitHub Actions variables and secrets are empty.

## 2026-10-09 — backup/restore browser E2E

- Added a Chromium Playwright E2E that saves learner progress, exports a backup, checks the runner token is absent, changes the answer, imports the backup, and verifies the saved answer and separate token are restored correctly.
- The Pages workflow now installs Chromium and runs this E2E before the static build. `pnpm test` passes all 14 Vitest tests and 9 runner API tests; `pnpm lint`, `pnpm test:e2e` (1 browser test), and `pnpm build` (743 static pages) pass locally.
- Pages run [37909059029](https://github.com/xero711/cpp-mastery/actions/runs/37909059029) exposed a Playwright readiness timeout because project-page testing must include the `/cpp-mastery` base path. The test now derives that prefix from `GITHUB_REPOSITORY`; local E2E passes with `GITHUB_REPOSITORY=xero711/cpp-mastery`, matching the Pages build environment.
- Corrected commit `8ef4a17` deployed successfully in [Pages run 37909519368](https://github.com/xero711/cpp-mastery/actions/runs/37909519368), including Chromium E2E and the 743-page static build. The browser test now reloads after both quiz changes and backup restore to verify IndexedDB persistence.
- Manual browser verification also confirmed backup export/import behavior. Week 9–104 lesson authoring, broader browser E2E coverage, production runner hosting, live public-page inspection through the Cloudflare challenge, and HTTPS enforcement remain open.

## 2026-10-09 — runner production deployment preparation

- Added an Ubuntu + gVisor production host runbook covering runtime installation, a dedicated API service account, a private token file, loopback-only API binding, HTTPS reverse proxy, host integration checks, and the GitHub Pages URL/token handoff. The runbook is preparatory and has not been executed on a production host.
- Production runner config now accepts either a registry manifest digest or Docker's immutable local `sha256:<image-id>`. This permits building the pinned sandbox on the dedicated host without publishing the large compiler image to a registry.
- Runner CI now obtains the built image ID and exercises the integration suite using that ID. The integration test can also run with `NODE_ENV=production` and `RUNNER_DOCKER_RUNTIME=runsc` on a future host; the Windows machine still lacks Docker and a WSL distro.
- Local `pnpm test` passes (14 Vitest and 9 runner API tests) and `pnpm lint` passes. Production gVisor execution remains unverified until a Linux host is supplied; GitHub Actions variables and secrets are still empty.
- Commit `f1d3951` passed runner CI in [run 37911080135](https://github.com/xero711/cpp-mastery/actions/runs/37911080135); the Docker integration suite passed while using the immutable local image ID. Pages CI passed E2E, static build, and deployment in [run 37911080121](https://github.com/xero711/cpp-mastery/actions/runs/37911080121). Runner CI uses `runc` on GitHub's isolated VM and does not prove production gVisor operation.

## 2026-10-09 — GitHub Pages answer isolation and server-side grading

- Kept the frontend as a GitHub Pages static export. Moved authored answer/test sources under the runner boundary and added generation of a browser-safe 56-lesson payload plus a runner-owned grading registry.
- The Pages payload includes pre-authored quiz choice indices for offline quiz checks, and omits reference solutions, debug fixes/explanations, and hidden test cases. `pnpm verify:public-bundle` scanned 902 generated HTML/JS/JSON assets and found no private answer or hidden-case payload.
- Added `/v1/grade` so the browser sends only lesson ID, source, and standard; the runner executes 110 public plus 73 hidden cases and calculates the score server-side. Only public case details return to the client. Added explicit `/v1/reveal` for solution/debug content. Local quizzes continue to save progress when no runner is configured.
- `pnpm lint`, `pnpm test` (16 Vitest tests and 13 runner API tests), `pnpm test:e2e` (backup/restore with mocked runner calls), and `pnpm build` passed locally. The Pages build emitted all 743 routes with the `xero711/cpp-mastery` prefix. `pnpm verify:lessons` passed with Visual Studio C++ for all 56 reference programs and 183 total test cases.
- The workflow now generates lesson payloads before tests/build and scans the final Pages artifact. Commit `3833b8d` is live on GitHub Pages; deployment run [37913271487](https://github.com/xero711/cpp-mastery/actions/runs/37913271487) passed. Runner CI run [37913271302](https://github.com/xero711/cpp-mastery/actions/runs/37913271302) passed the Docker-backed API, hidden-grade, and real C++ compile/run checks.
- GitHub Pages currently publishes through the custom URL `http://xero-x.me/cpp-mastery/` with workflow deployment. GitHub reports HTTPS enforcement is still disabled because the custom-domain certificate is not ready. The default `xero711.github.io` URL redirects to this configured domain.
- Production C++ grading remains unavailable until a separate Linux/gVisor runner host and HTTPS endpoint exist. GitHub Pages remains the frontend host; no runner URL or shared API token is configured in the repository.

## 2026-10-09 — GitHub Pages deployment and offline quizzes

- Restored browser-local checking for the authored multiple-choice quizzes so pre-authored lessons remain usable when no API is configured. The Pages bundle still excludes reference solutions, debug fixes, and hidden test cases; C++ grading stays server-owned.
- The latest code commit, `4ce7e71`, passed Pages workflow [37914366812](https://github.com/xero711/cpp-mastery/actions/runs/37914366812), including lint, 29 application/runner API tests, Chromium backup/restore E2E, static export, private-data scan, and deployment. The runner workflow [37914366744](https://github.com/xero711/cpp-mastery/actions/runs/37914366744) passed its Docker-backed compile/run and isolation checks on GitHub's hosted CI VM.
- The requested GitHub Pages deployment is active. GitHub reports `http://xero-x.me/cpp-mastery/`; `https://xero711.github.io/cpp-mastery/` redirects there. Direct automated requests to the custom domain still receive a Cloudflare browser challenge, and GitHub HTTPS enforcement remains disabled while the custom-domain certificate is unavailable.
- A production C++ runner is still not deployed. GitHub Pages hosts the static frontend only; no gVisor Linux host, runner HTTPS endpoint, or `CPP_RUNNER_URL` is configured.

## 2026-10-09 — browser-local runner endpoint

- Added a Settings field for a per-browser runner URL. It overrides the optional Pages build URL and is stored in `localStorage`; remote endpoints must use HTTPS, and plain HTTP is allowed only for `localhost`, `127.0.0.1`, or `[::1]`. The existing bearer token remains in its separate IndexedDB store. Both endpoint and token stay out of learner backup exports.
- Updated Dashboard and Workspace connection indicators to follow saved endpoint changes without a page reload. Added a Windows-local setup path for Docker Desktop with the runner bound to `127.0.0.1`; the `.env.example` allowlist includes the current Pages origin and local dev origin.
- `pnpm lint`, `pnpm test` (18 Vitest and 13 runner API tests), and `pnpm test:e2e` passed. The E2E ran with `GITHUB_REPOSITORY=xero711/cpp-mastery` and verified URL/token persistence, status updates, and exclusion of both values from backup JSON.
- `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build` generated all 743 static routes; `pnpm verify:public-bundle` confirmed 902 exported assets contain no private answer or hidden grading records; `pnpm verify:lessons` compiled 56 reference solutions and checked all 183 public/hidden cases with Visual Studio C++.
- Commit `f2e3c57` deployed successfully through GitHub Pages run [37916186479](https://github.com/xero711/cpp-mastery/actions/runs/37916186479). Runner CI run [37916186688](https://github.com/xero711/cpp-mastery/actions/runs/37916186688) passed the Docker-backed compile/run and isolation checks on GitHub's hosted CI VM.
- The local Windows runner still cannot be started here because Docker Desktop and a WSL distribution are absent. No production gVisor host is provisioned. Chrome may prompt for Local Network Access when a public Pages origin connects to a loopback runner; this needs a real browser plus a running local service for end-to-end acceptance.

## 2026-10-09 — browser-to-runner grading E2E

- Added a dedicated Playwright E2E that saves the worker URL and token in Settings, writes the Week 1 Day 1 program in Monaco, submits it through the browser to the real runner API, and confirms the server-side grade. It also reloads the page and confirms the submission count remains saved in browser storage.
- Runner CI now builds the pinned sandbox, starts the API on loopback, and runs that browser flow in addition to the container isolation suite. Run [37917540862](https://github.com/xero711/cpp-mastery/actions/runs/37917540862) passed; the Playwright step reported 1 passed. This uses `runc` only inside GitHub's isolated CI VM and is not production gVisor evidence.
- Pages run [37917540814](https://github.com/xero711/cpp-mastery/actions/runs/37917540814) passed the application tests, backup/restore E2E, 743-route static export, private-data scan, and deployment. Commit `9d60907` is deployed to the configured Pages site.
- Local `pnpm lint`, `pnpm test` (18 Vitest and 13 runner API tests), `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build`, `pnpm verify:public-bundle` (902 assets), and the browser backup/restore E2E passed. The targeted runner E2E is listed and runs successfully in CI; it cannot be executed on this Windows machine because Docker Desktop and WSL are absent.
- Still open: a separately hosted production gVisor worker and HTTPS endpoint, user selection of its host/provider, the Pages custom-domain HTTPS certificate/Cloudflare challenge, and E2E coverage for answer reveal and review sessions.
