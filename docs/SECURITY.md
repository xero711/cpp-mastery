# Security and trust boundaries

## GitHub Pages frontend

- Treat every static asset, browser state record, import file, and learner source file as untrusted input.
- Never place an API key, database credential, signing secret, or private test case in a `NEXT_PUBLIC_*` variable or static asset.
- The shipped site stores learner data in that browser's IndexedDB. Exported backups may contain code and personal learning notes; keep them private.
- Browser storage is not a server-side security boundary and does not sync across devices.

## C++ execution

- The static frontend does not compile or execute C++ itself.
- A runner is optional and disabled when no URL is configured.
- A runner URL can be compiled into the site or overridden in a browser-local `localStorage` entry. Remote endpoints require HTTPS; HTTP is accepted only for `localhost`, `127.0.0.1`, or `[::1]`. The local API must bind to loopback. A public HTTPS page may require explicit browser Local Network Access permission before it can connect to the local runner.
- The runner API in `services/runner/` is separate from the static site, requires a bearer token, and validates bounded source, standard, and stdin fields. The browser keeps the token in a separate IndexedDB object store; JSON learning backups do not contain it. Same-origin JavaScript can still read the token, so use a dedicated runner credential and only enter it on a trusted site.
- Code runs in disposable containers with `--network none`, non-root UID/GID, read-only root filesystem, no host mounts, dropped capabilities, `no-new-privileges`, Docker seccomp, CPU/memory/process/address-space/time/output limits, and bounded concurrent jobs.
- Production runner startup requires gVisor (`runsc`), an immutable SHA-256 image digest, and exact HTTPS origins. Local development uses `runc` on loopback only.
- Do not mount host secrets, the Docker socket, home directories, or the application source into a code container.
- The runner broker is the only service process that uses Docker CLI/daemon access; never pass the daemon socket to submitted code or expose it over TCP. Docker daemon access is root-equivalent.
- Docker shares the host kernel and is not sufficient by itself for an internet-facing multi-tenant execution platform. Use a hardened isolated service and review its threat model before public submissions.
- Do not confuse compile infrastructure errors with incorrect answers. Machine test results and AI review must remain separate.

The Docker-backed integration test runs in GitHub Actions because this Windows host has no Docker CLI or WSL distribution. Keep the build-time `CPP_RUNNER_URL` unset until a separate HTTPS deployment is verified. The site must report compile/run as unavailable unless the learner has entered a working browser-local or production runner URL and token.

## AI

GitHub Pages cannot protect secrets. The AI mentor therefore uses `services/mentor/` as a separate service. OpenAI keys and optional Ollama credentials are read only from server environment variables. The service requires a 32-character bearer token, exact Origin allowlist, request/history/context/output bounds, per-token rate limit, and a concurrency limit. It binds to loopback by default and rejects non-loopback binds; a production deployment needs a local HTTPS reverse proxy.

The browser sends no chat content during health checks. A submitted question sends the recent conversation turns; optional lesson/code context stays off unless the learner enables it. The service treats all messages, lesson material, and source as untrusted user data and never uses them as developer instructions. It does not persist or log prompt contents. OpenAI Responses requests set `store: false`. Browser conversations are stored locally and can be exported; AI service tokens remain in a separate IndexedDB store and are excluded from backups.

The service token is an owner credential, not per-user authentication. Do not distribute a shared token to public visitors. A public deployment still needs per-user identities or another access-control boundary, budget controls, monitoring, and abuse response. AI responses are not compiler/test evidence. Provider transport tests use mocks. A real local Ollama request returned a streamed answer through the service in CPU-only mode; its default GPU path failed during CUDA startup. OpenAI has not been called, and no public mentor service is deployed.
