'use client'

import { useState, useMemo } from 'react'
import type { Pattern } from '@/types/database'

interface PatternSelectorProps {
  patterns: Pattern[]
  defaultValue?: string
  onCreateNew?: () => void
}

/**
 * Searchable dropdown for selecting a pattern to link to a project.
 * Includes a "Create new pattern" option and a clear selection option.
 */
export default function PatternSelector({
  patterns,
  defaultValue,
  onCreateNew,
}: PatternSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>(defaultValue ?? '')
  const [isOpen, setIsOpen] = useState(false)

  const filteredPatterns = useMemo(() => {
    if (!search.trim()) return patterns
    const query = search.toLowerCase()
    return patterns.filter((p) => p.title.toLowerCase().includes(query))
  }, [patterns, search])

  const selectedPattern = patterns.find((p) => p.id === selectedId)

  const handleSelect = (patternId: string) => {
    setSelectedId(patternId)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedId('')
    setSearch('')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <label htmlFor="pattern-search" className="block text-sm font-medium text-gray-700">
        Linked Pattern
      </label>

      {/* Hidden input for form submission */}
      <input type="hidden" name="pattern_id" value={selectedId} />

      {/* Display selected pattern or search input */}
      {selectedId && selectedPattern ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900">
            {selectedPattern.title}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-500 hover:bg-gray-50"
            aria-label="Clear pattern selection"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative mt-1">
          <input
            type="text"
            id="pattern-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search patterns..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoComplete="off"
          />

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {filteredPatterns.length > 0 ? (
                filteredPatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => handleSelect(pattern.id)}
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {pattern.title}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No patterns found</div>
              )}

              {/* Create new pattern option */}
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onCreateNew()
                  }}
                  className="block w-full border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-purple-600 hover:bg-purple-50"
                >
                  + Create new pattern
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
