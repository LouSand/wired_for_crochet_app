'use client'

import { useState, useRef, useEffect } from 'react'

interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface CustomerSelectProps {
  customers: Customer[]
  defaultValue?: string
  name?: string
}

export default function CustomerSelect({
  customers,
  defaultValue,
  name = 'customer_id',
}: CustomerSelectProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(defaultValue ?? '')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedCustomer = customers.find((c) => c.id === selectedId)

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(customerId: string) {
    setSelectedId(customerId)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCustomer ? selectedCustomer.name : 'Select a customer...'}
        </span>
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
          </div>
          <ul
            className="max-h-48 overflow-y-auto py-1"
            role="listbox"
            aria-label="Customer options"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No customers found</li>
            ) : (
              filtered.map((customer) => (
                <li
                  key={customer.id}
                  role="option"
                  aria-selected={customer.id === selectedId}
                  onClick={() => handleSelect(customer.id)}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-purple-50 ${
                    customer.id === selectedId ? 'bg-purple-50 text-purple-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{customer.name}</div>
                  {(customer.email || customer.phone) && (
                    <div className="text-xs text-gray-500">
                      {customer.email}
                      {customer.email && customer.phone && ' · '}
                      {customer.phone}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
