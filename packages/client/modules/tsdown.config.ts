import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@buddhilive/dsh-client-modules',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
