import { useColorScheme } from 'react-native'

/** Same tokens as the web app (apps/web/src/app/globals.css), light and dark. */
const light = {
  bg: '#f5f4ef',
  surface: '#ffffff',
  surface2: '#efede6',
  fg: '#1b1a17',
  muted: '#6d695f',
  line: '#e4e1d8',
  accent: '#15924f',
  accentStrong: '#0f7a41',
  accentFg: '#ffffff',
  accentSoft: '#e2f3e8',
  energy: '#e8630a',
  energySoft: '#fdeedf',
  fat: '#6d5bd0',
  danger: '#c4321e',
  dangerSoft: '#fbe7e3',
}

const dark: typeof light = {
  bg: '#0f0f0d',
  surface: '#181816',
  surface2: '#22221f',
  fg: '#f1f0eb',
  muted: '#a19d92',
  line: '#2d2c28',
  accent: '#3cc775',
  accentStrong: '#5ad78b',
  accentFg: '#07150d',
  accentSoft: '#15301f',
  energy: '#ff8a3d',
  energySoft: '#33200f',
  fat: '#a597ff',
  danger: '#ff7a66',
  dangerSoft: '#3a1712',
}

export type Colors = typeof light

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const
export const radius = { sm: 12, md: 16, lg: 24, full: 999 } as const
