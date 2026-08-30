/**
 * Health probe utility for BuddhiAI Studio inferencing service.
 */

import { useEffect, useState } from 'react'

export interface BuddhiHealthStatus {
  online: boolean
  url: string
  models?: string[] | undefined
  error?: string | undefined
}

/**
 * Checks connectivity to BuddhiAI Studio by probing /health and /v1/models endpoints.
 */
export async function checkBuddhiStudioHealth(url = 'http://localhost:8765/v1'): Promise<BuddhiHealthStatus> {
  const cleanUrl = url.replace(/\/+$/, '')
  const baseOrigin = cleanUrl.replace(/\/v1$/, '')

  // Probe models endpoint first: fast (~50ms) and avoids SearXNG timeout on /health
  try {
    const modelsEndpoint = cleanUrl.endsWith('/v1') ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`
    const res = await fetch(modelsEndpoint, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = (await res.json()) as { data?: Array<{ id: string }> }
      return { online: true, url: cleanUrl, models: data.data?.map(m => m.id) }
    }
  } catch {
    // Fall back to /health endpoint with 5s timeout
    try {
      const res = await fetch(`${baseOrigin}/health`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        return { online: true, url: cleanUrl }
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Connection refused'
      return { online: false, url: cleanUrl, error }
    }
  }
  return { online: false, url: cleanUrl, error: 'Health check failed' }
}

/**
 * Reactive hook to probe BuddhiAI Studio health on mount and URL changes.
 */
export function useBuddhiHealth(url = 'http://localhost:8765/v1'): {
  status: 'checking' | 'online' | 'offline'
  error?: string | undefined
} {
  const [state, setState] = useState<{ status: 'checking' | 'online' | 'offline'; error?: string | undefined }>({
    status: 'checking',
  })

  useEffect(() => {
    let active = true
    setState({ status: 'checking' })
    void checkBuddhiStudioHealth(url)
      .then((res) => {
        if (!active) return
        setState({ status: res.online ? 'online' : 'offline', error: res.error })
      })
      .catch((err: unknown) => {
        if (!active) return
        setState({ status: 'offline', error: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      active = false
    }
  }, [url])

  return state
}
