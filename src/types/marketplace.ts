export interface SellerProfile {
  id: string
  user_id: string
  display_name: string
  slug: string
  bio: string | null
  avatar_path: string | null
  stripe_account_id: string | null
  stripe_onboarded: boolean
  created_at: string
  updated_at: string
}

export interface PublishedPattern {
  id: string
  user_id: string
  title: string
  type: string
  category: string | null
  introduction: string | null
  hook_size: string | null
  yarn_info: string | null
  gauge: string | null
  preview_description: string | null
  tags: string[]
  price: number | null
  currency: string
  slug: string | null
  is_published: boolean
  view_count: number
  purchase_count: number
  created_at: string
  // Joined data
  seller?: SellerProfile
  average_rating?: number
  review_count?: number
}

export interface PatternPurchase {
  id: string
  buyer_id: string
  pattern_id: string
  seller_id: string
  amount: number
  commission: number
  currency: string
  stripe_payment_id: string | null
  status: string
  created_at: string
}

export interface PatternReview {
  id: string
  pattern_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  // Joined
  reviewer_name?: string
}

export interface PatternReport {
  id: string
  pattern_id: string
  reporter_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
}
