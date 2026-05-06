'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { yarnFormSchema, yarnUpdateSchema, yarnUsageSchema } from '@/lib/validators/yarn'
import type { YarnEntry, YarnUsage } from '@/types/database'

export type YarnActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new yarn entry for the authenticated user.
 * Accepts FormData for use with useActionState.
 */
export async function createYarnEntry(
  _prevState: YarnActionState,
  formData: FormData
): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a yarn entry.' }
  }

  const rawData: Record<string, unknown> = {
    name: formData.get('name') as string,
    brand: (formData.get('brand') as string) || undefined,
    colour: (formData.get('colour') as string) || undefined,
    shade_code: (formData.get('shade_code') as string) || undefined,
    dye_lot: (formData.get('dye_lot') as string) || undefined,
    weight_category: (formData.get('weight_category') as string) || undefined,
    thickness: (formData.get('thickness') as string) || undefined,
    fibre_content: (formData.get('fibre_content') as string) || undefined,
    washing_instructions: (formData.get('washing_instructions') as string) || undefined,
    recommended_hook_size: (formData.get('recommended_hook_size') as string) || undefined,
  }

  const quantityStr = formData.get('quantity_owned') as string
  if (quantityStr && quantityStr.trim() !== '') {
    rawData.quantity_owned = parseFloat(quantityStr)
  }

  const costStr = formData.get('cost_per_unit') as string
  if (costStr && costStr.trim() !== '') {
    rawData.cost_per_unit = parseFloat(costStr)
  }

  const result = yarnFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('yarn_entries').insert({
    user_id: user.id,
    name: validated.name,
    brand: validated.brand ?? null,
    colour: validated.colour ?? null,
    shade_code: validated.shade_code ?? null,
    dye_lot: validated.dye_lot ?? null,
    weight_category: validated.weight_category ?? null,
    thickness: validated.thickness ?? null,
    fibre_content: validated.fibre_content ?? null,
    washing_instructions: validated.washing_instructions ?? null,
    recommended_hook_size: validated.recommended_hook_size ?? null,
    quantity_owned: validated.quantity_owned,
    cost_per_unit: validated.cost_per_unit ?? null,
  })

  if (error) {
    return { error: 'Failed to create yarn entry. Please try again.' }
  }

  revalidatePath('/yarn')
  return null
}

/**
 * Update an existing yarn entry.
 * Verifies the entry belongs to the current user before updating.
 */
export async function updateYarnEntry(
  id: string,
  _prevState: YarnActionState,
  formData: FormData
): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a yarn entry.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('yarn_entries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Yarn entry not found.' }
  }

  const rawData: Record<string, unknown> = {}

  const name = formData.get('name') as string
  if (name && name.trim() !== '') rawData.name = name

  const brand = formData.get('brand') as string
  if (brand !== null && brand !== undefined) rawData.brand = brand || undefined

  const colour = formData.get('colour') as string
  if (colour !== null && colour !== undefined) rawData.colour = colour || undefined

  const shadeCode = formData.get('shade_code') as string
  if (shadeCode !== null && shadeCode !== undefined) rawData.shade_code = shadeCode || undefined

  const dyeLot = formData.get('dye_lot') as string
  if (dyeLot !== null && dyeLot !== undefined) rawData.dye_lot = dyeLot || undefined

  const weightCategory = formData.get('weight_category') as string
  if (weightCategory && weightCategory.trim() !== '') rawData.weight_category = weightCategory

  const thickness = formData.get('thickness') as string
  if (thickness !== null && thickness !== undefined) rawData.thickness = thickness || undefined

  const fibreContent = formData.get('fibre_content') as string
  if (fibreContent !== null && fibreContent !== undefined) rawData.fibre_content = fibreContent || undefined

  const washingInstructions = formData.get('washing_instructions') as string
  if (washingInstructions !== null && washingInstructions !== undefined) rawData.washing_instructions = washingInstructions || undefined

  const recommendedHookSize = formData.get('recommended_hook_size') as string
  if (recommendedHookSize !== null && recommendedHookSize !== undefined) rawData.recommended_hook_size = recommendedHookSize || undefined

  const quantityStr = formData.get('quantity_owned') as string
  if (quantityStr && quantityStr.trim() !== '') {
    rawData.quantity_owned = parseFloat(quantityStr)
  }

  const costStr = formData.get('cost_per_unit') as string
  if (costStr && costStr.trim() !== '') {
    rawData.cost_per_unit = parseFloat(costStr)
  }

  const result = yarnUpdateSchema.safeParse(rawData)

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

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (validated.name !== undefined) updatePayload.name = validated.name
  if (validated.brand !== undefined) updatePayload.brand = validated.brand ?? null
  if (validated.colour !== undefined) updatePayload.colour = validated.colour ?? null
  if (validated.shade_code !== undefined) updatePayload.shade_code = validated.shade_code ?? null
  if (validated.dye_lot !== undefined) updatePayload.dye_lot = validated.dye_lot ?? null
  if (validated.weight_category !== undefined) updatePayload.weight_category = validated.weight_category ?? null
  if (validated.thickness !== undefined) updatePayload.thickness = validated.thickness ?? null
  if (validated.fibre_content !== undefined) updatePayload.fibre_content = validated.fibre_content ?? null
  if (validated.washing_instructions !== undefined) updatePayload.washing_instructions = validated.washing_instructions ?? null
  if (validated.recommended_hook_size !== undefined) updatePayload.recommended_hook_size = validated.recommended_hook_size ?? null
  if (validated.quantity_owned !== undefined) updatePayload.quantity_owned = validated.quantity_owned
  if (validated.cost_per_unit !== undefined) updatePayload.cost_per_unit = validated.cost_per_unit ?? null

  const { error } = await supabase
    .from('yarn_entries')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update yarn entry. Please try again.' }
  }

  revalidatePath('/yarn')
  revalidatePath(`/yarn/${id}`)
  return null
}

