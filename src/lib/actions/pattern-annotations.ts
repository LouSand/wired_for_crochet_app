'use server'

import { createClient } from '@/lib/supabase/server'
import type { AnnotationStroke } from '@/types/database'

/**
 * Fetch annotations for a specific project + pattern + page.
 */
export async function getAnnotations(
  projectId: string,
  patternId: string,
  pageNumber: number
): Promise<{ data: AnnotationStroke[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_annotations')
    .select('annotation_data')
    .eq('project_id', projectId)
    .eq('pattern_id', patternId)
    .eq('page_number', pageNumber)
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { data: null, error: 'Failed to fetch annotations' }
  }

  return { data: (data?.annotation_data as AnnotationStroke[]) ?? [], error: null }
}

/**
 * Fetch all annotations for a project + pattern (all pages).
 */
export async function getAllAnnotations(
  projectId: string,
  patternId: string
): Promise<{ data: Record<number, AnnotationStroke[]> | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_annotations')
    .select('page_number, annotation_data')
    .eq('project_id', projectId)
    .eq('pattern_id', patternId)
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: 'Failed to fetch annotations' }
  }

  const result: Record<number, AnnotationStroke[]> = {}
  for (const row of data ?? []) {
    result[row.page_number] = row.annotation_data as AnnotationStroke[]
  }

  return { data: result, error: null }
}

/**
 * Save annotations for a specific page (upsert).
 */
export async function saveAnnotations(
  projectId: string,
  patternId: string,
  pageNumber: number,
  annotations: AnnotationStroke[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pattern_annotations')
    .upsert(
      {
        project_id: projectId,
        pattern_id: patternId,
        user_id: user.id,
        page_number: pageNumber,
        annotation_data: annotations as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,pattern_id,page_number' }
    )

  if (error) {
    return { error: 'Failed to save annotations' }
  }

  return { error: null }
}

/**
 * Delete all annotations for a project + pattern (used when discarding on project finish).
 */
export async function deleteAllAnnotations(
  projectId: string,
  patternId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('pattern_annotations')
    .delete()
    .eq('project_id', projectId)
    .eq('pattern_id', patternId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete annotations' }
  }

  return { error: null }
}
