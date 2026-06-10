/**
 * AI-Powered Content Suggestions API
 * Uses IBM Granite to analyze competitor content and suggest content gaps
 * 
 * @module api/ai-content-suggestions
 */

import { getMarketSignalsFeed } from '../market-signals.mjs';
import { 
  generateText, 
  buildContentSuggestionsPrompt, 
  parseGraniteJSON,
  calculateCost,
  isGraniteConfigured
} from '../lib/granite-ai.mjs';

// Cache for AI responses (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get AI-powered content suggestions
 * 
 * @param {object} options - Options
 * @param {Array} options.competitors - List of competitors
 * @param {boolean} options.force - Force refresh (bypass cache)
 * @returns {Promise<object>} Content suggestions with metadata
 */
async function getAIContentSuggestions({ competitors = [], force = false } = {}) {
  const cacheKey = JSON.stringify({ competitors, type: 'content' });
  
  // Check cache
  if (!force && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached AI content suggestions');
      return { ...cached.data, metadata: { ...cached.data.metadata, cached: true } };
    }
  }

  // Check if Granite is configured
  if (!isGraniteConfigured()) {
    console.log('⚠️ Granite not configured, returning fallback suggestions');
    return getFallbackSuggestions();
  }

  try {
    console.log('🤖 Generating AI content suggestions...');
    
    // Get market signals (competitor content)
    const signals = await getMarketSignalsFeed({ competitors });
    
    // Extract competitor content
    const competitorContent = signals
      .filter(s => s.type === 'content' || s.type === 'blog' || s.type === 'announcement')
      .slice(0, 10) // Top 10 pieces
      .map(s => ({
        competitor: s.competitor || s.source,
        title: s.title,
        summary: s.summary || s.content?.substring(0, 200) || 'No summary available',
      }));

    if (competitorContent.length === 0) {
      console.log('⚠️ No competitor content found, returning fallback suggestions');
      return getFallbackSuggestions();
    }

    // Mock our content (in production, fetch from CMS)
    const ourContent = [
      {
        title: 'Introduction to IBM Db2 Warehouse',
        summary: 'Overview of Db2 Warehouse features and capabilities',
      },
      {
        title: 'Db2 Security Best Practices',
        summary: 'Guide to securing your Db2 Warehouse deployment',
      },
    ];

    // Extract market signals
    const marketSignals = signals
      .slice(0, 15)
      .map(s => ({
        source: s.source,
        summary: s.title || s.summary || 'No summary available',
      }));

    // Build prompt
    const prompt = buildContentSuggestionsPrompt(
      competitorContent,
      ourContent,
      marketSignals
    );

    // Generate with Granite
    const result = await generateText(prompt, {
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Parse response
    const suggestions = parseGraniteJSON(result.text);

    // Calculate cost
    const cost = calculateCost(result.inputTokens, result.outputTokens);

    // Prepare response
    const response = {
      suggestions: suggestions.suggestions || [],
      metadata: {
        model: result.model,
        timestamp: result.timestamp,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: cost.totalCost,
        cached: false,
        competitorCount: competitorContent.length,
        signalCount: marketSignals.length,
      },
    };

    // Cache response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    console.log(`✅ Generated ${response.suggestions.length} AI content suggestions`);
    
    return response;
  } catch (error) {
    console.error('❌ Error getting AI content suggestions:', error.message);
    
    // Return fallback suggestions on error
    return getFallbackSuggestions(error.message);
  }
}

/**
 * Get fallback suggestions when AI is not available
 * 
 * @param {string} errorMessage - Optional error message
 * @returns {object} Fallback suggestions
 */
function getFallbackSuggestions(errorMessage = null) {
  return {
    suggestions: [
      {
        topic: 'Data Warehouse Performance Optimization Guide',
        audience: 'Data Engineers and Database Administrators',
        differentiators: [
          'Hybrid cloud flexibility',
          'Built-in AI capabilities',
          'Enterprise-grade security'
        ],
        format: 'Technical whitepaper',
        priority: 'High',
        rationale: 'Performance optimization is a key concern for data warehouse users. Highlighting our hybrid cloud advantage addresses enterprise concerns.'
      },
      {
        topic: 'Real-time Analytics with IBM Db2',
        audience: 'Business Intelligence Teams',
        differentiators: [
          'Low-latency queries',
          'Integrated machine learning',
          'Seamless cloud integration'
        ],
        format: 'Blog post with code examples',
        priority: 'High',
        rationale: 'Real-time analytics is increasingly important. Showcasing our capabilities can attract BI teams.'
      },
      {
        topic: 'Db2 vs Competitors: Feature Comparison',
        audience: 'Enterprise buyers evaluating solutions',
        differentiators: [
          'Total cost of ownership',
          'Enterprise support',
          'Proven reliability'
        ],
        format: 'Comparison guide (PDF)',
        priority: 'Medium',
        rationale: 'Buyers need clear comparisons. A comprehensive guide helps them make informed decisions.'
      }
    ],
    metadata: {
      model: 'fallback',
      timestamp: new Date().toISOString(),
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      cached: false,
      fallback: true,
      error: errorMessage,
    },
  };
}

/**
 * API Handler
 * 
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const force = url.searchParams.has('refresh');
    const competitorsParam = url.searchParams.get('competitors');
    
    let competitors = [];
    if (competitorsParam) {
      try {
        competitors = JSON.parse(competitorsParam);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid competitors parameter' });
      }
    }

    console.log(`📊 AI Content Suggestions request: ${competitors.length} competitors, force=${force}`);

    // Get AI suggestions
    const suggestions = await getAIContentSuggestions({ competitors, force });

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('❌ Error in AI content suggestions API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content suggestions',
      message: error.message 
    });
  }
}

// Made with Bob
