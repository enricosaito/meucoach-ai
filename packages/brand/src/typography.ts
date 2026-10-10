// Typography: Archivo Expanded (display, numbers) + Manrope (UI text). Numbers are the hero of a
// lifting app, so the display face carries weights, reps, PRs, screen titles and hero stats.
//
// On React Native every weight is its own font family (named after the bundled file in
// apps/mobile/assets/fonts). Both fonts were checked to contain tabular figures ("tnum") and the
// Portuguese diacritics (ã õ ç ê á é í ó ú â ô à).

export const fontFamilies = {
  display: {
    700: 'ArchivoExpanded-Bold',
    800: 'ArchivoExpanded-ExtraBold',
    900: 'ArchivoExpanded-Black',
  },
  ui: {
    400: 'Manrope-Regular',
    500: 'Manrope-Medium',
    600: 'Manrope-SemiBold',
    700: 'Manrope-Bold',
  },
} as const

export type FontRole = keyof typeof fontFamilies
export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900

/** The bundled face closest to `weight` within a role (Manrope tops out at 700, Archivo starts at 700). */
export function fontFamilyFor(role: FontRole, weight: FontWeight): string {
  const faces = fontFamilies[role] as Partial<Record<FontWeight, string>>
  const available = Object.keys(faces).map(Number) as FontWeight[]
  const nearest = available.reduce((best, w) =>
    Math.abs(w - weight) < Math.abs(best - weight) ? w : best,
  )
  return faces[nearest] ?? Object.values(faces)[0] ?? ''
}

export interface TextStyleToken {
  role: FontRole
  weight: FontWeight
  /** px */
  size: number
  /** px */
  lineHeight: number
  /** px */
  letterSpacing: number
  /** Align digits in columns (logs, tables, timers, stats). */
  tabular?: boolean
  uppercase?: boolean
}

/**
 * The type scale. Display styles use Archivo Expanded; the expanded width is wide, so they stay
 * short (numbers, titles), and body copy is Manrope.
 */
export const typeScale = {
  /** Hero numbers: weekly ring, PR weight, streak count. */
  displayXL: {
    role: 'display',
    weight: 900,
    size: 48,
    lineHeight: 54,
    letterSpacing: -1,
    tabular: true,
  },
  /** Big stats and the greeting name. */
  displayL: { role: 'display', weight: 800, size: 30, lineHeight: 36, letterSpacing: -0.5 },
  /** Screen titles and card hero titles. */
  title: { role: 'display', weight: 700, size: 22, lineHeight: 28, letterSpacing: -0.3 },
  /** Numbers inside lists, tiles and logs (sets × reps, grams, kg). */
  number: {
    role: 'display',
    weight: 700,
    size: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    tabular: true,
  },
  /** Card and section headings. */
  heading: { role: 'ui', weight: 700, size: 17, lineHeight: 24, letterSpacing: -0.1 },
  body: { role: 'ui', weight: 400, size: 16, lineHeight: 24, letterSpacing: 0 },
  bodySmall: { role: 'ui', weight: 400, size: 14, lineHeight: 20, letterSpacing: 0 },
  /** Buttons, chips, form labels, navigation. */
  label: { role: 'ui', weight: 600, size: 14, lineHeight: 20, letterSpacing: 0.1 },
  caption: { role: 'ui', weight: 500, size: 12, lineHeight: 16, letterSpacing: 0.2 },
  /** Small uppercase kicker above a title ("TREINO DE HOJE"). */
  eyebrow: {
    role: 'ui',
    weight: 700,
    size: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    uppercase: true,
  },
} satisfies Record<string, TextStyleToken>

export type TypeVariant = keyof typeof typeScale
