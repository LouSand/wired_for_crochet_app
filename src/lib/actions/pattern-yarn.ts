'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PatternYarnRequirement } from '@/types/pattern-yarn'

export type YarnRequirementActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Fetch all yarn requirements for a pattern.
 */
export async function getPatternYarnRequirements(patternId: string): Promise<{
  data: PatternYarnRequirement[] | null
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
    .from('pattern_yarn_requirements')
    .select('*')
    .eq('pattern_id', patternId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) {
    return { data: null, error: 'Failed to fetch yarn requirements.' }
  }

  return { data: data as PatternYarnRequirement[], error: null }
}

/**
 * Add a yarn requirement to a pattern.
 */
export async function addPatternYarnRequirement(
  patternId: string,
  _prevState: YarnRequirementActionState,
  formData: FormData
): Promise<YarnRequirementActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  // Verify pattern ownership
  const { data: pattern } = await supabase
    .from('patterns')
    .select('id')
    .eq('id', patternId)
    .eq('user_id', user.id)
    .single()

  if (!pattern) {
    return { error: 'Pattern not found.' }
  }

  const yarnName = (formData.get('yarn_name') as string)?.trim()
  const colour = (formData.get('colour') as string)?.trim() || null
  const weightCategory = (formData.get('weight_category') as string)?.trim() || null
  const quantityStr = formData.get('quantity') as string
  const unit = (formData.get('unit') as string) || 'grams'
  const secondaryQuantityStr = formData.get('secondary_quantity') as string
  const secondaryUnit = (formData.get('secondary_unit') as string) || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!yarnName || yarnName.length === 0) {
    return { error: 'Yarn name is required.', fieldErrors: { yarn_name: ['Yarn name is required.'] } }
  }

  const quantity = parseFloat(quantityStr)
  if (isNaN(quantity) || quantity <= 0) {
    return { error: 'Quantity must be a positive number.', fieldErrors: { quantity: ['Must be a positive number.'] } }
  }

  let secondaryQuantity: number | null = null
  if (secondaryQuantityStr && secondaryQuantityStr.trim() !== '') {
    secondaryQuantity = parseFloat(secondaryQuantityStr)
    if (isNaN(secondaryQuantity) || secondaryQuantity <= 0) {
      return { error: 'Secondary quantity must be a positive number.', fieldErrors: { secondary_quantity: ['Must be a positive number.'] } }
    }
  }

  // Get next sort order
  const { data: existing } = await supabase
    .from('pattern_yarn_requirements')
    .select('sort_order')
    .eq('pattern_id', patternId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('pattern_yarn_requirements').insert({
    pattern_id: patternId,
    user_id: user.id,
    yarn_name: yarnName,
    colour,
    weight_category: weightCategory,
    quantity,
    unit,
    secondary_quantity: secondaryQuantity,
    secondary_unit: secondaryQuantity ? secondaryUnit : null,
    notes,
    sort_order: nextSortOrder,
  })

  if (error) {
    return { error: 'Failed to add yarn requirement. Please try again.' }
  }

  revalidatePath(`/patterns/${patternId}`)
  return null
}

/**
 * Remove a yarn requirement from a pattern.
 */
export async function removePatternYarnRequirement(
  requirementId: string,
  patternId: string
): Promise<YarnRequirementActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('pattern_yarn_requirements')
    .delete()
    .eq('id', requirementId)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to remove yarn requirement.' }
  }

  revalidatePath(`/patterns/${patternId}`)
  return null
}
