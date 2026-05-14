/**
 * US/UK Crochet Terminology Auto-Translator
 * Converts written pattern instructions between US and UK terms.
 */

const UK_TO_US: Array<[RegExp, string]> = [
  [/\bdouble crochet\b/gi, 'single crochet'],
  [/\bhalf treble\b/gi, 'half double crochet'],
  [/\btreble crochet\b/gi, 'double crochet'],
  [/\bdouble treble\b/gi, 'treble crochet'],
  [/\btriple treble\b/gi, 'double treble'],
  [/\bquadruple treble\b/gi, 'triple treble'],
  [/\btension\b/gi, 'gauge'],
  [/\bmiss\b/gi, 'skip'],
  [/\byarn round hook\b/gi, 'yarn over'],
  [/\byrh\b/g, 'yo'],
  [/\bdc\b/g, 'sc'],
  [/\bhtr\b/g, 'hdc'],
  [/\bdtr\b/g, 'tr'],
  [/\bttr\b/g, 'dtr'],
]

const US_TO_UK: Array<[RegExp, string]> = [
  [/\bsingle crochet\b/gi, 'double crochet'],
  [/\bhalf double crochet\b/gi, 'half treble'],
  [/\bdouble crochet\b/gi, 'treble crochet'],
  [/\btreble crochet\b/gi, 'double treble'],
  [/\bdouble treble\b/gi, 'triple treble'],
  [/\bgauge\b/gi, 'tension'],
  [/\bskip\b/gi, 'miss'],
  [/\byarn over\b/gi, 'yarn round hook'],
  [/\byo\b/g, 'yrh'],
  [/\bsc\b/g, 'dc'],
  [/\bhdc\b/g, 'htr'],
  [/\btr\b/g, 'dtr'],
]

/**
 * Translate pattern text from UK terms to US terms.
 */
export function translateToUS(text: string): string {
  let result = text
  // Use a two-pass approach with placeholders to avoid double-replacement
  const placeholders: Array<{ placeholder: string; replacement: string }> = []

  for (const [pattern, replacement] of UK_TO_US) {
    const placeholder = `__PLACEHOLDER_${placeholders.length}__`
    if (pattern.test(result)) {
      result = result.replace(pattern, placeholder)
      placeholders.push({ placeholder, replacement })
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0
  }

  for (const { placeholder, replacement } of placeholders) {
    result = result.replaceAll(placeholder, replacement)
  }

  return result
}

/**
 * Translate pattern text from US terms to UK terms.
 */
export function translateToUK(text: string): string {
  let result = text
  const placeholders: Array<{ placeholder: string; replacement: string }> = []

  for (const [pattern, replacement] of US_TO_UK) {
    const placeholder = `__PLACEHOLDER_${placeholders.length}__`
    if (pattern.test(result)) {
      result = result.replace(pattern, placeholder)
      placeholders.push({ placeholder, replacement })
    }
    pattern.lastIndex = 0
  }

  for (const { placeholder, replacement } of placeholders) {
    result = result.replaceAll(placeholder, replacement)
  }

  return result
}

/**
 * Detect whether text uses primarily US or UK terminology.
 */
export function detectTerminology(text: string): 'uk' | 'us' | 'unknown' {
  const lower = text.toLowerCase()
  let ukScore = 0
  let usScore = 0

  // UK indicators
  if (lower.includes('double crochet') && !lower.includes('half double crochet')) ukScore += 3
  if (lower.includes('treble')) ukScore += 2
  if (lower.includes('tension')) ukScore += 2
  if (lower.includes('miss')) ukScore += 1
  if (/\bhtr\b/.test(lower)) ukScore += 2
  if (/\byrh\b/.test(lower)) ukScore += 2

  // US indicators
  if (lower.includes('single crochet')) usScore += 3
  if (lower.includes('half double crochet')) usScore += 3
  if (lower.includes('gauge')) usScore += 2
  if (lower.includes('skip')) usScore += 1
  if (/\bhdc\b/.test(lower)) usScore += 2
  if (/\byo\b/.test(lower)) usScore += 1

  if (ukScore > usScore + 2) return 'uk'
  if (usScore > ukScore + 2) return 'us'
  return 'unknown'
}
