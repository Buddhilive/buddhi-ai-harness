/**
 * Rescope all `@deepseek-ai/dsh-*` packages to `@buddhilive/dsh-*` across the repository.
 *
 * Usage:
 *   pnpm run rescope-dsh          # dry-run
 *   pnpm run rescope-dsh --apply  # apply changes to disk
 *   pnpm run rescope-dsh:check    # verify zero residual @deepseek-ai/dsh- tokens
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(import.meta.dirname, '..')

const EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.tpl', '.json', '.yml', '.yaml', '.md', '.py'] as const

/** Files the rescope must never rewrite. */
function excluded(file: string): boolean {
  if (file === 'scripts/rescope-dsh.ts') return true
  if (file === 'scripts/rescope-vendor.ts') return true
  if (file.startsWith('vendor/')) return true
  if (file.startsWith('.agents/notes/')) return true
  if (file.startsWith('scripts/snapshots/')) return true
  if (file === 'docs/rescope.md' || file === 'docs/rescope.zh.md') return true
  if (file.endsWith('.i18n.yaml')) return true
  if (file === 'pnpm-lock.yaml') return true
  if (file.startsWith('dist/') || file.startsWith('.buddhi/')) return true
  return !EXTENSIONS.some(extension => file.endsWith(extension))
}

interface ExactEdit {
  readonly id: string
  readonly file: string
  readonly find: string
  readonly replace: string
  readonly expect: number
}

const EXACT_EDITS: readonly ExactEdit[] = [
  {
    id: 'cli-readme-title',
    file: 'apps/cli/README.md',
    find: '# `@deepseek-ai/dsh`',
    replace: '# `buddhi-ai`',
    expect: 1,
  },
  {
    id: 'cli-readme-zh-title',
    file: 'apps/cli/README.zh.md',
    find: '# `@deepseek-ai/dsh`',
    replace: '# `buddhi-ai`',
    expect: 1,
  },
  {
    id: 'check-workspace-constraints-app-pkg',
    file: 'scripts/check-workspace-constraints.ts',
    find: "  '@deepseek-ai/dsh': ['lib/*.js'],\n",
    replace: '',
    expect: 1,
  },
  {
    id: 'check-workspace-constraints-app-starts-with',
    file: 'scripts/check-workspace-constraints.ts',
    find: "if (dir.startsWith('apps/') && (manifest.name?.startsWith('@deepseek-ai/') || manifest.name === 'buddhi-ai')) {",
    replace: "if (dir.startsWith('apps/') && (manifest.name?.startsWith('@deepseek-ai/') || manifest.name?.startsWith('@buddhilive/') || manifest.name === 'buddhi-ai')) {",
    expect: 1,
  },
  {
    id: 'check-workspace-constraints-published-repo',
    file: 'scripts/check-workspace-constraints.ts',
    find: "const publishedRepositoryUrl = 'git+https://github.com/deepseek-ai/deepseek-harness.git'",
    replace: "const publishedRepositoryUrl = 'git+https://github.com/Buddhilive/buddhi-ai-harness.git'",
    expect: 1,
  },
  {
    id: 'verify-dsh-licenses-pkg-name',
    file: 'scripts/verify-dsh-package-licenses.ts',
    find: 'const DSH_PACKAGE_NAME = /^@deepseek-ai\\/dsh(?:-|$)/',
    replace: 'const DSH_PACKAGE_NAME = /^(?:@deepseek-ai|@buddhilive)\\/dsh(?:-|$)/',
    expect: 1,
  },
]

export type ExactEditState = 'pending' | 'applied' | 'invalid'

export function exactEditState(text: string, find: string, replace: string, expect: number): ExactEditState {
  const hits = text.split(find).length - 1
  if (replace === '') {
    return hits === 0 ? 'applied' : hits === expect ? 'pending' : 'invalid'
  }
  const landed = text.split(replace).length - 1
  if (replace.includes(find)) {
    if (landed === expect) return 'applied'
    return landed === 0 && hits === expect ? 'pending' : 'invalid'
  }
  if (find.includes(replace)) {
    if (hits === 0) return landed === expect ? 'applied' : 'invalid'
    return hits === expect ? 'pending' : 'invalid'
  }
  if (hits === 0 && landed === expect) return 'applied'
  return hits === expect && landed === 0 ? 'pending' : 'invalid'
}

interface PostCondition {
  readonly file: string
  readonly text: string
  readonly count: number
}

const POSTCONDITIONS: readonly PostCondition[] = [
  { file: 'package.json', text: '"name": "@buddhilive/dsh-root"', count: 1 },
  { file: 'packages/bundle/base/package.json', text: '"name": "@buddhilive/dsh-base"', count: 1 },
  { file: 'packages/bundle/web-app/package.json', text: '"name": "@buddhilive/dsh-web-app"', count: 1 },
  { file: 'packages/boot/app-boot/src/profile.ts', text: "'@buddhilive/dsh-base'", count: 6 },
  { file: 'scripts/release/families.ts', text: "const WORKSPACE_ROOT_PACKAGE = '@buddhilive/dsh-root'", count: 1 },
  { file: 'scripts/gen-tsconfig-paths.ts', text: "const PREFIX = '@buddhilive/dsh-'", count: 1 },
  { file: 'apps/cli/README.md', text: '# `buddhi-ai`', count: 1 },
]

