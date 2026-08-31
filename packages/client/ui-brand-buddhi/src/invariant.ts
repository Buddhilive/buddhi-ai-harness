/**
 * Package-owned invariant companion for `@buddhilive/bah-client-ui-brand`.
 * @module @buddhilive/bah-client-ui-brand/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@buddhilive/dsh-invariants'

const PACKAGE_NAME = '@buddhilive/bah-client-ui-brand'

/** Cordis companion plugin name. */
export const name = 'client-ui-brand-buddhi-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package retains no mutable state, and its
 * slot occupants install and leave through one transactional effect.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
