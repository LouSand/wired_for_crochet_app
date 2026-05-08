'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { counterFormSchema } from '@/lib/validators/counter'
import type { Counter } from '@/types/database'

export type CounterActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new counter for a project.
 * Accepts FormData for use with useActionState.
 */
export async function createCounter(
  projectId: string,
  _prevState: CounterActionState,
  formData: FormData
): Promise<CounterActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create a counter.' }
  }

  // Verify the project belongs to the user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return { error: 'Project not found.' }
  }

  // Extract form data
  const rawData: Record<string, unknown> = {
    name: formData.get('name') as string,
  }

  const targetValueStr = formData.get('target_value') as string
  if (targetValueStr && targetValueStr.trim() !== '') {
    rawData.target_value = parseInt(targetValueStr, 10)
  }

  const sortOrderStr = formData.get('sort_order') as string
  if (sortOrderStr && sortOrderStr.trim() !== '') {
    rawData.sort_order = parseInt(sortOrderStr, 10)
  }

  // Validate with Zod
  const result = counterFormSchema.safeParse(rawData)

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

  const { error } = await supabase.from('counters').insert({
    project_id: projectId,
    user_id: user.id,
    name: validated.name,
    target_value: validated.target_value ?? null,
    sort_order: validated.sort_order ?? 0,
    current_value: 0,
  })

  if (error) {
    return { error: 'Failed to create counter. Please try again.' }
  }

  revalidatePath(`/projects/${projectId}/counters`)
  return null
}

/**
 * Increment a counter's current_value by 1.
 */
export async function incrementCounter(counterId: string): Promise<{
  data: Counter | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to update a counter.' }
  }

  // Fetch the counter and verify ownership
  const { data: counter, error: fetchError } = await supabase
    .from('counters')
    .select('*')
    .eq('id', counterId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !counter) {
    return { data: null, error: 'Counter not found.' }
  }

  const newValue = counter.current_value + 1

  const { data, error } = await supabase
    .from('counters')
    .update({ current_value: newValue, updated_at: new Date().toISOString() })
    .eq('id', counterId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to increment counter.' }
  }

  revalidatePath(`/projects/${counter.project_id}/counters`)
  return { data, error: null }
}

/**
 * Decrement a counter's current_value by 1, with a minimum value of 0.
 * If the counter is already at 0, do nothing and return the current state.
 */
export async function decrementCounter(counterId: string): Promise<{
  data: Counter | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to update a counter.' }
  }

  // Fetch the counter and verify ownership
  const { data: counter, error: fetchError } = await supabase
    .from('counters')
    .select('*')
    .eq('id', counterId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !counter) {
    return { data: null, error: 'Counter not found.' }
  }

  // Enforce minimum value of 0
  if (counter.current_value <= 0) {
    return { data: counter, error: null }
  }

  const newValue = counter.current_value - 1

  const { data, error } = await supabase
    .from('counters')
    .update({ current_value: newValue, updated_at: new Date().toISOString() })
    .eq('id', counterId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to decrement counter.' }
  }

  revalidatePath(`/projects/${counter.project_id}/counters`)
  return { data, error: null }
}

/**
 * Reset a counter's current_value to 0.
 */
export async function resetCounter(counterId: string): Promise<{
  data: Counter | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to reset a counter.' }
  }

  // Fetch the counter and verify ownership
  const { data: counter, error: fetchError } = await supabase
    .from('counters')
    .select('id, project_id')
    .eq('id', counterId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !counter) {
    return { data: null, error: 'Counter not found.' }
  }

  const { data, error } = await supabase
    .from('counters')
    .update({ current_value: 0, updated_at: new Date().toISOString() })
    .eq('id', counterId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to reset counter.' }
  }

  revalidatePath(`/projects/${counter.project_id}/counters`)
  return { data, error: null }
}

/**
 * Set a counter's current_value to a specific non-negative integer.
 */
export async function updateCounterValue(
  counterId: string,
  value: number
): Promise<{
  data: Counter | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to update a counter.' }
  }

  // Validate value is a non-negative integer
  if (!Number.isInteger(value) || value < 0) {
    return { data: null, error: 'Value must be a non-negative integer.' }
  }

  // Fetch the counter and verify ownership
  const { data: counter, error: fetchError } = await supabase
    .from('counters')
    .select('id, project_id')
    .eq('id', counterId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !counter) {
    return { data: null, error: 'Counter not found.' }
  }

  const { data, error } = await supabase
    .from('counters')
    .update({ current_value: value, updated_at: new Date().toISOString() })
    .eq('id', counterId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to update counter value.' }
  }

  revalidatePath(`/projects/${counter.project_id}/counters`)
  return { data, error: null }
}

/**
 * Delete a counter.
 */
export async function deleteCounter(counterId: string): Promise<CounterActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a counter.' }
  }

  // Fetch the counter to get project_id for revalidation
  const { data: counter, error: fetchError } = await supabase
    .from('counters')
    .select('id, project_id')
    .eq('id', counterId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !counter) {
    return { error: 'Counter not found.' }
  }

  const { error } = await supabase
    .from('counters')
    .delete()
    .eq('id', counterId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete counter. Please try again.' }
  }

  revalidatePath(`/projects/${counter.project_id}/counters`)
  return null
}

/**
 * Fetch all counters for a project, ordered by sort_order.
 */
export async function getCounters(projectId: string): Promise<{
  data: Counter[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view counters.' }
  }

  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch counters.' }
  }

  return { data, error: null }
}
