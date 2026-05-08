'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supplierFormSchema } from '@/lib/validators/supplier'
import { assertProTier } from './business-gate'
import type { SupplierRow } from '@/types/business'

export type SupplierActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new supplier for the authenticated user.
 * Validates with supplierFormSchema and checks Pro tier.
 */
export async function createSupplier(
  _prevState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a supplier.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    website: (formData.get('website') as string) || '',
    notes: (formData.get('notes') as string) || '',
  }

  const result = supplierFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('suppliers').insert({
    user_id: user.id,
    name: validated.name,
    website: validated.website || null,
    notes: validated.notes || null,
  })

  if (error) {
    return { error: 'Failed to create supplier. Please try again.' }
  }

  revalidatePath('/business/suppliers')
  return null
}

/**
 * Update an existing supplier.
 * Validates, checks ownership, and updates.
 */
export async function updateSupplier(
  id: string,
  _prevState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a supplier.' }
  }

  // Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Supplier not found.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    website: (formData.get('website') as string) || '',
    notes: (formData.get('notes') as string) || '',
  }

  const result = supplierFormSchema.safeParse(rawData)

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
    .from('suppliers')
    .update({
      name: validated.name,
      website: validated.website || null,
      notes: validated.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update supplier. Please try again.' }
  }

  revalidatePath('/business/suppliers')
  revalidatePath(`/business/suppliers/${id}`)
  return null
}

/**
 * Delete a supplier.
 * Purchases keep their data; supplier_id becomes null via ON DELETE SET NULL.
 */
export async function deleteSupplier(id: string): Promise<SupplierActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a supplier.' }
  }

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete supplier. Please try again.' }
  }

  revalidatePath('/business/suppliers')
  return null
}

/**
 * Fetch all suppliers for the authenticated user with optional name search.
 */
export async function getSuppliers(search?: string): Promise<{
  data: SupplierRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view suppliers.' }
  }

  let query = supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', user.id)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch suppliers.' }
  }

  return { data: data as SupplierRow[], error: null }
}

/**
 * Fetch a single supplier by ID with linked purchases.
 */
export async function getSupplier(id: string): Promise<{
  data: (SupplierRow & { purchases: Array<{ id: string; description: string; cost: number; purchase_date: string; category: string }> }) | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this supplier.' }
  }

  const { data, error } = await supabase
    .from('suppliers')
    .select('*, purchases(id, description, cost, purchase_date, category)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Supplier not found.' }
  }

  return { data, error: null }
}
