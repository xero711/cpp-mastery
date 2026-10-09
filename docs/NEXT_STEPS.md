# Next steps

## C++ runner

1. Done: runner CI run [37918479556](https://github.com/xero711/cpp-mastery/actions/runs/37918479556) builds the pinned image, passes real C++17/20/23 compile/run and isolation checks, and passes a browser-to-runner compile/grade, saved-history reload, model-solution reveal, and debug-fix reveal using the static Pages export. This uses `runc` on GitHub's isolated Linux VM; it does not prove execution on the Windows host or production gVisor.
2. For personal use, install Docker Desktop with its Linux container engine, start the local runner with `RUNNER_HOST=127.0.0.1`, add the exact Pages origin to `RUNNER_ALLOWED_ORIGINS`, and enter `http://127.0.0.1:8081` plus its private token in the browser Settings screen. Follow [the local runner guide](../services/runner/README.md#local-development). Do not expose this `runc` development setup to the Internet.
3. For public submissions, choose a separately hosted Linux deployment target with Docker and gVisor (`runsc`), HTTPS, private ingress controls, egress policy, monitoring, and an abuse-response plan. Production startup rejects `runc` and mutable image tags; the host can pin a local image ID, so a separate image registry is optional. Follow [the production deployment runbook](../services/runner/DEPLOYMENT.md).
4. After production deployment, verify its public HTTPS URL, origin allowlist, bearer authentication, rate limits, sandbox image digest, and real cross-origin compile/run before setting repository variable `CPP_RUNNER_URL`. The token is stored separately in browser IndexedDB and is excluded from learning backups. Current runner auth does not issue per-user tokens, so do not distribute the owner token to public visitors.

The current Windows host has no Docker Desktop/CLI or WSL distribution. The GitHub repository currently has no Actions variables or secrets, including `CPP_RUNNER_URL`. The API and sandbox image are implemented; Docker-backed execution is not yet verified on this PC. A provider/account and its billing boundary must be available before a public gVisor runner can be created.

## GitHub Pages custom domain

The static frontend is deployed by GitHub Actions to GitHub Pages. `xero-x.me` is currently attached through the existing `xero711.github.io` user-site setup, while `xero711/cpp-mastery` reports `https_enforced=false`. GitHub's latest DNS health check finds the apex proxied by Cloudflare and not pointed at GitHub Pages, so its Pages certificate is not eligible yet; GitHub rejected an HTTPS-enforcement request because the certificate does not exist.

The domain owner needs to review the Cloudflare DNS records and proxy mode for `xero-x.me` and `www.xero-x.me`, ensuring the custom domain resolves directly through GitHub's documented Pages records and that no conflicting records remain. After GitHub reports the domain is served by Pages and HTTPS-eligible and provisions the certificate, enable HTTPS enforcement for `xero711/cpp-mastery`, then verify `https://xero-x.me/cpp-mastery/` in a normal browser. GitHub's current instructions are [custom-domain DNS setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [HTTPS troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https). No DNS change was made because the apex domain also serves the existing user-site; changing its routing may affect that site.

## Learning platform

1. Author and review detailed daily lessons beyond Week 8. Week 9–104 currently provides the weekly plan and daily templates.
2. Add adaptive planning, a skill map, projects, portfolio export, and richer measured analytics. The browser-local review schedule now advances only after a correct quiz and passing test.
3. Add AI mentor only through a separate secret-bearing service; it is not implemented.
4. Extend review E2E coverage for a missed review attempt and backup-restored review state. CI now verifies due-date presentation, a correct quiz plus passing isolated C++ submission advancing the interval, and persistence after reload. The separate Chromium backup/restore E2E confirms the runner token stays out of backup JSON.
5. Continue route-by-route accessibility and responsive review on the deployed GitHub Pages site. The custom domain currently presents a Cloudflare browser challenge to this automated review environment.
