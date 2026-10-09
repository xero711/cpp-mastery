# C++ runner production host runbook

This runbook prepares a dedicated Linux host for the separate runner API. It does not create a VM, DNS record, firewall rule, or paid cloud resource. The GitHub Pages site remains the static frontend.

## Host boundary

Use a dedicated Ubuntu 24.04 x86-64 or ARM64 Linux VM with a supported kernel, Docker Engine, Node.js 24, and a public DNS name. Do not share this VM with personal services or secrets: the API broker must access Docker, and Docker daemon access is root-equivalent. gVisor adds an isolation layer for untrusted code, but does not replace host hardening, network policy, monitoring, or abuse response. Review the [gVisor production guide](https://gvisor.dev/docs/user_guide/production/) before accepting public submissions.

Install Docker Engine using [Docker's Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Install gVisor's `runsc` from its [official apt repository](https://gvisor.dev/docs/user_guide/install/):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | sudo tee /etc/apt/sources.list.d/gvisor.list >/dev/null
sudo apt-get update
sudo apt-get install -y runsc
sudo runsc install
sudo systemctl restart docker
docker info --format '{{json .Runtimes}}'
```

The last command must list `runsc`. Keep the sandbox network disabled as configured by the API. Publicly expose only the HTTPS reverse proxy and administrator-restricted SSH; do not expose port 8081 or the Docker socket.

## Build and pin the sandbox image

Check out the reviewed application revision on the host and build the sandbox image from the repository root:

```bash
sudo git clone --branch main --depth 1 https://github.com/xero711/cpp-mastery.git /opt/cpp-mastery
cd /opt/cpp-mastery
sudo docker build --file services/runner/Dockerfile.sandbox --tag cpp-mastery-sandbox:prod services/runner
sudo docker run --rm --runtime=runsc cpp-mastery-sandbox:prod <<'EOF'
{"source":"#include <iostream>\nint main(){std::cout << 42 << '\\n';}","standard":"c++23","tests":[{"stdin":""}]}
EOF
```

The second command verifies that this host can start the sandbox with `runsc`; the API integration suite below exercises the complete HTTP-to-C++ path. Get the immutable Docker image ID and store that exact value as `RUNNER_SANDBOX_IMAGE`:

```bash
sudo docker image inspect --format '{{.Id}}' cpp-mastery-sandbox:prod
```

The ID must be `sha256:` followed by 64 lowercase hexadecimal characters. Production also accepts a registry reference pinned as `image@sha256:<digest>`. Mutable tags such as `:latest` are rejected.

## Service account and secret configuration

Create a dedicated service user. Membership in the `docker` group grants root-equivalent authority, which is why this must be a dedicated host:

```bash
sudo useradd --system --home /var/lib/cpp-mastery-runner --create-home --shell /usr/sbin/nologin cpp-runner
sudo usermod --append --groups docker cpp-runner
sudo chown -R root:cpp-runner /opt/cpp-mastery
sudo chmod -R g+rX /opt/cpp-mastery
sudo install --directory --owner=root --group=root --mode=0700 /etc/cpp-mastery-runner
sudoedit /etc/cpp-mastery-runner/runner.env
```

Put these values in the environment file. Generate a fresh token with `openssl rand -hex 32`; keep it private and do not commit it:

```dotenv
NODE_ENV=production
RUNNER_HOST=127.0.0.1
RUNNER_PORT=8081
RUNNER_API_TOKEN=<fresh 64-character token>
RUNNER_ALLOWED_ORIGINS=https://<the exact site origin>
RUNNER_DOCKER_RUNTIME=runsc
RUNNER_SANDBOX_IMAGE=sha256:<the image ID printed above>
RUNNER_MAX_CONCURRENT_JOBS=2
```

`RUNNER_ALLOWED_ORIGINS` is an origin, so it contains the scheme and hostname only, without a path. For the current Pages custom domain it would be `https://xero-x.me`; confirm the live site origin before using it. Protect the file:

```bash
sudo chown root:root /etc/cpp-mastery-runner/runner.env
sudo chmod 0600 /etc/cpp-mastery-runner/runner.env
```

## systemd unit

Find the Node.js executable with `command -v node`, then use its absolute path in `ExecStart` below if it is not `/usr/bin/node`:

```ini
[Unit]
Description=C++ Mastery isolated C++ runner API
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=simple
User=cpp-runner
SupplementaryGroups=docker
WorkingDirectory=/opt/cpp-mastery
EnvironmentFile=/etc/cpp-mastery-runner/runner.env
ExecStart=/usr/bin/node /opt/cpp-mastery/services/runner/src/server.mjs
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true

[Install]
WantedBy=multi-user.target
```

Save as `/etc/systemd/system/cpp-mastery-runner.service`, then start and check it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cpp-mastery-runner
sudo systemctl status cpp-mastery-runner --no-pager
curl --fail http://127.0.0.1:8081/healthz
```

Startup must fail closed if Docker, `runsc`, or the pinned image is missing. Inspect service logs with `sudo journalctl -u cpp-mastery-runner`.

## HTTPS reverse proxy

Point a DNS name such as `runner.example.com` to this host. Install Caddy using its [official instructions](https://caddyserver.com/docs/install), and configure:

```caddyfile
runner.example.com {
    reverse_proxy 127.0.0.1:8081
}
```

Caddy obtains and renews HTTPS certificates automatically when the DNS name resolves to this host and ports 80 and 443 are reachable. Keep the API itself bound to loopback. Apply a host firewall, restrict SSH to administrator addresses, and add the chosen provider's ingress controls, monitoring, and abuse response before public use.

## Acceptance and Pages connection

Before connecting the website:

1. Run the Docker integration suite on this host with gVisor:

   ```bash
   sudo -u cpp-runner env NODE_ENV=production RUNNER_DOCKER_RUNTIME=runsc RUNNER_SANDBOX_IMAGE="$(sudo docker image inspect --format '{{.Id}}' cpp-mastery-sandbox:prod)" /usr/bin/node /opt/cpp-mastery/services/runner/test/integration.mjs
   ```

2. Verify `https://runner.example.com/healthz` returns `{"status":"ok"}`.
3. Open the deployed site, save the same runner token in Settings, submit a known C++ exercise, and verify actual compiler output and test results. Confirm that a wrong answer, a compile error, a timeout, and a runner outage are shown as distinct outcomes.
4. Set the repository Actions variable `CPP_RUNNER_URL` to `https://runner.example.com`. The Pages workflow will build the static client with that URL.

The current API uses one configured bearer token for the runner instance; it does not issue per-user credentials. Keep this deployment for the owner until an account/token-issuance layer exists. Do not distribute one shared token to public site visitors.

This repository does not yet have a runner host, DNS name, or provider credentials. Until those exist and every acceptance step above passes, the live Pages site must keep reporting that C++ execution is unavailable.
