/**
 * BuddhiAI Studio LLM provider plugin for the BuddhiAI Harness LLM seam (ctx.llm).
 * Registers the 'buddhi-studio' provider route pointing to a local or configured
 * BuddhiAI Studio inferencing instance.
 *
 * @module @buddhilive/bah-llm-buddhi
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { BuddhiAdapter, resolveBaseURL, type BuddhiAdapterOptions } from './adapter.ts'

export const name = 'llm-buddhi'
export const inject = ['llm']

export const PROVIDER = 'buddhi-studio'
export const SETTINGS_NS: SettingsNamespace = 'llm-buddhi' as SettingsNamespace

export interface Config {
  baseURL?: string
  apiKey?: string
  apiKeyEnv?: string
  defaultContextWindow?: number
  defaultMaxTokens?: number
}

export const Config: z<Config> = z.object({
  baseURL: z.string().default('http://localhost:8765/v1').description('Base URL of the BuddhiAI Studio API (e.g. http://localhost:8765/v1)'),
  apiKey: z.string().description('Optional API key if BuddhiAI Studio requires authentication'),
  apiKeyEnv: z.string().description('Optional environment variable reference for API key'),
  defaultContextWindow: z.number().default(128000),
  defaultMaxTokens: z.number().default(8192),
})

export function apply(ctx: Context, config: Config = {}): void {
  let current: () => Config = () => config

  const getOptions = (): BuddhiAdapterOptions => {
    const cfg = current()
    return {
      baseURL: resolveBaseURL(cfg.baseURL),
      apiKey: cfg.apiKey,
      apiKeyEnv: cfg.apiKeyEnv,
      defaultContextWindow: cfg.defaultContextWindow,
      defaultMaxTokens: cfg.defaultMaxTokens,
    }
  }

  const adapter = new BuddhiAdapter(getOptions)

  ctx.llm.registerConfigurableProviders([
    {
      provider: PROVIDER,
      displayName: 'BuddhiAI Studio',
      settingsNs: SETTINGS_NS,
      settingsPath: [],
    },
  ])

  ctx.llm.registerModelDiscovery(SETTINGS_NS, async (req) => {
    const baseURL = resolveBaseURL(req.baseURL || current().baseURL)
    try {
      const res = await fetch(`${baseURL}/models`, {
        headers: {
          Accept: 'application/json',
          ...(req.apiKey ? { Authorization: `Bearer ${req.apiKey}` } : {}),
        },
      })
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ id: string; name?: string }> }
        if (Array.isArray(data.data)) {
          return data.data.map(m => ({ id: m.id, name: m.name || m.id }))
        }
      }
    } catch {
      // Fallback if probe fails
    }
    return [{ id: 'gemma-4-e4b' }, { id: 'gemma-3-1b' }]
  })

  ctx.llm.registerAdapter([PROVIDER], adapter)

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NS, Config, config, {
      setSource: (source) => {
        current = source
      },
      onChange: () => {},
    })
  })
}

export default {
  name,
  inject,
  Config,
  apply,
}
