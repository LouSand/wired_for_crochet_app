'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { timeSessionUpdateSchema } from '@/lib/validators/time-session'
import type { TimeSession } from '@/types/database'

export type TimeSessionActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Start a timer on a project.
 * Checks for an existing running session (end_time is null) and rejects duplicates.
 * Uses server timestamp for start_time.
 */
export async function startTimer(projectId: string): Promise<{
  data: TimeSession | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to start a timer.' }
  }

  // Check for existing running session on this project
  const { data: existingSession } = await supabase
    .from('time_sessions')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)
    .maybeSingle()

  if (existingSession) {
    return { data: null, error: 'A timer is already running on this project.' }
  }

  // Insert a new time session with server timestamp
  const { data, error } = await supabase
    .from('time_sessions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      start_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to start timer. Please try again.' }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/time`)
  return { data, error: null }
}

/**
 * Stop a running timer.
 * Verifies the session belongs to the user and has a null end_time.
 * Uses server timestamp for end_time.
 */
export async function stopTimer(sessionId: string): Promise<{
  data: TimeSession | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to stop a timer.' }
  }

  // Find the session and verify ownership and that it's running
  const { data: session, error: fetchError } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .is('end_time', null)
    .single()

  if (fetchError || !session) {
    return { data: null, error: 'Running session not found.' }
  }

  // Update with server timestamp
  const { data, error } = await supabase
    .from('time_sessions')
    .update({ end_time: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: 'Failed to stop timer. Please try again.' }
  }

  revalidatePath(`/projects/${session.project_id}`)
  revalidatePath(`/projects/${session.project_id}/time`)
  return { data, error: null }
}

/**
 * Update a time session (manual editing of start_time, end_time, note).
 * Validates that end_time > start_time using Zod schema.
 */
export async function updateTimeSession(
  sessionId: string,
  _prevState: TimeSessionActionState,
  formData: FormData
): Promise<TimeSessionActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to edit a time session.' }
  }

  // Verify the session exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('time_sessions')
    .select('id, project_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Time session not found.' }
  }

  // Extract form data
  const rawData = {
    start_time: formData.get('start_time') as string,
    end_time: (formData.get('end_time') as string) || undefined,
    note: (formData.get('note') as string) || undefined,
  }

  // Validate with Zod
  const result = timeSessionUpdateSchema.safeParse(rawData)

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
    start_time: validated.start_time,
  }

  if (validated.end_time && validated.end_time !== '') {
    updatePayload.end_time = validated.end_time
  } else {
    updatePayload.end_time = null
  }

  if (validated.note !== undefined) {
    updatePayload.note = validated.note || null
  }

  const { error } = await supabase
    .from('time_sessions')
    .update(updatePayload)
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update time session. Please try again.' }
  }

  revalidatePath(`/projects/${existing.project_id}`)
  revalidatePath(`/projects/${existing.project_id}/time`)
  return null
}

/**
 * Delete a time session.
 */
export async function deleteTimeSession(sessionId: string): Promise<TimeSessionActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a time session.' }
  }

  // Fetch the session to get project_id for revalidation
  const { data: session, error: fetchError } = await supabase
    .from('time_sessions')
    .select('id, project_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !session) {
    return { error: 'Time session not found.' }
  }

  const { error } = await supabase
    .from('time_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete time session. Please try again.' }
  }

  revalidatePath(`/projects/${session.project_id}`)
  revalidatePath(`/projects/${session.project_id}/time`)
  return null
}

/**
 * Fetch all time sessions for a project, ordered by start_time desc.
 * Also computes and returns total duration in seconds.
 */
export async function getTimeSessions(projectId: string): Promise<{
  data: TimeSession[] | null
  totalDurationSeconds: number
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, totalDurationSeconds: 0, error: 'You must be logged in to view time sessions.' }
  }

  const { data, error } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  if (error) {
    return { data: null, totalDurationSeconds: 0, error: 'Failed to fetch time sessions.' }
  }

  // Compute total duration from completed sessions
  const totalDurationSeconds = (data ?? []).reduce((total, session) => {
    if (session.end_time) {
      const start = new Date(session.start_time).getTime()
      const end = new Date(session.end_time).getTime()
      const durationMs = end - start
      return total + Math.max(0, Math.floor(durationMs / 1000))
    }
    return total
  }, 0)

  return { data, totalDurationSeconds, error: null }
}

/**
 * Return the currently running session (end_time is null) for a project, or null.
 */
export async function getActiveSession(projectId: string): Promise<{
  data: TimeSession | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to check active sessions.' }
  }

  const { data, error } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: 'Failed to check for active session.' }
  }

  return { data: data ?? null, error: null }
}
