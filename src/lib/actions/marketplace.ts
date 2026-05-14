'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PublishedPattern, SellerProfile, PatternReview } from '@/types/marketplace'

// ─── Public browsing (no auth required) ──────────────────────────────────────

/**
 * Fetch published patterns for the marketplace.
 * Supports search, category filter, and sorting.
 */
export async function getMarketplacePatterns(opts?: {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'popular' | 'price_low' | 'price_high' | 'rating'
  limit?: number
  offset?: number
}): Promise<{ data: PublishedPattern[]; total: number; error: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('patterns')
    .select('*', { count: 'exact' })
    .eq('is_published', true)

  if (opts?.search) {
    query = query.or(`title.ilike.%${opts.search}%,preview_description.ilike.%${opts.search}%,tags.cs.{${opts.search}}`)
  }

  if (opts?.category) {
    query = query.eq('category', opts.category)
  }

  if (opts?.minPrice !== undefined) {
    query = query.gte('price', opts.minPrice)
  }

  if (opts?.maxPrice !== undefined) {
    query = query.lte('price', opts.maxPrice)
  }

  // Sorting
  switch (opts?.sort) {
    case 'popular':
      query = query.order('purchase_count', { ascending: false })
      break
    case 'price_low':
      query = query.order('price', { ascending: true, nullsFirst: true })
      break
    case 'price_high':
      query = query.order('price', { ascending: false })
      break
    case 'rating':
      query = query.order('view_count', { ascending: false }) // proxy for now
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const limit = opts?.limit ?? 20
  const offset = opts?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return { data: [], total: 0, error: 'Failed to fetch patterns.' }
  }

  return { data: (data ?? []) as unknown as PublishedPattern[], total: count ?? 0, error: null }
}

/**
 * Fetch a single published pattern by slug.
 */
export async function getMarketplacePattern(slug: string): Promise<{
  data: PublishedPattern | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patterns')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) {
    return { data: null, error: 'Pattern not found.' }
  }

  // Increment view count
  await supabase
    .from('patterns')
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq('id', data.id)

  return { data: data as unknown as PublishedPattern, error: null }
}

/**
 * Fetch reviews for a pattern.
 */
export async function getPatternReviews(patternId: string): Promise<{
  data: PatternReview[]
  averageRating: number | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pattern_reviews')
    .select('*')
    .eq('pattern_id', patternId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: [], averageRating: null, error: 'Failed to fetch reviews.' }
  }

  const reviews = data ?? []
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : null

  return { data: reviews as PatternReview[], averageRating, error: null }
}

// ─── Seller actions (auth required) ──────────────────────────────────────────

/**
 * Get or create seller profile for the current user.
 */
export async function getSellerProfile(): Promise<{
  data: SellerProfile | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // No profile yet
    return { data: null, error: null }
  }

  if (error) return { data: null, error: 'Failed to fetch profile.' }
  return { data: data as SellerProfile, error: null }
}

/**
 * Create or update seller profile.
 */
export async function upsertSellerProfile(formData: FormData): Promise<{
  data: SellerProfile | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const displayName = (formData.get('display_name') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim() || null

  if (!displayName) {
    return { data: null, error: 'Display name is required.' }
  }

  // Generate slug from display name
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('seller_profiles')
    .upsert({
      user_id: user.id,
      display_name: displayName,
      slug,
      bio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'That display name is already taken. Please choose another.' }
    }
    return { data: null, error: 'Failed to save profile.' }
  }

  revalidatePath('/marketplace/seller')
  return { data: data as SellerProfile, error: null }
}

/**
 * Publish a pattern to the marketplace.
 */
