import { describe, expect, it } from 'vitest'
import { resolveBaseURL, serializeMessages, BuddhiAdapter } from '../src/adapter.ts'
import { parseSse } from '../src/sse.ts'
import type { GenerateOptions } from '@buddhilive/dsh-llm'
import { MessageId, ToolCallId } from '@buddhilive/dsh-llm'

describe('BuddhiAdapter base URL resolution', () => {
  it('falls back to default http://localhost:8765/v1 when nothing is set', () => {
    const original = process.env.BUDDHI_STUDIO_URL
    delete process.env.BUDDHI_STUDIO_URL
    try {
      expect(resolveBaseURL()).toBe('http://localhost:8765/v1')
    } finally {
      if (original) process.env.BUDDHI_STUDIO_URL = original
    }
  })

  it('uses configured baseURL when provided', () => {
    expect(resolveBaseURL('http://custom-host:9999/v1/')).toBe('http://custom-host:9999/v1')
  })

  it('reads from BUDDHI_STUDIO_URL environment variable', () => {
    const original = process.env.BUDDHI_STUDIO_URL
    process.env.BUDDHI_STUDIO_URL = 'http://studio:8765'
    try {
      expect(resolveBaseURL()).toBe('http://studio:8765/v1')
    } finally {
      if (original) process.env.BUDDHI_STUDIO_URL = original
      else delete process.env.BUDDHI_STUDIO_URL
    }
  })
})

describe('serializeMessages', () => {
  it('serializes system, user, and assistant messages', () => {
    const options: GenerateOptions = {
      provider: 'buddhi-studio',
      model: 'gemma-4-e4b',
      system: 'You are an AI assistant.',
      messages: [
        {
          id: MessageId('msg-1'),
          role: 'user',
          content: [{ type: 'text', text: 'Hello!' }],
          source: { kind: 'user' },
        },
        {
          id: MessageId('msg-2'),
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
          source: { kind: 'model', provider: 'buddhi-studio', model: 'gemma-4-e4b' },
        },
      ],
    }

    const serialized = serializeMessages(options)
    expect(serialized).toEqual([
      { role: 'system', content: 'You are an AI assistant.' },
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'Hi there!' },
    ])
  })

  it('serializes tool results to role: tool', () => {
    const options: GenerateOptions = {
      provider: 'buddhi-studio',
      model: 'gemma-4-e4b',
      messages: [
        {
          id: MessageId('msg-3'),
          role: 'user',
          content: [
            {
              type: 'tool-result',
              toolCallId: ToolCallId('call_123'),
              content: [{ type: 'text', text: 'Tool output 42' }],
            },
          ],
          source: { kind: 'tool', callId: ToolCallId('call_123') },
        },
      ],
    }

    const serialized = serializeMessages(options)
    expect(serialized).toEqual([
      { role: 'tool', tool_call_id: 'call_123', content: 'Tool output 42' },
    ])
  })
})

describe('BuddhiAdapter model resolution', () => {
  it('resolves model with default capacity', async () => {
    const adapter = new BuddhiAdapter(() => ({}))
    const resolved = await adapter.resolveModel('buddhi-studio', 'gemma-4-e4b')
    expect(resolved.id).toBe('gemma-4-e4b')
    expect(resolved.provider).toBe('buddhi-studio')
    expect(resolved.context?.contextWindow).toBe(128000)
    expect(resolved.defaultMaxTokens).toBe(8192)
  })
})

describe('parseSse', () => {
  it('parses text stream and terminates at [DONE]', async () => {
    const text = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'
    const stream = new ReadableStream<BufferSource>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text))
        controller.close()
      },
    })

    const chunks: string[] = []
    for await (const chunk of parseSse(stream)) {
      chunks.push(chunk)
    }

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toContain('"content":"Hello"')
    expect(chunks[1]).toBe('[DONE]')
  })
})
