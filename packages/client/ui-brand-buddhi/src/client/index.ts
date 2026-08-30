/**
 * BuddhiAI Harness brand occupants for generic browser-brand slots.
 *
 * @module @buddhilive/bah-client-ui-brand/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { BuddhiLogo } from './BuddhiLogo.tsx'
import { BuddhiWordmark } from './BuddhiWordmark.tsx'

export { BuddhiLogo } from './BuddhiLogo.tsx'
export { BuddhiWordmark } from './BuddhiWordmark.tsx'

export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', () =>
      ctx.slots.inject('conversation.hero.brand.mark', function* () {
        yield ctx.slots.register({ name: 'sidebar.brand.mark' }, BuddhiLogo)
        yield ctx.slots.register({ name: 'sidebar.brand.name' }, BuddhiWordmark)
        yield ctx.slots.register({ name: 'conversation.hero.brand.mark' }, BuddhiLogo)
      })))
}

export default {
  inject,
  apply,
}
