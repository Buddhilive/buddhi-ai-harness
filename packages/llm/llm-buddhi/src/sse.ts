/**
 * SSE decoder for OpenAI-compatible streaming chat completions.
 * Frames chunks, ignores comments, handles BOM/CRLF, yields event data payloads,
 * and terminates when [DONE] is encountered.
 *
 * @module @buddhilive/bah-llm-buddhi/sse
 */

import { EventSourceParserStream } from 'eventsource-parser/stream'
import { LlmError } from '@buddhilive/dsh-llm'

export const DONE = '[DONE]'

/**
 * Parses an SSE byte stream into data payloads.
 * Yields [DONE] as the final sentinel value.
 * Throws LlmError('STREAM_CLOSED') if stream ends unexpectedly without [DONE].
 */
export async function* parseSse(
  stream: ReadableStream<BufferSource>,
  onComment?: (comment: string) => void,
): AsyncGenerator<string> {
  const events = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream({ onComment }))

  for await (const { data } of events) {
    yield data
    if (data === DONE) return
  }
  throw new LlmError('SSE stream ended without [DONE]', 'STREAM_CLOSED')
}
