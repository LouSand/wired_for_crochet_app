'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Note } from '@/types/database'

export type NoteActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

export type NoteCategory = 'general' | 'remember_next_time' | 'pattern_alteration'

const VALID_CATEGORIES: NoteCategory[] = ['general', 'remember_next_time', 'pattern_alteration']

/**
 * Create a new note for a project.
 * Uses the prevState pattern for useActionState compatibility.
 */
export async function createNote(
  projectId: string,
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create notes.' }
  }

  const content = (formData.get('content') as string)?.trim()
  const category = (formData.get('category') as string) || 'general'

  // Validate content
  if (!content) {
    return { fieldErrors: { content: ['Note content is required.'] } }
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category as NoteCategory)) {
    return { fieldErrors: { category: ['Invalid category.'] } }
  }

  const { error } = await supabase
    .from('notes')
    .insert({
      project_id: projectId,
      user_id: user.id,
      content,
      category,
    })

  if (error) {
    return { error: 'Failed to create note. Please try again.' }
  }

  revalidatePath(`/projects/${projectId}/notes`)
  return null
}

/**
 * Update an existing note's content and/or category.
 */
export async function updateNote(
  noteId: string,
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update notes.' }
  }

  // Verify note exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('notes')
    .select('id, project_id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Note not found.' }
  }

  const content = (formData.get('content') as string)?.trim()
  const category = (formData.get('category') as string) || 'general'

  // Validate content
  if (!content) {
    return { fieldErrors: { content: ['Note content is required.'] } }
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category as NoteCategory)) {
    return { fieldErrors: { category: ['Invalid category.'] } }
  }

  const { error } = await supabase
    .from('notes')
    .update({
      content,
      category,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update note. Please try again.' }
  }

  revalidatePath(`/projects/${existing.project_id}/notes`)
  return null
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: string): Promise<NoteActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete notes.' }
  }

  // Fetch note to get project_id for revalidation
  const { data: note, error: fetchError } = await supabase
    .from('notes')
    .select('id, project_id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !note) {
    return { error: 'Note not found.' }
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete note. Please try again.' }
  }

  revalidatePath(`/projects/${note.project_id}/notes`)
  return null
}

/**
 * Fetch all notes for a project, optionally filtered by category.
 * Ordered by created_at DESC (newest first).
 */
export async function getNotes(
  projectId: string,
  category?: NoteCategory
): Promise<{
  data: Note[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view notes.' }
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch notes.' }
  }

  return { data, error: null }
}
