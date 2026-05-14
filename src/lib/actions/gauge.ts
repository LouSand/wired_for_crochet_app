'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface GaugeSwatch {
  id: string
  user_id: string
  hook_size: string
  yarn_weight: string | null
  yarn_name: string | null
  stitches_per_4in: number
  rows_per_4in: number | null
  notes: string | null
  created_at: string
}

export async function getGaugeSwatches(): Promise<{ data: GaugeSwatch[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('gauge_swatches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch swatches.' }
  return { data: (data ?? []) as GaugeSwatch[], error: null }
}

export async function saveGaugeSwatch(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const hookSize = (formData.get('hook_size') as string)?.trim()
  const stitchesPer4in = parseFloat(formData.get('stitches_per_4in') as string)
  const rowsPer4in = formData.get('rows_per_4in') as string
  const yarnWeight = (formData.get('yarn_weight') as string)?.trim() || null
  const yarnName = (formData.get('yarn_name') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!hookSize || isNaN(stitchesPer4in)) {
    return { error: 'Hook size and stitches per 4 inches are required.' }
  }

  const { error } = await supabase.from('gauge_swatches').insert({
    user_id: user.id,
    hook_size: hookSize,
    stitches_per_4in: stitchesPer4in,
    rows_per_4in: rowsPer4in ? parseFloat(rowsPer4in) : null,
    yarn_weight: yarnWeight,
    yarn_name: yarnName,
    notes,
  })

  if (error) return { error: 'Failed to save swatch.' }
  revalidatePath('/tools')
  return { error: null }
}

export async function deleteGaugeSwatch(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('gauge_swatches').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/tools')
  return { error: null }
}
