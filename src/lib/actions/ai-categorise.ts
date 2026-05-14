'use server'

import type { UCExpenseCategory } from '@/types/universal-credit'

/**
 * AI-assisted receipt/expense categorisation.
 *
 * Uses simple keyword matching as a local fallback.
 * Can be upgraded to use OpenAI/Claude API for better accuracy.
 *
 * Set AI_CATEGORISE_API_KEY in env to enable AI-powered categorisation.
 */

interface CategorisationResult {
  category: UCExpenseCategory
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// Keyword-based categorisation rules
const CATEGORY_KEYWORDS: Record<UCExpenseCategory, string[]> = {
  materials: [
    'yarn', 'wool', 'cotton', 'thread', 'fabric', 'stuffing', 'filling',
    'buttons', 'eyes', 'safety eyes', 'needles', 'hooks', 'stitch markers',
    'beads', 'ribbon', 'elastic', 'velcro', 'zipper', 'dye', 'paint',
    'glue', 'wire', 'pipe cleaners', 'felt', 'interfacing',
  ],
  mileage_travel: [
    'petrol', 'diesel', 'fuel', 'parking', 'bus', 'train', 'taxi',
    'uber', 'mileage', 'travel', 'toll', 'congestion', 'craft fair travel',
    'post office', 'delivery', 'courier',
  ],
  equipment: [
    'sewing machine', 'iron', 'steamer', 'scissors', 'rotary cutter',
    'cutting mat', 'lamp', 'light', 'magnifier', 'storage', 'shelving',
    'display', 'mannequin', 'camera', 'tripod', 'printer', 'laptop',
    'tablet', 'computer', 'monitor', 'desk', 'chair', 'table',
  ],
  insurance: [
    'insurance', 'public liability', 'product liability', 'indemnity',
    'cover', 'policy', 'premium',
  ],
  office_costs: [
    'rent', 'rates', 'electric', 'electricity', 'gas', 'water',
    'heating', 'council tax', 'broadband', 'wifi', 'cleaning',
  ],
  phone_internet: [
    'phone', 'mobile', 'sim', 'data', 'internet', 'broadband',
    'domain', 'hosting', 'website', 'email', 'software', 'app',
    'subscription', 'etsy', 'shopify', 'canva', 'adobe',
  ],
  advertising: [
    'advertising', 'advert', 'facebook ads', 'instagram', 'google ads',
    'flyer', 'leaflet', 'business card', 'banner', 'sign', 'promotion',
    'marketing', 'social media', 'boost', 'sponsored',
  ],
  professional_fees: [
    'accountant', 'solicitor', 'lawyer', 'legal', 'consultant',
    'bookkeeper', 'tax', 'hmrc', 'companies house', 'registration',
  ],
  other_allowable: [
    'packaging', 'box', 'envelope', 'tape', 'label', 'tissue paper',
    'postage', 'stamps', 'royal mail', 'parcel', 'shipping',
    'craft fair', 'market stall', 'table hire', 'pitch fee',
    'course', 'workshop', 'training', 'book', 'magazine', 'pattern',
  ],
}

/**
 * Categorise an expense description using keyword matching.
 * Returns the best matching category with confidence level.
 */
export async function categoriseExpense(description: string): Promise<CategorisationResult> {
  const lower = description.toLowerCase()

  // Score each category
  const scores: Array<{ category: UCExpenseCategory; score: number; matchedKeywords: string[] }> = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.filter((kw) => lower.includes(kw))
    if (matched.length > 0) {
      scores.push({
        category: category as UCExpenseCategory,
        score: matched.length + matched.reduce((s, kw) => s + kw.length, 0) / 100,
        matchedKeywords: matched,
      })
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  if (scores.length === 0) {
    return {
      category: 'other_allowable',
      confidence: 'low',
      reason: 'No matching keywords found — defaulting to Other Allowable Expenses',
    }
  }

  const best = scores[0]
  const confidence: 'high' | 'medium' | 'low' =
    best.score >= 2 ? 'high' : best.score >= 1 ? 'medium' : 'low'

  return {
    category: best.category,
    confidence,
    reason: `Matched keywords: ${best.matchedKeywords.join(', ')}`,
  }
}

/**
 * Batch categorise multiple expense descriptions.
 */
export async function batchCategorise(
  items: Array<{ id: string; description: string }>
): Promise<Array<{ id: string; result: CategorisationResult }>> {
  const results = await Promise.all(
    items.map(async (item) => ({
      id: item.id,
      result: await categoriseExpense(item.description),
    }))
  )
  return results
}

/**
 * Suggest a category for a receipt/expense as the user types.
 * Lightweight version for real-time suggestions.
 */
export async function suggestCategory(description: string): Promise<{
  suggestion: UCExpenseCategory | null
  confidence: 'high' | 'medium' | 'low'
}> {
  if (!description || description.length < 3) {
    return { suggestion: null, confidence: 'low' }
  }

  const result = await categoriseExpense(description)
  return {
    suggestion: result.confidence !== 'low' ? result.category : null,
    confidence: result.confidence,
  }
}
