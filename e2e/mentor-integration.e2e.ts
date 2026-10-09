import { createServer } from "node:http";
import { expect, test } from "@playwright/test";

test("AI mentor sends chat only on submit, streams a reply, and restores local history", async ({ page }) => {
  const token = "e2e-test-mentor-token-not-a-real-secret-0123456789";
  const server = createServer();
  let siteOrigin = "";
  let submitted: Record<string, unknown> | null = null;
  let healthChecks = 0;

  server.on("request", async (request, response) => {
    const origin = request.headers.origin ?? "";
    if (origin !== siteOrigin) {
      response.writeHead(403).end();
      return;
    }
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }
    if (request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "bad token" }));
      return;
    }
    if (request.method === "GET" && request.url === "/v1/health") {
      healthChecks += 1;
      response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ready: true, provider: "ollama", model: "local-e2e-model", costEstimateConfigured: true }));
      return;
    }
    if (request.method === "POST" && request.url === "/v1/chat") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      submitted = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
      response.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" });
      response.write(`data: ${JSON.stringify({ type: "delta", text: "まず要素数とcapacityを分けて考えます。" })}\n\n`);
      response.write(`data: ${JSON.stringify({ type: "done", usage: { provider: "ollama", model: "local-e2e-model", inputTokens: 19, outputTokens: 11, estimatedCostUsd: 0 } })}\n\n`);
      response.end();
      return;
    }
    response.writeHead(404).end();
  });

  await page.goto("settings/");
  siteOrigin = new URL(page.url()).origin;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Mentor test server did not bind to a TCP port");
  const serviceUrl = `http://127.0.0.1:${address.port}`;

  try {
    await page.getByLabel("AIサービスURL").fill(serviceUrl);
    await page.getByRole("button", { name: "AI URLを保存" }).click();
    await page.getByLabel("AIサービスのアクセストークン").fill(token);
    await page.getByRole("button", { name: "AIトークンを保存" }).click();

    await page.goto("mentor/");
    await expect(page.getByText("Ollama · local-e2e-model")).toBeVisible();
    expect(healthChecks).toBeGreaterThan(0);
    expect(submitted).toBeNull();

    await page.getByLabel("教材・コードを添付").check();
    await page.getByLabel("AI講師に添付する教材やコード").fill("#include <vector>\nstd::vector<int> values;");
    await page.getByLabel("AI講師への質問").fill("capacityが増えるタイミングを教えてください。");
    await page.getByRole("button", { name: "送信" }).click();
    await expect(page.getByText("まず要素数とcapacityを分けて考えます。")).toBeVisible();
    expect(submitted).toMatchObject({
      mode: "teacher",
      context: "#include <vector>\nstd::vector<int> values;",
      messages: [{ role: "user", content: "capacityが増えるタイミングを教えてください。" }],
    });
    expect(page.getByText(/入力 19 \/ 出力 11 tokens/)).toBeVisible();

    await page.reload();
    await expect(page.getByText("capacityが増えるタイミングを教えてください。")).toBeVisible();
    await expect(page.getByText("まず要素数とcapacityを分けて考えます。")).toBeVisible();
    expect(submitted).not.toBeNull();
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
