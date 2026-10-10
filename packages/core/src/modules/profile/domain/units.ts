export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const
export type UnitSystem = (typeof UNIT_SYSTEMS)[number]

/** Round to one decimal place, which is the precision stored for height and weight. */
export function roundTo1(value: number): number {
  return Math.round(value * 10) / 10
}

export function poundsToKg(pounds: number): number {
  return roundTo1(pounds * KG_PER_LB)
}

export function feetInchesToCm(feet: number, inches: number): number {
  return roundTo1((feet * 12 + inches) * CM_PER_IN)
}

export function kgToPounds(kg: number): number {
  return roundTo1(kg / KG_PER_LB)
}

/** Splits centimetres into whole feet and rounded inches (inches always 0–11). */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_IN)
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 }
}