function rewrite(text: string, file: string): { text: string; changed: boolean } {
  let out = text

  // Primary rename: @deepseek-ai/dsh- -> @buddhilive/dsh-
  if (out.includes('@deepseek-ai/dsh-')) {
    out = out.split('@deepseek-ai/dsh-').join('@buddhilive/dsh-')
  }

  // In package.json manifests, update repository URL to Buddhilive repo
  if (file.endsWith('package.json')) {
    if (out.includes('git+https://github.com/deepseek-ai/deepseek-harness.git')) {
      out = out.split('git+https://github.com/deepseek-ai/deepseek-harness.git').join('git+https://github.com/Buddhilive/buddhi-ai-harness.git')
    }
  }

  // Markdown anchor slugs
  if (out.includes('#deepseek-aidsh-')) {
    out = out.split('#deepseek-aidsh-').join('#buddhilivedsh-')
  }

  return { text: out, changed: out !== text }
}

function classify(file: string): string {
  if (file.endsWith('package.json')) return 'package.json manifests'
  if (/\.(ts|tsx|js|mjs|cjs|tpl)$/.test(file)) return 'TypeScript / JavaScript'
  if (/\.(yml|yaml)$/.test(file)) return 'YAML configuration'
  if (file.endsWith('.json')) return 'JSON files'
  if (file.endsWith('.py')) return 'Python sources'
  return 'Markdown documentation'
}

function main(): void {
  const args = process.argv.slice(2)
  const mode = args.includes('--apply') ? 'apply' : args.includes('--check') ? 'check' : 'dry'

  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(file => file !== '' && !excluded(file))

  const counts = new Map<string, { files: number }>()
  const failures: string[] = []
  const outstanding: string[] = []

  // Check and plan exact edits
  const planned: { edit: ExactEdit; path: string; find: string; replace: string }[] = []
  for (const edit of EXACT_EDITS) {
    const path = resolve(root, edit.file)
    if (!existsSync(path)) {
      failures.push(`exact edit ${edit.id}: file ${edit.file} does not exist`)
      continue
    }
    const before = readFileSync(path, 'utf8')
    const state = exactEditState(before, edit.find, edit.replace, edit.expect)
    if (state === 'invalid') {
      failures.push(`exact edit ${edit.id}: ${edit.file} is neither pending nor cleanly applied`)
      continue
    }
    if (mode === 'check') {
      if (state !== 'applied') failures.push(`exact edit ${edit.id} did not land in ${edit.file}`)
      continue
    }
    if (state === 'pending') planned.push({ edit, path, find: edit.find, replace: edit.replace })
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`rescope-dsh: ${failure}`)
    console.error(`rescope-dsh: ${String(failures.length)} problem(s); nothing was written.`)
    process.exitCode = 1
    return
  }

  // Apply exact edits
  if (mode === 'apply') {
    for (const { path, find, replace } of planned) {
      writeFileSync(path, readFileSync(path, 'utf8').split(find).join(replace))
    }
  }

  // Generic rewrite pass
  for (const file of files) {
    const path = resolve(root, file)
    const before = readFileSync(path, 'utf8')
    const { text: after, changed } = rewrite(before, file)
    if (!changed) continue
    outstanding.push(file)
    const kind = classify(file)
    const current = counts.get(kind) ?? { files: 0 }
    counts.set(kind, { files: current.files + 1 })
    if (mode === 'apply') writeFileSync(path, after)
  }

  console.log(`rescope-dsh: ${mode} over ${String(files.length)} tracked files`)
  for (const kind of [...counts.keys()].sort()) {
    const { files: count } = counts.get(kind) ?? { files: 0 }
    console.log(`  ${kind.padEnd(26)} ${String(count).padStart(4)} file(s)`)
  }

  if (mode !== 'dry') {
    for (const check of POSTCONDITIONS) {
      const path = resolve(root, check.file)
      const hits = existsSync(path) ? readFileSync(path, 'utf8').split(check.text).length - 1 : -1
      if (hits !== check.count) {
        failures.push(`postcondition: ${check.file} has ${String(hits)} occurrence(s) of ${JSON.stringify(check.text)}, expected ${String(check.count)}`)
      }
    }
    if (mode === 'check') {
      for (const file of outstanding) failures.push(`residue: ${file} still carries a pre-rescope @deepseek-ai/dsh- token`)
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`rescope-dsh: ${failure}`)
    console.error(`rescope-dsh: ${String(failures.length)} problem(s).`)
    process.exitCode = 1
  } else if (mode === 'check') {
    console.log('rescope-dsh: post-state verified — no residue, every exact edit landed, idempotent.')
  } else if (mode === 'apply') {
    console.log('rescope-dsh: applied successfully.')
  }
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
