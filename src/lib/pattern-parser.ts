/**
 * Pattern Parser — extracts structure from crochet pattern text.
 *
 * Detects:
 * - Row/round numbers and stitch counts (e.g., "Row 1: sc 10 (10)")
 * - Repeat sections (e.g., "Rows 5-10: repeat row 4")
 * - Section headers (e.g., "Body:", "Arms (make 2):")
 * - Total stitch counts in parentheses at end of rows
 * - Common crochet abbreviations
 */

export interface ParsedRow {
  lineNumber: number
  rowNumber: number | null
  roundNumber: number | null
  stitchCount: number | null
  text: string
  isSection: boolean
  sectionName: string | null
}

export interface PatternAnalysis {
  rows: ParsedRow[]
  totalRows: number
  sections: string[]
  suggestedCounters: SuggestedCounter[]
  stitchCountsPerRow: Array<{ row: number; stitches: number }>
  difficulty: 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert' | null
}

export interface SuggestedCounter {
  name: string
  targetValue: number | null
  reason: string
}

// Common crochet abbreviations for difficulty estimation
const BASIC_STITCHES = ['ch', 'sc', 'sl st', 'slst']
const INTERMEDIATE_STITCHES = ['dc', 'hdc', 'tr', 'dtr', 'fpdc', 'bpdc', 'inc', 'dec']
const ADVANCED_STITCHES = ['bobble', 'popcorn', 'puff', 'cable', 'crocodile', 'broomstick', 'tunisian', 'overlay']

/**
 * Parse a crochet pattern's instructions text and extract structure.
 */
export function parsePattern(instructions: string): PatternAnalysis {
  const lines = instructions.split('\n')
  const rows: ParsedRow[] = []
  const sections: string[] = []
  const suggestedCounters: SuggestedCounter[] = []

  let maxRowNumber = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parsed = parseLine(line, i)
    rows.push(parsed)

    if (parsed.isSection && parsed.sectionName) {
      sections.push(parsed.sectionName)
    }

    if (parsed.rowNumber && parsed.rowNumber > maxRowNumber) {
      maxRowNumber = parsed.rowNumber
    }
    if (parsed.roundNumber && parsed.roundNumber > maxRowNumber) {
      maxRowNumber = parsed.roundNumber
    }
  }

  // Generate suggested counters
  if (maxRowNumber > 0) {
    suggestedCounters.push({
      name: 'Row Counter',
      targetValue: maxRowNumber,
      reason: `Pattern has ${maxRowNumber} rows/rounds`,
    })
  }

  // Detect stitch counts per row and suggest stitch counters
  const rowsWithStitchCounts = rows.filter((r) => r.stitchCount !== null && r.stitchCount > 0)
  if (rowsWithStitchCounts.length > 0) {
    // Find the most common stitch count (likely the main body stitch count)
    const stitchCounts = rowsWithStitchCounts.map((r) => r.stitchCount!)
    const maxStitchCount = Math.max(...stitchCounts)
    const firstRowStitchCount = rowsWithStitchCounts[0].stitchCount!

    suggestedCounters.push({
      name: 'Stitch Counter',
      targetValue: firstRowStitchCount,
      reason: `First row has ${firstRowStitchCount} stitches — target updates per row`,
    })

    // If stitch counts vary, suggest per-row stitch tracking
    const uniqueCounts = new Set(stitchCounts)
    if (uniqueCounts.size > 1) {
      suggestedCounters.push({
        name: 'Stitch Counter (varies)',
        targetValue: maxStitchCount,
        reason: `Stitch count varies between rows (${Math.min(...stitchCounts)}–${maxStitchCount}). Target shows max.`,
      })
    }
  }

  // Add section-based counters
  for (const section of sections) {
    const sectionRows = rows.filter(
      (r) => r.sectionName === section || (r.rowNumber && rows.find((s) => s.sectionName === section))
    )
    if (sectionRows.length > 0) {
      suggestedCounters.push({
        name: `${section} Progress`,
        targetValue: null,
        reason: `Track progress through "${section}" section`,
      })
    }
  }

  // Check for "make X" patterns (e.g., "Arms (make 2)")
  const makePattern = instructions.match(/\(make\s+(\d+)\)/gi)
  if (makePattern) {
    for (const match of makePattern) {
      const count = match.match(/(\d+)/)
      if (count) {
        suggestedCounters.push({
          name: `Pieces Made`,
          targetValue: parseInt(count[1], 10),
          reason: `Pattern requires making ${count[1]} pieces`,
        })
      }
    }
  }

  // Estimate difficulty
  const difficulty = estimateDifficulty(instructions)

  // Build stitch counts per row
  const stitchCountsPerRow = rows
    .filter((r) => (r.rowNumber || r.roundNumber) && r.stitchCount)
    .map((r) => ({ row: r.rowNumber || r.roundNumber!, stitches: r.stitchCount! }))

  return {
    rows,
    totalRows: maxRowNumber,
    sections,
    suggestedCounters,
    stitchCountsPerRow,
    difficulty,
  }
}

