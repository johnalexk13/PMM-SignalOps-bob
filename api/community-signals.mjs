import { getCommunitySignalsFeed } from "../community-signals.mjs";

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const force = url.searchParams.has("refresh");
    const productName = url.searchParams.get("product") || "IBM Netezza";
    const keywords = url.searchParams.get("keywords") || "";
    const platforms = url.searchParams.get("platforms") || "";
    
    const data = await getCommunitySignalsFeed({
      force,
      productName,
      keywords,
      platforms
    });
    
    response.status(200).json(data);
  } catch (error) {
    console.error("Error in community-signals API:", error);
    response.status(500).json({ 
      error: "Failed to fetch community signals",
      message: error.message 
    });
  }
}

// Made with Bob
