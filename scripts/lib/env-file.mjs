// Reads a git-ignored `KEY=value` file from the repo root (e.g. `.env.supabase.local`).
// Secrets in these files are passed to tools, never printed.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Returns the variables in `fileName`, or exits with `help` if the file or `required` is missing. */
export function loadEnvFile(fileName, required, help) {
  const file = join(repoRoot, fileName)
  if (!existsSync(file)) {
    console.error(`Missing ${fileName}. ${help}`)
    process.exit(1)
  }
  const vars = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (match?.[1]) vars[match[1]] = (match[2] ?? '').replace(/^(['"])(.*)\1$/, '$2')
  }
  if (!vars[required]) {
    console.error(`${fileName} has no ${required}. ${help}`)
    process.exit(1)
  }
  return vars
}
