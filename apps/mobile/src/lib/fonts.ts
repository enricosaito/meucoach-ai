import { useFonts } from 'expo-font'

// Bundled brand fonts (apps/mobile/assets/fonts, SIL OFL). Keys are the family names used in
// styles and must match @mycoach/brand fontFamilies (a brand test checks the files exist).
// Loaded at runtime so they work in Expo Go and on web; the root layout keeps the splash screen
// up until they are ready.
const FONTS = {
  'ArchivoExpanded-Bold': require('../../assets/fonts/ArchivoExpanded-Bold.ttf') as number,
  'ArchivoExpanded-ExtraBold':
    require('../../assets/fonts/ArchivoExpanded-ExtraBold.ttf') as number,
  'ArchivoExpanded-Black': require('../../assets/fonts/ArchivoExpanded-Black.ttf') as number,
  'Manrope-Regular': require('../../assets/fonts/Manrope-Regular.ttf') as number,
  'Manrope-Medium': require('../../assets/fonts/Manrope-Medium.ttf') as number,
  'Manrope-SemiBold': require('../../assets/fonts/Manrope-SemiBold.ttf') as number,
  'Manrope-Bold': require('../../assets/fonts/Manrope-Bold.ttf') as number,
}

/** True once the fonts are usable, or if loading failed (text falls back to the system font). */
export function useBrandFonts(): boolean {
  const [loaded, error] = useFonts(FONTS)
  return loaded || error !== null
}
