'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { productFormSchema } from '@/lib/validators/business-product'
import { assertProTier } from './business-gate'
import type { ProductRow } from '@/types/business'

export type ProductActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

/**
 * Create a new product for the authenticated user.
 * Validates with productFormSchema and checks Pro tier.
 */
export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to add a product.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    description: (formData.get('description') as string) || '',
    sell_price: parseFloat((formData.get('sell_price') as string) || '0'),
    status: (formData.get('status') as string) || 'active',
    time_taken_minutes: (formData.get('time_taken_minutes') as string)
      ? parseInt(formData.get('time_taken_minutes') as string, 10)
      : null,
    wages_per_minute: (formData.get('wages_per_minute') as string)
      ? parseFloat(formData.get('wages_per_minute') as string)
      : null,
    profit_margin_percent: (formData.get('profit_margin_percent') as string)
      ? parseFloat(formData.get('profit_margin_percent') as string)
      : null,
  }

  const result = productFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase.from('products').insert({
    user_id: user.id,
    name: validated.name,
    description: validated.description || null,
    sell_price: validated.sell_price,
    status: validated.status,
    time_taken_minutes: validated.time_taken_minutes ?? null,
    wages_per_minute: validated.wages_per_minute ?? null,
    profit_margin_percent: validated.profit_margin_percent ?? null,
  })

  if (error) {
    return { error: 'Failed to create product. Please try again.' }
  }

  revalidatePath('/business/products')
  return null
}

/**
 * Update an existing product.
 * Validates, checks ownership, and updates.
 */
export async function updateProduct(
  id: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update a product.' }
  }

  // Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { error: 'Product not found.' }
  }

  const rawData = {
    name: (formData.get('name') as string) || '',
    description: (formData.get('description') as string) || '',
    sell_price: parseFloat((formData.get('sell_price') as string) || '0'),
    status: (formData.get('status') as string) || 'active',
    time_taken_minutes: (formData.get('time_taken_minutes') as string)
      ? parseInt(formData.get('time_taken_minutes') as string, 10)
      : null,
    wages_per_minute: (formData.get('wages_per_minute') as string)
      ? parseFloat(formData.get('wages_per_minute') as string)
      : null,
    profit_margin_percent: (formData.get('profit_margin_percent') as string)
      ? parseFloat(formData.get('profit_margin_percent') as string)
      : null,
  }

  const result = productFormSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase
    .from('products')
    .update({
      name: validated.name,
      description: validated.description || null,
      sell_price: validated.sell_price,
      status: validated.status,
      time_taken_minutes: validated.time_taken_minutes ?? null,
      wages_per_minute: validated.wages_per_minute ?? null,
      profit_margin_percent: validated.profit_margin_percent ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update product. Please try again.' }
  }

  revalidatePath('/business/products')
  revalidatePath(`/business/products/${id}`)
  return null
}

/**
 * Delete a product. Cascades to bom_line_items, sets product_id null on sales.
 */
export async function deleteProduct(id: string): Promise<ProductActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete a product.' }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to delete product. Please try again.' }
  }

  revalidatePath('/business/products')
  return null
}

/**
 * Fetch all products for the authenticated user.
 * Excludes discontinued products by default unless includeDiscontinued is true.
 */
export async function getProducts(includeDiscontinued?: boolean): Promise<{
  data: ProductRow[] | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view products.' }
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)

  if (!includeDiscontinued) {
    query = query.eq('status', 'active')
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return { data: null, error: 'Failed to fetch products.' }
  }

  return { data: data as ProductRow[], error: null }
}

/**
 * Link a product to a project via the product_projects junction table.
 */
export async function linkProductToProject(
  productId: string,
  projectId: string
): Promise<ProductActionState> {
  const tierCheck = await assertProTier()
  if (tierCheck) {
    return { error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to link a product to a project.' }
  }

  const { error } = await supabase.from('product_projects').insert({
    product_id: productId,
    project_id: projectId,
    user_id: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This product is already linked to this project.' }
    }
    return { error: 'Failed to link product to project. Please try again.' }
  }

  revalidatePath(`/business/products/${productId}`)
  return null
}

/**
 * Fetch a single product by ID.
 */
export async function getProduct(id: string): Promise<{
  data: ProductRow | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in to view this product.' }
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: 'Product not found.' }
  }

  return { data: data as ProductRow, error: null }
}
