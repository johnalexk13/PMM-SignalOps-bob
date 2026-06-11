/**
 * Competitor Source Mapping Module
 * 
 * This module provides dynamic competitor source mapping to support
 * any product category (data warehouses, business automation, etc.)
 * 
 * Usage:
 *   import { buildSourcesForCompetitors, filterSignalsByCompetitors } from './lib/competitor-mapping.mjs';
 */

// Comprehensive competitor source mapping
export const COMPETITOR_SOURCE_MAP = {
  // Data Warehouse Competitors
  "Databricks": {
    linkedin: "https://www.linkedin.com/company/databricks",
    g2: "https://www.g2.com/products/databricks-data-intelligence-platform/reviews",
    trustradius: "https://www.trustradius.com/products/databricks/reviews",
    blog: "https://docs.databricks.com/aws/en/feed.xml",
    website: "https://docs.databricks.com/sql/index.html"
  },
  "Snowflake": {
    linkedin: "https://www.linkedin.com/company/snowflake-computing",
    g2: "https://www.g2.com/products/snowflake/reviews",
    trustradius: "https://www.trustradius.com/products/snowflake/reviews",
    blog: "https://www.snowflake.com/blog/feed/",
    website: "https://www.snowflake.com/en/migrate-to-the-cloud/"
  },
  "Google BigQuery": {
    linkedin: "https://www.linkedin.com/showcase/google-cloud/",
    g2: "https://www.g2.com/products/google-bigquery/reviews",
    trustradius: "https://www.trustradius.com/products/google-bigquery/reviews",
    blog: "https://cloud.google.com/blog/products/data-analytics/rss/",
    website: "https://cloud.google.com/bigquery"
  },
  "Amazon Redshift": {
    linkedin: "https://www.linkedin.com/company/amazon-web-services",
    g2: "https://www.g2.com/products/amazon-redshift/reviews",
    trustradius: "https://www.trustradius.com/products/redshift/reviews",
    blog: "https://aws.amazon.com/blogs/big-data/feed/",
    website: "https://aws.amazon.com/redshift/features/"
  },
  "Azure Synapse": {
    linkedin: "https://www.linkedin.com/showcase/microsoft-azure/",
    g2: "https://www.g2.com/products/microsoft-azure-synapse-analytics/reviews",
    trustradius: "https://www.trustradius.com/products/azure-synapse-analytics/reviews",
    website: "https://azure.microsoft.com/en-us/products/synapse-analytics/"
  },
  "Teradata": {
    linkedin: "https://www.linkedin.com/company/teradata",
    g2: "https://www.g2.com/products/teradata-vantage/reviews",
    trustradius: "https://www.trustradius.com/products/teradata-vantage/reviews",
    blog: "https://www.teradata.com/Blogs/RSS",
    website: "https://www.teradata.com/platform"
  },
  "Yellowbrick": {
    linkedin: "https://www.linkedin.com/company/yellowbrick-data",
    g2: "https://www.g2.com/products/yellowbrick-data-warehouse/reviews",
    trustradius: "https://www.trustradius.com/products/yellowbrick-data-warehouse/reviews",
    blog: "https://yellowbrick.com/blog/",
    website: "https://yellowbrick.com/product/"
  },
  
  // Business Automation Competitors
  "Pega": {
    linkedin: "https://www.linkedin.com/company/pegasystems",
    g2: "https://www.g2.com/products/pega-platform/reviews",
    trustradius: "https://www.trustradius.com/products/pega-platform/reviews",
    website: "https://www.pega.com/products/platform"
  },
  "Appian": {
    linkedin: "https://www.linkedin.com/company/appian-corporation",
    g2: "https://www.g2.com/products/appian/reviews",
    trustradius: "https://www.trustradius.com/products/appian/reviews",
    website: "https://appian.com/platform.html"
  },
  "Opentext": {
    linkedin: "https://www.linkedin.com/company/opentext",
    g2: "https://www.g2.com/products/opentext-appworks/reviews",
    trustradius: "https://www.trustradius.com/products/opentext-appworks/reviews",
    website: "https://www.opentext.com/products/appworks-platform"
  },
  "Microsoft": {
    linkedin: "https://www.linkedin.com/company/microsoft",
    g2: "https://www.g2.com/products/microsoft-power-automate/reviews",
    trustradius: "https://www.trustradius.com/products/microsoft-power-automate/reviews",
    website: "https://www.microsoft.com/en-us/power-platform/products/power-automate"
  },
  
  // Add more competitors as needed
};

