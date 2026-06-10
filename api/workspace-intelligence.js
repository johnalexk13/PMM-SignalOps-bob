import { getWorkspaceIntelligence } from "../workspace-intelligence.mjs";

export default async function handler(request, response) {
  try {
    const url = getRequestUrl(request);
    const payload = await getWorkspaceIntelligence({
      force: url.searchParams.has("refresh"),
      product: {
        id: url.searchParams.get("productId") || "",
        displayName: url.searchParams.get("productName") || "",
        productName: url.searchParams.get("fullProductName") || "",
        shortName: url.searchParams.get("shortName") || "",
        description: url.searchParams.get("description") || "",
        primaryBuyer: url.searchParams.get("primaryBuyer") || "",
        productUrl: url.searchParams.get("productUrl") || "",
      },
    });

    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      error: "Workspace intelligence endpoint failed",
      message: error?.message || "Unknown error",
    });
  }
}

function getRequestUrl(request) {
  return new URL(request.url || "/", `https://${request.headers.host || "localhost"}`);
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}
