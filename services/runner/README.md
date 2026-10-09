# Isolated C++ runner

This service is separate from the GitHub Pages frontend. It accepts bounded C++ source and public stdin cases, compiles in a disposable container, and returns compiler output and one execution result per input. It does not receive expected answers or award scores; the browser compares returned output with the lesson's public expected output.

## Local development

Requirements: Node.js 24 and Docker Desktop using the Linux container engine. Build the sandbox image from the repository root:

```powershell
docker build --file services/runner/Dockerfile.sandbox --tag cpp-mastery-sandbox:dev services/runner
```

Copy `services/runner/.env.example` to `services/runner/.env.private`, set a random token with at least 32 characters, then start the API from the repository root:

```powershell
Copy-Item services/runner/.env.example services/runner/.env.private
# Edit .env.private and replace the example token before starting the service.
node --env-file=services/runner/.env.private services/runner/src/server.mjs
```

The API binds to loopback by default. Do not expose this development configuration to the Internet.

## API

`POST /v1/execute` requires `Authorization: Bearer <token>` and JSON shaped as:

```json
{
  "source": "#include <iostream>\nint main(){std::cout << 42 << '\\n';}",
  "standard": "c++23",
  "tests": [{ "stdin": "" }]
}
```

The API validates C++17/20/23, caps source at 32 KB, accepts at most 12 cases with 8 KB input per case and 64 KB total input, and caps requests at 768 KB. The sandbox caps each output stream at 8 KB, compilation at 12 seconds, and each case at 2 seconds. The service allows at most four concurrent jobs (default two) and 20 accepted jobs per minute per token. HTTP errors represent authentication, validation, rate-limit, or infrastructure failures; they do not count as failed answers.

## Isolation boundary

Each test case runs in its own fresh container, so program processes, temporary files, and child processes cannot carry state into the next case. Containers have no network, no host mounts, a read-only root filesystem, a 64 MB writable temporary filesystem, UID/GID 65532, no Linux capabilities, `no-new-privileges`, Docker's built-in seccomp profile, 512 MB memory and swap, one CPU, 64 processes, 64 file descriptors, and no core dumps. The compiler and each program process also have address-space limits; UndefinedBehaviorSanitizer and libstdc++ assertions are enabled for submissions. The GCC image includes the AddressSanitizer runtime, but the API does not yet expose an AddressSanitizer toggle. The container has no runner API token, Docker socket, source checkout, home directory, or expected answers. The broker removes the named container if the job is cancelled or the service times out.

The broker is the only process that needs access to the Docker daemon. Docker daemon access is root-equivalent, so never expose the daemon socket or a Docker TCP endpoint to the network. Docker's default runtime shares the host kernel; production startup therefore refuses `runc`, requires gVisor (`runsc`), requires an immutable SHA-256 sandbox image reference, and only accepts HTTPS origins. These measures are not a substitute for operational review, an external authentication gateway, egress controls, monitoring, and abuse response before accepting public submissions.

## Tests

```powershell
node --test services/runner/test/server.node.mjs
```

The full Docker-backed integration suite is `node services/runner/test/integration.mjs`. It compiles and runs C++17/20/23, then checks compile errors, timeouts, output caps, and the network namespace. `.github/workflows/runner-ci.yml` builds the pinned sandbox image and runs both suites on trusted pushes to `main`.
