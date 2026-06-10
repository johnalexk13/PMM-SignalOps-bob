import { getMarketSignalsFeed } from "../market-signals.mjs";

export default async function handler(request, response) {
  try {
    const url = getRequestUrl(request);
    const payload = await getMarketSignalsFeed({
      force: url.searchParams.has("refresh"),
    });

    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      error: "Market signals endpoint failed",
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
