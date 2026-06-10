/**
 * AI-Powered PMM Action Recommendations API
 * Uses IBM Granite to prioritize PMM actions based on market signals
 * 
 * @module api/ai-action-recommendations
 */

import { getMarketSignalsFeed } from '../market-signals.mjs';
import { 
  generateText, 
  buildPMMActionsPrompt, 
  parseGraniteJSON,
  calculateCost,
  isGraniteConfigured
} from '../lib/granite-ai.mjs';

// Cache for AI responses (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get AI-powered PMM action recommendations
 * 
 * @param {object} options - Options
 * @param {Array} options.competitors - List of competitors
 * @param {object} options.productInfo - Product information
 * @param {boolean} options.force - Force refresh (bypass cache)
 * @returns {Promise<object>} Action recommendations with metadata
 */
async function getAIPMMActions({ competitors = [], productInfo = {}, force = false } = {}) {
  const cacheKey = JSON.stringify({ competitors, product: productInfo.name, type: 'actions' });
  
  // Check cache
  if (!force && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached AI PMM actions');
      return { ...cached.data, metadata: { ...cached.data.metadata, cached: true } };
    }
  }

  // Check if Granite is configured
  if (!isGraniteConfigured()) {
    console.log('⚠️ Granite not configured, returning fallback actions');
    return getFallbackActions();
  }

  try {
    console.log('🤖 Generating AI PMM action recommendations...');
    
    // Get market signals
    const signals = await getMarketSignalsFeed({ competitors });
    
    // Extract relevant signals
    const marketSignals = signals
      .slice(0, 20)
      .map(s => ({
        source: s.source,
        summary: s.title || s.summary || 'No summary available',
        sentiment: s.sentiment || 'neutral',
      }));

    if (marketSignals.length === 0) {
      console.log('⚠️ No market signals found, returning fallback actions');
      return getFallbackActions();
    }

    // Extract competitor activities
    const competitorActivities = signals
      .filter(s => s.type === 'announcement' || s.type === 'feature' || s.type === 'blog')
      .slice(0, 10)
      .map(s => ({
        competitor: s.competitor || s.source,
        activity: s.title || s.summary || 'No activity description',
      }));

    // Default product info if not provided
    const defaultProductInfo = {
      name: 'IBM Db2 Warehouse',
      category: 'Data Warehouse',
      strengths: ['Enterprise security', 'Hybrid cloud', 'AI integration'],
      audience: 'Enterprise data teams',
      ...productInfo,
    };

    // Build prompt
    const prompt = buildPMMActionsPrompt(
      marketSignals,
      defaultProductInfo,
      competitorActivities
    );

    // Generate with Granite
    const result = await generateText(prompt, {
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Parse response
    const actions = parseGraniteJSON(result.text);

    // Calculate cost
    const cost = calculateCost(result.inputTokens, result.outputTokens);

    // Prepare response
    const response = {
      actions: actions.actions || [],
      metadata: {
        model: result.model,
        timestamp: result.timestamp,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: cost.totalCost,
        cached: false,
        signalCount: marketSignals.length,
        activityCount: competitorActivities.length,
      },
    };

    // Cache response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    console.log(`✅ Generated ${response.actions.length} AI PMM action recommendations`);
    
    return response;
  } catch (error) {
    console.error('❌ Error getting AI PMM actions:', error.message);
    
    // Return fallback actions on error
    return getFallbackActions(error.message);
  }
}

/**
 * Get fallback actions when AI is not available
 * 
 * @param {string} errorMessage - Optional error message
 * @returns {object} Fallback actions
 */
function getFallbackActions(errorMessage = null) {
  return {
    actions: [
      {
        action: 'Create competitive comparison guide',
        rationale: 'Buyers need clear comparisons to make informed decisions. A comprehensive guide highlighting our strengths can accelerate sales cycles.',
        audience: 'Enterprise buyers evaluating data warehouse solutions',
        impact: 'High',
        effort: 'Medium',
        priority: 9,
        assets: [
          'Feature comparison matrix',
          'TCO calculator',
          'Customer success stories',
          'Migration guide'
        ]
      },
      {
        action: 'Develop security-focused content series',
        rationale: 'Enterprise security is a key differentiator. Creating content that showcases our security capabilities can attract security-conscious buyers.',
        audience: 'CISOs and security teams',
        impact: 'High',
        effort: 'Medium',
        priority: 8,
        assets: [
          'Security whitepaper',
          'Compliance checklist',
          'Security best practices guide',
          'Webinar on data protection'
        ]
      },
      {
        action: 'Launch hybrid cloud positioning campaign',
        rationale: 'Hybrid cloud flexibility is increasingly important. Highlighting this capability addresses vendor lock-in concerns.',
        audience: 'Enterprise architects and IT leaders',
        impact: 'High',
        effort: 'High',
        priority: 8,
        assets: [
          'Hybrid cloud architecture guide',
          'Case studies',
          'ROI calculator',
          'Technical webinar series'
        ]
      },
      {
        action: 'Create AI/ML integration showcase',
        rationale: 'AI integration is a growing requirement. Demonstrating our built-in AI capabilities can differentiate us from competitors.',
        audience: 'Data scientists and ML engineers',
        impact: 'Medium',
        effort: 'Medium',
        priority: 7,
        assets: [
          'AI integration tutorials',
          'Sample notebooks',
          'Use case examples',
          'Performance benchmarks'
        ]
      },
      {
        action: 'Develop customer success story library',
        rationale: 'Social proof is powerful. A library of success stories can help prospects see themselves succeeding with our solution.',
        audience: 'All buyer personas',
        impact: 'Medium',
        effort: 'Low',
        priority: 6,
        assets: [
          'Video testimonials',
          'Written case studies',
          'ROI metrics',
          'Industry-specific examples'
        ]
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
    const productParam = url.searchParams.get('product');
    
    let competitors = [];
    if (competitorsParam) {
      try {
        competitors = JSON.parse(competitorsParam);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid competitors parameter' });
      }
    }

    let productInfo = {};
    if (productParam) {
      try {
        productInfo = JSON.parse(productParam);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid product parameter' });
      }
    }

    console.log(`📊 AI PMM Actions request: ${competitors.length} competitors, force=${force}`);

    // Get AI actions
    const actions = await getAIPMMActions({ competitors, productInfo, force });

    return res.status(200).json(actions);
  } catch (error) {
    console.error('❌ Error in AI PMM actions API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PMM action recommendations',
      message: error.message 
    });
  }
}

// Made with Bob
