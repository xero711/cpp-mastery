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

Verified: static export, lint, current automated tests, 84 authored C++ reference solutions against 194 public and 101 hidden test cases, 28 standalone Week 9–12 examples with Visual Studio C++, root and project-prefix asset/link generation, local browser rendering, IndexedDB persistence, honest runner-unavailable behavior, public repository push, and successful GitHub Pages workflow deployments. The current static-bundle scan checks 904 assets and rejects private answers or hidden grading cases.

Not yet accepted: learner code compiled and graded through a production isolated service, public-page content in a normal browser (Cloudflare challenge blocked this environment), enforced HTTPS for the project Pages site, the full unit/integration/E2E suite from the product brief, and detailed lesson content for Weeks 13–104.

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
- Still open: a separately hosted production gVisor worker and HTTPS endpoint, user selection of its host/provider, the Pages custom-domain HTTPS certificate/Cloudflare challenge, and E2E coverage for review sessions.

## 2026-10-09 — static-export browser acceptance

- Changed both browser E2E configurations to serve the generated `out/` export with the repository base path. The Pages workflow now builds first and tests the exact static artifact before publishing; the runner workflow uses the same export for its real compile/grade flow.
- Added a small dependency-free local static file server for E2E. Local Playwright confirmed the static route and browser backup/restore flow. The public bundle check still verified 902 assets without reference solutions, debug fixes, or hidden test cases.
- Extended the runner browser flow through authenticated `/v1/reveal` for both the model solution and debug fix. Runner workflow [37918479556](https://github.com/xero711/cpp-mastery/actions/runs/37918479556) passed the sandbox checks and the full static-browser compile, hidden-test grade, history reload, solution reveal, and debug reveal flow (1 E2E passed).
- Pages workflow [37918479537](https://github.com/xero711/cpp-mastery/actions/runs/37918479537) passed the static browser backup/restore test, export scan, and deployment of commit `4ae9963`.
- Local checks passed: `pnpm lint`, `pnpm test` (18 Vitest and 13 runner API tests), static `pnpm build` (743 routes), `pnpm verify:public-bundle`, and `pnpm test:e2e` (1 browser test).
- Production gVisor hosting remains unverified. CI runs `runc` only on GitHub's isolated VM. The Windows machine still has no Docker/WSL runner, and no production host/provider has been selected.

## 2026-10-09 — browser review-session acceptance

- Added a second static-export Playwright flow with a fixed browser clock: a missed Week 1 quiz is scheduled for the next day, appears in the due queue on that day, and advances to a three-day interval only after a correct quiz and a real isolated C++ submission passes.
- The E2E reloads the Review Center and confirms the new interval and repetition count persist in IndexedDB. Runner workflow [37919220763](https://github.com/xero711/cpp-mastery/actions/runs/37919220763) passed both browser-to-runner E2Es plus the Docker sandbox isolation suite; the review flow completed in 4.8 seconds.
- Pages workflow [37919220802](https://github.com/xero711/cpp-mastery/actions/runs/37919220802) passed the static export build, backup/restore browser E2E, private-data scan, and deployment of commit `1fe9e88`.
- Local checks on this checkout passed: lint, 18 Vitest tests, 13 runner API tests, all 743 static routes, 902-asset private-data scan, and static backup/restore E2E. The separate lesson verifier also compiled all 56 reference solutions and checked all 183 public/hidden cases.
- Still unresolved: production gVisor host/HTTPS endpoint selection, local Docker/WSL setup, and GitHub Pages HTTPS enforcement for the configured domain.

## 2026-10-09 — GitHub Pages custom-domain HTTPS diagnosis

- Reconfirmed the frontend is deployed with the GitHub Pages workflow. The project repository Pages API reports `build_type=workflow`, `html_url=http://xero-x.me/cpp-mastery/`, `cname=null`, and `https_enforced=false`; the default `xero711.github.io` project URL redirects to the custom domain.
- GitHub's Pages DNS health check for the apex `xero-x.me` reports `is_proxied=true`, `is_cloudflare_ip=true`, `is_pointed_to_github_pages_ip=false`, `is_non_github_pages_ip_present=true`, and `is_https_eligible=false`. It can respond to HTTPS at the Cloudflare edge, but GitHub does not consider the DNS eligible for its Pages certificate. The `www` alias is not currently served by Pages and fails peer certificate verification.
- A request to enable HTTPS enforcement on `xero711/cpp-mastery` was rejected with `The certificate does not exist yet`; the setting remains disabled. No DNS or Pages domain settings were changed during this diagnosis.
- GitHub's documented DNS setup requires the apex to resolve to GitHub Pages records and the selected custom domain to be configured on the Pages site. The DNS proxy and any extra or non-Pages records must be reviewed by the domain owner; then wait for GitHub's DNS health check and certificate provisioning before enabling HTTPS enforcement. The proxy challenge and TLS state have not been accepted in a normal browser.
- GitHub Pages remains the frontend host and the workflow deployment is healthy. Custom-domain HTTPS remains an external DNS/certificate blocker; the public isolated runner also remains unhosted.

## 2026-10-09 — optional AI mentor service

- Added a separate Node service for OpenAI Responses SSE and Ollama `/api/chat`, with eight teaching modes, explicit context opt-in, server-only provider credentials, exact-Origin CORS, bearer authorization, bounded UTF-8 requests/history/output, per-token rate limits, concurrency limits, and no prompt persistence/logging. GitHub Pages remains the static frontend host.
- Added the Japanese mentor chat UI, local IndexedDB history, separate browser token storage, backup/restore for conversation history, and service settings. Credentials are excluded from backups. The UI distinguishes AI explanations from actual compiler and grading results.
- Local verification passed: `pnpm lint`; `pnpm test` (24 Vitest tests and 21 Node service/API tests); `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build` (743 static routes); `pnpm verify:public-bundle` (904 assets with no private answers/hidden cases); `pnpm test:e2e` (2 Chromium flows covering backup/restore and mentor streaming/history).
- Real local integration passed with Ollama `gpt-oss:20b` after disabling CUDA and Vulkan (`CUDA_VISIBLE_DEVICES=-1`, `OLLAMA_VULKAN=0`): the mentor service streamed a Japanese answer and received 362 input / 606 output tokens. CPU-only generation took about 75 seconds. The default GPU path previously failed during CUDA `MUL_MAT` initialization. This verifies local transport/inference only, not answer correctness or public hosting. No OpenAI request was made.
- Temporary local services were stopped and verified absent: no Ollama/llama-server process and no listeners on ports 11434 or 8082.
- Commit `97ab83f` deployed successfully to GitHub Pages in [run 37922806719](https://github.com/xero711/cpp-mastery/actions/runs/37922806719); CI passed lint, tests, Chromium E2E, static export, public-bundle scan, and deployment.
- Still open: production HTTPS hosting and per-user authorization for the mentor, OpenAI verification, public gVisor runner hosting, custom-domain HTTPS eligibility, and detailed daily lesson authoring for Weeks 9–104.

## 2026-10-09 — runner browser-to-grade CI recovery

- Current state inspection found runner CI [37922806740](https://github.com/xero711/cpp-mastery/actions/runs/37922806740) had failed after the AI settings card added a second button whose accessible name partially matched `URLを保存`. Updated runner E2E selectors to require exact button names.
- Local `pnpm test` passed (24 Vitest tests and 21 Node API tests); `pnpm lint` and `git diff --check` passed.
- Commit `3dfd9f4` passed runner CI [37923379801](https://github.com/xero711/cpp-mastery/actions/runs/37923379801): Docker sandbox image build, runner API checks, real C++17/20/23 compile/run and isolation checks, static Pages export, Chromium browser grading/history/solution/debug flow, and the due-review progression E2E all passed.
- This confirms the separate runner and complete browser-to-grade path on GitHub's isolated Linux CI VM using `runc`. The Windows PC still has no Docker CLI/engine or WSL Linux distribution, and production gVisor hosting remains unconfigured; those are still separate acceptance gaps.

## 2026-10-09 — Week 9 daily lessons and GitHub Pages

- Authored all seven Week 9 lessons on declarations and definitions, header use, include guards, compile versus link errors, internal linkage, translation units, and a small namespaced scoring API. The lessons explain that this site's current submission interface compiles one `.cpp` file; multi-file build roles are taught with explicit examples.
- The curriculum now contains 63 lessons, 131 public tests, and 80 runner-only hidden tests. The curriculum availability message follows the actual authored lesson data, and a Chromium E2E opens Week 9 Day 1 through the project Pages base path.
- `pnpm lint` passed. `pnpm test` passed (24 Vitest tests and 21 Node service/API tests). `pnpm verify:lessons` passed with Visual Studio C++: 63 reference solutions and all 131 public / 80 hidden cases, plus seven standalone Week 9 code examples and their output checks. `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build` produced all 743 static routes. `pnpm verify:public-bundle` scanned 904 Pages assets without finding private answers or hidden tests. `pnpm test:e2e` passed all three Chromium flows, including Week 9 lesson availability and rendering.
- Commit `9102681` deployed to GitHub Pages in [run 37925324489](https://github.com/xero711/cpp-mastery/actions/runs/37925324489); the Pages build, tests, browser E2E, private-data scan, artifact upload, and deployment all passed. Runner run [37925324490](https://github.com/xero711/cpp-mastery/actions/runs/37925324490) also passed sandbox compilation/isolation and browser-to-runner grading. GitHub reports workflow-based Pages publishing (`build_type=workflow`) at `http://xero-x.me/cpp-mastery/`; the domain's HTTPS enforcement remains disabled while GitHub awaits a valid Pages certificate.
- Still open: detailed daily lessons for Weeks 10–104, production gVisor runner hosting and a real public grading endpoint, Windows Docker/WSL runner setup, and custom-domain HTTPS eligibility. CI uses `runc` only on GitHub's isolated VM and does not establish production runner acceptance.

## 2026-10-09 — Week 10 daily lessons

- Authored seven lessons on classes and encapsulation, member functions, constructors and initializer lists, access control and invariants, const member functions, overloaded/delegating constructors, and an integrated bounded `Character` class.
- The course now contains 70 daily lessons and reference solutions, 152 public grading cases, and 87 runner-only hidden cases. The curriculum marks Week 10 available from the lesson data, and the Chromium curriculum E2E opens and checks Weeks 9 and 10.
- Tightened lesson export to an explicit public-field allowlist after detecting duplicate top-level answer and hidden-test fields in the generated JSON. The public-bundle verifier now checks the generated JSON schema as well as all 904 static assets; the final scan found no private answers or hidden grading cases.
- `pnpm lint` passed. `pnpm test` passed (24 Vitest tests and 21 Node service/API tests). `pnpm verify:lessons` passed with Visual Studio C++: all 70 reference solutions, 152 public cases, 87 hidden cases, and 14 standalone Week 9–10 examples. `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build` generated all 743 static routes. `pnpm verify:public-bundle` scanned 904 assets. `pnpm test:e2e` passed all three Chromium flows.
- Commit `b8b0a37` deployed to GitHub Pages in [run 37927851636](https://github.com/xero711/cpp-mastery/actions/runs/37927851636); lint, tests, Chromium E2E, the 904-asset private-data scan, static build, and deployment passed. Runner CI [37927851679](https://github.com/xero711/cpp-mastery/actions/runs/37927851679) passed Docker isolation tests and the browser-to-runner compile/grade E2E. CI uses `runc` on GitHub's isolated VM; it does not establish production gVisor hosting.
- Still open: detailed daily lessons for Weeks 11–104, production gVisor runner hosting and a public grading endpoint, Windows Docker/WSL runner setup, and custom-domain HTTPS eligibility.

## 2026-10-09 — Week 11 daily lessons

- Authored seven lessons on destructor timing, reverse construction order, member-object destruction, RAII with real file streams, Rule of Zero, temporary-object lifetime, and an integrated lifetime-bounded `Ticket` class.
- The course now contains 77 daily lessons and reference solutions, 173 public grading cases, and 94 runner-only hidden cases. The Chromium curriculum E2E checks the availability and content of Weeks 9–11.
- `pnpm verify:lessons` passed with Visual Studio C++: all 77 reference solutions, 173 public cases, 94 hidden cases, and 21 complete standalone examples from Weeks 9–11. The verifier now runs each program from its temporary directory so file exercises cannot write into the repository.
- `pnpm test` passed (24 Vitest tests and 21 Node service/API tests); `pnpm lint`, `GITHUB_REPOSITORY=xero711/cpp-mastery pnpm build` (743 routes), `pnpm verify:public-bundle` (904 assets), `pnpm test:e2e` (3 Chromium flows), and `git diff --check` passed.
- Commit `4ddbf6d` is live on GitHub Pages after [run 37929173420](https://github.com/xero711/cpp-mastery/actions/runs/37929173420); build, browser backup/restore E2E, private-data scan, and deployment all passed. Runner CI [37929173459](https://github.com/xero711/cpp-mastery/actions/runs/37929173459) passed Docker isolation and browser-to-runner compile/grade.
- Current infrastructure check: Docker CLI is missing, WSL has no installed distribution, and the repository has no Actions variables or secrets. GitHub Pages remains workflow-hosted at `http://xero-x.me/cpp-mastery/` with HTTPS enforcement disabled. CI's `runc` success is not production gVisor hosting evidence.
- Still open: production gVisor runner hosting and a public grading endpoint, Docker/WSL setup on this Windows PC, custom-domain HTTPS eligibility, and detailed daily lessons for Weeks 12–104.

## 2026-10-09 — Week 12 daily lessons

- Authored seven lessons on `std::string` length and safe indexing, `find`/`npos`, vector growth and bounds, range-based loops, sorting/searching, and a combined word-list exercise. The curriculum now exposes the full Week 12 lesson set.
- The course now contains 84 daily lessons and reference solutions, 194 public grading cases, and 101 runner-only hidden cases. The Chromium curriculum E2E checks Weeks 9–12.
- `pnpm verify:lessons` passed with Visual Studio C++: all 84 reference solutions and all public/hidden cases, plus 28 standalone Week 9–12 examples. `pnpm test` passed (24 Vitest tests and 21 Node service/API tests); `pnpm lint` passed; the production build generated all 743 static routes; `pnpm verify:public-bundle` scanned 904 GitHub Pages assets and found no private answers or hidden tests; `pnpm test:e2e` passed all three Chromium flows; `git diff --check` passed.
- Commit `8b66f8e` was published by [GitHub Pages run 37930386811](https://github.com/xero711/cpp-mastery/actions/runs/37930386811); build, browser backup/restore, private-data scan, artifact upload, and deployment all passed. [Runner CI run 37930386894](https://github.com/xero711/cpp-mastery/actions/runs/37930386894) passed Docker isolation and browser-to-runner compile/grade. The previously recorded deployment and runner infrastructure limits remain: the Pages API reports `https_enforced=false` for `http://xero-x.me/cpp-mastery/`; this PC lacks Docker and an installed WSL distribution, the repository has no Actions variables or secrets, and CI `runc` checks do not establish a production gVisor runner.
- Still open: production gVisor runner hosting and a public grading endpoint, custom-domain HTTPS eligibility and live public-page inspection beyond the Cloudflare challenge, and detailed daily lessons for Weeks 13–104.
