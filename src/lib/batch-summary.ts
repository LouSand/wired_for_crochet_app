/**
 * Computes a summary of batch upload results.
 */
export function computeBatchSummary(
  results: Array<{ success: boolean }>
): { total: number; successes: number; failures: number } {
  const total = results.length
  const successes = results.filter((r) => r.success).length
  const failures = total - successes
  return { total, successes, failures }
}
