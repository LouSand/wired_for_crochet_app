'use client'

import { useState } from 'react'
import { analysePattern, autoCreateCounters } from '@/lib/actions/pattern-parser'
import type { PatternAnalysis, SuggestedCounter } from '@/lib/pattern-parser'
import SmartRowStitchCounter from '@/components/counters/SmartRowStitchCounter'

interface PatternAnalysisPanelProps {
  patternId: string
  projectId: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  easy: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default function PatternAnalysisPanel({ patternId, projectId }: PatternAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCounters, setSelectedCounters] = useState<Set<number>>(new Set())
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<number | null>(null)

  const handleAnalyse = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await analysePattern(patternId)
    if (err) {
      setError(err)
    } else if (data) {
      setAnalysis(data)
      // Select all counters by default
      setSelectedCounters(new Set(data.suggestedCounters.map((_, i) => i)))
    }
    setLoading(false)
  }

  const handleCreateCounters = async () => {
    if (!analysis) return
    setCreating(true)
    const counters = analysis.suggestedCounters.filter((_, i) => selectedCounters.has(i))
    const { created: count, error: err } = await autoCreateCounters(projectId, patternId, counters)
    if (err) {
      setError(err)
    } else {
      setCreated(count)
    }
    setCreating(false)
  }

  const toggleCounter = (idx: number) => {
    setSelectedCounters((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-800">Pattern Analysis</p>
            <p className="text-xs text-purple-600 mt-0.5">
              Analyse the pattern to auto-detect rows, suggest counters, and estimate difficulty
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyse}
            disabled={loading}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[32px]"
          >
            {loading ? 'Analysing...' : '✨ Analyse Pattern'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-purple-800">Pattern Analysis</p>
        {analysis.difficulty && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[analysis.difficulty] ?? 'bg-gray-100 text-gray-700'}`}>
            {analysis.difficulty}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs text-purple-700">
        {analysis.totalRows > 0 && (
          <span className="rounded bg-purple-100 px-2 py-0.5">{analysis.totalRows} rows detected</span>
        )}
        {analysis.stitchCountsPerRow.length > 0 && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">{analysis.stitchCountsPerRow.length} rows with stitch counts</span>
        )}
        {analysis.sections.length > 0 && (
          <span className="rounded bg-purple-100 px-2 py-0.5">{analysis.sections.length} sections</span>
        )}
      </div>

      {/* Smart Row+Stitch Counter (if stitch counts detected) */}
      {analysis.stitchCountsPerRow.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">Smart Row & Stitch Tracker:</p>
          <SmartRowStitchCounter
            stitchCountsPerRow={analysis.stitchCountsPerRow}
            totalRows={analysis.totalRows}
          />
        </div>
      )}

      {/* Sections list */}
      {analysis.sections.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">Sections found:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.sections.map((s, i) => (
              <span key={i} className="rounded bg-white border border-purple-200 px-2 py-0.5 text-xs text-purple-700">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested counters */}
      {analysis.suggestedCounters.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wide mb-1">Suggested counters:</p>
          <div className="space-y-1.5">
            {analysis.suggestedCounters.map((counter, idx) => (
              <label key={idx} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCounters.has(idx)}
                  onChange={() => toggleCounter(idx)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800">
                    {counter.name}
                    {counter.targetValue && (
                      <span className="ml-1 text-gray-500">(target: {counter.targetValue})</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500">{counter.reason}</p>
                </div>
              </label>
            ))}
          </div>

          {created !== null ? (
            <p className="mt-2 text-xs text-green-700 font-medium">
              ✓ Created {created} counter{created !== 1 ? 's' : ''}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleCreateCounters}
              disabled={creating || selectedCounters.size === 0}
              className="mt-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[32px]"
            >
              {creating ? 'Creating...' : `Create ${selectedCounters.size} counter${selectedCounters.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
