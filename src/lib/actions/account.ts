'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AccountActionState = {
  error?: string
  message?: string
} | null

/**
 * Delete all user data and sign out.
 *
 * Deletes data in dependency order to respect foreign key constraints:
 * 1. pricing_extras (depends on projects)
 * 2. notes (depends on projects)
 * 3. progress_photos (depends on projects) + remove from storage
 * 4. yarn_usages (depends on yarn_entries and projects)
 * 5. hook_usages (depends on hook_entries and projects)
 * 6. counters (depends on projects)
 * 7. time_sessions (depends on projects)
 * 8. pattern_versions (depends on patterns)
 * 9. patterns (may be referenced by projects)
 * 10. projects (depends on patterns via pattern_id)
 * 11. yarn_entries
 * 12. hook_entries
 * 13. user_settings
 *
 * Note: The auth user record itself cannot be deleted from the client.
 * After data deletion, the user is signed out. The auth record can be
 * cleaned up via Supabase dashboard or a scheduled edge function.
 */
export async function deleteAccount(): Promise<AccountActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete your account.' }
  }

  const userId = user.id

  try {
    // 1. Delete pricing_extras
    const { error: pricingError } = await supabase
      .from('pricing_extras')
      .delete()
      .eq('user_id', userId)
    if (pricingError) throw new Error(`Failed to delete pricing extras: ${pricingError.message}`)

    // 2. Delete notes
    const { error: notesError } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', userId)
    if (notesError) throw new Error(`Failed to delete notes: ${notesError.message}`)

    // 3. Delete progress_photos and remove files from storage
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('file_path')
      .eq('user_id', userId)

    if (photos && photos.length > 0) {
      const filePaths = photos.map((p) => p.file_path)
      await supabase.storage.from('progress-photos').remove(filePaths)
    }

    const { error: photosError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('user_id', userId)
    if (photosError) throw new Error(`Failed to delete photos: ${photosError.message}`)

    // 4. Delete yarn_usages
    const { error: yarnUsagesError } = await supabase
      .from('yarn_usages')
      .delete()
      .eq('user_id', userId)
    if (yarnUsagesError) throw new Error(`Failed to delete yarn usages: ${yarnUsagesError.message}`)

    // 5. Delete hook_usages
    const { error: hookUsagesError } = await supabase
      .from('hook_usages')
      .delete()
      .eq('user_id', userId)
    if (hookUsagesError) throw new Error(`Failed to delete hook usages: ${hookUsagesError.message}`)

    // 6. Delete counters
    const { error: countersError } = await supabase
      .from('counters')
      .delete()
      .eq('user_id', userId)
    if (countersError) throw new Error(`Failed to delete counters: ${countersError.message}`)

    // 7. Delete time_sessions
    const { error: sessionsError } = await supabase
      .from('time_sessions')
      .delete()
      .eq('user_id', userId)
    if (sessionsError) throw new Error(`Failed to delete time sessions: ${sessionsError.message}`)

    // 8. Delete pattern_versions
    const { error: versionsError } = await supabase
      .from('pattern_versions')
      .delete()
      .eq('user_id', userId)
    if (versionsError) throw new Error(`Failed to delete pattern versions: ${versionsError.message}`)

    // 9. First unlink patterns from projects, then delete patterns
    await supabase
      .from('projects')
      .update({ pattern_id: null })
      .eq('user_id', userId)

    const { error: patternsError } = await supabase
      .from('patterns')
      .delete()
      .eq('user_id', userId)
    if (patternsError) throw new Error(`Failed to delete patterns: ${patternsError.message}`)

    // 10. Delete projects
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
    if (projectsError) throw new Error(`Failed to delete projects: ${projectsError.message}`)

    // 11. Delete yarn_entries
    const { error: yarnError } = await supabase
      .from('yarn_entries')
      .delete()
      .eq('user_id', userId)
    if (yarnError) throw new Error(`Failed to delete yarn entries: ${yarnError.message}`)

    // 12. Delete hook_entries
    const { error: hooksError } = await supabase
      .from('hook_entries')
      .delete()
      .eq('user_id', userId)
    if (hooksError) throw new Error(`Failed to delete hook entries: ${hooksError.message}`)

    // 13. Delete user_settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId)
    if (settingsError) throw new Error(`Failed to delete user settings: ${settingsError.message}`)

    // Sign out the user
    await supabase.auth.signOut()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { error: `Account deletion failed: ${message}` }
  }

  redirect('/login')
}
