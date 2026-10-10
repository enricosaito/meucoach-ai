// Spacing and shape. Generous spacing, rounded-but-not-bubbly corners.

/** Spacing scale in px (4-based). */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const

/** Corner radii: 12–16 for cards and tiles, fully rounded for pills, chips and buttons. */
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const
