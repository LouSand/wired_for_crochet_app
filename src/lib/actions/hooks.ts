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

  const rawData: Record<string, unknown> = {
    size: formData.get('size') as string,
    type: (formData.get('type') as string) || undefined,
    brand: (formData.get('brand') as string) || undefined,
    material: (formData.get('material') as string) || undefined,
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

  const rawData: Record<string, unknown> = {}

  const size = formData.get('size') as string
  if (size && size.trim() !== '') rawData.size = size

  const type = formData.get('type') as string
  if (type !== null && type !== undefined) rawData.type = type || undefined

  const brand = formData.get('brand') as string
  if (brand !== null && brand !== undefined) rawData.brand = brand || undefined

  const material = formData.get('material') as string
  if (material !== null && material !== undefined) rawData.material = material || undefined

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
