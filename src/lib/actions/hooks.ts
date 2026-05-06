'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { hookFormSchema, hookUpdateSchema, hookUsageSchema } from '@/lib/validators/hook'
import type { HookEntry, HookUsage } from '@/types/database'

export type HookActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new hook entry for the authenticated user.
 * Accepts FormData for use with useActionState.
 */
export async function createHookEntry(
  _prevState: HookActionState,
  formData: FormData
): Promise<HookActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a hook entry.' }
  }

  // Parse yarn_types and pattern_types from JSON strings
  const yarnTypesRaw = formData.get('yarn_types') as string
  const patternTypesRaw = formData.get('pattern_types') as string
  let yarnTypes: string[] = []
  let patternTypes: string[] = []
  try {
    yarnTypes = yarnTypesRaw ? JSON.parse(yarnTypesRaw) : []
  } catch { yarnTypes = [] }
  try {
    patternTypes = patternTypesRaw ? JSON.parse(patternTypesRaw) : []
  } catch { patternTypes = [] }

  const rawData: Record<string, unknown> = {
    size: formData.get('size') as string,
    type: (formData.get('type') as string) || undefined,
    brand: (formData.get('brand') as string) || undefined,
    material: (formData.get('material') as string) || undefined,
    yarn_types: yarnTypes,
    pattern_types: patternTypes,
  }

  const result = hookFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('hook_entries').insert({
    user_id: user.id,
    size: validated.size,
    type: validated.type ?? null,
    brand: validated.brand ?? null,
    material: validated.material ?? null,
    yarn_types: validated.yarn_types,
    pattern_types: validated.pattern_types,
  })

  if (error) {
    return { error: 'Failed to create hook entry. Please try again.' }
  }

  revalidatePath('/hooks')
  return null
}

/**
 * Update an existing hook entry.
 * Verifies the entry belongs to the current user before updating.
 */
export async function updateHookEntry(
  id: string,
  _prevState: HookActionState,
  formData: FormData
): Promise<HookActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a hook entry.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('hook_entries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Hook entry not found.' }
  }

  // Parse yarn_types and pattern_types from JSON strings
  const yarnTypesRaw = formData.get('yarn_types') as string
  const patternTypesRaw = formData.get('pattern_types') as string
  let yarnTypes: string[] | undefined
  let patternTypes: string[] | undefined
  try {
    yarnTypes = yarnTypesRaw ? JSON.parse(yarnTypesRaw) : undefined
  } catch { yarnTypes = undefined }
  try {
    patternTypes = patternTypesRaw ? JSON.parse(patternTypesRaw) : undefined
  } catch { patternTypes = undefined }

  const rawData: Record<string, unknown> = {}

  const size = formData.get('size') as string
  if (size && size.trim() !== '') rawData.size = size

  const type = formData.get('type') as string
  if (type !== null && type !== undefined) rawData.type = type || undefined

  const brand = formData.get('brand') as string
  if (brand !== null && brand !== undefined) rawData.brand = brand || undefined

  const material = formData.get('material') as string
  if (material !== null && material !== undefined) rawData.material = material || undefined

  if (yarnTypes !== undefined) rawData.yarn_types = yarnTypes
  if (patternTypes !== undefined) rawData.pattern_types = patternTypes

  const result = hookUpdateSchema.safeParse(rawData)

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

  if (validated.size !== undefined) updatePayload.size = validated.size
  if (validated.type !== undefined) updatePayload.type = validated.type ?? null
  if (validated.brand !== undefined) updatePayload.brand = validated.brand ?? null
  if (validated.material !== undefined) updatePayload.material = validated.material ?? null
  if (validated.yarn_types !== undefined) updatePayload.yarn_types = validated.yarn_types
  if (validated.pattern_types !== undefined) updatePayload.pattern_types = validated.pattern_types

  const { error } = await supabase
    .from('hook_entries')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update hook entry. Please try again.' }
  }

  revalidatePath('/hooks')
  revalidatePath(`/hooks/${id}`)
  return null
}

/**
 * Delete a hook entry and all associated hook_usages.
 */
export async function deleteHookEntry(id: string): Promise<HookActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a hook entry.' }
  }

  // Delete associated hook usages first
  await supabase.from('hook_usages').delete().eq('hook_entry_id', id)

  const { error } = await supabase
    .from('hook_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete hook entry. Please try again.' }
  }

  revalidatePath('/hooks')
  return null
}

