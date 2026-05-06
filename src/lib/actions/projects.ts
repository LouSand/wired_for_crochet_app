'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { projectFormSchema, projectUpdateSchema } from '@/lib/validators/project'
import type { Project } from '@/types/database'

export type ProjectActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new project for the authenticated user.
 * Accepts FormData for use with useActionState.
 */
export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create a project.' }
  }

  // Extract and parse form data
  const rawData: Record<string, unknown> = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    status: (formData.get('status') as string) || undefined,
    difficulty: (formData.get('difficulty') as string) || undefined,
    customer_name: (formData.get('customer_name') as string) || undefined,
    date_started: (formData.get('date_started') as string) || undefined,
    date_completed: (formData.get('date_completed') as string) || undefined,
    estimated_completion_date: (formData.get('estimated_completion_date') as string) || undefined,
    pattern_id: (formData.get('pattern_id') as string) || undefined,
    currency: (formData.get('currency') as string) || undefined,
  }

  // Handle mark-as-finished logic
  const markAsFinished = formData.get('mark_as_finished') as string
  if (markAsFinished === 'true') {
    rawData.status = 'completed'
    if (!rawData.date_completed) {
      rawData.date_completed = new Date().toISOString().split('T')[0]
    }
  }

  // Parse hourly_rate_override as number if provided
  const hourlyRateStr = formData.get('hourly_rate_override') as string
  if (hourlyRateStr && hourlyRateStr.trim() !== '') {
    rawData.hourly_rate_override = parseFloat(hourlyRateStr)
  }

  // Parse profit_margin as number if provided
  const profitMarginStr = formData.get('profit_margin') as string
  if (profitMarginStr && profitMarginStr.trim() !== '') {
    rawData.profit_margin = parseFloat(profitMarginStr)
  }

  // Parse priority as number if provided
  const priorityStr = formData.get('priority') as string
  if (priorityStr && priorityStr.trim() !== '') {
    rawData.priority = parseInt(priorityStr, 10)
  }

  // Validate with Zod
  const result = projectFormSchema.safeParse(rawData)

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

  // Insert into projects table
  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: validated.name,
    description: validated.description ?? null,
    status: validated.status,
    difficulty: validated.difficulty ?? null,
    customer_name: validated.customer_name ?? null,
    date_started: validated.date_started ?? null,
    date_completed: validated.date_completed ?? null,
    estimated_completion_date: validated.estimated_completion_date ?? null,
    priority: validated.priority ?? null,
    hourly_rate_override: validated.hourly_rate_override ?? null,
    pattern_id: validated.pattern_id ?? null,
    currency: validated.currency,
    profit_margin: (rawData as Record<string, unknown>).profit_margin ?? null,
  })

  if (error) {
    return { error: 'Failed to create project. Please try again.' }
  }

  revalidatePath('/projects')
  return null
}

/**
 * Update an existing project.
 * Verifies the project belongs to the current user before updating.
 */
