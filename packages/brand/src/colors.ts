// "Chalk and iron": the brand palette. The single source of truth for colors on every client;
// mobile imports these directly, web mirrors them in apps/web/src/app/globals.css (a test keeps
// the two in sync). See BRAND.md for when to use what.

/** Raw brand colors. Screens use the semantic tokens below, never these directly. */
export const palette = {
  /** Primary dark, used instead of pure black. */
  graphite: '#1C1F24',
  /** Primary light background, a warm off-white. */
  chalk: '#F4F1EA',
  /** Signal orange: primary actions, highlights, PR celebrations. Not for small text on light. */
  orange: '#FF5A36',
  /** Recovery sage: rest days, recovery, calm progress states. Not for small text on light. */
  sage: '#8FA89A',
  white: '#FFFFFF',
} as const

/** Neutrals between chalk (50) and graphite (900): borders, secondary text, surfaces, disabled. */
export const neutral = {
  50: '#EBE8E1',
  100: '#DEDAD2',
  200: '#CFCDC8',
  300: '#B3B2AF',
  400: '#939391',
  500: '#777777',
  600: '#5E5F61',
  700: '#4C4D50',
  800: '#353A41',
  850: '#2C3037',
  900: '#1C1F24',
} as const

/**
 * Competition bumper plate colors, for meaning only: barbell visuals, level badges, weight
 * classes. `on` is the readable text/icon color on top of each plate.
 */
export const plates = {
  kg25: { color: '#D93A3A', on: palette.white },
  kg20: { color: '#2F6FD6', on: palette.white },
  kg15: { color: '#F2C230', on: palette.graphite },
  kg10: { color: '#3E9E5C', on: palette.graphite },
  kg5: { color: palette.chalk, on: palette.graphite },
} as const

export type Plate = keyof typeof plates

/**
 * Semantic tokens. Pairings are checked for WCAG AA in colors.test.ts:
 * - text tokens (text*, *Text, success/warning/error) reach 4.5:1 on every surface;
 * - graphic tokens (accentIcon, macro*) reach 3:1 (icons, rings, chart marks);
 * - `onAccent` reaches 4.5:1 on `accent` and `accentPressed` (graphite passes, white doesn't).
 */
const lightTokens = {
  background: palette.chalk,
  surface: '#FBFAF6',
  surfaceElevated: palette.white,
  surfaceMuted: neutral[50],
  border: neutral[100],
  /** The selected segment of a segmented control (must stand out from surfaceMuted). */
  controlSelected: palette.white,

  textPrimary: palette.graphite,
  textSecondary: neutral[600],
  textDisabled: neutral[400],

  accent: palette.orange,
  accentPressed: '#FF6E4E',
  accentText: '#B5391A',
  accentIcon: '#D9441F',
  accentSoft: '#FCE3DA',
  onAccent: palette.graphite,

  recovery: palette.sage,
  recoveryText: '#52695C',
  recoverySoft: '#E3EAE5',

  success: '#2F7049',
  successSoft: '#E0EDE4',
  warning: '#7A5D00',
  warningSoft: '#FBF0CF',
  error: '#B13435',
  errorSoft: '#F8E1DE',

  macroProtein: '#5E7D6B',
  macroCarbs: '#8C7553',
  macroFat: '#6B7684',

  /** Scrim over photos (e.g. a remove button) and the content on top of it. */
  overlay: 'rgba(28, 31, 36, 0.6)',
  onOverlay: palette.white,
}

/** Token names with plain string values, so the dark set can differ. */
export type ColorTokens = { [K in keyof typeof lightTokens]: string }

export const light: ColorTokens = lightTokens

export const dark: ColorTokens = {
  background: palette.graphite,
  surface: '#24282E',
  surfaceElevated: neutral[850],
  surfaceMuted: '#2A2E34',
  border: neutral[800],
  controlSelected: '#3D424A',

  textPrimary: palette.chalk,
  textSecondary: neutral[300],
  textDisabled: neutral[500],

  accent: palette.orange,
  accentPressed: '#FF7A5C',
  accentText: '#FF7A5C',
  accentIcon: palette.orange,
  accentSoft: '#322B2A',
  onAccent: palette.graphite,

  recovery: palette.sage,
  recoveryText: '#A3B9AC',
  recoverySoft: '#273029',

  success: '#6CB585',
  successSoft: '#22322A',
  warning: '#F2C230',
  warningSoft: '#3A3120',
  error: '#F08A80',
  errorSoft: '#3A2422',

  macroProtein: palette.sage,
  macroCarbs: '#C2AE8E',
  macroFat: '#9AA5B1',

  overlay: 'rgba(28, 31, 36, 0.6)',
  onOverlay: palette.white,
}

/**
 * The plate on a level badge: the bar gets heavier as you level up (5 kg chalk at the start,
 * then 10 green, 15 yellow, 20 blue, 25 red from level 10).
 */
export function plateForLevel(level: number): Plate {
  if (level >= 10) return 'kg25'
  if (level >= 7) return 'kg20'
  if (level >= 5) return 'kg15'
  if (level >= 3) return 'kg10'
  return 'kg5'
}
