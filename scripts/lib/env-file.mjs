// Reads git-ignored `KEY=value` files from the repo root (`.env.local`, or a tool-specific
// `.env.<tool>.local`). Secrets in these files are passed to tools, never printed.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function parse(file) {
  const vars = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (match?.[1]) vars[match[1].toUpperCase()] = (match[2] ?? '').replace(/^(['"])(.*)\1$/, '$2')
  }
  return vars
}

/**
 * Returns the variables of the first file in `fileNames` that defines `required`, or exits with
 * `help`. Keys are matched case-insensitively.
 */
export function loadEnvFile(fileNames, required, help) {
  for (const fileName of fileNames) {
    const file = join(repoRoot, fileName)
    if (!existsSync(file)) continue
    const vars = parse(file)
    if (vars[required]) return { [required]: vars[required] }
  }
  console.error(`${required} not found in ${fileNames.join(' or ')}. ${help}`)
  process.exit(1)
}
