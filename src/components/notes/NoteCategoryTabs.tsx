'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { key: '', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'remember_next_time', label: 'Remember Next Time' },
  { key: 'pattern_alteration', label: 'Pattern Alterations' },
] as const

interface NoteCategoryTabsProps {
  activeCategory: string
}

export default function NoteCategoryTabs({ activeCategory }: NoteCategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key)}
          role="tab"
          aria-selected={activeCategory === tab.key}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === tab.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
