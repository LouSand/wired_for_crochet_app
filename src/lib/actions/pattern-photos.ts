'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PatternPhoto } from '@/types/pattern-photo'

export type PatternPhotoActionState = {
  error?: string
} | null

/**
 * Fetch all photos for a pattern, ordered by sort_order.
 */
export async function getPatternPhotos(patternId: string): Promise<{
  data: PatternPhoto[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  const { data, error } = await supabase
    .from('pattern_photos')
    .select('*')
    .eq('pattern_id', patternId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch pattern photos.' }
  }

  return { data: data as PatternPhoto[], error: null }
}

/**
 * Save a pattern photo record after the file has been uploaded to storage.
 * Called from the client after successful upload.
 */
export async function savePatternPhoto(
  patternId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  caption?: string
): Promise<{ data: PatternPhoto | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  // Verify pattern ownership
  const { data: pattern } = await supabase
    .from('patterns')
    .select('id')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (!pattern) {
    return { data: null, error: 'Pattern not found.' }
  }

  // Get next sort order
  const { data: existing } = await supabase
    .from('pattern_photos')
    .select('sort_order')
    .eq('pattern_id', patternId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  // Check if this is the first photo (make it cover)
  const { count } = await supabase
    .from('pattern_photos')
    .select('id', { count: 'exact', head: true })
    .eq('pattern_id', patternId)

  const isCover = (count ?? 0) === 0

  const { data, error } = await supabase
    .from('pattern_photos')
    .insert({
      pattern_id: patternId,
      user_id: user.id,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      caption: caption || null,
      is_cover: isCover,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error || !data) {
    return { data: null, error: 'Failed to save photo record.' }
  }

  revalidatePath(`/patterns/${patternId}`)
  return { data: data as PatternPhoto, error: null }
}

/**
 * Delete a pattern photo (record + storage file).
 */
export async function deletePatternPhoto(
  photoId: string,
  patternId: string
): Promise<PatternPhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  // Fetch the photo to get file_path
  const { data: photo, error: fetchError } = await supabase
    .from('pattern_photos')
    .select('id, file_path')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return { error: 'Photo not found.' }
  }

  // Delete from storage
  await supabase.storage.from('pattern-files').remove([photo.file_path])

  // Delete record
  const { error } = await supabase
    .from('pattern_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete photo.' }
  }

  revalidatePath(`/patterns/${patternId}`)
  return null
}

/**
 * Set a photo as the cover image for a pattern.
 */
export async function setCoverPhoto(
  photoId: string,
  patternId: string
): Promise<PatternPhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  // Unset all existing covers for this pattern
  await supabase
    .from('pattern_photos')
    .update({ is_cover: false })
    .eq('pattern_id', patternId)
    .eq('user_id', user.id)

  // Set the new cover
  const { error } = await supabase
    .from('pattern_photos')
    .update({ is_cover: true })
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to set cover photo.' }
  }

  revalidatePath(`/patterns/${patternId}`)
  return null
}
