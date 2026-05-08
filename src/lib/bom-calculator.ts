'use strict'

/**
 * Pure function for calculating BOM (Bill of Materials) cost breakdown.
 * No side effects, no database calls — just math.
 */

export interface BomLineItemInput {
  material_id: string | null
  quantity_required: number
  cost_per_unit: number | null
}

export interface BomCostInput {
  line_items: BomLineItemInput[]
  time_taken_minutes: number | null
  wages_per_minute: number | null
  extras: Array<{ description: string; amount: number }>
  profit_margin_percent: number | null
}

export interface BomCostBreakdown {
  material_cost: number
  labour_cost: number
  extras_total: number
  total_production_cost: number
  profit_margin_amount: number
  suggested_sell_price: number
  invalid_line_items: number
}

export function calculateBomCost(input: BomCostInput): BomCostBreakdown {
  // Only include valid line items (material_id not null)
  const validItems = input.line_items.filter(item => item.material_id !== null)
  const invalidCount = input.line_items.length - validItems.length

  const material_cost = validItems.reduce((sum, item) => {
    return sum + (item.quantity_required * (item.cost_per_unit ?? 0))
  }, 0)

  const labour_cost = (input.time_taken_minutes ?? 0) * (input.wages_per_minute ?? 0)

  const extras_total = input.extras.reduce((sum, extra) => sum + extra.amount, 0)

  const total_production_cost = material_cost + labour_cost + extras_total

  const profit_margin_amount = input.profit_margin_percent
    ? total_production_cost * (input.profit_margin_percent / 100)
    : 0

  const suggested_sell_price = total_production_cost + profit_margin_amount

  return {
    material_cost,
    labour_cost,
    extras_total,
    total_production_cost,
    profit_margin_amount,
    suggested_sell_price,
    invalid_line_items: invalidCount,
  }
}
