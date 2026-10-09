# Security and trust boundaries

## GitHub Pages frontend

- Treat every static asset, browser state record, import file, and learner source file as untrusted input.
- Never place an API key, database credential, signing secret, or private test case in a `NEXT_PUBLIC_*` variable or static asset.
- The shipped site stores learner data in that browser's IndexedDB. Exported backups may contain code and personal learning notes; keep them private.
- Browser storage is not a server-side security boundary and does not sync across devices.

## C++ execution

- The static frontend does not compile or execute C++ itself.
- A runner is optional and disabled when no URL is configured.
- The runner API in `services/runner/` is separate from the static site, requires a bearer token, and validates bounded source, standard, and stdin fields. The browser keeps the token in a separate IndexedDB object store; JSON learning backups do not contain it. Same-origin JavaScript can still read the token, so use a dedicated runner credential and only enter it on a trusted site.
- Code runs in disposable containers with `--network none`, non-root UID/GID, read-only root filesystem, no host mounts, dropped capabilities, `no-new-privileges`, Docker seccomp, CPU/memory/process/address-space/time/output limits, and bounded concurrent jobs.
- Production runner startup requires gVisor (`runsc`), an immutable SHA-256 image digest, and exact HTTPS origins. Local development uses `runc` on loopback only.
- Do not mount host secrets, the Docker socket, home directories, or the application source into a code container.
- The runner broker is the only service process that uses Docker CLI/daemon access; never pass the daemon socket to submitted code or expose it over TCP. Docker daemon access is root-equivalent.
- Docker shares the host kernel and is not sufficient by itself for an internet-facing multi-tenant execution platform. Use a hardened isolated service and review its threat model before public submissions.
- Do not confuse compile infrastructure errors with incorrect answers. Machine test results and AI review must remain separate.

The Docker-backed integration test runs in GitHub Actions because this Windows host has no Docker CLI or WSL distribution. Until that job and a separate HTTPS deployment are verified, the public site must leave `CPP_RUNNER_URL` unset and continue to report that compile/run is unavailable.

## AI

GitHub Pages cannot protect secrets. Any future AI integration must go through a separate server that stores keys privately, rate-limits requests, limits context, and treats learner code and lesson text as untrusted data rather than instructions.
