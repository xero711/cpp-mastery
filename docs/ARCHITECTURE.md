# Architecture

## Deployment boundary

C++ Mastery is a static Next.js App Router export deployed to GitHub Pages. `next build` writes the deployable site to `out/`. The Pages project prefix is derived from `GITHUB_REPOSITORY` during CI; `owner.github.io` repositories use the root path. All routes are statically generated.

GitHub Pages cannot run a Node.js API, database, compiler, or secret-bearing AI endpoint. The shipped client stores one learner's progress in IndexedDB and supports JSON backup/restore. A production C++ execution service must be a separately hosted HTTPS service configured at build time with `NEXT_PUBLIC_CPP_RUNNER_URL`. It must implement the runner protocol and allow only the published Pages origin. An unset URL means compilation is unavailable and the UI must say so.

## Current components

- `src/app`: statically exported Japanese routes and application shell.
- `src/lib/curriculum.ts`: canonical 104-week plan (8 phases, 728 learning days).
- `src/lib/lessons.ts` and `src/lib/lessons.public.json`: browser-safe payload for the 56 authored Week 1–8 lessons.
- `services/runner/data/lesson-source.ts`: authoring source for private answers and test definitions; `pnpm generate:lessons` emits the browser-safe JSON and runner registry separately.
- `src/lib/browser-store.ts`: IndexedDB-backed learner settings, drafts, answers, and evidence.
- `src/lib/runner-client.ts`: browser client for an optional isolated runner; it never compiles on the Pages host.
- `.github/workflows/deploy-pages.yml`: build and publish `out/` through GitHub Pages Actions.

## Data flow

1. Static lesson content is shipped with the site.
2. The browser reads and writes learner state in IndexedDB. No account or cloud sync exists in this phase.
3. The browser submits only source, lesson ID, and selected standard to `/v1/grade` after an explicit Submit action. It does not send test inputs or expected outputs. The runner URL is a Pages build variable; the bearer token is stored in a separate browser IndexedDB store and is excluded from learner backups.
4. The runner loads public and private cases from its own registry, compiles and runs each case in a disposable sandbox, and calculates the score server-side. It returns public case details and the aggregate verdict; hidden inputs and expected outputs stay on the runner.
5. Quiz choices are graded through `/v1/quiz`. Solutions and debug fixes are requested through `/v1/reveal` only after the learner chooses to reveal them. These private fields are absent from the static payload.
6. The browser records the returned result and lesson completion locally.

## Runner protocol

`POST {CPP_RUNNER_URL}/v1/grade` accepts `{ lessonId, source, standard }`, uses runner-owned public and hidden cases, and returns the server-calculated score with public case details only. `/v1/quiz` returns only a correctness boolean; `/v1/reveal` returns the selected solution or debug explanation after an explicit request. `/v1/execute` remains available for general authenticated compile/run requests. All endpoints require `Authorization: Bearer <token>` and an allowlisted Origin. The separate Node broker and Docker sandbox are implemented in `services/runner/`. Each case runs in a disposable, networkless, non-root container with a read-only root filesystem, no host mounts, CPU/memory/process/time/output limits, and no API token. Unit tests cover server-side hidden grading and response privacy. Docker-backed CI passes on GitHub's isolated Ubuntu runner; production gVisor hosting remains pending.

Production startup rejects Docker's `runc`, requires gVisor (`runsc`), an immutable sandbox image digest, an exact HTTPS origin allowlist, and a long bearer token. Docker is still a defense layer, not a complete public multi-tenant boundary. A separately hosted runner needs controlled ingress, egress policy, monitoring, and operational review before accepting public submissions. CORS is not authentication and does not prevent direct API calls.

## Next architecture steps

1. Deploy the runner to a dedicated, hardened HTTPS host, then configure the Pages build variable only after its origin, gVisor runtime, authentication, and ingress policy are verified.
2. Add an authenticated API/database only if multi-device sync or multiple learners is required; keep GitHub Pages as the static frontend.
3. Add a server-side AI provider adapter. Never expose provider keys in the static bundle.

## Technical references

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
