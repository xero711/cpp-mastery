# Architecture

## Deployment boundary

C++ Mastery is a static Next.js App Router export deployed to GitHub Pages. `next build` writes the deployable site to `out/`. The Pages project prefix is derived from `GITHUB_REPOSITORY` during CI; `owner.github.io` repositories use the root path. All routes are statically generated.

GitHub Pages cannot run a Node.js API, database, compiler, or secret-bearing AI endpoint. The shipped client stores one learner's progress and AI conversation history in IndexedDB and supports JSON backup/restore; service credentials remain in a separate store and are excluded from backups. C++ execution and AI are optional, separately hosted services. Their public endpoints require HTTPS; owner-only local use is restricted to loopback. The browser can trigger Local Network Access permission when a public website connects to a local service. Each service must allow only the exact published Pages origin. An unset endpoint means that service is unavailable and the UI says so.

## Current components

- `src/app`: statically exported Japanese routes and application shell.
- `src/lib/curriculum.ts`: canonical 104-week plan (8 phases, 728 learning days).
- `src/lib/lessons.ts` and `src/lib/lessons.public.json`: browser-safe payload for the 84 authored Week 1–12 lessons.
- `services/runner/data/lesson-source.ts`: authoring source for private answers and test definitions; `pnpm generate:lessons` emits the browser-safe JSON and runner registry separately.
- `src/lib/browser-store.ts`: IndexedDB-backed learner settings, drafts, answers, and evidence.
- `src/lib/runner-client.ts`: browser client for an optional isolated runner; it never compiles on the Pages host and validates browser-local endpoint overrides.
- `services/mentor/src/server.mjs`: separate OpenAI Responses API/Ollama streaming service with server-only provider keys, exact-origin CORS, bearer auth, bounded requests, and rate/concurrency limits.
- `src/lib/mentor-client.ts` and `src/components/mentor-page.tsx`: opt-in browser chat, explicit context attachment, local conversation persistence, and response usage display.
- `.github/workflows/deploy-pages.yml`: build and publish `out/` through GitHub Pages Actions.

## Data flow

1. Static lesson content is shipped with the site.
2. The browser reads and writes learner state in IndexedDB. No account or cloud sync exists in this phase.
3. The browser submits only source, lesson ID, and selected standard to `/v1/grade` after an explicit Submit action. It does not send test inputs or expected outputs. A runner URL can come from the Pages build or a browser-local setting; the bearer token is stored in a separate browser IndexedDB store and is excluded from learner backups.
4. The runner loads public and private cases from its own registry, compiles and runs each case in a disposable sandbox, and calculates the score server-side. It returns public case details and the aggregate verdict; hidden inputs and expected outputs stay on the runner.
5. Quiz choices are graded against their pre-authored choice index and saved locally, so lesson checks work when the runner is unavailable. Solutions and debug fixes are requested through `/v1/reveal` only after the learner chooses to reveal them. Reference solutions, fixes, and hidden tests remain absent from the static payload.
6. The browser records the returned result and lesson completion locally.
7. The learner submits an AI question explicitly. The browser sends only recent conversation turns and the selected mode; lesson/code context is omitted unless the learner enables the attachment control. The separate mentor service keeps provider credentials server-side, treats messages/context as untrusted, and streams text through SSE. The service does not persist or log conversation content; the browser stores history locally and includes it in JSON backups.

## Runner protocol

`POST {CPP_RUNNER_URL}/v1/grade` accepts `{ lessonId, source, standard }`, uses runner-owned public and hidden cases, and returns the server-calculated score with public case details only. `/v1/reveal` returns the selected solution or debug explanation after an explicit request. `/v1/execute` remains available for general authenticated compile/run requests. All endpoints require `Authorization: Bearer <token>` and an allowlisted Origin. The separate Node broker and Docker sandbox are implemented in `services/runner/`. Each case runs in a disposable, networkless, non-root container with a read-only root filesystem, no host mounts, CPU/memory/process/time/output limits, and no API token. Unit tests cover server-side hidden grading and response privacy. Docker-backed CI passes on GitHub's isolated Ubuntu runner; production gVisor hosting remains pending.

Production startup rejects Docker's `runc`, requires gVisor (`runsc`), an immutable sandbox image digest, an exact HTTPS origin allowlist, and a long bearer token. Docker is still a defense layer, not a complete public multi-tenant boundary. A separately hosted runner needs controlled ingress, egress policy, monitoring, and operational review before accepting public submissions. CORS is not authentication and does not prevent direct API calls.

## Mentor protocol

The separate service in `services/mentor/` exposes authenticated `GET /v1/health` and `POST /v1/chat`. It accepts only one of eight fixed instruction modes, a bounded user/assistant history, and optional context. It has no tool execution, database, prompt logging, or browser-accessible provider key. OpenAI requests use the Responses API with `stream=true` and `store=false`; Ollama uses `/api/chat` streaming. Both become browser SSE `delta`, `done`, or sanitized `error` events. OpenAI token-cost estimates are returned only when the deployment owner supplies per-million-token rates; Ollama reports external API cost as zero, excluding local power and hardware.

The service binds to loopback by default and rejects non-loopback bind hosts. A browser-local bearer token is an owner credential, not a public user identity. Do not distribute it to public visitors; public use requires per-user authentication, budget controls, and an abuse-response boundary. Local Ollama `gpt-oss:20b` inference was verified on CPU after disabling CUDA and Vulkan; its default GPU path failed during CUDA initialization. Production hosting, OpenAI inference, and public-user access remain pending.

## Next architecture steps

1. For production use, deploy the runner to a dedicated, hardened HTTPS host, then configure the Pages build variable only after its origin, gVisor runtime, authentication, and ingress policy are verified. A browser-local override is reserved for the owner's loopback-only development runner.
2. Add an authenticated API/database only if multi-device sync or multiple learners is required; keep GitHub Pages as the static frontend.
3. Deploy the AI mentor service behind an HTTPS reverse proxy with per-user access and cost/abuse controls before enabling it for public visitors. Keep provider credentials and rate configuration in the server environment.

## Technical references

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
