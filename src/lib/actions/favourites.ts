'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleFavourite(patternId: string): Promise<{ isFavourite: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isFavourite: false, error: 'Not authenticated' }

  // Check if already favourited
  const { data: existing } = await supabase
    .from('pattern_favourites')
    .select('id')
    .eq('user_id', user.id)
    .eq('pattern_id', patternId)
    .single()

  if (existing) {
    // Remove favourite
    await supabase.from('pattern_favourites').delete().eq('id', existing.id)
    revalidatePath('/patterns')
    return { isFavourite: false, error: null }
  } else {
    // Add favourite
    const { error } = await supabase.from('pattern_favourites').insert({
      user_id: user.id,
      pattern_id: patternId,
    })
    if (error) return { isFavourite: false, error: 'Failed to save favourite.' }
    revalidatePath('/patterns')
    return { isFavourite: true, error: null }
  }
}

export async function getFavourites(): Promise<{ data: string[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_favourites')
    .select('pattern_id')
    .eq('user_id', user.id)

  if (error) return { data: [], error: 'Failed to fetch favourites.' }
  return { data: (data ?? []).map((f) => f.pattern_id), error: null }
}

export async function getFavouritePatterns(): Promise<{
  data: Array<{ id: string; title: string; type: string; category: string | null; hook_size: string | null }>
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_favourites')
    .select('patterns(id, title, type, category, hook_size)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch favourites.' }

  const patterns = (data ?? []).map((f) => {
    const p = f.patterns as unknown as { id: string; title: string; type: string; category: string | null; hook_size: string | null }
    return p
  }).filter(Boolean)

  return { data: patterns, error: null }
}

/**
 * Feature 9: Share wishlist with friends
 * Generates a URL with the user's favourited pattern IDs encoded.
 */
export async function getShareableWishlistUrl(): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_favourites')
    .select('pattern_id')
    .eq('user_id', user.id)

  if (error) return { url: null, error: 'Failed to fetch favourites.' }

  const patternIds = (data ?? []).map((f) => f.pattern_id)

  if (patternIds.length === 0) {
    return { url: null, error: 'No patterns in your wishlist to share.' }
  }

  // Encode pattern IDs as a base64 string for a compact URL
  const encoded = Buffer.from(JSON.stringify(patternIds)).toString('base64url')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wiredfor.crochet'
  const url = `${baseUrl}/wishlist/shared?ids=${encoded}`

  return { url, error: null }
}
