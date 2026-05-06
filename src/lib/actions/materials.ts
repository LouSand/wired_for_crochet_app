'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { materialFormSchema } from '@/lib/validators/material'
import { assertProTier } from './business-gate'
import type { MaterialRow, MaterialFilters } from '@/types/business'

export type MaterialActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new material for the authenticated user.
 * Validates with materialFormSchema and checks Pro tier.
 */
export async function createMaterial(
  _prevState: MaterialActionState,
  formData: FormData
): Promise<MaterialActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a material.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    material_type: (formData.get('material_type') as string) || '',
    category: (formData.get('category') as string) || '',
    colour: (formData.get('colour') as string) || '',
    quantity_owned: parseFloat((formData.get('quantity_owned') as string) || '0'),
    quantity_used: parseFloat((formData.get('quantity_used') as string) || '0'),
    total_cost: (formData.get('total_cost') as string)
      ? parseFloat(formData.get('total_cost') as string)
      : null,
    unit: (formData.get('unit') as string) || 'pieces',
  }

  const result = materialFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('materials').insert({
    user_id: user.id,
    name: validated.name,
    material_type: validated.material_type || null,
    category: validated.category,
    colour: validated.colour || null,
    quantity_owned: validated.quantity_owned,
    quantity_used: validated.quantity_used,
    total_cost: validated.total_cost ?? null,
    unit: validated.unit,
    secondary_unit: (formData.get('secondary_unit') as string) || null,
    secondary_quantity_owned: (formData.get('secondary_quantity_owned') as string)
      ? parseFloat(formData.get('secondary_quantity_owned') as string)
      : null,
    secondary_quantity_used: (formData.get('secondary_quantity_used') as string)
      ? parseFloat(formData.get('secondary_quantity_used') as string)
      : null,
  })

  if (error) {
    return { error: 'Failed to create material. Please try again.' }
  }

  revalidatePath('/business/materials')
  return null
}

/**
 * Update an existing material.
 * Validates, checks ownership, and updates. cost_per_unit is auto-calculated by DB.
 */
export async function updateMaterial(
  id: string,
  _prevState: MaterialActionState,
  formData: FormData
): Promise<MaterialActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a material.' }
  }

  // Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('materials')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Material not found.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    material_type: (formData.get('material_type') as string) || '',
    category: (formData.get('category') as string) || '',
    colour: (formData.get('colour') as string) || '',
    quantity_owned: parseFloat((formData.get('quantity_owned') as string) || '0'),
    quantity_used: parseFloat((formData.get('quantity_used') as string) || '0'),
    total_cost: (formData.get('total_cost') as string)
      ? parseFloat(formData.get('total_cost') as string)
      : null,
    unit: (formData.get('unit') as string) || 'pieces',
  }

  const result = materialFormSchema.safeParse(rawData)

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
    .from('materials')
    .update({
      name: validated.name,
      material_type: validated.material_type || null,
      category: validated.category,
      colour: validated.colour || null,
      quantity_owned: validated.quantity_owned,
      quantity_used: validated.quantity_used,
      total_cost: validated.total_cost ?? null,
      unit: validated.unit,
      secondary_unit: (formData.get('secondary_unit') as string) || null,
      secondary_quantity_owned: (formData.get('secondary_quantity_owned') as string)
        ? parseFloat(formData.get('secondary_quantity_owned') as string)
        : null,
      secondary_quantity_used: (formData.get('secondary_quantity_used') as string)
        ? parseFloat(formData.get('secondary_quantity_used') as string)
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update material. Please try again.' }
  }

  revalidatePath('/business/materials')
  return null
}

/**
 * Delete a material. bom_line_items get material_id set to NULL via ON DELETE SET NULL.
 */
export async function deleteMaterial(id: string): Promise<MaterialActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a material.' }
  }

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete material. Please try again.' }
  }

  revalidatePath('/business/materials')
  return null
}

/**
 * Fetch all materials for the authenticated user with optional category filter.
 */
export async function getMaterials(filters?: MaterialFilters): Promise<{
  data: MaterialRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view materials.' }
  }

  let query = supabase
    .from('materials')
    .select('*')
    .eq('user_id', user.id)

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  query = query.order('name', { ascending: true })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch materials.' }
  }

  return { data: data as MaterialRow[], error: null }
}
