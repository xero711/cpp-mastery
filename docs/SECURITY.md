# Security and trust boundaries

## GitHub Pages frontend

- Treat every static asset, browser state record, import file, and learner source file as untrusted input.
- Never place an API key, database credential, signing secret, or private test case in a `NEXT_PUBLIC_*` variable or static asset.
- The shipped site stores learner data in that browser's IndexedDB. Exported backups may contain code and personal learning notes; keep them private.
- Browser storage is not a server-side security boundary and does not sync across devices.

## C++ execution

- The static frontend does not compile or execute C++ itself.
- A runner is optional and disabled when no URL is configured.
- A runner must be a separate, authenticated service with strict request and output caps, allowlisted C++ standards, no network for code containers, non-root execution, read-only root filesystem, CPU/memory/process/time limits, and disposable workspaces.
- Do not mount host secrets, the Docker socket, home directories, or the application source into a code container.
- Keep the Docker daemon socket available only to a narrowly scoped runner broker; never pass it to submitted code.
- Docker shares the host kernel and is not sufficient by itself for an internet-facing multi-tenant execution platform. Use a hardened isolated service and review its threat model before public submissions.
- Do not confuse compile infrastructure errors with incorrect answers. Machine test results and AI review must remain separate.

## AI

GitHub Pages cannot protect secrets. Any future AI integration must go through a separate server that stores keys privately, rate-limits requests, limits context, and treats learner code and lesson text as untrusted data rather than instructions.
