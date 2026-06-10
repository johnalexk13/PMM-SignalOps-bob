import { getWorkspaceIntelligence } from "../workspace-intelligence.mjs";

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
        console.log(`[api/workspace-intelligence] Received competitors: ${competitors.join(', ')}`);
      } catch (error) {
        console.error("[api/workspace-intelligence] Failed to parse competitors param:", error);
      }
    }
    
    const data = await getWorkspaceIntelligence({ force, competitors });
    
    response.status(200).json(data);
  } catch (error) {
    console.error("Error in workspace-intelligence API:", error);
    response.status(500).json({
      error: "Failed to fetch workspace intelligence",
      message: error.message
    });
  }
}

// Made with Bob
