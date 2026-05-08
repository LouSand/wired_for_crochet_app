'use client'

import { useState, useEffect } from 'react'
import { getHookRecommendations } from '@/lib/actions/hooks'
import type { HookEntry } from '@/types/database'

interface HookRecommendationsProps {
  yarnTypes?: string[]
  patternTypes?: string[]
}

export default function HookRecommendations({
  yarnTypes = [],
  patternTypes = [],
}: HookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<HookEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchRecommendations() {
      if (yarnTypes.length === 0 && patternTypes.length === 0) {
        setRecommendations([])
        return
      }

      setLoading(true)
      try {
        const result = await getHookRecommendations({ yarnTypes, patternTypes })
        setRecommendations(result.data ?? [])
      } catch {
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [yarnTypes, patternTypes])

  // Hide entirely if no matches
  if (!loading && recommendations.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <h4 className="text-sm font-semibold text-purple-900">
        🪝 Hook Suggestions
      </h4>
      <p className="mt-0.5 text-xs text-purple-700">
        Based on your selected yarn/pattern types, these hooks from your collection may work well.
      </p>

      {loading ? (
        <p className="mt-2 text-xs text-purple-600">Loading suggestions...</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {recommendations.map((hook) => (
            <li
              key={hook.id}
              className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
            >
              <span className="font-medium text-gray-900">{hook.size}</span>
              {hook.brand && (
                <span className="text-gray-500">· {hook.brand}</span>
              )}
              {hook.material && (
                <span className="text-gray-500 capitalize">· {hook.material}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
