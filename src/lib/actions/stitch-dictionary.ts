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
