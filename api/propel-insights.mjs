/**
 * /api/propel-insights
 *
 * Serves IBM Product Knowledge (Propel MCP) data to the SignalOps dashboard.
 * Returns positioning, competitive, capabilities, integration, and enablement
 * sections sourced from IBM Docs, Seismic, cloud_docs, and marketing content.
 *
 * @module api/propel-insights
 */
import { getPropelKnowledge } from "../lib/propel-knowledge.mjs";

function readBody(request) {
  if (request.body && typeof request.body === "object") return Promise.resolve(request.body);
  return new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
    request.on("error", () => resolve({}));
  });
}

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const body = request.method === "POST" ? await readBody(request) : {};
    const params = { ...queryParams, ...body };

    const force = "refresh" in params;
    const productName = params.productName || params.product || "IBM Netezza";

    let competitors = [];
    if (params.competitors) {
      try {
        const parsed = typeof params.competitors === "string"
          ? JSON.parse(params.competitors)
          : params.competitors;
        competitors = Array.isArray(parsed)
          ? parsed.map((c) => (typeof c === "string" ? c : c?.name || "")).filter(Boolean)
          : [];
      } catch {
        competitors = [];
      }
    }

    const data = await getPropelKnowledge({ productName, competitors, force });

    response.status(200).json(data);
  } catch (error) {
    console.error("[api/propel-insights] Error:", error);
    response.status(500).json({
      error: "Failed to fetch IBM product knowledge",
      message: error.message,
    });
  }
}