/**
 * Delete a yarn entry and all associated yarn_usages.
 */
export async function deleteYarnEntry(id: string): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a yarn entry.' }
  }

  // Delete associated yarn usages first
  await supabase.from('yarn_usages').delete().eq('yarn_entry_id', id)

  const { error } = await supabase
    .from('yarn_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete yarn entry. Please try again.' }
  }

  revalidatePath('/yarn')
  return null
}

/**
 * Link a yarn entry to a project by creating a yarn_usage record.
 * Accepts FormData for use with useActionState.
 */
export async function linkYarnToProject(
  _prevState: YarnActionState,
  formData: FormData
): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to link yarn to a project.' }
  }

  const rawData: Record<string, unknown> = {
    yarn_entry_id: formData.get('yarn_entry_id') as string,
    project_id: formData.get('project_id') as string,
  }

  const quantityStr = formData.get('quantity_used') as string
  if (quantityStr && quantityStr.trim() !== '') {
    rawData.quantity_used = parseFloat(quantityStr)
  } else {
    rawData.quantity_used = 0
  }

  const result = yarnUsageSchema.safeParse(rawData)

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

  const { error } = await supabase.from('yarn_usages').insert({
    user_id: user.id,
    yarn_entry_id: validated.yarn_entry_id,
    project_id: validated.project_id,
    quantity_used: validated.quantity_used,
  })

  if (error) {
    return { error: 'Failed to link yarn to project. Please try again.' }
  }

  revalidatePath('/yarn')
  revalidatePath(`/projects/${validated.project_id}`)
  return null
}

/**
 * Update the quantity_used on an existing yarn usage record.
 */
export async function updateYarnUsage(
  usageId: string,
  _prevState: YarnActionState,
  formData: FormData
): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update yarn usage.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('yarn_usages')
    .select('id, project_id')
    .eq('id', usageId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Yarn usage record not found.' }
  }

  const quantityStr = formData.get('quantity_used') as string
  if (!quantityStr || quantityStr.trim() === '') {
    return { fieldErrors: { quantity_used: ['Quantity used is required.'] } }
  }

  const quantityUsed = parseFloat(quantityStr)
  if (isNaN(quantityUsed) || quantityUsed < 0) {
    return { fieldErrors: { quantity_used: ['Quantity used must be a non-negative number.'] } }
  }

  const { error } = await supabase
    .from('yarn_usages')
    .update({
      quantity_used: quantityUsed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', usageId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update yarn usage. Please try again.' }
  }

  revalidatePath('/yarn')
  revalidatePath(`/projects/${existing.project_id}`)
  return null
}

/**
 * Delete a yarn usage record (remove yarn-project link).
 */
export async function deleteYarnUsage(usageId: string): Promise<YarnActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to remove yarn usage.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('yarn_usages')
    .select('id, project_id')
    .eq('id', usageId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Yarn usage record not found.' }
  }

  const { error } = await supabase
    .from('yarn_usages')
    .delete()
    .eq('id', usageId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to remove yarn usage. Please try again.' }
  }

  revalidatePath('/yarn')
  revalidatePath(`/projects/${existing.project_id}`)
  return null
}

/**
 * Fetch all yarn entries for the authenticated user with optional search/filter.
 */
export async function getYarnEntries(options?: {
  search?: string
  weight_category?: string
}): Promise<{ data: YarnEntry[] | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view yarn entries.' }
  }

  let query = supabase
    .from('yarn_entries')
    .select('*')
    .eq('user_id', user.id)

  if (options?.weight_category) {
    query = query.eq('weight_category', options.weight_category)
  }

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,brand.ilike.%${options.search}%,colour.ilike.%${options.search}%`
    )
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch yarn entries.' }
  }

  return { data, error: null }
}

/**
 * Fetch a single yarn entry by ID with its associated usages.
 */
export async function getYarnEntry(id: string): Promise<{
  data: (YarnEntry & { yarn_usages: YarnUsage[] }) | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this yarn entry.' }
  }

  const { data, error } = await supabase
    .from('yarn_entries')
    .select('*, yarn_usages(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Yarn entry not found.' }
  }

  return { data, error: null }
}

/**
 * Fetch all yarn usages for a specific project.
 */
export async function getYarnUsagesForProject(projectId: string): Promise<{
  data: (YarnUsage & { yarn_entries: YarnEntry })[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view yarn usages.' }
  }

  const { data, error } = await supabase
    .from('yarn_usages')
    .select('*, yarn_entries(*)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: 'Failed to fetch yarn usages for project.' }
  }

  return { data: data as (YarnUsage & { yarn_entries: YarnEntry })[], error: null }
}
