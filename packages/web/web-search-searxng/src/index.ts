/**
 * SearXNG search provider plugin for the BuddhiAI Harness web seam (ctx.web).
 * Connects to BuddhiAI Studio SearXNG REST search service on port 8765 or BUDDHI_STUDIO_URL.
 *
 * @module @buddhilive/bah-web-search-searxng
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@buddhilive/dsh-web'
import { executeSearXNGSearch, resolveSearXNGBaseURL, type SearXNGClientOptions } from './searxng-client.ts'

export const name = 'web-search-searxng'
export const inject = ['web']
export const SEARXNG_PROVIDER_ID = 'searxng'

export interface Config {
  /** Base URL of the BuddhiAI Studio or SearXNG instance. */
  baseURL?: string
  /** Request timeout in milliseconds. */
  timeoutMs?: number
}

export const Config: z<Config> = z.object({
  baseURL: z.string().description('Base URL of the BuddhiAI Studio or SearXNG instance (default: http://localhost:8765)'),
  timeoutMs: z.number().default(10000).description('Request timeout in milliseconds'),
})

export class SearXNGSearchProvider implements WebSearchProvider {
  readonly id = SEARXNG_PROVIDER_ID

  constructor(private readonly options: () => SearXNGClientOptions) {}

  available(): boolean {
    return true
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    return executeSearXNGSearch(request, this.options(), signal)
  }
}

export function apply(ctx: Context, config: Config = {}): void {
  const currentConfig = config

  const getOptions = (): SearXNGClientOptions => ({
    baseURL: resolveSearXNGBaseURL(currentConfig.baseURL),
    timeoutMs: currentConfig.timeoutMs,
  })

  const provider = new SearXNGSearchProvider(getOptions)
  ctx.web.registerSearchProvider(provider)
}

export default {
  name,
  inject,
  Config,
  apply,
}
