'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { startTimer, stopTimer } from '@/lib/actions/time-sessions'
import type { TimeSession } from '@/types/database'

interface UseTimerOptions {
  projectId: string
  activeSession: TimeSession | null
}

interface UseTimerReturn {
  isRunning: boolean
  elapsed: number
  error: string | null
  isLoading: boolean
  start: () => Promise<void>
  stop: () => Promise<void>
}

/**
 * Custom hook for managing client-side timer state.
 * Calculates elapsed time from activeSession.start_time to now,
 * and provides start/stop controls that call server actions.
 */
export function useTimer({ projectId, activeSession }: UseTimerOptions): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(!!activeSession)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string | null>(activeSession?.id ?? null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Calculate elapsed seconds from a start time
  const calculateElapsed = useCallback((startTime: string): number => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    return Math.max(0, Math.floor((now - start) / 1000))
  }, [])

  // Initialize state from activeSession
  useEffect(() => {
    if (activeSession) {
      setIsRunning(true)
      sessionIdRef.current = activeSession.id
      setElapsed(calculateElapsed(activeSession.start_time))
    } else {
      setIsRunning(false)
      sessionIdRef.current = null
      setElapsed(0)
    }
  }, [activeSession, calculateElapsed])

  // Set up interval to update elapsed time every second while running
  useEffect(() => {
    if (isRunning && activeSession) {
      // Update immediately
      setElapsed(calculateElapsed(activeSession.start_time))

      intervalRef.current = setInterval(() => {
        setElapsed(calculateElapsed(activeSession.start_time))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, activeSession, calculateElapsed])

  // Start the timer
  const start = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await startTimer(projectId)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        sessionIdRef.current = result.data.id
        setIsRunning(true)
        setElapsed(calculateElapsed(result.data.start_time))
      }
    } catch {
      setError('Failed to start timer. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, calculateElapsed])

  // Stop the timer with retry logic for network failures
  const stop = useCallback(async () => {
    if (!sessionIdRef.current) {
      setError('No active session to stop.')
      return
    }

    setError(null)
    setIsLoading(true)
    retryCountRef.current = 0

    const attemptStop = async (): Promise<void> => {
      try {
        const result = await stopTimer(sessionIdRef.current!)

        if (result.error) {
          setError(result.error)
        } else {
          setIsRunning(false)
          sessionIdRef.current = null
          // Keep the final elapsed value displayed
        }
      } catch {
        retryCountRef.current += 1
        if (retryCountRef.current < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCountRef.current - 1))
          )
          return attemptStop()
        }
        setError('Failed to stop timer after multiple attempts. Please try again when your connection is restored.')
      }
    }

    await attemptStop()
    setIsLoading(false)
  }, [])

  return {
    isRunning,
    elapsed,
    error,
    isLoading,
    start,
    stop,
  }
}
