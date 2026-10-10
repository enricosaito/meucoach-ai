import { dark, light, type ColorTokens } from '@mycoach/brand'
import { useColorScheme } from 'react-native'
import { useForcedScheme } from './lib/appearance'

// Design tokens live in @mycoach/brand (packages/brand); this file only picks the active set.
// Rule of thumb: `accent` is a fill (buttons, rings, bars) with `onAccent` content; small orange
// text uses `accentText` and icons `accentIcon`, which stay readable on light surfaces.
export { plates, radius, space } from '@mycoach/brand'

export type Colors = ColorTokens

/** The active scheme: the user's choice in Settings, or the system's. */
export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme()
  return useForcedScheme() ?? (system === 'dark' ? 'dark' : 'light')
}

export function useColors(): Colors {
  return useScheme() === 'dark' ? dark : light
}
