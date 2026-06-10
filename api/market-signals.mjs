import { getMarketSignalsFeed } from "../market-signals.mjs";

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const force = url.searchParams.has("refresh");
    
    // Parse competitors from query params
    const competitorsParam = url.searchParams.get("competitors");
    let competitors = [];
    if (competitorsParam) {
      try {
        competitors = JSON.parse(competitorsParam);
        console.log(`[api/market-signals] Received competitors: ${competitors.join(', ')}`);
      } catch (error) {
        console.error("[api/market-signals] Failed to parse competitors param:", error);
      }
    }
    
    const data = await getMarketSignalsFeed({ force, competitors });
    
    response.status(200).json(data);
  } catch (error) {
    console.error("Error in market-signals API:", error);
    response.status(500).json({
      error: "Failed to fetch market signals",
      message: error.message
    });
  }
}

// Made with Bob
