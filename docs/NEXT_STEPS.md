# Next steps

## C++ runner

1. Done: runner CI run [37903323633](https://github.com/xero711/cpp-mastery/actions/runs/37903323633) builds the pinned image and passes real C++17/20/23 compile/run, network, memory, timeout, output-limit, and per-case isolation checks on GitHub's Linux runner. This validates CI only.
2. Choose a separately hosted Linux deployment target with Docker and gVisor (`runsc`), HTTPS, private ingress controls, egress policy, monitoring, and an abuse-response plan. Production startup rejects `runc` and mutable sandbox image tags.
3. Deploy the runner and verify its public HTTPS URL, origin allowlist, bearer authentication, rate limits, sandbox image digest, and real cross-origin compile/run before setting the repository variable `CPP_RUNNER_URL`.
4. Configure the frontend build and enter the per-user token in Settings only after the service is reachable. The token is stored separately in browser IndexedDB and is excluded from learning backups.

The current Windows host has no Docker CLI, WSL distribution, cloud-provider CLI, or cloud credentials. The GitHub repository currently has no Actions variables or secrets, including `CPP_RUNNER_URL`. The API and sandbox image are implemented; Docker-backed execution is not yet verified on this PC or deployed. A provider/account and its billing boundary must be available before a public runner can be created.

## Learning platform

1. Author and review detailed daily lessons beyond Week 8. Week 9–104 currently provides the weekly plan and daily templates.
2. Add adaptive planning, a skill map, projects, portfolio export, and richer measured analytics. The browser-local review schedule now advances only after a correct quiz and passing test.
3. Add AI mentor only through a separate secret-bearing service; it is not implemented.
4. Expand browser E2E coverage for learner progress, code submission, review sessions, and error handling. A Chromium E2E now verifies backup/restore, including that the separate runner token stays out of the backup; Docker-backed runner integration already runs in CI.
5. Continue route-by-route accessibility and responsive review on the deployed GitHub Pages site. The custom domain currently presents a Cloudflare browser challenge to this automated review environment.