/**
 * Link a hook entry to a project by creating a hook_usage record.
 * Accepts FormData for use with useActionState.
 */
export async function linkHookToProject(
  _prevState: HookActionState,
  formData: FormData
): Promise<HookActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to link a hook to a project.' }
  }

  const rawData: Record<string, unknown> = {
    hook_entry_id: formData.get('hook_entry_id') as string,
    project_id: formData.get('project_id') as string,
  }

  const note = formData.get('note') as string
  if (note && note.trim() !== '') {
    rawData.note = note.trim()
  }

  const result = hookUsageSchema.safeParse(rawData)

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

  const { error } = await supabase.from('hook_usages').insert({
    user_id: user.id,
    hook_entry_id: validated.hook_entry_id,
    project_id: validated.project_id,
    note: validated.note ?? null,
  })

  if (error) {
    return { error: 'Failed to link hook to project. Please try again.' }
  }

  revalidatePath('/hooks')
  revalidatePath(`/projects/${validated.project_id}`)
  return null
}

/**
 * Delete a hook usage record (remove hook-project link).
 */
export async function deleteHookUsage(usageId: string): Promise<HookActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to remove hook usage.' }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('hook_usages')
    .select('id, project_id')
    .eq('id', usageId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Hook usage record not found.' }
  }

  const { error } = await supabase
    .from('hook_usages')
    .delete()
    .eq('id', usageId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to remove hook usage. Please try again.' }
  }

  revalidatePath('/hooks')
  revalidatePath(`/projects/${existing.project_id}`)
  return null
}

/**
 * Fetch all hook entries for the authenticated user with optional search.
 */
export async function getHookEntries(options?: {
  search?: string
}): Promise<{ data: HookEntry[] | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view hook entries.' }
  }

  let query = supabase
    .from('hook_entries')
    .select('*')
    .eq('user_id', user.id)

  if (options?.search) {
    query = query.or(
      `size.ilike.%${options.search}%,brand.ilike.%${options.search}%,material.ilike.%${options.search}%,type.ilike.%${options.search}%`
    )
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch hook entries.' }
  }

  return { data, error: null }
}

/**
 * Fetch a single hook entry by ID with its associated usages.
 */
export async function getHookEntry(id: string): Promise<{
  data: (HookEntry & { hook_usages: HookUsage[] }) | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this hook entry.' }
  }

  const { data, error } = await supabase
    .from('hook_entries')
    .select('*, hook_usages(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Hook entry not found.' }
  }

  return { data, error: null }
}

/**
 * Fetch all hook usages for a specific project.
 */
export async function getHookUsagesForProject(projectId: string): Promise<{
  data: (HookUsage & { hook_entries: HookEntry })[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view hook usages.' }
  }

  const { data, error } = await supabase
    .from('hook_usages')
    .select('*, hook_entries(*)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: 'Failed to fetch hook usages for project.' }
  }

  return { data: data as (HookUsage & { hook_entries: HookEntry })[], error: null }
}

/**
 * Get hook recommendations based on yarn types and/or pattern types.
 * Uses JSONB containment queries to find hooks with matching compatibility metadata.
 */
export async function getHookRecommendations(options: {
  yarnTypes?: string[]
  patternTypes?: string[]
}): Promise<{ data: HookEntry[] | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to get hook recommendations.' }
  }

  const { yarnTypes = [], patternTypes = [] } = options

  // If no filters provided, return empty
  if (yarnTypes.length === 0 && patternTypes.length === 0) {
    return { data: [], error: null }
  }

  // Build OR filter for JSONB containment
  const filters: string[] = []
  if (yarnTypes.length > 0) {
    filters.push(`yarn_types.cs.${JSON.stringify(yarnTypes)}`)
  }
  if (patternTypes.length > 0) {
    filters.push(`pattern_types.cs.${JSON.stringify(patternTypes)}`)
  }

  const { data, error } = await supabase
    .from('hook_entries')
    .select('*')
    .eq('user_id', user.id)
    .or(filters.join(','))

  if (error) {
    return { data: null, error: 'Failed to fetch hook recommendations.' }
  }

  return { data, error: null }
}
