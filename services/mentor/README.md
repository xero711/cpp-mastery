# AI mentor service

The GitHub Pages frontend does not call OpenAI or Ollama directly. This separate Node.js service keeps provider credentials on the server, checks a bearer token and exact browser Origin, limits request size/rate/output/concurrency, and streams text to the browser with SSE. It does not store chat content or log prompts. Browser chat history is stored in local IndexedDB and can be included in the learner backup; the service token stays in a separate store and is excluded.

## Local development

Use Node.js 24. Copy `.env.example` to `.env.private`, choose a model installed in Ollama or configure the OpenAI provider, and replace the example token with a random secret of at least 32 characters. Never commit `.env.private` or place `OPENAI_API_KEY` in a `NEXT_PUBLIC_` variable.

```powershell
Copy-Item services/mentor/.env.example services/mentor/.env.private
# Edit .env.private. For OpenAI, set MENTOR_PROVIDER=openai, MENTOR_MODEL, OPENAI_API_KEY,
# and the per-million-token prices if cost estimates are wanted.
node --env-file=services/mentor/.env.private services/mentor/src/server.mjs
```

The default listener is `127.0.0.1:8082`. For the local site, `http://localhost:3000` is already in the example Origin allowlist. If connecting from GitHub Pages, set the exact HTTPS site origin in `MENTOR_ALLOWED_ORIGINS`, then enter the HTTPS service URL and its bearer token in Settings. Do not expose a shared owner token to public visitors; use this service for personal development until per-user authentication and an abuse-control boundary are deployed.

In Settings, save the service URL and token. Both are browser-local and excluded from backups. The page sends no content just by connecting. Each message is sent only when the learner submits it. Lesson/code context is off by default and must be explicitly included; the server treats all user messages, code, and lesson context as untrusted input.

## Providers and endpoint

- `MENTOR_PROVIDER=ollama` posts to Ollama's `/api/chat` streaming endpoint. Use loopback HTTP for a local Ollama instance, or HTTPS for a remote server.
- `MENTOR_PROVIDER=openai` uses the OpenAI Responses API streaming endpoint and `OPENAI_API_KEY` from the service environment. Requests set `store: false` and use code-managed Japanese teaching instructions.
- `GET /v1/health` reports the selected provider/model and whether required server-side configuration is present.
- `POST /v1/chat` accepts a mode, a bounded list of user/assistant messages, and optional explicitly supplied context. It streams `{type:"delta",text}`, followed by `{type:"done",usage}` or a sanitized `{type:"error",message}` event.

OpenAI input/output token counts and an estimated API cost are returned when the provider supplies usage and both per-million-token rates are configured. Rates are deployment configuration; no model price is assumed. Ollama reports token counts and zero external API cost; local power and hardware costs are not included.

## Verification

```powershell
node --test services/mentor/test/server.node.mjs
```

Tests use a fake provider transport. They verify authentication, CORS, validation, limits, streaming events, cost estimation, and the OpenAI/Ollama request shapes without sending learner data to an external provider.
