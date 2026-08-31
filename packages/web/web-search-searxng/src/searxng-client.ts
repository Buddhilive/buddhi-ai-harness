/**
 * SearXNG REST search client for BuddhiAI Studio.
 *
 * @module @buddhilive/bah-web-search-searxng/searxng-client
 */

import type { WebSearchRequest, WebSearchResult, WebSearchSource } from '@buddhilive/dsh-web'

export interface SearXNGClientOptions {
  baseURL?: string | undefined
  timeoutMs?: number | undefined
}

const DEFAULT_PORT_URL = 'http://localhost:8765'
const DEFAULT_TIMEOUT_MS = 10000

export function resolveSearXNGBaseURL(configured?: string): string {
  const envUrl = process.env.BUDDHI_STUDIO_URL || process.env.SEARXNG_URL
  const raw = configured || envUrl || DEFAULT_PORT_URL
  return raw.replace(/\/+$/, '')
}

export interface SearXNGRawItem {
  url: string
  title?: string
  content?: string
  snippet?: string
  publishedDate?: string
  publishedAt?: string
}

export interface SearXNGResponse {
  query?: string
  results?: SearXNGRawItem[]
  sources?: SearXNGRawItem[]
  answers?: string[]
}

/**
 * Normalizes raw SearXNG items into standard WebSearchSource objects.
 */
export function normalizeSearXNGResults(items: SearXNGRawItem[] = []): WebSearchSource[] {
  return items
    .filter(item => typeof item?.url === 'string' && item.url.trim().length > 0)
    .map(item => ({
      url: item.url,
      ...(item.title ? { title: item.title } : {}),
      ...(item.snippet || item.content ? { snippet: item.snippet || item.content } : {}),
      ...(item.publishedDate || item.publishedAt ? { publishedAt: item.publishedDate || item.publishedAt } : {}),
    }))
}

/**
 * Executes a search query against BuddhiAI Studio SearXNG REST endpoint.
 */
export async function executeSearXNGSearch(
  request: WebSearchRequest,
  options: SearXNGClientOptions = {},
  signal?: AbortSignal,
): Promise<WebSearchResult> {
  const baseURL = resolveSearXNGBaseURL(options.baseURL)
  const maxResults = request.maxResults ?? 10
  const searchUrl = new URL(`${baseURL}/v1/search`)
  searchUrl.searchParams.set('q', request.query)
  searchUrl.searchParams.set('max_results', String(maxResults))

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  try {
    const res = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`SearXNG search error (${res.status}): ${errText || res.statusText}`)
    }

    const data = (await res.json()) as SearXNGResponse
    const rawItems = data.results || data.sources || (Array.isArray(data) ? (data as unknown as SearXNGRawItem[]) : [])
    const sources = normalizeSearXNGResults(rawItems)

    const truncated = maxResults !== undefined && sources.length > maxResults
    const boundedSources = truncated ? sources.slice(0, maxResults) : sources
    const content = data.answers && data.answers.length > 0 ? data.answers.join('\n') : undefined

    return {
      ...(content ? { content } : {}),
      sources: boundedSources,
      truncated,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
