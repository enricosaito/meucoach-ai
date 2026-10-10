import { Platform } from 'react-native'

/**
 * Where the app talks to. A phone can't reach `localhost` on the dev machine, so native builds
 * use production by default; the web preview in development uses the local stack (`pnpm dev` +
 * `pnpm db:start`, demo user from seed.sql). Override any value with EXPO_PUBLIC_* env vars.
 *
 * Only public values live here: the publishable key is designed to ship in client apps (RLS
 * protects the data).
 */
const localWeb = __DEV__ && Platform.OS === 'web'

export const env = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    (localWeb ? 'http://localhost:3000' : 'https://meucoach-ai.vercel.app'),
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    (localWeb ? 'http://127.0.0.1:54321' : 'https://gucypanajihwfocfpjzk.supabase.co'),
  supabasePublishableKey:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    (localWeb
      ? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
      : 'sb_publishable_qRUgfYbpQoF1O3_ejWgaWA_x98h6U0A'),
}
