'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/lib/supabase/storage'
import { validateFile, sanitizeFileName } from '@/lib/validators/file'
import type { ProgressPhoto } from '@/types/database'

const BUCKET = 'progress-photos'

export type PhotoActionState = {
  error?: string
} | null

export type PhotoWithUrl = ProgressPhoto & { url: string | null }

/**
 * Upload a photo to a project.
 * Validates the file, uploads to Supabase Storage, and saves metadata to progress_photos table.
 */
export async function uploadPhoto(
  projectId: string,
  formData: FormData
): Promise<{ data: PhotoWithUrl | null; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to upload photos.' }
  }

  const file = formData.get('file') as File | null

  if (!file || file.size === 0) {
    return { data: null, error: 'No file provided.' }
  }

  // Validate file type and size
  const validation = validateFile(
    { type: file.type, size: file.size },
    'photo'
  )

  if (!validation.valid) {
    return { data: null, error: validation.error ?? 'Invalid file.' }
  }

  // Sanitize file name and build storage path
  const sanitizedName = sanitizeFileName(file.name)
  const storagePath = `${user.id}/${projectId}/${Date.now()}-${sanitizedName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { data: null, error: 'Failed to upload photo. Please try again.' }
  }

  // Save metadata to progress_photos table
  const { data, error: insertError } = await supabase
    .from('progress_photos')
    .insert({
      project_id: projectId,
      user_id: user.id,
      file_path: storagePath,
      file_name: sanitizedName,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (insertError) {
    // Attempt to clean up the uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { data: null, error: 'Failed to save photo metadata. Please try again.' }
  }

  // Get signed URL for the uploaded photo
  const { url } = await getSignedUrl(BUCKET, storagePath)

  revalidatePath(`/projects/${projectId}/photos`)
  return { data: { ...data, url }, error: null }
}

/**
 * Delete a photo from a project.
 * Removes from storage and database.
 */
export async function deletePhoto(photoId: string): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete photos.' }
  }

  // Fetch the photo to get file_path and project_id
  const { data: photo, error: fetchError } = await supabase
    .from('progress_photos')
    .select('id, file_path, project_id')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return { error: 'Photo not found.' }
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photo.file_path])

  if (storageError) {
    return { error: 'Failed to delete photo file. Please try again.' }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (deleteError) {
    return { error: 'Failed to delete photo record. Please try again.' }
  }

  revalidatePath(`/projects/${photo.project_id}/photos`)
  return null
}

/**
 * Fetch all photos for a project, ordered by created_at ASC (chronological).
 * Returns photos with signed URLs.
 */
export async function getPhotos(projectId: string): Promise<{
  data: PhotoWithUrl[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view photos.' }
  }

  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch photos.' }
  }

  // Generate signed URLs for each photo
  const photosWithUrls: PhotoWithUrl[] = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { url } = await getSignedUrl(BUCKET, photo.file_path)
      return { ...photo, url }
    })
  )

  return { data: photosWithUrls, error: null }
}

/**
 * Update a photo's caption.
 */
export async function updatePhotoCaption(
  photoId: string,
  caption: string
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update photos.' }
  }

  // Fetch photo to get project_id for revalidation
  const { data: photo, error: fetchError } = await supabase
    .from('progress_photos')
    .select('id, project_id')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return { error: 'Photo not found.' }
  }

  const { error } = await supabase
    .from('progress_photos')
    .update({ caption: caption || null })
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update caption. Please try again.' }
  }

  revalidatePath(`/projects/${photo.project_id}/photos`)
  return null
}

/**
 * Mark or unmark a photo as the final project photo.
 */
export async function markPhotoAsFinal(
  photoId: string,
  isFinal: boolean
): Promise<PhotoActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update photos.' }
  }

  // Fetch photo to get project_id for revalidation
  const { data: photo, error: fetchError } = await supabase
    .from('progress_photos')
    .select('id, project_id')
    .eq('id', photoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !photo) {
    return { error: 'Photo not found.' }
  }

  const { error } = await supabase
    .from('progress_photos')
    .update({ is_final: isFinal })
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update photo. Please try again.' }
  }

  revalidatePath(`/projects/${photo.project_id}/photos`)
  return null
}
