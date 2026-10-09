import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // UI code may only use the client-safe `contracts` entry points of core modules, and must
      // never import server-only code (admin client, API internals). Writes go through the API client.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@mycoach/core(/(?![a-z-]+/contracts$).*)?$',
              message: 'UI code may only import @mycoach/core/<module>/contracts.',
            },
            {
              group: ['@mycoach/db/admin', '@mycoach/api', '@mycoach/api/*'],
              message: 'Server-only. Use the API client (src/lib/api.ts) instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // The only place allowed to construct the API (and with it the service-role client).
    files: ['src/server/**'],
    rules: { '@typescript-eslint/no-restricted-imports': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