const COMPETITOR_ALIASES = {
  databricks: "Databricks",
  snowflake: "Snowflake",
  bigquery: "Google BigQuery",
  "google bigquery": "Google BigQuery",
  google: "Google BigQuery",
  gcp: "Google BigQuery",
  redshift: "Amazon Redshift",
  "amazon redshift": "Amazon Redshift",
  amazon: "Amazon Redshift",
  aws: "Amazon Redshift",
  synapse: "Azure Synapse",
  "azure synapse": "Azure Synapse",
  azure: "Azure Synapse",
  teradata: "Teradata",
  yellowbrick: "Yellowbrick",
  "yellowbrick data": "Yellowbrick",
  pega: "Pega",
  appian: "Appian",
  opentext: "Opentext",
  microsoft: "Microsoft",
};

function normalizeUrl(value) {
  return String(value || "").trim().toLowerCase().replace(/\/+$/, "");
}

function normalizeCompetitorKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

export function resolveCompetitorName(competitor) {
  const rawName = typeof competitor === "string" ? competitor : competitor?.name || competitor?.competitor || "";
  const normalizedKey = normalizeCompetitorKey(rawName);
  if (!normalizedKey) return "";
  const aliasMatch = COMPETITOR_ALIASES[normalizedKey];
  if (aliasMatch) return aliasMatch;
  const directMatch = Object.keys(COMPETITOR_SOURCE_MAP).find((name) => normalizeCompetitorKey(name) === normalizedKey);
  return directMatch || rawName.trim();
}

/**
 * Build dynamic market signal sources for specified competitors
 *
 * @param {string[]} competitors - Array of competitor names
 * @returns {Array} Array of source objects for market signal fetching
 */
