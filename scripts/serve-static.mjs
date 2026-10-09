import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const siteRoot = resolve(process.env.STATIC_SITE_DIR ?? "out");
const basePath = process.argv[2] ?? "";
const port = Number(process.env.STATIC_SITE_PORT ?? 3008);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function handleRequest(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    sendNotFound(response);
    return;
  }

  if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    sendNotFound(response);
    return;
  }

  let routePath = basePath ? pathname.slice(basePath.length) : pathname;
  if (!routePath.startsWith("/")) routePath = `/${routePath}`;
  const candidate = resolve(siteRoot, `.${routePath}`);
  const relativePath = relative(siteRoot, candidate);
  if (isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    sendNotFound(response);
    return;
  }

  try {
    let filePath = candidate;
    let fileInfo = await stat(filePath);
    if (fileInfo.isDirectory()) {
      filePath = resolve(filePath, "index.html");
      fileInfo = await stat(filePath);
    }
    if (!fileInfo.isFile()) {
      sendNotFound(response);
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": fileInfo.size,
      "Content-Type": contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      sendNotFound(response);
      return;
    }
    console.error("Static file server request failed", error);
    if (!response.headersSent) response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(port, "0.0.0.0", () => {
  console.info(`Serving ${siteRoot} at http://localhost:${port}${basePath}/`);
});
