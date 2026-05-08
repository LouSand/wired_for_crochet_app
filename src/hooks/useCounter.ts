'use client'

import { useState, useCallback, useTransition } from 'react'
import {
  incrementCounter,
  decrementCounter,
  resetCounter,
  updateCounterValue,
  deleteCounter,
} from '@/lib/actions/counters'
import type { Counter } from '@/types/database'

interface UseCounterOptions {
  counter: Counter
}

interface UseCounterReturn {
  /** The displayed value (optimistically updated) */
  displayValue: number
  /** Whether a server action is in flight */
  isPending: boolean
  /** Error message from the last failed action */
  error: string | null
  /** Increment the counter by 1 */
  increment: () => void
  /** Decrement the counter by 1 (floors at 0) */
  decrement: () => void
  /** Reset the counter to 0 */
  reset: () => void
  /** Set the counter to a specific value */
  setValue: (value: number) => void
  /** Delete the counter */
  remove: () => Promise<void>
}

/**
 * Custom hook for optimistic counter updates.
 * Immediately updates the displayed value, then calls the server action.
 * If the server action fails, reverts to the previous value and shows an error.
 */
export function useCounter({ counter }: UseCounterOptions): UseCounterReturn {
  const [displayValue, setDisplayValue] = useState(counter.current_value)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const increment = useCallback(() => {
    setError(null)
    const previousValue = displayValue
    const newValue = previousValue + 1
    setDisplayValue(newValue)

    startTransition(async () => {
      const result = await incrementCounter(counter.id)
      if (result.error) {
        setDisplayValue(previousValue)
        setError(result.error)
      } else if (result.data) {
        setDisplayValue(result.data.current_value)
      }
    })
  }, [counter.id, displayValue])

  const decrement = useCallback(() => {
    setError(null)
    const previousValue = displayValue
    const newValue = Math.max(0, previousValue - 1)
    if (newValue === previousValue) return
    setDisplayValue(newValue)

    startTransition(async () => {
      const result = await decrementCounter(counter.id)
      if (result.error) {
        setDisplayValue(previousValue)
        setError(result.error)
      } else if (result.data) {
        setDisplayValue(result.data.current_value)
      }
    })
  }, [counter.id, displayValue])

  const reset = useCallback(() => {
    setError(null)
    const previousValue = displayValue
    setDisplayValue(0)

    startTransition(async () => {
      const result = await resetCounter(counter.id)
      if (result.error) {
        setDisplayValue(previousValue)
        setError(result.error)
      } else if (result.data) {
        setDisplayValue(result.data.current_value)
      }
    })
  }, [counter.id, displayValue])

  const setValue = useCallback(
    (value: number) => {
      if (!Number.isInteger(value) || value < 0) {
        setError('Value must be a non-negative integer.')
        return
      }
      setError(null)
      const previousValue = displayValue
      setDisplayValue(value)

      startTransition(async () => {
        const result = await updateCounterValue(counter.id, value)
        if (result.error) {
          setDisplayValue(previousValue)
          setError(result.error)
        } else if (result.data) {
          setDisplayValue(result.data.current_value)
        }
      })
    },
    [counter.id, displayValue]
  )

  const remove = useCallback(async () => {
    setError(null)
    const result = await deleteCounter(counter.id)
    if (result?.error) {
      setError(result.error)
    }
  }, [counter.id])

  return {
    displayValue,
    isPending,
    error,
    increment,
    decrement,
    reset,
    setValue,
    remove,
  }
}
