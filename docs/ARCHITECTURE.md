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
3. The browser submits source to the configured runner only after an explicit Run/Submit action.
4. The runner returns compiler output, program output, and test results as separate fields. Compiler output and test output are authoritative; AI commentary is not used as a score.
5. The browser records the returned result and lesson completion locally.

## Runner protocol

`POST {CPP_RUNNER_URL}/v1/execute` accepts JSON `{ source, standard, tests: [{ stdin }] }`, where `standard` is one of `c++17`, `c++20`, or `c++23`. It returns `{ status, compilerOutput, cases: [{ stdout, stderr, exitCode, durationMs, timedOut? }] }`; `status` is `ok`, `compile_error`, or `runner_error`. The server must cap request and output size, validate every field, run each job in a disposable sandbox with no network, non-root identity, read-only root filesystem, CPU/memory/process/time/output limits, and return exactly one case per submitted input. The browser treats malformed or unavailable services as infrastructure errors rather than wrong answers. This repository does not yet ship or claim a production runner. A CORS origin allowlist controls which browser pages can read a response; it does not authenticate requests or prevent direct API calls.

Docker is a defense layer, not a complete public multi-tenant boundary. Any separately hosted runner needs further hardening and operational review before accepting public submissions.

## Next architecture steps

1. Add a Docker-based local runner and validate it on a machine with Docker Desktop/WSL2.
2. Deploy the runner to a dedicated, hardened service and configure the Pages build variable only after its origin and CORS policy are known.
3. Add an authenticated API/database only if multi-device sync or multiple learners is required; keep GitHub Pages as the static frontend.
4. Add a server-side AI provider adapter. Never expose provider keys in the static bundle.

## Technical references

- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