function parseLine(line: string, lineNumber: number): ParsedRow {
  // Check for section headers (e.g., "Body:", "Arms (make 2):", "## Section")
  const sectionMatch = line.match(/^(?:#{1,3}\s+)?([A-Z][A-Za-z\s()0-9]+):?\s*$/m) ||
    line.match(/^(?:#{1,3}\s+)?([A-Z][A-Za-z\s]+)\s*\(make\s+\d+\)/i)

  if (sectionMatch && line.length < 60 && !line.match(/^\s*(row|round|rnd|r)\s*\d/i)) {
    return {
      lineNumber,
      rowNumber: null,
      roundNumber: null,
      stitchCount: null,
      text: line,
      isSection: true,
      sectionName: sectionMatch[1].trim(),
    }
  }

  // Check for row/round numbers — many formats:
  // "Row 1:", "R1:", "Row 1 -", "1.", "1:", "1)", "Rnd 1", "Round 1"
  const rowMatch = line.match(/^(?:row|r)\s*(\d+)/i) ||
    line.match(/^(\d+)\s*[.:)\-–]/) ||
    line.match(/^(?:row|r)\.?\s*(\d+)/i)
  const roundMatch = line.match(/^(?:round|rnd|rd)\s*(\d+)/i) ||
    line.match(/^(?:rnd|rd)\.?\s*(\d+)/i)

  // Check for stitch count — many formats:
  // "(10)", "(10 sts)", "(10 stitches)", "[10]", "= 10 sts", "- 10", "{10}"
  // Also matches mid-line: "...repeat (12 sts)" or "total: 24"
  const stitchCountMatch = line.match(/\((\d+)(?:\s*(?:sts?|stitches?|st))?\)\s*$/) ||
    line.match(/\[(\d+)(?:\s*(?:sts?|stitches?|st))?\]\s*$/) ||
    line.match(/\{(\d+)(?:\s*(?:sts?|stitches?|st))?\}\s*$/) ||
    line.match(/[-–—=]\s*(\d+)\s*(?:sts?|stitches?|st)\s*$/) ||
    line.match(/[-–—=]\s*(\d+)\s*$/) ||
    line.match(/total:?\s*(\d+)/i) ||
    line.match(/\((\d+)\s*(?:sts?|st|stitches?)\)/) ||
    line.match(/\((\d+)\)(?:\s*$|\s*[-–])/) 

  return {
    lineNumber,
    rowNumber: rowMatch ? parseInt(rowMatch[1], 10) : null,
    roundNumber: roundMatch ? parseInt(roundMatch[1], 10) : null,
    stitchCount: stitchCountMatch ? parseInt(stitchCountMatch[1], 10) : null,
    text: line,
    isSection: false,
    sectionName: null,
  }
}

function estimateDifficulty(instructions: string): PatternAnalysis['difficulty'] {
  const lower = instructions.toLowerCase()

  let score = 0
  let stitchTypes = 0

  // Check for advanced stitches
  for (const stitch of ADVANCED_STITCHES) {
    if (lower.includes(stitch)) {
      score += 3
      stitchTypes++
    }
  }

  // Check for intermediate stitches
  for (const stitch of INTERMEDIATE_STITCHES) {
    if (lower.includes(stitch)) {
      score += 1
      stitchTypes++
    }
  }

  // Check for basic stitches only
  for (const stitch of BASIC_STITCHES) {
    if (lower.includes(stitch)) {
      stitchTypes++
    }
  }

  // Factor in pattern length
  const lineCount = instructions.split('\n').filter((l) => l.trim()).length
  if (lineCount > 100) score += 2
  else if (lineCount > 50) score += 1

  // Factor in colour changes
  if (lower.includes('colour change') || lower.includes('color change') || lower.includes('change colour')) {
    score += 2
  }

  // Factor in shaping
  if (lower.includes('increase') || lower.includes('decrease') || lower.includes('inc') || lower.includes('dec')) {
    score += 1
  }

  if (score >= 8) return 'expert'
  if (score >= 5) return 'advanced'
  if (score >= 3) return 'intermediate'
  if (stitchTypes > 2) return 'easy'
  return 'beginner'
}
