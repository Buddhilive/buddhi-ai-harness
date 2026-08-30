import { describe, expect, it } from 'vitest'
import {
  normalizeSearXNGResults,
  resolveSearXNGBaseURL,
  type SearXNGRawItem,
} from '../src/searxng-client.ts'
import { SearXNGSearchProvider } from '../src/index.ts'

describe('resolveSearXNGBaseURL', () => {
  it('falls back to default http://localhost:8765 when nothing is set', () => {
    const original = process.env.BUDDHI_STUDIO_URL
    delete process.env.BUDDHI_STUDIO_URL
    try {
      expect(resolveSearXNGBaseURL()).toBe('http://localhost:8765')
    } finally {
      if (original) process.env.BUDDHI_STUDIO_URL = original
    }
  })

  it('uses configured baseURL when provided', () => {
    expect(resolveSearXNGBaseURL('http://custom-search:8080/')).toBe('http://custom-search:8080')
  })

  it('reads from BUDDHI_STUDIO_URL environment variable', () => {
    const original = process.env.BUDDHI_STUDIO_URL
    process.env.BUDDHI_STUDIO_URL = 'http://127.0.0.1:8765'
    try {
      expect(resolveSearXNGBaseURL()).toBe('http://127.0.0.1:8765')
    } finally {
      if (original) process.env.BUDDHI_STUDIO_URL = original
      else delete process.env.BUDDHI_STUDIO_URL
    }
  })
})

describe('normalizeSearXNGResults', () => {
  it('filters out items without valid url', () => {
    const raw: SearXNGRawItem[] = [
      { url: '' },
      { url: '   ' },
      { url: 'https://example.com/a', title: 'Example A' },
    ]
    const normalized = normalizeSearXNGResults(raw)
    expect(normalized).toHaveLength(1)
    expect(normalized[0]!.url).toBe('https://example.com/a')
    expect(normalized[0]!.title).toBe('Example A')
  })

  it('correctly maps title, snippet, and publishedAt', () => {
    const raw: SearXNGRawItem[] = [
      {
        url: 'https://buddhi.live/docs',
        title: 'Buddhi AI Documentation',
        content: 'Official docs for Buddhi AI ecosystem',
        publishedDate: '2026-08-30T00:00:00Z',
      },
    ]
    const normalized = normalizeSearXNGResults(raw)
    expect(normalized).toEqual([
      {
        url: 'https://buddhi.live/docs',
        title: 'Buddhi AI Documentation',
        snippet: 'Official docs for Buddhi AI ecosystem',
        publishedAt: '2026-08-30T00:00:00Z',
      },
    ])
  })
})

describe('SearXNGSearchProvider', () => {
  it('reports available=true', () => {
    const provider = new SearXNGSearchProvider(() => ({}))
    expect(provider.id).toBe('searxng')
    expect(provider.available()).toBe(true)
  })
})
