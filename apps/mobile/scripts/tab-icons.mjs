// Renders the tab bar icons from Lucide (the web app's icon set) into template PNGs:
// single-color with transparency, so the native tab bar (Liquid Glass on iOS 26) tints them like
// SF Symbols. 25 pt is Apple's size for custom tab bar icons; @2x/@3x for Retina screens.
//
// Run after changing TAB_ICONS: pnpm --filter @mycoach/mobile tab-icons
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Tab route → Lucide icon name (same icons as apps/web/src/app/app/app-shell.tsx). */
const TAB_ICONS = {
  home: 'house',
  training: 'dumbbell',
  diet: 'salad',
  coach: 'message-circle',
  profile: 'user-round',
}
const POINTS = 25
const SCALES = [1, 2, 3]

const require = createRequire(import.meta.url)
const iconsDir = join(dirname(require.resolve('lucide-static/package.json')), 'icons')
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images', 'tabs')
mkdirSync(outDir, { recursive: true })

for (const [tab, icon] of Object.entries(TAB_ICONS)) {
  // Lucide draws with currentColor; template images only use the alpha channel.
  const svg = readFileSync(join(iconsDir, `${icon}.svg`), 'utf8').replaceAll('currentColor', '#000')
  for (const scale of SCALES) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: POINTS * scale } }).render().asPng()
    const suffix = scale === 1 ? '' : `@${String(scale)}x`
    writeFileSync(join(outDir, `${tab}${suffix}.png`), png)
  }
  console.log(`${tab}: ${icon}`)
}
