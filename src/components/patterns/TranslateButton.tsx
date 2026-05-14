'use client'

import { useState } from 'react'
import { translateToUS, translateToUK, detectTerminology } from '@/lib/terminology-translator'

interface TranslateButtonProps {
  text: string
  onTranslated: (translated: string) => void
}

export default function TranslateButton({ text, onTranslated }: TranslateButtonProps) {
  const [detected, setDetected] = useState<'uk' | 'us' | 'unknown' | null>(null)

  const handleTranslate = (direction: 'toUS' | 'toUK') => {
    const translated = direction === 'toUS' ? translateToUS(text) : translateToUK(text)
    onTranslated(translated)
  }

  const handleDetect = () => {
    const result = detectTerminology(text)
    setDetected(result)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleDetect}
        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
      >
        Detect terms
      </button>
      {detected && (
        <span className="text-[10px] text-gray-500">
          Detected: <strong>{detected === 'unknown' ? 'unclear' : `${detected.toUpperCase()} terms`}</strong>
        </span>
      )}
      <button
        type="button"
        onClick={() => handleTranslate('toUS')}
        className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100"
      >
        → US terms
      </button>
      <button
        type="button"
        onClick={() => handleTranslate('toUK')}
        className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
      >
        → UK terms
      </button>
    </div>
  )
}
