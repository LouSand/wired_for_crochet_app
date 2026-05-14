'use server'

import { createClient } from '@/lib/supabase/server'
import { parsePattern, type PatternAnalysis, type SuggestedCounter } from '@/lib/pattern-parser'
import { revalidatePath } from 'next/cache'

/**
 * Analyse a pattern's instructions and return suggested counters + difficulty.
 */
export async function analysePattern(patternId: string): Promise<{
  data: PatternAnalysis | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: pattern, error } = await supabase
    .from('patterns')
    .select('instructions')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (error || !pattern?.instructions) {
    return { data: null, error: 'Pattern not found or has no instructions.' }
  }

  const analysis = parsePattern(pattern.instructions)
  return { data: analysis, error: null }
}

/**
 * Auto-create counters for a project based on pattern analysis.
 * Creates counters from the suggested counters list.
 */
export async function autoCreateCounters(
  projectId: string,
  patternId: string,
  selectedCounters?: SuggestedCounter[]
): Promise<{ created: number; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { created: 0, error: 'Not authenticated' }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return { created: 0, error: 'Project not found.' }

  // Get pattern analysis if no specific counters provided
  let countersToCreate: SuggestedCounter[]
  if (selectedCounters && selectedCounters.length > 0) {
    countersToCreate = selectedCounters
  } else {
    const { data: pattern } = await supabase
      .from('patterns')
      .select('instructions')
      .eq('id', patternId)
      .eq('user_id', user.id)
      .single()

    if (!pattern?.instructions) {
      return { created: 0, error: 'Pattern has no instructions to analyse.' }
    }

    const analysis = parsePattern(pattern.instructions)
    countersToCreate = analysis.suggestedCounters
  }

  if (countersToCreate.length === 0) {
    return { created: 0, error: null }
  }

  // Get existing counters to avoid duplicates
  const { data: existingCounters } = await supabase
    .from('counters')
    .select('name')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  const existingNames = new Set((existingCounters ?? []).map((c) => c.name.toLowerCase()))

  // Create counters that don't already exist
  const newCounters = countersToCreate
    .filter((c) => !existingNames.has(c.name.toLowerCase()))
    .map((c, idx) => ({
      project_id: projectId,
      user_id: user.id,
      name: c.name,
      target_value: c.targetValue,
      current_value: 0,
      sort_order: idx,
    }))

  if (newCounters.length === 0) {
    return { created: 0, error: null }
  }

  const { error: insertError } = await supabase
    .from('counters')
    .insert(newCounters)

  if (insertError) {
    return { created: 0, error: 'Failed to create counters.' }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/counters`)
  return { created: newCounters.length, error: null }
}

/**
 * Update a pattern's difficulty based on analysis.
 */
export async function updatePatternDifficulty(
  patternId: string
): Promise<{ difficulty: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { difficulty: null, error: 'Not authenticated' }

  const { data: pattern } = await supabase
    .from('patterns')
    .select('instructions')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (!pattern?.instructions) {
    return { difficulty: null, error: 'Pattern has no instructions.' }
  }

  const analysis = parsePattern(pattern.instructions)
  return { difficulty: analysis.difficulty, error: null }
}