export async function updateProject(
  id: string,
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a project.' }
  }

  // Verify the project exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Project not found.' }
  }

  // Extract and parse form data (all fields optional for update)
  const rawData: Record<string, unknown> = {}

  const name = formData.get('name') as string
  if (name && name.trim() !== '') rawData.name = name

  const description = formData.get('description') as string
  if (description !== null && description !== undefined) rawData.description = description || undefined

  const status = formData.get('status') as string
  if (status && status.trim() !== '') rawData.status = status

  const difficulty = formData.get('difficulty') as string
  if (difficulty && difficulty.trim() !== '') rawData.difficulty = difficulty

  const customerName = formData.get('customer_name') as string
  if (customerName !== null && customerName !== undefined) rawData.customer_name = customerName || undefined

  const dateStarted = formData.get('date_started') as string
  if (dateStarted && dateStarted.trim() !== '') rawData.date_started = dateStarted

  const dateCompleted = formData.get('date_completed') as string
  if (dateCompleted && dateCompleted.trim() !== '') rawData.date_completed = dateCompleted

  const estimatedCompletionDate = formData.get('estimated_completion_date') as string
  if (estimatedCompletionDate !== null && estimatedCompletionDate !== undefined) {
    rawData.estimated_completion_date = estimatedCompletionDate.trim() !== '' ? estimatedCompletionDate : undefined
  }

  const priorityStr = formData.get('priority') as string
  if (priorityStr !== null && priorityStr !== undefined) {
    if (priorityStr.trim() !== '') {
      rawData.priority = parseInt(priorityStr, 10)
    } else {
      rawData.priority = undefined
    }
  }

  const patternId = formData.get('pattern_id') as string
  if (patternId && patternId.trim() !== '') rawData.pattern_id = patternId

  const currency = formData.get('currency') as string
  if (currency && currency.trim() !== '') rawData.currency = currency

  const hourlyRateStr = formData.get('hourly_rate_override') as string
  if (hourlyRateStr && hourlyRateStr.trim() !== '') {
    rawData.hourly_rate_override = parseFloat(hourlyRateStr)
  }

  // Handle mark-as-finished logic
  const markAsFinished = formData.get('mark_as_finished') as string
  if (markAsFinished === 'true') {
    rawData.status = 'completed'
    if (!rawData.date_completed) {
      rawData.date_completed = new Date().toISOString().split('T')[0]
    }
  } else if (markAsFinished === 'false') {
    // Revert: clear date_completed (status should be set by the form's status field)
    rawData.date_completed = undefined
  }

  // Validate with partial schema
  const result = projectUpdateSchema.safeParse(rawData)

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

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (validated.name !== undefined) updatePayload.name = validated.name
  if (validated.description !== undefined) updatePayload.description = validated.description ?? null
  if (validated.status !== undefined) updatePayload.status = validated.status
  if (validated.difficulty !== undefined) updatePayload.difficulty = validated.difficulty ?? null
  if (validated.customer_name !== undefined) updatePayload.customer_name = validated.customer_name ?? null
  if (validated.date_started !== undefined) updatePayload.date_started = validated.date_started ?? null
  if (validated.date_completed !== undefined) updatePayload.date_completed = validated.date_completed ?? null
  if (validated.estimated_completion_date !== undefined) updatePayload.estimated_completion_date = validated.estimated_completion_date ?? null
  if (validated.priority !== undefined) updatePayload.priority = validated.priority ?? null
  if (validated.hourly_rate_override !== undefined) updatePayload.hourly_rate_override = validated.hourly_rate_override ?? null
  if (validated.pattern_id !== undefined) updatePayload.pattern_id = validated.pattern_id ?? null
  if (validated.currency !== undefined) updatePayload.currency = validated.currency

  const { error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update project. Please try again.' }
  }

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return null
}

/**
 * Delete a project and all associated data.
 * The database cascade constraints handle related records (time_sessions, counters, etc.).
 */
export async function deleteProject(id: string): Promise<ProjectActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a project.' }
  }

  // Delete associated data manually in case DB cascade isn't configured
  // Order matters: delete dependent records first
  await supabase.from('pricing_extras').delete().eq('project_id', id)
  await supabase.from('notes').delete().eq('project_id', id)
  await supabase.from('progress_photos').delete().eq('project_id', id)
  await supabase.from('yarn_usages').delete().eq('project_id', id)
  await supabase.from('hook_usages').delete().eq('project_id', id)
  await supabase.from('counters').delete().eq('project_id', id)
  await supabase.from('time_sessions').delete().eq('project_id', id)

  // Delete the project itself
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete project. Please try again.' }
  }

  revalidatePath('/projects')
  return null
}

/**
 * Fetch all projects for the authenticated user with optional filters and sorting.
 */
export async function getProjects(options?: {
  status?: string
  difficulty?: string
  sortBy?: 'date_started' | 'status' | 'difficulty' | 'created_at' | 'estimated_completion_date' | 'priority'
  sortDirection?: 'asc' | 'desc'
}): Promise<{ data: Project[] | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view projects.' }
  }

  let query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)

  // Apply filters
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.difficulty) {
    query = query.eq('difficulty', options.difficulty)
  }

  // Apply sorting
  const sortBy = options?.sortBy || 'created_at'
  const sortDirection = options?.sortDirection || 'desc'
  query = query.order(sortBy, { ascending: sortDirection === 'asc', nullsFirst: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch projects.' }
  }

  return { data, error: null }
}

/**
 * Fetch a single project by ID for the authenticated user.
 */
export async function getProject(id: string): Promise<{ data: Project | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this project.' }
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Project not found.' }
  }

  return { data, error: null }
}
