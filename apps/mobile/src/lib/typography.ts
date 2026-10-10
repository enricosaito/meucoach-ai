import {
  fontFamilyFor,
  typeScale,
  type FontRole,
  type FontWeight,
  type TextStyleToken,
  type TypeVariant,
} from '@mycoach/brand'
import type { TextStyle } from 'react-native'

// React Native styles for the brand type scale (@mycoach/brand typography). Custom fonts ignore
// `fontWeight` on Android, so weights are always expressed as a font family.

function toTextStyle(token: TextStyleToken): TextStyle {
  return {
    fontFamily: fontFamilyFor(token.role, token.weight),
    fontSize: token.size,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    ...(token.tabular && { fontVariant: ['tabular-nums'] }),
    ...(token.uppercase && { textTransform: 'uppercase' }),
  }
}

export const textStyles = Object.fromEntries(
  Object.entries(typeScale).map(([name, token]) => [name, toTextStyle(token)]),
) as Record<TypeVariant, TextStyle>

/** A specific face, for text outside <Txt> (buttons, inputs, navigation). */
export function font(role: FontRole, weight: FontWeight): TextStyle {
  return { fontFamily: fontFamilyFor(role, weight) }
}

/** Turns a `fontWeight` override into the matching bundled face of the variant's font. */
export function weightToFont(variant: TypeVariant, weight: TextStyle['fontWeight']): TextStyle {
  if (weight === undefined) return {}
  const numeric = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight)
  if (!Number.isFinite(numeric)) return {}
  return font(typeScale[variant].role, numeric as FontWeight)
}

/** Digits of equal width, so numbers line up in lists, logs, tables and timers. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] }
