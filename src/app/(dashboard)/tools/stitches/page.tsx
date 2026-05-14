'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getStitches, addCustomStitch, type Stitch } from '@/lib/actions/stitch-dictionary'

export default function StitchDictionaryPage() {
  const [stitches, setStitches] = useState<Stitch[]>([])
  const [search, setSearch] = useState('')
  const [craftFilter, setCraftFilter] = useState<'all' | 'crochet' | 'knitting'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadStitches = async () => {
    const { data } = await getStitches({
      craft_type: craftFilter === 'all' ? undefined : craftFilter,
      category: categoryFilter || undefined,
      search: search || undefined,
    })
    setStitches(data)
    setLoading(false)
  }

  useEffect(() => {
    loadStitches()
  }, [search, craftFilter, categoryFilter])

  const handleAddStitch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    await addCustomStitch(formData)
    await loadStitches()
    setSaving(false)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tools" className="text-sm text-purple-600 hover:text-purple-700">← Back to Tools</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Stitch Dictionary</h1>
        <p className="mt-1 text-sm text-gray-600">Reference guide for crochet and knitting stitches with UK/US terms.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stitches..."
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select value={craftFilter} onChange={(e) => setCraftFilter(e.target.value as 'all' | 'crochet' | 'knitting')} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="all">All crafts</option>
          <option value="crochet">Crochet</option>
          <option value="knitting">Knitting</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All categories</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="decorative">Decorative</option>
          <option value="structural">Structural</option>
        </select>
      </div>

      {/* Stitch list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : stitches.length === 0 ? (
        <p className="text-sm text-gray-500">No stitches found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stitches.map((stitch) => (
            <div key={stitch.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {stitch.name_uk}
                    {stitch.name_uk !== stitch.name_us && (
                      <span className="text-gray-400 font-normal"> / {stitch.name_us}</span>
                    )}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    {stitch.abbreviation_uk && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700">
                        🇬🇧 {stitch.abbreviation_uk}
                      </span>
                    )}
                    {stitch.abbreviation_us && stitch.abbreviation_us !== stitch.abbreviation_uk && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-700">
                        🇺🇸 {stitch.abbreviation_us}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    stitch.craft_type === 'crochet' ? 'bg-purple-100 text-purple-700' :
                    stitch.craft_type === 'knitting' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {stitch.craft_type}
                  </span>
                  {stitch.difficulty && (
                    <span className="text-[9px] text-gray-400">{stitch.difficulty}</span>
                  )}
                </div>
              </div>
              {stitch.description && (
                <p className="mt-2 text-xs text-gray-600">{stitch.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Stitch Form */}
      <div className="mt-6">
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            + Add Custom Stitch
          </button>
        ) : (
          <form onSubmit={handleAddStitch} className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-purple-900">Add Custom Stitch</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">UK Name *</label>
                <input type="text" name="name_uk" required placeholder="e.g. Treble" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">US Name *</label>
                <input type="text" name="name_us" required placeholder="e.g. Double crochet" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Abbreviation</label>
                <input type="text" name="abbreviation" placeholder="e.g. tr / dc" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Craft Type *</label>
                <select name="craft_type" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="crochet">Crochet</option>
                  <option value="knitting">Knitting</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <select name="category" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="">None</option>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="decorative">Decorative</option>
                  <option value="structural">Structural</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Description</label>
                <textarea name="description" rows={2} placeholder="How to work this stitch..." className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Stitch'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
