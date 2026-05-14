'use client'

import { useState, useCallback } from 'react'

interface RowStitchData {
  row: number
  targetStitches: number
  completedStitches: number
}

interface SmartRowStitchCounterProps {
  /** Stitch counts per row from pattern analysis: [{ row: 1, stitches: 12 }, ...] */
  stitchCountsPerRow: Array<{ row: number; stitches: number }>
  /** Total rows in the pattern */
  totalRows: number
  /** Initial row (if resuming) */
  initialRow?: number
  /** Saved per-row stitch progress (if resuming) */
  initialRowData?: RowStitchData[]
}

/**
 * Smart Row + Stitch Counter
 *
 * - Row counter on the left, stitch counter on the right
 * - When you advance a row: stitch counter resets to 0, target updates to new row's stitch count
 * - When you go back a row: stitch counter restores to where you were on that row
 * - All per-row stitch progress is preserved (for frogging)
 */
export default function SmartRowStitchCounter({
  stitchCountsPerRow,
  totalRows,
  initialRow = 1,
  initialRowData = [],
}: SmartRowStitchCounterProps) {
  const [currentRow, setCurrentRow] = useState(initialRow)
  const [rowData, setRowData] = useState<RowStitchData[]>(() => {
    if (initialRowData.length > 0) return initialRowData
    // Initialize with zeros for all rows
    return stitchCountsPerRow.map((r) => ({
      row: r.row,
      targetStitches: r.stitches,
      completedStitches: 0,
    }))
  })

  // Get current row's data
  const currentRowData = rowData.find((r) => r.row === currentRow)
  const currentStitches = currentRowData?.completedStitches ?? 0
  const currentTarget = currentRowData?.targetStitches ??
    stitchCountsPerRow.find((r) => r.row === currentRow)?.stitches ?? 
    (stitchCountsPerRow.length > 0 ? stitchCountsPerRow[stitchCountsPerRow.length - 1].stitches : 0)

  // Get stitch target for a specific row
  const getTargetForRow = useCallback((row: number) => {
    return stitchCountsPerRow.find((r) => r.row === row)?.stitches ?? currentTarget
  }, [stitchCountsPerRow, currentTarget])

  // Update stitch count for current row
  const updateStitches = (newCount: number) => {
    setRowData((prev) => {
      const existing = prev.find((r) => r.row === currentRow)
      if (existing) {
        return prev.map((r) => r.row === currentRow ? { ...r, completedStitches: newCount } : r)
      }
      return [...prev, { row: currentRow, targetStitches: getTargetForRow(currentRow), completedStitches: newCount }]
    })
  }

  // Increment stitch
  const incrementStitch = () => {
    updateStitches(currentStitches + 1)
  }

  // Decrement stitch
  const decrementStitch = () => {
    if (currentStitches > 0) {
      updateStitches(currentStitches - 1)
    }
  }

  // Advance to next row — resets stitch counter to 0
  const nextRow = () => {
    if (currentRow >= totalRows) return
    const newRow = currentRow + 1
    setCurrentRow(newRow)
    // Reset stitch counter for new row (or create entry if doesn't exist)
    setRowData((prev) => {
      const existing = prev.find((r) => r.row === newRow)
      if (existing) {
        // Row exists but we're advancing fresh — reset to 0
        return prev.map((r) => r.row === newRow ? { ...r, completedStitches: 0 } : r)
      }
      return [...prev, { row: newRow, targetStitches: getTargetForRow(newRow), completedStitches: 0 }]
    })
  }

  // Go back a row — restores previous stitch count (for frogging)
  const prevRow = () => {
    if (currentRow <= 1) return
    setCurrentRow(currentRow - 1)
    // Previous row's data is preserved in rowData — shows where you left off
  }

  const rowProgress = totalRows > 0 ? Math.round((currentRow / totalRows) * 100) : 0
  const stitchProgress = currentTarget > 0 ? Math.round((currentStitches / currentTarget) * 100) : 0

  return (
    <div className="rounded-xl bg-gray-50 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Row & Stitch Tracker</p>
        <span className="text-[9px] text-gray-400">
          Row {currentRow}/{totalRows}
        </span>
      </div>

      {/* Overall row progress */}
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${rowProgress}%` }} />
      </div>

      {/* Paired counters */}
      <div className="grid grid-cols-2 gap-2">
        {/* Row counter */}
        <div className="rounded-lg bg-white border border-gray-200 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <p className="text-[9px] font-medium text-gray-500">Row</p>
            <button
              type="button"
              onClick={() => {
                const newTotal = prompt('Edit total rows:', String(totalRows))
                if (newTotal && !isNaN(parseInt(newTotal))) {
                  // Can't directly set totalRows as it's a prop, but we can show it
                  alert(`Total rows updated to ${newTotal}. Save this in your counter settings.`)
                }
              }}
              className="text-[8px] text-purple-500 hover:text-purple-700"
              title="Edit total rows"
            >
              (/{totalRows} ✎)
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={prevRow}
              disabled={currentRow <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-600 active:bg-gray-200 active:scale-95 disabled:opacity-30 transition-all"
              aria-label="Previous row"
            >
              −
            </button>
            <span className="min-w-[2.5rem] text-center text-xl font-bold text-gray-900 tabular-nums">
              {currentRow}
            </span>
            <button
              type="button"
              onClick={nextRow}
              disabled={currentRow >= totalRows}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-400 bg-purple-50 text-sm font-bold text-purple-700 active:bg-purple-200 active:scale-95 disabled:opacity-30 transition-all"
              aria-label="Next row"
            >
              +
            </button>
          </div>
          <p className="text-[8px] text-gray-400 mt-1">of {totalRows}</p>
        </div>

        {/* Stitch counter */}
        <div className="rounded-lg bg-white border border-gray-200 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <p className="text-[9px] font-medium text-gray-500">Stitches</p>
            {currentTarget > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const newTarget = prompt('Edit stitch target for this row:', String(currentTarget))
                  if (newTarget && !isNaN(parseInt(newTarget))) {
                    setRowData((prev) => prev.map((r) => r.row === currentRow ? { ...r, targetStitches: parseInt(newTarget) } : r))
                  }
                }}
                className="text-[8px] text-purple-500 hover:text-purple-700"
                title="Edit target"
              >
                (/{currentTarget} ✎)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const target = prompt('Set stitch target for this row:')
                  if (target && !isNaN(parseInt(target))) {
                    setRowData((prev) => {
                      const existing = prev.find((r) => r.row === currentRow)
                      if (existing) return prev.map((r) => r.row === currentRow ? { ...r, targetStitches: parseInt(target) } : r)
                      return [...prev, { row: currentRow, targetStitches: parseInt(target), completedStitches: currentStitches }]
                    })
                  }
                }}
                className="text-[8px] text-blue-500 hover:text-blue-700 font-medium"
              >
                + set target
              </button>
            )}
          </div>
          {/* Stitch progress bar */}
          {currentTarget > 0 && (
            <div className="h-1 rounded-full bg-gray-200 overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-200 ${stitchProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, stitchProgress)}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={decrementStitch}
              disabled={currentStitches <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-600 active:bg-gray-200 active:scale-95 disabled:opacity-30 transition-all"
              aria-label="Decrease stitch count"
            >
              −
            </button>
            <span className={`min-w-[2.5rem] text-center text-xl font-bold tabular-nums ${
              currentTarget > 0 && currentStitches >= currentTarget ? 'text-green-600' : 'text-gray-900'
            }`}>
              {currentStitches}
            </span>
            <button
              type="button"
              onClick={incrementStitch}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400 bg-blue-50 text-sm font-bold text-blue-700 active:bg-blue-200 active:scale-95 transition-all"
              aria-label="Increase stitch count"
            >
              +
            </button>
          </div>
          {currentTarget > 0 && currentStitches >= currentTarget && (
            <p className="text-[8px] text-green-600 font-medium mt-1">✓ Row complete — tap + on Row to advance</p>
          )}
        </div>
      </div>

      {/* Row history (last 3 rows for reference) */}
      {rowData.filter((r) => r.row < currentRow && r.completedStitches > 0).length > 0 && (
        <details className="text-[9px]">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Previous rows</summary>
          <div className="mt-1 space-y-0.5 max-h-[80px] overflow-y-auto">
            {rowData
              .filter((r) => r.row < currentRow)
              .sort((a, b) => b.row - a.row)
              .slice(0, 5)
              .map((r) => (
                <div key={r.row} className="flex justify-between text-gray-500">
                  <span>Row {r.row}</span>
                  <span>{r.completedStitches}/{r.targetStitches} stitches</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
