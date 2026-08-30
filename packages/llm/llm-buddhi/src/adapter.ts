/**
 * BuddhiAI Studio LLM adapter for OpenAI-compatible chat completions.
 *
 * @module @buddhilive/bah-llm-buddhi/adapter
 */

import {
  LlmAdapter,
  LlmError,
  attributionHeaders,
  ToolCallId,
  type GenerateOptions,
  type LlmModelInfo,
  type LlmProviderInfo,
  type LlmResolvedModelInfo,
  type StreamChunk,
  type TokenUsage,
  type ToolCallBlock,
} from '@deepseek-ai/dsh-llm'
import { parseSse } from './sse.ts'

export interface BuddhiAdapterOptions {
  baseURL?: string | undefined
  apiKey?: string | undefined
  apiKeyEnv?: string | undefined
  defaultContextWindow?: number | undefined
  defaultMaxTokens?: number | undefined
}

const DEFAULT_PORT_URL = 'http://localhost:8765/v1'
const DEFAULT_MODELS = ['gemma-4-e4b', 'gemma-3-1b']
const DEFAULT_CONTEXT_WINDOW = 128000
const DEFAULT_MAX_TOKENS = 8192

export function resolveBaseURL(configured?: string): string {
  const envUrl = process.env.BUDDHI_STUDIO_URL || process.env.BUDDHI_STUDIO_BASE_URL
  const raw = configured || (envUrl ? (envUrl.endsWith('/v1') ? envUrl : `${envUrl.replace(/\/+$/, '')}/v1`) : DEFAULT_PORT_URL)
  return raw.replace(/\/+$/, '')
}

interface OpenAIMessage {
  role: string
  content?: string
  name?: string
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
}

interface OpenAIChunkUsage {
  prompt_tokens?: number
  completion_tokens?: number
  reasoning_tokens?: number
}

interface OpenAIChunkChoice {
  finish_reason?: string | null
  delta?: {
    content?: string | null
    reasoning_content?: string | null
    thinking?: string | null
    tool_calls?: Array<{
      index?: number
      id?: string
      function?: {
        name?: string
        arguments?: string
      }
    }>
  }
}

interface OpenAIStreamChunk {
  usage?: OpenAIChunkUsage
  choices?: OpenAIChunkChoice[]
}

/**
 * Serializes harness messages and tool definitions into standard OpenAI chat completion messages.
 */
export function serializeMessages(options: GenerateOptions): OpenAIMessage[] {
  const result: OpenAIMessage[] = []

  if (options.system) {
    result.push({ role: 'system', content: options.system })
  }

  for (const msg of options.messages) {
    if (msg.role === 'assistant') {
      let textContent = ''
      const toolCalls: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> = []

      for (const block of msg.content) {
        if (block.type === 'text') {
          textContent += block.text
        } else if (block.type === 'tool-call') {
          toolCalls.push({
            id: String(block.id),
            type: 'function',
            function: {
              name: block.name,
              arguments: block.arguments,
            },
          })
        }
      }

      const assistantMsg: OpenAIMessage = { role: 'assistant' }
      if (textContent) assistantMsg.content = textContent
      if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls
      result.push(assistantMsg)
    } else if (msg.role === 'user') {
      const toolResults = msg.content.filter(b => b.type === 'tool-result')
      if (toolResults.length > 0) {
        for (const tr of toolResults) {
          if (tr.type === 'tool-result') {
            const contentText = tr.content
              .filter(b => b.type === 'text')
              .map(b => (b as { text: string }).text)
              .join('\n') || (tr.isError ? 'Error executing tool' : 'Success')
            result.push({
              role: 'tool',
              tool_call_id: String(tr.toolCallId),
              content: contentText,
            })
          }
        }
      } else {
        const text = msg.content
          .filter(b => b.type === 'text')
          .map(b => (b as { text: string }).text)
          .join('\n')
        result.push({ role: 'user', content: text })
      }
    } else if (msg.role === 'system') {
      const text = msg.content
        .filter(b => b.type === 'text')
        .map(b => (b as { text: string }).text)
        .join('\n')
      result.push({ role: 'system', content: text })
    }
  }

  return result
}

export class BuddhiAdapter extends LlmAdapter {
  constructor(private readonly options: () => BuddhiAdapterOptions) {
    super()
  }

  override providerInfo(provider: string): LlmProviderInfo {
    return { id: provider, name: 'BuddhiAI Studio' }
  }

