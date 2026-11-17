// ============================================================================
// Local dev server — serves public/ with no dependencies
// Usage:  node scripts/dev-server.mjs     →  http://localhost:3000
// (Web3Forms is called client-side — no API function needed locally)
// ============================================================================
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 3000);
const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(HERE, "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    let relative = decodeURIComponent(url.pathname);
    if (relative === "/") relative = "/index.html";
    const abs = resolve(join(ROOT, relative));
    if (abs !== ROOT && !abs.startsWith(ROOT + sep)) {
      res.writeHead(403); return res.end("Forbidden");
    }

    let data;
    try {
      data = await readFile(abs);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const type = MIME[extname(abs).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  } catch (err) {
    console.error("dev-server error:", err);
    res.writeHead(500); res.end("Internal error");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Dev server running:  http://localhost:${PORT}`);
  console.log(`  Contact page:        http://localhost:${PORT}/contact.html\n`);
});
