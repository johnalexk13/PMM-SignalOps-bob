import { buildEvidenceDatabase } from "../evidence-store.mjs";

export default async function handler(request, response) {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const force = url.searchParams.has("refresh");
    
    const data = await buildEvidenceDatabase({ force });
    
    response.status(200).json(data);
  } catch (error) {
    console.error("Error in evidence-store API:", error);
    response.status(500).json({ 
      error: "Failed to fetch evidence store",
      message: error.message 
    });
  }
}

// Made with Bob
