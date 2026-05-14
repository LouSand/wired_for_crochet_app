'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface SharedProject {
  id: string
  user_id: string
  project_id: string
  photo_path: string | null
  caption: string | null
  pattern_id: string | null
  craft_type: string | null
  yarn_used: string | null
  time_taken_seconds: number | null
  is_public: boolean
  likes_count: number
  created_at: string
}

export async function getInspirationGallery(opts?: {
  craft_type?: string
  limit?: number
  offset?: number
}): Promise<{ data: SharedProject[]; error: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('shared_projects')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (opts?.craft_type) query = query.eq('craft_type', opts.craft_type)

  const limit = opts?.limit ?? 20
  const offset = opts?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) return { data: [], error: 'Failed to fetch gallery.' }
  return { data: (data ?? []) as SharedProject[], error: null }
}

export async function shareProject(
  projectId: string,
  caption: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('id, pattern_id, craft_type')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return { error: 'Project not found.' }

  // Get total time
  const { data: sessions } = await supabase
    .from('time_sessions')
    .select('start_time, end_time')
    .eq('project_id', projectId)
    .not('end_time', 'is', null)

  const totalSeconds = (sessions ?? []).reduce((sum, s) => {
    return sum + Math.round((new Date(s.end_time!).getTime() - new Date(s.start_time).getTime()) / 1000)
  }, 0)

  // Get first progress photo
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('file_path')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  const { error } = await supabase.from('shared_projects').upsert({
    user_id: user.id,
    project_id: projectId,
    caption,
    pattern_id: project.pattern_id,
    craft_type: project.craft_type,
    photo_path: photos?.[0]?.file_path ?? null,
    time_taken_seconds: totalSeconds > 0 ? totalSeconds : null,
    is_public: true,
  }, { onConflict: 'project_id' })

  if (error) return { error: 'Failed to share project.' }
  revalidatePath('/inspiration')
  return { error: null }
}

export async function toggleLike(sharedProjectId: string): Promise<{ liked: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('inspiration_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('shared_project_id', sharedProjectId)
    .single()

  if (existing) {
    await supabase.from('inspiration_likes').delete().eq('id', existing.id)
    await supabase.from('shared_projects').update({ likes_count: Math.max(0, -1) }).eq('id', sharedProjectId)
    return { liked: false, error: null }
  } else {
    await supabase.from('inspiration_likes').insert({ user_id: user.id, shared_project_id: sharedProjectId })
    return { liked: true, error: null }
  }
}