export function buildSourcesForCompetitors(competitors) {
  if (!competitors || competitors.length === 0) {
    return [];
  }
  
  const sources = [];
  
  competitors.forEach((competitor) => {
    const resolvedCompetitor = resolveCompetitorName(competitor);
    if (!resolvedCompetitor) return;
    const userUrl = typeof competitor === "object" && competitor
      ? String(competitor.url || competitor.website || competitor.webpageUrl || "").trim()
      : "";
    const mapping = COMPETITOR_SOURCE_MAP[resolvedCompetitor] || {};
    const competitorId = resolvedCompetitor.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Build LinkedIn source
    if (mapping.linkedin) {
      sources.push({
        id: `${competitorId}-linkedin`,
        kind: "html",
        parser: "linkedin",
        competitor: resolvedCompetitor,
        group: "social",
        sourceLabel: "LinkedIn",
        sourceBadge: "LINKEDIN",
        sourceUrl: mapping.linkedin
      });
    }
    
    // Build G2 source
    if (mapping.g2) {
      sources.push({
        id: `${competitorId}-g2`,
        kind: "html",
        parser: "g2",
        competitor: resolvedCompetitor,
        group: "reviews",
        sourceLabel: "G2",
        sourceBadge: "G2",
        sourceUrl: mapping.g2
      });
    }
    
    // Build TrustRadius source
    if (mapping.trustradius) {
      sources.push({
        id: `${competitorId}-tr`,
        kind: "html",
        parser: "trustradius",
        competitor: resolvedCompetitor,
        group: "reviews",
        sourceLabel: "TrustRadius",
        sourceBadge: "TRUSTRADIUS",
        sourceUrl: mapping.trustradius
      });
    }
    
    // Build Blog source
    if (mapping.blog) {
      sources.push({
        id: `${competitorId}-blog`,
        kind: "feed",
        parser: "feed",
        competitor: resolvedCompetitor,
        group: "blog",
        sourceLabel: "Blog",
        sourceBadge: "BLOG",
        sourceUrl: mapping.blog
      });
    }
    
    // Build Website source from curated mapping OR the URL configured by the user in Manage
    const websiteUrl = mapping.website || userUrl;
    if (websiteUrl) {
      sources.push({
        id: `${competitorId}-web`,
        kind: "html",
        parser: "website",
        competitor: resolvedCompetitor,
        group: "website",
        sourceLabel: "Website",
        sourceBadge: "WEBSITE",
        sourceUrl: websiteUrl
      });
    }

    // If the user configured a different URL in Manage, monitor that page as well
    if (userUrl && mapping.website && normalizeUrl(userUrl) !== normalizeUrl(mapping.website)) {
      sources.push({
        id: `${competitorId}-web-custom`,
        kind: "html",
        parser: "website",
        competitor: resolvedCompetitor,
        group: "website",
        sourceLabel: "Configured page",
        sourceBadge: "WEBSITE",
        sourceUrl: userUrl
      });
    }

    // Universal live news source - works for ANY competitor in ANY vertical, no mapping required
    sources.push({
      id: `${competitorId}-news`,
      kind: "feed",
      parser: "feed",
      competitor: resolvedCompetitor,
      group: "blog",
      sourceLabel: "News",
      sourceBadge: "NEWS",
      sourceUrl: `https://news.google.com/rss/search?q=${encodeURIComponent('"' + resolvedCompetitor + '"')}&hl=en-US&gl=US&ceid=US:en`
    });
  });
  
  console.log(`[competitor-mapping] Built ${sources.length} sources for ${competitors.length} competitors`);
  return sources;
}

/**
 * Filter market signals to only include specified competitors
 * 
 * @param {Array} signals - Array of market signal objects
 * @param {string[]} competitors - Array of competitor names to filter by
 * @returns {Array} Filtered array of signals
 */
export function filterSignalsByCompetitors(signals, competitors) {
  if (!competitors || competitors.length === 0) {
    return signals; // Return all if no filter specified
  }
  
  const resolvedCompetitors = new Set(
    competitors
      .map((competitor) => resolveCompetitorName(competitor))
      .filter(Boolean)
  );
  const filtered = signals.filter((signal) =>
    resolvedCompetitors.has(resolveCompetitorName(signal?.competitor))
  );
  
  console.log(`[competitor-mapping] Filtered ${signals.length} signals to ${filtered.length} for competitors: ${[...resolvedCompetitors].join(', ')}`);
  return filtered;
}

/**
 * Get list of all supported competitors
 * 
 * @returns {string[]} Array of competitor names
 */
export function getSupportedCompetitors() {
  return Object.keys(COMPETITOR_SOURCE_MAP);
}

/**
 * Check if a competitor is supported
 * 
 * @param {string} competitor - Competitor name
 * @returns {boolean} True if competitor has source mappings
 */
export function isCompetitorSupported(competitor) {
  return COMPETITOR_SOURCE_MAP.hasOwnProperty(resolveCompetitorName(competitor));
}

/**
 * Get available source types for a competitor
 * 
 * @param {string} competitor - Competitor name
 * @returns {string[]} Array of available source types (linkedin, g2, etc.)
 */
export function getCompetitorSourceTypes(competitor) {
  const mapping = COMPETITOR_SOURCE_MAP[resolveCompetitorName(competitor)];
  if (!mapping) return [];
  
  return Object.keys(mapping);
}

// Made with Bob