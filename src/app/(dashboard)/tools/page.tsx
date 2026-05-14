'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getGaugeSwatches, saveGaugeSwatch, deleteGaugeSwatch, type GaugeSwatch } from '@/lib/actions/gauge'
import { getYarnEntries } from '@/lib/actions/yarn'
import type { YarnEntry } from '@/types/database'

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
  const [gramsPerBall, setGramsPerBall] = useState('')
  const [metresPerBall, setMetresPerBall] = useState('')

  const ounces = grams ? (parseFloat(grams) * 0.035274).toFixed(1) : ''
  const yards = metres ? (parseFloat(metres) * 1.09361).toFixed(1) : ''
  const metresFromYards = yards && !metres ? (parseFloat(yards) / 1.09361).toFixed(1) : ''
  const ballsNeeded = ballMetres && neededMetres ? Math.ceil(parseFloat(neededMetres) / parseFloat(ballMetres)) : null
  const metresPerGram = gramsPerBall && metresPerBall && parseFloat(gramsPerBall) > 0
    ? (parseFloat(metresPerBall) / parseFloat(gramsPerBall)).toFixed(2)
    : null

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

      {/* Metres per gram calculator */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Metres per Gram</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="block text-[10px] text-gray-500">Grams per ball</label>
            <input type="number" value={gramsPerBall} onChange={(e) => setGramsPerBall(e.target.value)} placeholder="e.g. 100" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Metres per ball</label>
            <input type="number" value={metresPerBall} onChange={(e) => setMetresPerBall(e.target.value)} placeholder="e.g. 200" className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-end">
            {metresPerGram && (
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-bold text-blue-700 w-full text-center">
                {metresPerGram} m/g
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

      {/* Saved Gauge Swatches */}
      <SavedSwatches />

      {/* Yarn Converter */}
      <YarnConverter />

      {/* Yarn Substitution Helper */}
      <YarnSubstitutionHelper />
    </div>
  )
}

// ─── Yarn Substitution Helper ────────────────────────────────────────────────

const YARN_WEIGHT_CATEGORIES = [
  'Lace',
  'Super Fine / Fingering',
  'Fine / Sport',
  'Light / DK',
  'Medium / Worsted',
  'Bulky',
  'Super Bulky',
  'Jumbo',
]

function YarnSubstitutionHelper() {
  const [selectedWeight, setSelectedWeight] = useState<string>('')
  const [matchingYarns, setMatchingYarns] = useState<YarnEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!selectedWeight) return
    setLoading(true)
    setSearched(true)
    const { data } = await getYarnEntries({ weight_category: selectedWeight })
    setMatchingYarns(data ?? [])
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Yarn Substitution Helper</h3>
      <p className="text-xs text-gray-500 mb-4">Find yarns in your inventory that match a specific weight category.</p>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Yarn Weight Category</label>
          <select
            value={selectedWeight}
            onChange={(e) => { setSelectedWeight(e.target.value); setSearched(false) }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a weight...</option>
            {YARN_WEIGHT_CATEGORIES.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!selectedWeight || loading}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[38px]"
        >
          {loading ? 'Searching...' : 'Find Matches'}
        </button>
      </div>

      {searched && !loading && (
        <div className="mt-4">
          {matchingYarns.length === 0 ? (
            <p className="text-sm text-gray-500">No yarns in your inventory match &quot;{selectedWeight}&quot;.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">
                {matchingYarns.length} yarn{matchingYarns.length !== 1 ? 's' : ''} found matching &quot;{selectedWeight}&quot;:
              </p>
              {matchingYarns.map((yarn) => (
                <div key={yarn.id} className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{yarn.name}</p>
                    <p className="text-xs text-gray-500">
                      {[yarn.brand, yarn.colour, yarn.fibre_content].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{yarn.quantity_owned} in stock</p>
                    {yarn.recommended_hook_size && (
                      <p className="text-xs text-gray-400">Hook: {yarn.recommended_hook_size}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Saved Gauge Swatches ────────────────────────────────────────────────────

function SavedSwatches() {
  const [swatches, setSwatches] = useState<GaugeSwatch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await getGaugeSwatches()
      setSwatches(data)
      setLoaded(true)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    await saveGaugeSwatch(formData)
    const { data } = await getGaugeSwatches()
    setSwatches(data)
    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    await deleteGaugeSwatch(id)
    setSwatches((prev) => prev.filter((s) => s.id !== id))
  }

  if (!loaded) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Saved Gauge Swatches</h3>
          <p className="text-xs text-gray-500">Your gauge records for different yarn + hook combinations.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 min-h-[32px]"
        >
          {showForm ? 'Cancel' : '+ Save Swatch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700">Hook/Needle Size *</label>
            <input type="text" name="hook_size" required placeholder="e.g. 4.0mm" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Stitches per 4&quot; *</label>
            <input type="number" name="stitches_per_4in" required step="0.5" placeholder="e.g. 14" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Rows per 4&quot;</label>
            <input type="number" name="rows_per_4in" step="0.5" placeholder="e.g. 18" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Yarn Weight</label>
            <input type="text" name="yarn_weight" placeholder="e.g. DK, Aran" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Yarn Name</label>
            <input type="text" name="yarn_name" placeholder="e.g. Stylecraft Special DK" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Notes</label>
            <input type="text" name="notes" placeholder="Optional notes" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Swatch'}
            </button>
          </div>
        </form>
      )}

      {swatches.length === 0 ? (
        <p className="text-sm text-gray-500">No saved swatches yet. Save your gauge measurements for future reference.</p>
      ) : (
        <div className="space-y-2">
          {swatches.map((swatch) => (
            <div key={swatch.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {swatch.hook_size} — {swatch.stitches_per_4in} sts/4&quot;
                  {swatch.rows_per_4in && `, ${swatch.rows_per_4in} rows/4"`}
                </p>
                <p className="text-xs text-gray-500">
                  {[swatch.yarn_name, swatch.yarn_weight].filter(Boolean).join(' • ') || 'No yarn specified'}
                  {swatch.notes && ` — ${swatch.notes}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(swatch.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
