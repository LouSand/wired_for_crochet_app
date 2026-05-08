/**
 * Types for structured yarn requirements on patterns.
 */

export interface PatternYarnRequirement {
  id: string
  pattern_id: string
  user_id: string
  yarn_name: string
  colour: string | null
  weight_category: string | null
  quantity: number
  unit: string
  secondary_quantity: number | null
  secondary_unit: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export const YARN_WEIGHT_CATEGORIES = [
  'Lace',
  '2ply',
  '3ply',
  '4ply',
  'Sport',
  'DK',
  'Aran',
  'Worsted',
  'Chunky',
  'Super Chunky',
  'Jumbo',
] as const

export type YarnWeightCategory = (typeof YARN_WEIGHT_CATEGORIES)[number]
