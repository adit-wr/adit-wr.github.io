// ============================================================================
// Local dev server — serves public/ AND runs api/submit.js as a real function
// Usage:  node scripts/dev-server.mjs     →  http://localhost:3000
// Reads .env.local for WEB3FORMS_ACCESS_KEY (see .env.example)
// ============================================================================
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 3000);
const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(HERE, "..", "public");
const ENV_PATH = resolve(HERE, "..", ".env.local");

// --- Load .env.local into process.env (no dependency needed) -----------------
try {
  const raw = await readFile(ENV_PATH, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    let val = value.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
  if (process.env.WEB3FORMS_ACCESS_KEY) console.log("  .env.local loaded — WEB3FORMS_ACCESS_KEY is set");
} catch {
  console.log("  no .env.local found — /api/submit will return 500 until you create one");
}

// --- Load the serverless function (CommonJS) ----------------------------------
const fn = (await import("../api/submit.js")).default;

// --- Minimal MIME table ---------------------------------------------------------
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

// --- Vercel-style req/res proxy around the function ------------------------------
const callApi = (req, res, rawBody) => {
  let body = {};
  try { body = JSON.parse(rawBody || "{}"); } catch { body = {}; }

  const resProxy = {
    _statusCode: 200,
    _headers: {},
    status(code) { this._statusCode = code; return this; },
    setHeader(k, v) { this._headers[k] = v; },
    json(payload) {
      res.writeHead(this._statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...this._headers
      });
      res.end(JSON.stringify(payload));
    }
  };

  return fn({ method: req.method, headers: req.headers, body }, resProxy)
    .catch((err) => {
      console.error("/api/submit crashed:", err);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, message: "Internal dev-server error" }));
    });
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const pathname = url.pathname;

    // API route
    if (pathname === "/api/submit" && req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      return callApi(req, res, raw);
    }

    // Static files (with traversal protection)
    let relative = decodeURIComponent(pathname);
    if (relative === "/") relative = "/index.html";
    const abs = resolve(join(ROOT, relative));
    if (abs !== ROOT && !abs.startsWith(ROOT + sep)) {
      res.writeHead(403); return res.end("Forbidden");
    }

    let data;
    try {
      data = await readFile(abs);
    } catch {
      // 404
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
