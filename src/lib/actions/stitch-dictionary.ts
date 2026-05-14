'use server'

import { createClient } from '@/lib/supabase/server'

export interface Stitch {
  id: string
  name_uk: string
  name_us: string
  abbreviation_uk: string | null
  abbreviation_us: string | null
  craft_type: 'crochet' | 'knitting' | 'both'
  category: string | null
  description: string | null
  instructions: string | null
  difficulty: string | null
  is_system: boolean
}

export async function getStitches(opts?: {
  craft_type?: 'crochet' | 'knitting'
  category?: string
  search?: string
}): Promise<{ data: Stitch[]; error: string | null }> {
  const supabase = await createClient()

  let query = supabase.from('stitch_dictionary').select('*').order('name_uk')

  if (opts?.craft_type) {
    query = query.or(`craft_type.eq.${opts.craft_type},craft_type.eq.both`)
  }
  if (opts?.category) {
    query = query.eq('category', opts.category)
  }
  if (opts?.search) {
    query = query.or(`name_uk.ilike.%${opts.search}%,name_us.ilike.%${opts.search}%,abbreviation_uk.ilike.%${opts.search}%,abbreviation_us.ilike.%${opts.search}%`)
  }

  const { data, error } = await query
  if (error) return { data: [], error: 'Failed to fetch stitches.' }
  return { data: (data ?? []) as Stitch[], error: null }
}

export async function addCustomStitch(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name_uk = (formData.get('name_uk') as string)?.trim()
  const name_us = (formData.get('name_us') as string)?.trim()
  const abbreviation = (formData.get('abbreviation') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const craft_type = (formData.get('craft_type') as string)?.trim() || 'crochet'
  const category = (formData.get('category') as string)?.trim() || null

  if (!name_uk || !name_us) return { error: 'UK and US names are required.' }

  const { error } = await supabase.from('stitch_dictionary').insert({
    name_uk,
    name_us,
    abbreviation_uk: abbreviation,
    abbreviation_us: abbreviation,
    craft_type,
    category,
    description,
    is_system: false,
    user_id: user.id,
  })

  if (error) return { error: 'Failed to add stitch.' }
  return { error: null }
}
