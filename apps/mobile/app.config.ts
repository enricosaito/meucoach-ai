import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * App variants on top of app.json, picked by APP_VARIANT (set per profile in eas.json):
 * - development: dev-client build with its own name and a TEMPORARY identifier, installable next
 *   to the real app.
 * - preview / production: the store identifier, which is permanent once the first build is
 *   uploaded to App Store Connect. It is deliberately unset until the app's name and publisher are
 *   decided (see docs/status.md); those builds fail fast instead of locking in a wrong one.
 */
const STORE_IDENTIFIER: string | undefined = undefined

const VARIANTS = {
  development: { name: 'Meu Coach (Dev)', identifier: 'dev.enricolass.meucoach.dev' },
  preview: { name: 'Meu Coach (Preview)', identifier: STORE_IDENTIFIER },
  production: { name: undefined, identifier: STORE_IDENTIFIER },
} as const

type Variant = keyof typeof VARIANTS

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = (process.env.APP_VARIANT ?? 'development') as Variant
  const { name, identifier } = VARIANTS[variant]
  if (process.env.EAS_BUILD && !identifier) {
    throw new Error(
      `No bundle identifier for the "${variant}" variant yet: set STORE_IDENTIFIER in apps/mobile/app.config.ts.`,
    )
  }
  return {
    ...config,
    name: name ?? config.name ?? 'Meu Coach',
    slug: config.slug ?? 'meucoach',
    ios: { ...config.ios, ...(identifier && { bundleIdentifier: identifier }) },
    android: { ...config.android, ...(identifier && { package: identifier }) },
  }
}
