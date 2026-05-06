'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bomLineItemFormSchema } from '@/lib/validators/bom'
import { assertProTier } from './business-gate'
import { calculateBomCost, type BomCostBreakdown, type BomLineItemInput } from '@/lib/bom-calculator'
import type { BomLineItemRow, MaterialRow, ProductRow } from '@/types/business'

export type BomActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

export interface BomLineItemWithMaterial extends BomLineItemRow {
  materials: {
    name: string
    cost_per_unit: number | null
    unit: string
  } | null
}

/**
 * Add a BOM line item to a product.
 */
export async function addBomLineItem(
  productId: string,
  _prevState: BomActionState,
  formData: FormData
): Promise<BomActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a BOM line item.' }
  }

  const rawData = {
    material_id: (formData.get('material_id') as string) || '',
    quantity_required: parseFloat((formData.get('quantity_required') as string) || '0'),
  }

  const result = bomLineItemFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase.from('bom_line_items').insert({
    product_id: productId,
    material_id: validated.material_id,
    user_id: user.id,
    quantity_required: validated.quantity_required,
  })

  if (error) {
    return { error: 'Failed to add BOM line item. Please try again.' }
  }

  revalidatePath(`/business/products/${productId}/bom`)
  return null
}

/**
 * Remove a BOM line item.
 */
export async function removeBomLineItem(id: string, productId: string): Promise<BomActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to remove a BOM line item.' }
  }

  const { error } = await supabase
    .from('bom_line_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to remove BOM line item. Please try again.' }
  }

  revalidatePath(`/business/products/${productId}/bom`)
  return null
}

/**
 * Fetch all BOM line items for a product with material details.
 */
export async function getBomForProduct(productId: string): Promise<{
  data: BomLineItemWithMaterial[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view BOM.' }
  }

  const { data, error } = await supabase
    .from('bom_line_items')
    .select('*, materials(name, cost_per_unit, unit)')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch BOM line items.' }
  }

  return { data: data as BomLineItemWithMaterial[], error: null }
}

/**
 * Calculate the full BOM cost breakdown for a product.
 */
export async function calculateProductBomCost(productId: string): Promise<{
  data: BomCostBreakdown | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  // Fetch product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('time_taken_minutes, wages_per_minute, profit_margin_percent')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single()

  if (productError || !product) {
    return { data: null, error: 'Product not found.' }
  }

  // Fetch BOM line items with material cost
  const { data: lineItems, error: bomError } = await supabase
    .from('bom_line_items')
    .select('material_id, quantity_required, materials(cost_per_unit)')
    .eq('product_id', productId)
    .eq('user_id', user.id)

  if (bomError) {
    return { data: null, error: 'Failed to fetch BOM data.' }
  }

  const bomInput: BomLineItemInput[] = (lineItems ?? []).map((item: any) => ({
    material_id: item.material_id,
    quantity_required: item.quantity_required,
    cost_per_unit: item.materials?.cost_per_unit ?? null,
  }))

  const breakdown = calculateBomCost({
    line_items: bomInput,
    time_taken_minutes: product.time_taken_minutes,
    wages_per_minute: product.wages_per_minute,
    extras: [],
    profit_margin_percent: product.profit_margin_percent,
  })

  return { data: breakdown, error: null }
}
