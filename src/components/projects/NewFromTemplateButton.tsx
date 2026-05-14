'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTemplates, type ProjectTemplate } from '@/lib/actions/project-templates'

export default function NewFromTemplateButton() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showPicker && templates.length === 0) {
      setLoading(true)
      getTemplates().then(({ data }) => {
        setTemplates(data)
        setLoading(false)
      })
    }
  }, [showPicker, templates.length])

  const handleSelect = (template: ProjectTemplate) => {
    // Navigate to new project page with template data as query params
    const params = new URLSearchParams()
    if (template.pattern_id) params.set('pattern_id', template.pattern_id)
    params.set('template_name', template.name)
    params.set('craft_type', template.craft_type)
    router.push(`/projects/new?${params.toString()}`)
    setShowPicker(false)
  }

  if (showPicker) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Choose Template</h4>
          <button type="button" onClick={() => setShowPicker(false)} className="text-xs text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {loading ? (
          <p className="text-xs text-gray-500">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-gray-500">No templates yet. Complete a project and save it as a template.</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t)}
                className="w-full text-left rounded-md border border-gray-100 p-3 hover:bg-purple-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">
                  {t.counters.length} counters • {t.hooks.length} hooks • {t.craft_type}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowPicker(true)}
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      From Template
    </button>
  )
}
