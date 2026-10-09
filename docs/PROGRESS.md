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

Verified: static export, lint, current automated tests, 35 authored C++ reference solutions against 47 public test cases, root and project-prefix asset/link generation, local browser rendering, IndexedDB draft/quiz persistence across reload, honest runner-unavailable behavior, public repository push, and successful GitHub Pages workflow deployments.

Not yet accepted: learner code compiled and graded through an isolated service, public-page content in a normal browser (Cloudflare challenge blocked this environment), enforced HTTPS for the project Pages site, the full unit/integration/E2E suite from the product brief, and detailed lesson content after Week 5.

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

## 2026-10-09 — Week 5 daily lessons

- Authored all seven Week 5 lessons on function declarations, arguments, return values, boolean predicates, local scope, combined functions, and a short review challenge. Each lesson includes Japanese instruction, worked code/output, a quiz, a coding task and solution, hints, and a debugging task. Public test cases cover representative inputs; the review score is capped at 100.
- The course now contains 35 complete daily lesson records with 35 reference solutions and 47 public test cases. The code exercise week filter is generated from authored lesson data and displays Week 5 only when it has lessons.
- `pnpm test`: passed (3 Vitest files / 9 tests and 9 runner API tests). `pnpm lint`: passed. `pnpm build`: passed and generated all 743 static pages/routes. `pnpm verify:lessons`: passed; Visual Studio C++ compiled all 35 reference programs and checked all 47 public cases.
- Local browser review confirmed Week 5 Day 1 lesson content and that the practice week filter offers Week 5 with seven Week 5 tasks.
- Commit `32f3595` was deployed successfully by the GitHub Pages workflow ([run 37904617941](https://github.com/xero711/cpp-mastery/actions/runs/37904617941)); lint, application/API tests, static export, artifact upload, and deployment all passed.
- Weeks 6–104 still have planned weekly topics and daily templates, not complete authored lessons. The isolated runner is implemented and passed Docker integration in GitHub Actions, but no production gVisor service is deployed.
