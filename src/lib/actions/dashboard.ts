'use server'

import { createClient } from '@/lib/supabase/server'
import { assertProTier } from './business-gate'
import type { DashboardMetrics, ExpenseCategory } from '@/types/business'

export interface DateRange {
  start_date?: string
  end_date?: string
}

/**
 * Fetch dashboard metrics: total expenses, revenue, profit/loss, stock value,
 * expenses by category, and top products by revenue.
 */
export async function getDashboardMetrics(dateRange?: DateRange): Promise<{
  data: DashboardMetrics | null
  error: string | null
}> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view dashboard.' }
  }

  const startDate = dateRange?.start_date || null
  const endDate = dateRange?.end_date || null

  // Fetch total expenses
  const { data: expensesData } = await supabase.rpc('get_total_expenses', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  // Fetch total revenue
  const { data: revenueData } = await supabase.rpc('get_total_revenue', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  // Fetch expenses by category
  const { data: categoryData } = await supabase.rpc('get_expenses_by_category', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  // Fetch total stock value
  const { data: stockData } = await supabase.rpc('get_total_stock_value', {
    p_user_id: user.id,
  })

  // Fetch top products by revenue
  let salesQuery = supabase
    .from('sales')
    .select('product_id, sale_price, products(name)')
    .eq('user_id', user.id)
    .not('product_id', 'is', null)

  if (startDate) {
    salesQuery = salesQuery.gte('sale_date', startDate)
  }
  if (endDate) {
    salesQuery = salesQuery.lte('sale_date', endDate)
  }

  const { data: salesData } = await salesQuery

  // Aggregate top products
  const productRevenue: Record<string, { name: string; total_revenue: number }> = {}
  if (salesData) {
    for (const sale of salesData as any[]) {
      const pid = sale.product_id
      if (!pid) continue
      if (!productRevenue[pid]) {
        productRevenue[pid] = {
          name: sale.products?.name ?? 'Unknown',
          total_revenue: 0,
        }
      }
      productRevenue[pid].total_revenue += Number(sale.sale_price)
    }
  }

  const topProducts = Object.entries(productRevenue)
    .map(([product_id, info]) => ({
      product_id,
      name: info.name,
      total_revenue: info.total_revenue,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 5)

  const total_expenses = Number(expensesData ?? 0)
  const total_revenue = Number(revenueData ?? 0)

  const metrics: DashboardMetrics = {
    total_expenses,
    total_revenue,
    profit_or_loss: total_revenue - total_expenses,
    expenses_by_category: (categoryData ?? []).map((row: any) => ({
      category: row.category as ExpenseCategory,
      total: Number(row.total),
    })),
    total_stock_value: Number(stockData ?? 0),
    top_products: topProducts,
  }

  return { data: metrics, error: null }
}

/**
 * Compute "What Can I Make?" for all products with BOM.
 * Returns how many units of each product can be made with current stock.
 */
export async function getWhatCanIMake(): Promise<{
  data: Array<{
    product_id: string
    product_name: string
    can_make: number
    limiting_materials: Array<{ name: string; have: number; need: number }>
  }> | null
  error: string | null
}> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  // Fetch all products with BOM line items
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (!products || products.length === 0) {
    return { data: [], error: null }
  }

  // Fetch all BOM line items for user
  const { data: bomItems } = await supabase
    .from('bom_line_items')
    .select('product_id, material_id, quantity_required, materials(name, quantity_owned, quantity_used)')
    .eq('user_id', user.id)
    .not('material_id', 'is', null)

  if (!bomItems || bomItems.length === 0) {
    return { data: [], error: null }
  }

  // Group BOM items by product
  const bomByProduct: Record<string, Array<{
    material_id: string
    quantity_required: number
    material_name: string
    available: number
  }>> = {}

  for (const item of bomItems as any[]) {
    const pid = item.product_id
    if (!bomByProduct[pid]) {
      bomByProduct[pid] = []
    }
    const available = Math.max(0, (item.materials?.quantity_owned ?? 0) - (item.materials?.quantity_used ?? 0))
    bomByProduct[pid].push({
      material_id: item.material_id,
      quantity_required: item.quantity_required,
      material_name: item.materials?.name ?? 'Unknown',
      available,
    })
  }

  const results = products
    .filter(p => bomByProduct[p.id])
    .map(product => {
      const items = bomByProduct[product.id]
      let canMake = Infinity
      const limiting: Array<{ name: string; have: number; need: number }> = []

      for (const item of items) {
        const possibleUnits = item.quantity_required > 0
          ? Math.floor(item.available / item.quantity_required)
          : Infinity

        if (possibleUnits < canMake) {
          canMake = possibleUnits
        }

        if (possibleUnits === 0) {
          limiting.push({
            name: item.material_name,
            have: item.available,
            need: item.quantity_required,
          })
        }
      }

      return {
        product_id: product.id,
        product_name: product.name,
        can_make: canMake === Infinity ? 0 : canMake,
        limiting_materials: limiting,
      }
    })

  return { data: results, error: null }
}
