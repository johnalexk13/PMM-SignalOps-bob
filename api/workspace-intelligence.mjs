import { getWorkspaceIntelligence } from "../workspace-intelligence.mjs";

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

function buildProduct(params) {
    return {
          id: params.productId || "",
          displayName: params.productName || "",
          productName: params.fullProductName || params.productName || "",
          shortName: params.shortName || "",
          description: params.description || "",
          primaryBuyer: params.primaryBuyer || "",
          productUrl: params.productUrl || "",
    };
}

export default async function handler(request, response) {
    try {
          const url = new URL(request.url, `https://${request.headers.host}`);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          const body = request.method === "POST" ? await readBody(request) : {};
          const params = { ...queryParams, ...body };

      const force = "refresh" in params && params.refresh !== undefined;

      let competitors = [];
          const rawCompetitors = params.competitors;
          if (Array.isArray(rawCompetitors)) {
                  competitors = rawCompetitors;
          } else if (typeof rawCompetitors === "string" && rawCompetitors) {
                  try { competitors = JSON.parse(rawCompetitors); } catch (error) {
                            console.error("[api/workspace-intelligence] Failed to parse competitors param:", error);
                  }
          }

      const documents = Array.isArray(params.documents) ? params.documents : [];
          const product = buildProduct(params);

      const data = await getWorkspaceIntelligence({ force, product, competitors, documents });

      response.status(200).json(data);
    } catch (error) {
          console.error("Error in workspace-intelligence API:", error);
          response.status(500).json({
                  error: "Failed to fetch workspace intelligence",
                  message: error.message
          });
    }
}
