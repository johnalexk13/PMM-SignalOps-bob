const GROUP_TRUST_SCORE = {
  website: 28,
  blog: 24,
  reviews: 22,
  social: 16,
  community: 14,
};

const PURPOSE_GROUP_WEIGHT = {
  content: { blog: 32, website: 26, reviews: 22, social: 18, community: 10 },
  pmm: { social: 30, reviews: 28, website: 24, blog: 22, community: 12 },
  product: { website: 34, blog: 28, reviews: 18, social: 12, community: 8 },
  positioning: { website: 30, social: 26, reviews: 22, blog: 20, community: 8 },
  overview: { website: 26, blog: 24, reviews: 22, social: 20, community: 10 },
  community: { community: 34, social: 18, blog: 14, reviews: 10, website: 8 },
};

const COMPETITOR_PRESSURE = {
  Databricks: 92,
  Snowflake: 88,
  "Google BigQuery": 81,
  "Amazon Redshift": 75,
  "Azure Synapse": 69,
  Teradata: 64,
};

export function buildEvidenceDatabase({ marketItems = [], communityItems = [] } = {}) {
  const marketEvidence = marketItems.map((item) => normalizeEvidenceItem(item, "market"));
  const communityEvidence = communityItems.map((item) => normalizeEvidenceItem(item, "community"));
  const items = dedupeEvidence([...marketEvidence, ...communityEvidence])
    .map((item) => ({
      ...item,
      score: scoreEvidenceItem(item),
    }))
    .sort((left, right) => right.score - left.score);

  const liveCount = items.filter((item) => item.coverageType === "live").length;
  const staticCount = items.length - liveCount;

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      itemCount: items.length,
      liveCount,
      staticCount,
      mode: liveCount && staticCount ? "hybrid" : liveCount ? "live" : "static",
    },
    items,
  };
}

export function normalizeEvidenceItem(item, evidenceType = "market") {
  const sourceName = evidenceType === "community"
    ? item.community || item.platform || item.sourceLabel || "Community source"
    : item.competitor || item.sourceLabel || "Competitor source";
  const group = evidenceType === "community" ? "community" : item.group || "website";
  const coverageType = item.coverageType === "live" ? "live" : "static";
  const sourceUrl = item.sourceUrl || item.url || "";

  return {
    id: `${evidenceType}-${item.id || slugify(`${sourceName}-${sourceUrl}`)}`,
    originalId: item.id || "",
    evidenceType,
    competitor: item.competitor || "",
    community: item.community || "",
    group,
    sourceName,
    sourceLabel: item.sourceLabel || item.source || sourceName,
    sourceBadge: item.sourceBadge || item.badge || group.toUpperCase(),
    sourceUrl,
    headline: item.headline || item.signal || `${sourceName} signal`,
    summary: item.summary || item.content || item.recommendation || "Source-backed evidence item.",
    publishedAt: normalizeDate(item.publishedAt || item.updatedAt || item.lastUpdated),
    coverageType,
    coverageLabel: coverageType === "live" ? "Live" : "Static",
    freshnessLabel: item.freshnessLabel || item.dateLabel || "",
  };
}

export function rankEvidenceForPurpose(items, purpose = "overview", { limit = 8, diversify = true } = {}) {
  const groupWeight = PURPOSE_GROUP_WEIGHT[purpose] || PURPOSE_GROUP_WEIGHT.overview;
  const ranked = [...items]
    .map((item) => ({
      ...item,
      purposeScore: scoreEvidenceItem(item) + (groupWeight[item.group] || 0),
    }))
    .sort((left, right) => {
      if (right.purposeScore !== left.purposeScore) return right.purposeScore - left.purposeScore;
      return new Date(right.publishedAt) - new Date(left.publishedAt);
    });

  return diversify ? diversifyEvidence(ranked, limit) : ranked.slice(0, limit);
}

export function makeCitations(evidenceItems, limit = 4) {
  return evidenceItems.slice(0, limit).map((item) => ({
    id: item.id,
    competitor: item.competitor || item.community || item.sourceName,
    sourceLabel: item.sourceLabel,
    sourceBadge: item.sourceBadge,
    sourceUrl: item.sourceUrl,
    coverageType: item.coverageType,
    coverageLabel: item.coverageLabel,
    dateLabel: item.freshnessLabel || formatShortDate(item.publishedAt),
    evidenceScore: item.score || scoreEvidenceItem(item),
  }));
}

export function scoreEvidenceItem(item) {
  const coverageScore = item.coverageType === "live" ? 34 : 12;
  const groupScore = GROUP_TRUST_SCORE[item.group] || 10;
  const pressureScore = Math.round((COMPETITOR_PRESSURE[item.competitor] || 50) / 5);
  const recencyScore = getRecencyScore(item.publishedAt);
  const citationScore = item.sourceUrl ? 8 : 0;
  return coverageScore + groupScore + pressureScore + recencyScore + citationScore;
}

function diversifyEvidence(items, limit) {
  const picked = [];
  const seen = new Set();

  for (const item of items) {
    if (picked.length >= limit) break;
    const key = item.competitor || item.community || item.sourceName || item.group;
    if (seen.has(key)) continue;
    picked.push(item);
    seen.add(key);
  }

  for (const item of items) {
    if (picked.length >= limit) break;
    if (!picked.some((pickedItem) => pickedItem.id === item.id)) {
      picked.push(item);
    }
  }

  return picked;
}

function dedupeEvidence(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.sourceUrl || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRecencyScore(value) {
  const hours = (Date.now() - new Date(value).getTime()) / 36e5;
  if (!Number.isFinite(hours)) return 0;
  if (hours <= 24) return 24;
  if (hours <= 72) return 18;
  if (hours <= 168) return 12;
  if (hours <= 720) return 6;
  return 2;
}

function normalizeDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatShortDate(value) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "";
  }
}

function slugify(value) {
  return String(value || "evidence")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "evidence";
}
