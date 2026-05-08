'use client'

import { useState, useRef } from 'react'
import { YARN_TYPE_OPTIONS, PATTERN_TYPE_OPTIONS } from '@/lib/validators/hook'

interface HookCompatibilityFieldsProps {
  yarnTypes?: string[]
  patternTypes?: string[]
}

function MultiSelect({
  label,
  name,
  options,
  selected,
  onSelectionChange,
}: {
  label: string
  name: string
  options: readonly string[]
  selected: string[]
  onSelectionChange: (values: string[]) => void
}) {
  const [customInput, setCustomInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((v) => v !== option))
    } else {
      onSelectionChange([...selected, option])
    }
  }

  function addCustomValue() {
    const trimmed = customInput.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onSelectionChange([...selected, trimmed])
    }
    setCustomInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomValue()
    }
  }

  function removeValue(value: string) {
    onSelectionChange(selected.filter((v) => v !== value))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Selected values as tags */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(value)}
                className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Predefined options as checkboxes */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="capitalize">{option}</span>
          </label>
        ))}
      </div>

      {/* Custom text input */}
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add custom value..."
          className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={addCustomValue}
          disabled={!customInput.trim()}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Hidden input to store JSON array for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
    </div>
  )
}

export default function HookCompatibilityFields({
  yarnTypes = [],
  patternTypes = [],
}: HookCompatibilityFieldsProps) {
  const [selectedYarnTypes, setSelectedYarnTypes] = useState<string[]>(yarnTypes)
  const [selectedPatternTypes, setSelectedPatternTypes] = useState<string[]>(patternTypes)

  return (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Compatibility</h3>
        <p className="mt-1 text-xs text-gray-500">
          Record which yarn types and pattern types work well with this hook.
        </p>
      </div>

      <MultiSelect
        label="Works great with yarn type"
        name="yarn_types"
        options={YARN_TYPE_OPTIONS}
        selected={selectedYarnTypes}
        onSelectionChange={setSelectedYarnTypes}
      />

      <MultiSelect
        label="Works great with pattern type"
        name="pattern_types"
        options={PATTERN_TYPE_OPTIONS}
        selected={selectedPatternTypes}
        onSelectionChange={setSelectedPatternTypes}
      />
    </div>
  )
}