  override async listModels(provider: string): Promise<readonly LlmModelInfo[]> {
    const baseURL = resolveBaseURL(this.options().baseURL)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(`${baseURL}/models`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timer)

      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ id: string; name?: string }> }
        if (Array.isArray(data.data) && data.data.length > 0) {
          return data.data.map(m => ({
            provider,
            id: m.id,
            name: m.name || m.id,
          }))
        }
      }
    } catch {
      // Fall through to defaults when server is not running during listing
    }

    return DEFAULT_MODELS.map(id => ({
      provider,
      id,
      name: id,
    }))
  }

  override async resolveModel(
    provider: string,
    model: string,
    _signal?: AbortSignal,
  ): Promise<LlmResolvedModelInfo> {
    const opts = this.options()
    return {
      provider,
      id: model,
      name: model,
      context: {
        contextWindow: opts.defaultContextWindow ?? DEFAULT_CONTEXT_WINDOW,
      },
      defaultMaxTokens: opts.defaultMaxTokens ?? DEFAULT_MAX_TOKENS,
    }
  }

  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const baseURL = resolveBaseURL(this.options().baseURL)
    const url = `${baseURL}/chat/completions`

    const messages = serializeMessages(options)
    const body: Record<string, unknown> = {
      model: options.model,
      messages,
      stream: true,
      enable_thinking: options.reasoningEffort !== undefined,
    }

    if (options.temperature !== undefined) body.temperature = options.temperature
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
    if (options.stop !== undefined && options.stop.length > 0) body.stop = options.stop

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }))
    }

    const headers: Record<string, string> = {
      ...attributionHeaders(),
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }

    const apiKey = this.options().apiKey
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: options.signal ?? null,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new LlmError(`Failed to connect to BuddhiAI Studio at ${url}: ${msg}`, 'TRANSPORT', { cause: err })
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new LlmError(
        `BuddhiAI Studio error (${response.status}): ${errorText || response.statusText}`,
        response.status === 401 ? 'AUTH' : 'SERVER',
        { status: response.status },
      )
    }

    if (!response.body) {
      throw new LlmError('Empty response body from BuddhiAI Studio', 'EMPTY_RESPONSE')
    }

    let currentBlockType: 'text' | 'reasoning' | 'tool-call' | null = null
    let blockIndex = 0
    let accumulatedText = ''
    let accumulatedReasoning = ''
    const toolCallAccumulators: Map<number, { id: string; name: string; args: string }> = new Map()
    let finishReasonKind: 'stop' | 'tool-calls' | 'max-tokens' = 'stop'

    for await (const chunkText of parseSse(response.body)) {
      if (!chunkText || chunkText === '[DONE]') continue

      let chunkData: OpenAIStreamChunk
      try {
        chunkData = JSON.parse(chunkText) as OpenAIStreamChunk
      } catch {
        continue
      }

      if (chunkData.usage) {
        const u = chunkData.usage
        const usage: TokenUsage = {
          inputTokens: u.prompt_tokens ?? 0,
          outputTokens: u.completion_tokens ?? 0,
        }
        if (u.reasoning_tokens) usage.reasoningTokens = u.reasoning_tokens
        yield { type: 'usage', usage }
      }

      const choice = chunkData.choices?.[0]
      if (!choice) continue

      if (choice.finish_reason) {
        if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call') {
          finishReasonKind = 'tool-calls'
        } else if (choice.finish_reason === 'length') {
          finishReasonKind = 'max-tokens'
        }
      }

      const delta = choice.delta
      if (!delta) continue

      // Handle reasoning / thinking content
      const reasoningDelta = delta.reasoning_content || delta.thinking
      if (reasoningDelta) {
        if (currentBlockType !== 'reasoning') {
          if (currentBlockType === 'text' && accumulatedText) {
            yield {
              type: 'block-end',
              index: blockIndex,
              block: { type: 'text', text: accumulatedText },
            }
            blockIndex++
            accumulatedText = ''
          }
          currentBlockType = 'reasoning'
          yield { type: 'block-start', index: blockIndex, blockType: 'reasoning' }
        }
        accumulatedReasoning += reasoningDelta
        yield { type: 'reasoning-delta', index: blockIndex, text: reasoningDelta }
      }

      // Handle text content
      if (delta.content) {
        if (currentBlockType !== 'text') {
          if (currentBlockType === 'reasoning' && accumulatedReasoning) {
            yield {
              type: 'block-end',
              index: blockIndex,
              block: { type: 'reasoning', text: accumulatedReasoning },
            }
            blockIndex++
            accumulatedReasoning = ''
          }
          currentBlockType = 'text'
          yield { type: 'block-start', index: blockIndex, blockType: 'text' }
        }
        accumulatedText += delta.content
        yield { type: 'text-delta', index: blockIndex, text: delta.content }
      }

      // Handle tool calls
      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const tcIdx = tc.index ?? 0
          let acc = toolCallAccumulators.get(tcIdx)
          if (!acc) {
            if (currentBlockType === 'text' && accumulatedText) {
              yield {
                type: 'block-end',
                index: blockIndex,
                block: { type: 'text', text: accumulatedText },
              }
              blockIndex++
              accumulatedText = ''
            }
            acc = { id: tc.id || `call_${Date.now()}_${tcIdx}`, name: tc.function?.name || '', args: '' }
            toolCallAccumulators.set(tcIdx, acc)
            currentBlockType = 'tool-call'
            yield { type: 'block-start', index: blockIndex + tcIdx, blockType: 'tool-call' }
          }
          if (tc.function?.name && !acc.name) acc.name = tc.function.name
          const argsDelta = tc.function?.arguments || ''
          acc.args += argsDelta
          yield {
            type: 'tool-call-delta',
            index: blockIndex + tcIdx,
            id: ToolCallId(acc.id),
            name: acc.name,
            argumentsDelta: argsDelta,
          }
        }
      }
    }

    // Close any open block
    if (currentBlockType === 'text') {
      yield {
        type: 'block-end',
        index: blockIndex,
        block: { type: 'text', text: accumulatedText },
      }
    } else if (currentBlockType === 'reasoning') {
      yield {
        type: 'block-end',
        index: blockIndex,
        block: { type: 'reasoning', text: accumulatedReasoning },
      }
    } else if (toolCallAccumulators.size > 0) {
      for (const [tcIdx, acc] of toolCallAccumulators) {
        const block: ToolCallBlock = {
          type: 'tool-call',
          id: ToolCallId(acc.id),
          name: acc.name,
          arguments: acc.args,
        }
        yield {
          type: 'block-end',
          index: blockIndex + tcIdx,
          block,
        }
      }
    }

    yield {
      type: 'finish',
      reason: { kind: finishReasonKind },
    }
  }
}
