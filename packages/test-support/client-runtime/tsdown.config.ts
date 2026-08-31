import { clientLibrary } from '../../client/tsdown.client.ts'

export default clientLibrary(
  '@buddhilive/dsh-client-test-runtime',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
