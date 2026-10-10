import { AVATARS_BUCKET } from '@mycoach/core/profile/contracts'
import { supabase } from './supabase'

/** Public URL of an avatar in the avatars bucket, or null when the user has none. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl
}
