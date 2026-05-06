'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { saleFormSchema } from '@/lib/validators/sale'
import { assertProTier } from './business-gate'
import type { SaleRow, SaleFilters } from '@/types/business'

export type SaleActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new sale for the authenticated user.
 */
export async function createSale(
  _prevState: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to record a sale.' }
  }

  const rawData = {
    sale_date: (formData.get('sale_date') as string) || '',
    product_id: (formData.get('product_id') as string) || '',
    customer_id: (formData.get('customer_id') as string) || '',
    quantity_sold: parseInt((formData.get('quantity_sold') as string) || '1', 10),
    sale_price: parseFloat((formData.get('sale_price') as string) || '0'),
  }

  const result = saleFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('sales').insert({
    user_id: user.id,
    sale_date: validated.sale_date,
    product_id: validated.product_id || null,
    customer_id: validated.customer_id || null,
    quantity_sold: validated.quantity_sold,
    sale_price: validated.sale_price,
  })

  if (error) {
    return { error: 'Failed to record sale. Please try again.' }
  }

  revalidatePath('/business/sales')
  return null
}

/**
 * Update an existing sale.
 */
export async function updateSale(
  id: string,
  _prevState: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a sale.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('sales')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Sale not found.' }
  }

  const rawData = {
    sale_date: (formData.get('sale_date') as string) || '',
    product_id: (formData.get('product_id') as string) || '',
    customer_id: (formData.get('customer_id') as string) || '',
    quantity_sold: parseInt((formData.get('quantity_sold') as string) || '1', 10),
    sale_price: parseFloat((formData.get('sale_price') as string) || '0'),
  }

  const result = saleFormSchema.safeParse(rawData)

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

  const { error } = await supabase
    .from('sales')
    .update({
      sale_date: validated.sale_date,
      product_id: validated.product_id || null,
      customer_id: validated.customer_id || null,
      quantity_sold: validated.quantity_sold,
      sale_price: validated.sale_price,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update sale. Please try again.' }
  }

  revalidatePath('/business/sales')
  return null
}

/**
 * Delete a sale.
 */
export async function deleteSale(id: string): Promise<SaleActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a sale.' }
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete sale. Please try again.' }
  }

  revalidatePath('/business/sales')
  return null
}

/**
 * Fetch all sales for the authenticated user with optional filters.
 */
export async function getSales(filters?: SaleFilters): Promise<{
  data: SaleRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view sales.' }
  }

  let query = supabase
    .from('sales')
    .select('*')
    .eq('user_id', user.id)

  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id)
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id)
  }

  if (filters?.start_date) {
    query = query.gte('sale_date', filters.start_date)
  }

  if (filters?.end_date) {
    query = query.lte('sale_date', filters.end_date)
  }

  query = query.order('sale_date', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch sales.' }
  }

  return { data: data as SaleRow[], error: null }
}
