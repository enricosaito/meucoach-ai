// Module boundary rules for packages/core.
import boundaries from 'eslint-plugin-boundaries'

/**
 * Inside packages/core/src:
 *  - files may import anything inside their own module
 *  - other modules may only be imported through their public `index.ts` (server API) or
 *    `contracts.ts` (client-safe subset)
 *  - `shared` may be imported by any module through its `index.ts`; `shared` never imports modules
 */
export function moduleBoundariesConfig() {
  return [
    {
      files: ['src/**/*.ts'],
      plugins: { boundaries },
      settings: {
        'import/resolver': { typescript: { alwaysTryTypes: true } },
        'boundaries/include': ['src/**/*.ts'],
        'boundaries/elements': [
          { type: 'shared', pattern: 'src/shared' },
          { type: 'module', pattern: 'src/modules/*', capture: ['moduleName'] },
        ],
      },
      rules: {
        'boundaries/no-unknown-files': 'error',
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            policies: [
              { allow: { dependency: { relationship: { to: 'internal' } } } },
              {
                from: { element: { type: 'module' } },
                allow: {
                  to: { element: { type: 'module', fileInternalPath: '{index,contracts}.ts' } },
                },
              },
              {
                from: { element: { type: 'module' } },
                allow: { to: { element: { type: 'shared', fileInternalPath: 'index.ts' } } },
              },
            ],
          },
        ],
      },
    },
  ]
}
