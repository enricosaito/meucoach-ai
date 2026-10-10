import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Database } from '@mycoach/db'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import { env } from './env'

/**
 * The app's Supabase client: sign-in and RLS-protected reads of the user's own rows. Every write
 * goes through the API (see `api.ts`), never directly to the database.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh()
    else void supabase.auth.stopAutoRefresh()
  })
}
