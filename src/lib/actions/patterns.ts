'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { patternFormSchema, patternUpdateSchema } from '@/lib/validators/pattern'
import type { Pattern, PatternVersion } from '@/types/database'

export type PatternActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  patternId?: string
} | null

/**
 * Create a new pattern for the authenticated user.
 * Accepts FormData for use with useActionState.
 */
export async function createPattern(
  _prevState: PatternActionState,
  formData: FormData
): Promise<PatternActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create a pattern.' }
  }

  const rawData: Record<string, unknown> = {
    title: formData.get('title') as string,
    type: formData.get('type') as string,
    introduction: (formData.get('introduction') as string) || undefined,
    materials_list: (formData.get('materials_list') as string) || undefined,
    hook_size: (formData.get('hook_size') as string) || undefined,
    yarn_info: (formData.get('yarn_info') as string) || undefined,
    gauge: (formData.get('gauge') as string) || undefined,
    abbreviations: (formData.get('abbreviations') as string) || undefined,
    instructions: (formData.get('instructions') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  }

  const result = patternFormSchema.safeParse(rawData)

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

  // Handle file upload for uploaded type
  let filePath: string | null = null
  let fileName: string | null = null

  if (validated.type === 'uploaded') {
    filePath = (formData.get('file_path') as string) || null
    fileName = (formData.get('file_name') as string) || null
  }

  const { data, error } = await supabase
    .from('patterns')
    .insert({
      user_id: user.id,
      title: validated.title,
      type: validated.type,
      introduction: validated.introduction ?? null,
      materials_list: validated.materials_list ?? null,
      hook_size: validated.hook_size ?? null,
      yarn_info: validated.yarn_info ?? null,
      gauge: validated.gauge ?? null,
      abbreviations: validated.abbreviations ?? null,
      instructions: validated.instructions ?? null,
      notes: validated.notes ?? null,
      file_path: filePath,
      file_name: fileName,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'Failed to create pattern. Please try again.' }
  }

  revalidatePath('/patterns')
  return { patternId: data.id }
}

/**
 * Update an existing pattern.
 * Saves version history when instructions field changes.
 */
export async function updatePattern(
  id: string,
  _prevState: PatternActionState,
  formData: FormData
): Promise<PatternActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a pattern.' }
  }

  // Fetch existing pattern to compare instructions
  const { data: existing, error: fetchError } = await supabase
    .from('patterns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Pattern not found.' }
  }

  const rawData: Record<string, unknown> = {}

  const title = formData.get('title') as string
  if (title && title.trim() !== '') rawData.title = title

  const type = formData.get('type') as string
  if (type) rawData.type = type

  const introduction = formData.get('introduction') as string
  if (introduction !== null && introduction !== undefined) rawData.introduction = introduction || undefined

  const materialsList = formData.get('materials_list') as string
  if (materialsList !== null && materialsList !== undefined) rawData.materials_list = materialsList || undefined

  const hookSize = formData.get('hook_size') as string
  if (hookSize !== null && hookSize !== undefined) rawData.hook_size = hookSize || undefined

  const yarnInfo = formData.get('yarn_info') as string
  if (yarnInfo !== null && yarnInfo !== undefined) rawData.yarn_info = yarnInfo || undefined

  const gauge = formData.get('gauge') as string
  if (gauge !== null && gauge !== undefined) rawData.gauge = gauge || undefined

  const abbreviations = formData.get('abbreviations') as string
  if (abbreviations !== null && abbreviations !== undefined) rawData.abbreviations = abbreviations || undefined

  const instructions = formData.get('instructions') as string
  if (instructions !== null && instructions !== undefined) rawData.instructions = instructions || undefined

  const notes = formData.get('notes') as string
  if (notes !== null && notes !== undefined) rawData.notes = notes || undefined

  const result = patternUpdateSchema.safeParse(rawData)

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

  // Check if instructions changed — save version history
  const newInstructions = validated.instructions
  if (
    newInstructions !== undefined &&
    newInstructions !== null &&
    newInstructions !== existing.instructions
  ) {
    // Get the current max version number
    const { data: versions } = await supabase
      .from('pattern_versions')
      .select('version_number')
      .eq('pattern_id', id)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1

    await supabase.from('pattern_versions').insert({
      pattern_id: id,
      user_id: user.id,
      instructions: newInstructions,
      version_number: nextVersion,
    })
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (validated.title !== undefined) updatePayload.title = validated.title
  if (validated.type !== undefined) updatePayload.type = validated.type
  if (validated.introduction !== undefined) updatePayload.introduction = validated.introduction ?? null
  if (validated.materials_list !== undefined) updatePayload.materials_list = validated.materials_list ?? null
  if (validated.hook_size !== undefined) updatePayload.hook_size = validated.hook_size ?? null
  if (validated.yarn_info !== undefined) updatePayload.yarn_info = validated.yarn_info ?? null
  if (validated.gauge !== undefined) updatePayload.gauge = validated.gauge ?? null
  if (validated.abbreviations !== undefined) updatePayload.abbreviations = validated.abbreviations ?? null
  if (validated.instructions !== undefined) updatePayload.instructions = validated.instructions ?? null
  if (validated.notes !== undefined) updatePayload.notes = validated.notes ?? null

  const { error } = await supabase
    .from('patterns')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update pattern. Please try again.' }
  }

  revalidatePath('/patterns')
  revalidatePath(`/patterns/${id}`)
  return null
}

/**
 * Delete a pattern and all associated versions.
 */
export async function deletePattern(id: string): Promise<PatternActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a pattern.' }
  }

  // Delete associated pattern versions first
  await supabase.from('pattern_versions').delete().eq('pattern_id', id)

  // Unlink from any projects
  await supabase
    .from('projects')
    .update({ pattern_id: null })
    .eq('pattern_id', id)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('patterns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete pattern. Please try again.' }
  }

  revalidatePath('/patterns')
  return null
}

/**
 * Fetch all patterns for the authenticated user.
 */
export async function getPatterns(): Promise<{
  data: Pattern[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view patterns.' }
  }

  const { data, error } = await supabase
    .from('patterns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: 'Failed to fetch patterns.' }
  }

  return { data, error: null }
}

/**
 * Fetch a single pattern by ID with its version history.
 */
export async function getPattern(id: string): Promise<{
  data: (Pattern & { pattern_versions: PatternVersion[] }) | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this pattern.' }
  }

  const { data, error } = await supabase
    .from('patterns')
    .select('*, pattern_versions(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Pattern not found.' }
  }

  return { data, error: null }
}

/**
 * Link a pattern to a project.
 */
export async function linkPatternToProject(
  patternId: string,
  projectId: string
): Promise<PatternActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to link a pattern to a project.' }
  }

  // Verify pattern belongs to user
  const { data: pattern, error: patternError } = await supabase
    .from('patterns')
    .select('id')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (patternError || !pattern) {
    return { error: 'Pattern not found.' }
  }

  // Verify project belongs to user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return { error: 'Project not found.' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ pattern_id: patternId })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to link pattern to project. Please try again.' }
  }

  revalidatePath('/patterns')
  revalidatePath(`/patterns/${patternId}`)
  revalidatePath(`/projects/${projectId}`)
  return null
}
