import { createReadStream, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { getCommunitySignalsFeed } from "./community-signals.mjs";
import { getMarketSignalsFeed } from "./market-signals.mjs";
import { getWorkspaceIntelligence } from "./workspace-intelligence.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3002);

await loadLocalEnv();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    if (pathname === "/api/market-signals" || pathname === "/.netlify/functions/market-signals") {
      const force = url.searchParams.has("refresh");
      const competitorsParam = url.searchParams.get("competitors");
      let competitors = [];
      if (competitorsParam) {
        try {
          competitors = JSON.parse(competitorsParam);
        } catch (e) {
          console.error("Invalid competitors parameter:", e);
        }
      }
      sendJson(response, 200, await getMarketSignalsFeed({ force, competitors }));
      return;
    }

    if (pathname === "/api/community-signals" || pathname === "/.netlify/functions/community-signals") {
      const force = url.searchParams.has("refresh");
      sendJson(response, 200, await getCommunitySignalsFeed({
        force,
        productName: url.searchParams.get("product") || "IBM Netezza",
        keywords: url.searchParams.get("keywords") || "",
        platforms: url.searchParams.get("platforms") || "",
      }));
      return;
    }

    if (pathname === "/api/workspace-intelligence" || pathname === "/.netlify/functions/workspace-intelligence") {
      const force = url.searchParams.has("refresh");
      const competitorsParam = url.searchParams.get("competitors");
      let competitors = [];
      if (competitorsParam) {
        try {
          competitors = JSON.parse(competitorsParam);
        } catch (e) {
          console.error("Invalid competitors parameter:", e);
        }
      }
      sendJson(response, 200, await getWorkspaceIntelligence({
        force,
        competitors,
        product: {
          id: url.searchParams.get("productId") || "",
          displayName: url.searchParams.get("productName") || "",
          productName: url.searchParams.get("fullProductName") || "",
          shortName: url.searchParams.get("shortName") || "",
          description: url.searchParams.get("description") || "",
          primaryBuyer: url.searchParams.get("primaryBuyer") || "",
          productUrl: url.searchParams.get("productUrl") || "",
        },
      }));
      return;
    }

    const sanitizedPath = normalize(pathname).replace(/^(\.\.[\\/])+/, "");
    const filePath = join(rootDir, sanitizedPath);

    if (!filePath.startsWith(rootDir)) {
      sendText(response, 403, "Forbidden");
      return;
    }

    if (!existsSync(filePath)) {
      sendText(response, 404, "Not found");
      return;
    }

    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      sendText(response, 403, "Forbidden");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });

    createReadStream(filePath).pipe(response);
  } catch (error) {
    sendText(response, 500, `Server error: ${error.message}`);
  }
}).listen(port, () => {
  console.log(`SignalOps Product Marketing Insights running at http://localhost:${port}`);
});

async function loadLocalEnv() {
  const candidates = [".env.local", ".env"];

  for (const filename of candidates) {
    try {
      const raw = await readFile(join(rootDir, filename), "utf8");
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex <= 0) return;
        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        if (!key || process.env[key] !== undefined) return;
        process.env[key] = rawValue.replace(/^["']|["']$/g, "");
      });
    } catch {
      // Local env files are optional.
    }
  }
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(message);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}
