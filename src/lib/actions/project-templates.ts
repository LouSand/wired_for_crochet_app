'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ProjectTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  craft_type: string
  pattern_id: string | null
  counters: Array<{ name: string; target_value: number | null }>
  hooks: Array<{ size: string; note: string }>
  yarn: Array<{ name: string; colour: string; quantity: string }>
  settings: Record<string, unknown>
  created_at: string
}

export async function getTemplates(): Promise<{ data: ProjectTemplate[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('project_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch templates.' }
  return { data: (data ?? []) as ProjectTemplate[], error: null }
}

export async function saveAsTemplate(projectId: string, name: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch project data
  const { data: project } = await supabase
    .from('projects')
    .select('pattern_id, craft_type')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return { error: 'Project not found.' }

  // Fetch counters
  const { data: counters } = await supabase
    .from('counters')
    .select('name, target_value')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  // Fetch hooks
  const { data: hooks } = await supabase
    .from('hook_usages')
    .select('note, hook_entries(size)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  // Fetch yarn
  const { data: yarn } = await supabase
    .from('yarn_usages')
    .select('quantity_used, yarn_entries(name, colour)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)

  const { error } = await supabase.from('project_templates').insert({
    user_id: user.id,
    name,
    craft_type: project.craft_type ?? 'crochet',
    pattern_id: project.pattern_id,
    counters: (counters ?? []).map((c) => ({ name: c.name, target_value: c.target_value })),
    hooks: (hooks ?? []).map((h) => ({ size: (h.hook_entries as unknown as { size: string })?.size ?? '', note: h.note ?? '' })),
    yarn: (yarn ?? []).map((y) => {
      const entry = y.yarn_entries as unknown as { name: string; colour: string } | null
      return { name: entry?.name ?? '', colour: entry?.colour ?? '', quantity: String(y.quantity_used) }
    }),
  })

  if (error) return { error: 'Failed to save template.' }
  revalidatePath('/patterns')
  return { error: null }
}

export async function deleteTemplate(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('project_templates').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/patterns')
  return { error: null }
}
