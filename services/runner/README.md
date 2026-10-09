# Isolated C++ runner

This service is separate from the GitHub Pages frontend. It compiles bounded C++ source in disposable containers. Code grading and explicit answer reveals use runner-owned records; reference solutions, debug fixes, and hidden tests are not included in the static browser payload. Multiple-choice checks work from the pre-authored lesson data without this service.

## Local development

Requirements: Node.js 24 and Docker Desktop using the Linux container engine. Build the sandbox image from the repository root:

```powershell
docker build --file services/runner/Dockerfile.sandbox --tag cpp-mastery-sandbox:dev services/runner
```

Copy `services/runner/.env.example` to `services/runner/.env.private`. Set a random token with at least 32 characters and allow the exact origin that serves the site. For the current Pages custom domain, use `RUNNER_ALLOWED_ORIGINS=https://xero-x.me,http://localhost:3000`. Keep `RUNNER_HOST=127.0.0.1` so the service is reachable only on this PC. Then start the API from the repository root:

```powershell
Copy-Item services/runner/.env.example services/runner/.env.private
# Edit .env.private and replace the example token before starting the service.
node --env-file=services/runner/.env.private services/runner/src/server.mjs
```

In the GitHub Pages Settings screen, save `http://127.0.0.1:8081` as the runner URL and enter the same token. The URL override and token stay in this browser and are not part of learner backups. Chrome 142 and later may ask to let the Pages site access the local network; allow it only when connecting to your own loopback runner. This personal Windows setup uses Docker's default `runc` runtime and is not a production public runner. Use the separate gVisor deployment guide before accepting public submissions.

The API binds to loopback by default. Do not expose this development configuration to the Internet.

## API

`POST /v1/execute` is a general compile-and-run endpoint. It requires `Authorization: Bearer <token>` and JSON shaped as:

```json
{
  "source": "#include <iostream>\nint main(){std::cout << 42 << '\\n';}",
  "standard": "c++23",
  "tests": [{ "stdin": "" }]
}
```

`POST /v1/grade` accepts `{ "lessonId", "source", "standard" }`. The API looks up public and private cases in `data/lesson-registry.json`, runs both groups, compares expected output on the server, and returns the score plus public case details only. The browser cannot supply tests or expected answers to this endpoint. `POST /v1/reveal` returns a solution or debug explanation only after an explicit request. All endpoints require the bearer token and an allowlisted request Origin. Multiple-choice checks use pre-authored lesson data and do not need this service.

The API validates C++17/20/23, caps source at 32 KB, accepts at most 12 runner-owned cases with 8 KB input per case and 64 KB total input, and caps requests at 768 KB. The sandbox caps each output stream at 8 KB, compilation at 12 seconds, and each case at 2 seconds. The service allows at most four concurrent jobs (default two) and 20 accepted requests per minute per token. HTTP errors represent authentication, validation, rate-limit, or infrastructure failures; they do not count as failed answers.

## Isolation boundary

Each test case runs in its own fresh container, so program processes, temporary files, and child processes cannot carry state into the next case. Containers have no network, no host mounts, a read-only root filesystem, a 64 MB writable temporary filesystem, UID/GID 65532, no Linux capabilities, `no-new-privileges`, Docker's built-in seccomp profile, 512 MB memory and swap, one CPU, 64 processes, 64 file descriptors, and no core dumps. The compiler and each program process also have address-space limits; UndefinedBehaviorSanitizer and libstdc++ assertions are enabled for submissions. The GCC image includes the AddressSanitizer runtime, but the API does not yet expose an AddressSanitizer toggle. The container has no runner API token, Docker socket, source checkout, home directory, or expected answers. The broker removes the named container if the job is cancelled or the service times out.

The broker is the only process that needs access to the Docker daemon. Docker daemon access is root-equivalent, so never expose the daemon socket or a Docker TCP endpoint to the network. Docker's default runtime shares the host kernel; production startup therefore refuses `runc`, requires gVisor (`runsc`), requires an immutable SHA-256 sandbox image reference, and only accepts HTTPS origins. Pin a registry image as `name@sha256:<digest>`, or build the image on the runner host and pin its immutable local Docker image ID (`sha256:<image-id>`). These measures are not a substitute for operational review, an external authentication gateway, egress controls, monitoring, and abuse response before accepting public submissions.

See [production deployment](DEPLOYMENT.md) for the Ubuntu and gVisor runbook. It is a host setup guide; public service acceptance still requires a real host, domain, HTTPS endpoint, and cross-origin compile/run verification.

## Tests

```powershell
node --test services/runner/test/server.node.mjs
```

Generate the safe public lesson payload and runner-only grading registry from the lesson source before running tests or building Pages:

```powershell
pnpm generate:lessons
```

The Pages workflow runs a post-build scan that rejects private solutions, debug fixes, and hidden case data in the exported HTML, JavaScript, and JSON assets.

The full Docker-backed integration suite is `node services/runner/test/integration.mjs`. It compiles and runs C++17/20/23, then checks compile errors, timeouts, output caps, and the network namespace. `.github/workflows/runner-ci.yml` builds the pinned sandbox image and runs both suites on trusted pushes to `main`.
