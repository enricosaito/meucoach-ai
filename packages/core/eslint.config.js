import { baseConfig } from '@mycoach/config/eslint'
import { moduleBoundariesConfig } from '@mycoach/config/eslint/boundaries'

export default [
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...moduleBoundariesConfig(),
]
