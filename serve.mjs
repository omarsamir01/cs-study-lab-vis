/**
 * Static file server (no npm): uses the same Node that ships with Cursor / your PATH.
 * Serves with correct MIME types so ES modules load.
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8090;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1`);
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    if (rel.includes("..")) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    const filePath = path.join(__dirname, rel);
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.writeHead(200);
    res.end(data);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not found");
    } else {
      res.writeHead(500);
      res.end(e && e.message ? e.message : String(e));
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`CS Study Lab → http://127.0.0.1:${PORT}/`);
});