export async function publishPattern(
  patternId: string,
  opts: { price: number | null; previewDescription: string; tags: string[] }
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: pattern } = await supabase
    .from('patterns')
    .select('id, title, user_id')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (!pattern) return { error: 'Pattern not found.' }

  // Check seller profile exists — create one automatically if not
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!seller) {
    // Auto-create a basic seller profile
    await supabase.from('seller_profiles').insert({
      user_id: user.id,
      display_name: pattern.title.split(' ')[0] + ' Designs',
      slug: user.id.slice(0, 8),
    })
  }

  // Generate slug
  const slug = pattern.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + pattern.id.slice(0, 8)

  const { error } = await supabase
    .from('patterns')
    .update({
      is_published: true,
      price: opts.price,
      preview_description: opts.previewDescription,
      tags: opts.tags,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patternId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to publish pattern.' }

  revalidatePath('/marketplace')
  revalidatePath(`/patterns/${patternId}`)
  return { error: null }
}

/**
 * Unpublish a pattern (remove from marketplace).
 */
export async function unpublishPattern(patternId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('patterns')
    .update({
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patternId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to unpublish pattern.' }

  revalidatePath('/marketplace')
  revalidatePath(`/patterns/${patternId}`)
  return { error: null }
}

// ─── Buyer actions ───────────────────────────────────────────────────────────

/**
 * "Purchase" a free pattern (add to library).
 */
export async function acquireFreePattern(patternId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify pattern is published and free
  const { data: pattern } = await supabase
    .from('patterns')
    .select('id, user_id, price, is_published')
    .eq('id', patternId)
    .eq('is_published', true)
    .single()

  if (!pattern) return { error: 'Pattern not found.' }
  if (pattern.price && pattern.price > 0) return { error: 'This pattern requires payment.' }

  // Create purchase record
  const { error } = await supabase
    .from('pattern_purchases')
    .insert({
      buyer_id: user.id,
      pattern_id: patternId,
      seller_id: pattern.user_id,
      amount: 0,
      commission: 0,
      currency: 'GBP',
      status: 'completed',
    })

  if (error) {
    if (error.code === '23505') return { error: null } // Already acquired
    return { error: 'Failed to add pattern to library.' }
  }

  // Increment purchase count
  await supabase
    .from('patterns')
    .update({ purchase_count: (pattern as unknown as { purchase_count: number }).purchase_count + 1 })
    .eq('id', patternId)

  revalidatePath('/marketplace/library')
  return { error: null }
}

/**
 * Get user's purchased/acquired patterns (library).
 */
export async function getMyLibrary(): Promise<{
  data: Array<{ pattern_id: string; title: string; type: string; created_at: string }>
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('pattern_purchases')
    .select('pattern_id, created_at, patterns(title, type)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: 'Failed to fetch library.' }

  const library = (data ?? []).map((p) => ({
    pattern_id: p.pattern_id,
    title: (p.patterns as unknown as { title: string })?.title ?? 'Unknown',
    type: (p.patterns as unknown as { type: string })?.type ?? 'written',
    created_at: p.created_at,
  }))

  return { data: library, error: null }
}

/**
 * Submit a review for a purchased pattern.
 */
export async function submitReview(
  patternId: string,
  rating: number,
  comment: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (rating < 1 || rating > 5) return { error: 'Rating must be 1-5.' }

  // Verify user has purchased this pattern
  const { data: purchase } = await supabase
    .from('pattern_purchases')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('pattern_id', patternId)
    .single()

  if (!purchase) return { error: 'You must own this pattern to review it.' }

  const { error } = await supabase
    .from('pattern_reviews')
    .upsert({
      pattern_id: patternId,
      reviewer_id: user.id,
      rating,
      comment: comment?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'pattern_id,reviewer_id' })

  if (error) return { error: 'Failed to submit review.' }

  revalidatePath(`/marketplace/${patternId}`)
  return { error: null }
}

/**
 * Report a pattern for content moderation.
 */
export async function reportPattern(
  patternId: string,
  reason: string,
  details: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const validReasons = ['copyright', 'inappropriate', 'spam', 'misleading', 'other']
  if (!validReasons.includes(reason)) return { error: 'Invalid reason.' }

  const { error } = await supabase
    .from('pattern_reports')
    .insert({
      pattern_id: patternId,
      reporter_id: user.id,
      reason,
      details: details?.trim() || null,
    })

  if (error) return { error: 'Failed to submit report.' }
  return { error: null }
}
