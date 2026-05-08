import type { PricingBreakdown } from '@/types/forms'

/**
 * Input for the pricing calculation function.
 * All monetary values are in the user's currency (no conversion).
 */
export interface PricingInput {
  material_cost: number
  total_hours: number
  hourly_rate: number
  extras: Array<{ description: string; amount: number }>
  profit_margin_percent?: number | null
  profit_margin_fixed?: number | null
}

/**
 * Calculate the suggested price for a project.
 *
 * Formula:
 *   total = material_cost + (total_hours × hourly_rate) + sum(extra_costs) + profit_margin_amount
 *
 * Profit margin is either:
 *   - A fixed amount (profit_margin_fixed), OR
 *   - A percentage of the subtotal (profit_margin_percent)
 *   - If both are provided, fixed takes precedence
 *   - If neither is provided, profit margin is 0
 */
export function calculatePrice(input: PricingInput): PricingBreakdown {
  const { material_cost, total_hours, hourly_rate, extras } = input

  const time_cost = total_hours * hourly_rate
  const extras_total = extras.reduce((sum, extra) => sum + extra.amount, 0)
  const subtotal = material_cost + time_cost + extras_total

  // Determine profit margin
  let profit_margin_amount = 0
  const profit_margin_fixed = input.profit_margin_fixed ?? null
  const profit_margin_percent = input.profit_margin_percent ?? null

  if (profit_margin_fixed != null && profit_margin_fixed > 0) {
    profit_margin_amount = profit_margin_fixed
  } else if (profit_margin_percent != null && profit_margin_percent > 0) {
    profit_margin_amount = subtotal * profit_margin_percent / 100
  }

  const total = subtotal + profit_margin_amount

  return {
    material_cost,
    time_cost,
    hourly_rate,
    total_hours,
    extras: extras.map((e) => ({ description: e.description, amount: e.amount })),
    extras_total,
    subtotal,
    profit_margin_percent,
    profit_margin_fixed,
    profit_margin_amount,
    total,
  }
}
