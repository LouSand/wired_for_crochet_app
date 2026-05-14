'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Terminology Conversion ──────────────────────────────────────────────────

const TERMINOLOGY_MAP = [
  { uk: 'Chain (ch)', us: 'Chain (ch)' },
  { uk: 'Slip stitch (sl st)', us: 'Slip stitch (sl st)' },
  { uk: 'Double crochet (dc)', us: 'Single crochet (sc)' },
  { uk: 'Half treble (htr)', us: 'Half double crochet (hdc)' },
  { uk: 'Treble (tr)', us: 'Double crochet (dc)' },
  { uk: 'Double treble (dtr)', us: 'Treble crochet (tr)' },
  { uk: 'Triple treble (ttr)', us: 'Double treble (dtr)' },
  { uk: 'Quadruple treble (qtr)', us: 'Triple treble (ttr)' },
  { uk: 'Tension', us: 'Gauge' },
  { uk: 'Miss', us: 'Skip' },
  { uk: 'Yarn round hook (yrh)', us: 'Yarn over (yo)' },
  { uk: 'Raise / Relief', us: 'Front/Back post' },
  { uk: 'Alternate', us: 'Every other' },
]

// ─── Gauge Calculator ────────────────────────────────────────────────────────

function GaugeCalculator() {
  const [stitches, setStitches] = useState('')
  const [rows, setRows] = useState('')
  const [sampleSize, setSampleSize] = useState('4')
  const [patternStitches, setPatternStitches] = useState('')
  const [patternRows, setPatternRows] = useState('')

  const stitchesPerInch = stitches && sampleSize ? (parseFloat(stitches) / parseFloat(sampleSize)).toFixed(2) : null
  const rowsPerInch = rows && sampleSize ? (parseFloat(rows) / parseFloat(sampleSize)).toFixed(2) : null

  const gaugeDiffStitches = stitchesPerInch && patternStitches
    ? ((parseFloat(stitchesPerInch) - parseFloat(patternStitches) / parseFloat(sampleSize)) * parseFloat(sampleSize)).toFixed(1)
    : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Gauge Calculator</h3>
      <p className="text-xs text-gray-500 mb-4">Measure your swatch and compare with pattern requirements.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Your Swatch</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-gray-500">Sample size (inches)</label>
              <input type="number" value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} step="0.5" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500">Stitches in sample</label>
              <input type="number" value={stitches} onChange={(e) => setStitches(e.target.value)} step="0.5" placeholder="e.g. 14" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500">Rows in sample</label>
              <input type="number" value={rows} onChange={(e) => setRows(e.target.value)} step="0.5" placeholder="e.g. 18" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Pattern Gauge (optional)</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-gray-500">Pattern stitches per {sampleSize}&quot;</label>
              <input type="number" value={patternStitches} onChange={(e) => setPatternStitches(e.target.value)} step="0.5" placeholder="e.g. 14" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500">Pattern rows per {sampleSize}&quot;</label>
              <input type="number" value={patternRows} onChange={(e) => setPatternRows(e.target.value)} step="0.5" placeholder="e.g. 18" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {(stitchesPerInch || rowsPerInch) && (
        <div className="mt-4 rounded-lg bg-purple-50 p-3">
          <h4 className="text-xs font-medium text-purple-800 mb-2">Your Gauge</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {stitchesPerInch && <div><span className="text-gray-500">Stitches/inch:</span> <strong>{stitchesPerInch}</strong></div>}
            {rowsPerInch && <div><span className="text-gray-500">Rows/inch:</span> <strong>{rowsPerInch}</strong></div>}
          </div>
          {gaugeDiffStitches && parseFloat(gaugeDiffStitches) !== 0 && (
            <p className={`mt-2 text-xs ${Math.abs(parseFloat(gaugeDiffStitches)) > 1 ? 'text-red-700' : 'text-amber-700'}`}>
              {parseFloat(gaugeDiffStitches) > 0
                ? `⚠️ You have ${gaugeDiffStitches} more stitches than pattern — try a larger hook/needle`
                : `⚠️ You have ${Math.abs(parseFloat(gaugeDiffStitches)).toFixed(1)} fewer stitches than pattern — try a smaller hook/needle`}
            </p>
          )}
          {gaugeDiffStitches && parseFloat(gaugeDiffStitches) === 0 && (
            <p className="mt-2 text-xs text-green-700">✓ Your gauge matches the pattern!</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Yarn Converter ──────────────────────────────────────────────────────────

function YarnConverter() {
  const [grams, setGrams] = useState('')
  const [metres, setMetres] = useState('')
  const [ballMetres, setBallMetres] = useState('')
  const [neededMetres, setNeededMetres] = useState('')

  const ounces = grams ? (parseFloat(grams) * 0.035274).toFixed(1) : ''
  const yards = metres ? (parseFloat(metres) * 1.09361).toFixed(1) : ''
  const metresFromYards = yards && !metres ? (parseFloat(yards) / 1.09361).toFixed(1) : ''
  const ballsNeeded = ballMetres && neededMetres ? Math.ceil(parseFloat(neededMetres) / parseFloat(ballMetres)) : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Yarn Converter</h3>
      <p className="text-xs text-gray-500 mb-4">Convert between metric and imperial yarn measurements.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Weight */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Weight</h4>
          <div className="flex items-center gap-2">
            <input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="Grams" className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            <span className="text-xs text-gray-400">=</span>
            <div className="flex-1 rounded-md bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm text-gray-700">
              {ounces || '—'} oz
            </div>
          </div>
        </div>

        {/* Length */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Length</h4>
          <div className="flex items-center gap-2">
            <input type="number" value={metres} onChange={(e) => setMetres(e.target.value)} placeholder="Metres" className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
            <span className="text-xs text-gray-400">=</span>
            <div className="flex-1 rounded-md bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm text-gray-700">
              {yards || '—'} yds
            </div>
          </div>
        </div>
      </div>

      {/* Balls needed calculator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-xs font-medium text-gray-700 mb-2">How many balls do I need?</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="block text-[10px] text-gray-500">Metres per ball</label>
            <input type="number" value={ballMetres} onChange={(e) => setBallMetres(e.target.value)} placeholder="e.g. 200" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Pattern needs (metres)</label>
            <input type="number" value={neededMetres} onChange={(e) => setNeededMetres(e.target.value)} placeholder="e.g. 850" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-end">
            {ballsNeeded && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-1.5 text-sm font-bold text-green-700 w-full text-center">
                {ballsNeeded} ball{ballsNeeded !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [showTerms, setShowTerms] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tools & Reference</h1>
        <p className="mt-1 text-sm text-gray-600">Calculators, converters, and reference guides.</p>
      </div>

      {/* Terminology Reference */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">US / UK Terminology</h3>
            <p className="text-xs text-gray-500 mt-0.5">Crochet terms differ between US and UK patterns</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTerms(!showTerms)}
            className="rounded-md bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200"
          >
            {showTerms ? 'Hide' : 'Show'} Reference
          </button>
        </div>

        {showTerms && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">🇬🇧 UK Term</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">🇺🇸 US Term</th>
                </tr>
              </thead>
              <tbody>
                {TERMINOLOGY_MAP.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${row.uk !== row.us ? '' : 'text-gray-400'}`}>
                    <td className="py-2 pr-4 text-gray-800">{row.uk}</td>
                    <td className={`py-2 ${row.uk !== row.us ? 'text-purple-700 font-medium' : 'text-gray-400'}`}>{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] text-gray-400">
              Highlighted rows show where terms differ. Same-name stitches are greyed out.
            </p>
          </div>
        )}
      </div>

      {/* Gauge Calculator */}
      <GaugeCalculator />

      {/* Yarn Converter */}
      <YarnConverter />
    </div>
  )
}
