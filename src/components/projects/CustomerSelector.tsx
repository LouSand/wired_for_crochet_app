'use client'

import { useState, useEffect, useRef } from 'react'
import { getCustomers } from '@/lib/actions/customers'
import type { CustomerRow } from '@/types/business'

interface CustomerSelectorProps {
  name: string
  defaultValue?: string
}

export default function CustomerSelector({ name, defaultValue = '' }: CustomerSelectorProps) {
  const [value, setValue] = useState(defaultValue)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [filtered, setFiltered] = useState<CustomerRow[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch customers on mount
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true)
      try {
        const { data } = await getCustomers()
        if (data) setCustomers(data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  // Filter customers as user types
  useEffect(() => {
    if (!value.trim()) {
      setFiltered(customers)
    } else {
      const lower = value.toLowerCase()
      setFiltered(customers.filter((c) => c.name.toLowerCase().includes(lower)))
    }
  }, [value, customers])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (customer: CustomerRow) => {
    setValue(customer.name)
    setShowDropdown(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        Customer Name
      </label>
      <div className="relative mt-1">
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Type to search or add new..."
          autoComplete="off"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 pr-10"
        />
        {/* Dropdown toggle button */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-gray-600"
          aria-label="Show customers"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-[200px] overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2">
              <p className="text-sm text-gray-500">
                {customers.length === 0
                  ? 'No customers yet — type a name to add one'
                  : 'No match — this will be added as a new customer name'}
              </p>
            </div>
          ) : (
            <>
              {filtered.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors min-h-[40px]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                    {customer.email && (
                      <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
          {value.trim() && !customers.some((c) => c.name.toLowerCase() === value.toLowerCase()) && (
            <div className="border-t border-gray-100 px-3 py-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium text-purple-600">&quot;{value}&quot;</span> will be saved as the customer name
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
