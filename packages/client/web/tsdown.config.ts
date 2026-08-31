import { staticLinked } from '../tsdown.client.ts'

export default staticLinked(
  '@buddhilive/dsh-client-web',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
