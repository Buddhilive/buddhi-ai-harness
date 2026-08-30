/**
 * Health probe utility for BuddhiAI Studio inferencing service.
 */

export interface BuddhiHealthStatus {
  online: boolean
  url: string
  models?: string[] | undefined
  error?: string | undefined
}

/**
 * Checks connectivity to BuddhiAI Studio by probing /health and /v1/models endpoints.
 */
export async function checkBuddhiStudioHealth(url = 'http://localhost:8765'): Promise<BuddhiHealthStatus> {
  const cleanUrl = url.replace(/\/+$/, '')
  try {
    const res = await fetch(`${cleanUrl}/health`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      return { online: true, url: cleanUrl }
    }
  } catch {
    // Try probing /v1/models
    try {
      const res = await fetch(`${cleanUrl}/v1/models`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ id: string }> }
        return { online: true, url: cleanUrl, models: data.data?.map(m => m.id) }
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Connection refused'
      return { online: false, url: cleanUrl, error }
    }
  }
  return { online: false, url: cleanUrl, error: 'Health check failed' }
}
