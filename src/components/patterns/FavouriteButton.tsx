'use client'

import { useState } from 'react'
import { toggleFavourite } from '@/lib/actions/favourites'

interface FavouriteButtonProps {
  patternId: string
  initialFavourite?: boolean
  size?: 'sm' | 'md'
}

export default function FavouriteButton({ patternId, initialFavourite = false, size = 'md' }: FavouriteButtonProps) {
  const [isFavourite, setIsFavourite] = useState(initialFavourite)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent link navigation if inside a Link
    e.stopPropagation()
    setLoading(true)
    const { isFavourite: newState } = await toggleFavourite(patternId)
    setIsFavourite(newState)
    setLoading(false)
  }

  const sizeClasses = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses} flex items-center justify-center rounded-full transition-all ${
        isFavourite
          ? 'bg-red-100 text-red-500 hover:bg-red-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
      } disabled:opacity-50`}
      aria-label={isFavourite ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isFavourite ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={iconSize}
        fill={isFavourite ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isFavourite ? 0 : 2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  )
}
