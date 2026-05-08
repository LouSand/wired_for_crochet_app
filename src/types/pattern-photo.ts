/**
 * Types for pattern photos.
 */

export interface PatternPhoto {
  id: string
  pattern_id: string
  user_id: string
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  caption: string | null
  is_cover: boolean
  sort_order: number
  created_at: string
}
