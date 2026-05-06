'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { businessProfileSchema } from '@/lib/validators/business-profile'
import { assertProPlusTier } from './business-gate'
import type { BusinessProfile, ProfileActionState } from '@/types/invoicing'

/**
 * Fetch the business profile for the authenticated user.
 * Returns the parsed BusinessProfile from user_settings.business_profile JSONB, or null.
 */
export async function getBusinessProfile(): Promise<{
  data: BusinessProfile | null
  error: string | null
}> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { data: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'You must be logged in.' }
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('business_profile')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { data: null, error: null }
  }

  if (!data.business_profile) {
    return { data: null, error: null }
  }

  return { data: data.business_profile as BusinessProfile, error: null }
}

/**
 * Update the business profile for the authenticated user.
 * Validates with businessProfileSchema, then updates user_settings.business_profile JSONB.
 */
export async function updateBusinessProfile(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { success: false, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in.' }
  }

  const rawData = {
    company_name: (formData.get('company_name') as string) || '',
    address: (formData.get('address') as string) || '',
    phone: (formData.get('phone') as string) || '',
    email: (formData.get('email') as string) || '',
    bank_account_name: (formData.get('bank_account_name') as string) || '',
    bank_account_number: (formData.get('bank_account_number') as string) || '',
    bank_sort_code: (formData.get('bank_sort_code') as string) || '',
    logo_url: (formData.get('logo_url') as string) || null,
  }

  const result = businessProfileSchema.safeParse(rawData)

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = []
      }
      fieldErrors[field].push(issue.message)
    }
    return { success: false, error: 'Validation failed.', fieldErrors }
  }

  const validated = result.data

  const { error } = await supabase
    .from('user_settings')
    .update({
      business_profile: validated,
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'Failed to update business profile. Please try again.' }
  }

  revalidatePath('/business/invoicing/settings')
  return { success: true, error: null, data: validated as BusinessProfile }
}

/**
 * Upload a business logo to Supabase Storage.
 * Stores in `business-assets/{user_id}/logo.{ext}` and returns the public URL.
 */
export async function uploadBusinessLogo(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const tierCheck = await assertProPlusTier()
  if (tierCheck) {
    return { url: null, error: tierCheck.error }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { url: null, error: 'You must be logged in.' }
  }

  const file = formData.get('logo') as File | null

  if (!file || file.size === 0) {
    return { url: null, error: 'No file provided.' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: 'Only JPEG and PNG images are allowed.' }
  }

  // Validate file size (5 MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'File must be less than 5 MB.' }
  }

  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const filePath = `${user.id}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('business-assets')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return { url: null, error: 'Failed to upload logo. Please try again.' }
  }

  const { data: urlData } = supabase.storage
    .from('business-assets')
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl, error: null }
}
