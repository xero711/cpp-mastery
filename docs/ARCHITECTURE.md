# Architecture

## Deployment boundary

C++ Mastery is a static Next.js App Router export deployed to GitHub Pages. `next build` writes the deployable site to `out/`. The Pages project prefix is derived from `GITHUB_REPOSITORY` during CI; `owner.github.io` repositories use the root path. All routes are statically generated.

GitHub Pages cannot run a Node.js API, database, compiler, or secret-bearing AI endpoint. The shipped client stores one learner's progress in IndexedDB and supports JSON backup/restore. A production C++ execution service must be a separately hosted HTTPS service configured at build time with `NEXT_PUBLIC_CPP_RUNNER_URL`. It must implement the runner protocol and allow only the published Pages origin. An unset URL means compilation is unavailable and the UI must say so.

## Current components

- `src/app`: statically exported Japanese routes and application shell.
- `src/lib/curriculum.ts`: canonical 104-week plan (8 phases, 728 learning days).
- `src/lib/lessons.ts`: versioned first-four-week lesson set.
- `src/lib/browser-store.ts`: IndexedDB-backed learner settings, drafts, answers, and evidence.
- `src/lib/runner-client.ts`: browser client for an optional isolated runner; it never compiles on the Pages host.
- `.github/workflows/deploy-pages.yml`: build and publish `out/` through GitHub Pages Actions.

## Data flow

1. Static lesson content is shipped with the site.
2. The browser reads and writes learner state in IndexedDB. No account or cloud sync exists in this phase.
3. The browser submits source to the configured runner only after an explicit Run/Submit action. The runner URL is a Pages build variable; the bearer token is stored in a separate browser IndexedDB store and is excluded from learner backups.
4. The runner returns compiler output, program output, and test results as separate fields. Compiler output and test output are authoritative; AI commentary is not used as a score.
5. The browser records the returned result and lesson completion locally.

## Runner protocol

`POST {CPP_RUNNER_URL}/v1/execute` accepts JSON `{ source, standard, tests: [{ stdin }] }`, where `standard` is one of `c++17`, `c++20`, or `c++23`. It requires `Authorization: Bearer <token>` and returns `{ status, compilerOutput, cases: [{ stdout, stderr, exitCode, durationMs, timedOut, outputLimited }] }`; `status` is `ok`, `compile_error`, or `runner_error`. The separate Node broker and Docker sandbox are implemented in `services/runner/`. The broker validates all fields, enforces request and job limits, and returns exactly one case per submitted input. Each job runs in a disposable, networkless, non-root container with a read-only root filesystem, no host mounts, CPU/memory/process/time/output limits, and no API token or test answers. The browser treats malformed or unavailable services as infrastructure errors rather than wrong answers. The Docker-backed integration suite has not yet passed on an available Docker host.

Production startup rejects Docker's `runc`, requires gVisor (`runsc`), an immutable sandbox image digest, an exact HTTPS origin allowlist, and a long bearer token. Docker is still a defense layer, not a complete public multi-tenant boundary. A separately hosted runner needs controlled ingress, egress policy, monitoring, and operational review before accepting public submissions. CORS is not authentication and does not prevent direct API calls.

## Next architecture steps

1. Validate the Docker runner with the new GitHub Actions integration job; validate again on Docker Desktop/WSL2.
2. Deploy the runner to a dedicated, hardened HTTPS host, then configure the Pages build variable only after its origin, gVisor runtime, authentication, and ingress policy are verified.
3. Add an authenticated API/database only if multi-device sync or multiple learners is required; keep GitHub Pages as the static frontend.
4. Add a server-side AI provider adapter. Never expose provider keys in the static bundle.

## Technical references

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
