# Brand

How the app looks and talks. Read this before changing UI, colors, type or copy. The values
below live in code in [`packages/brand`](packages/brand/src) (the single source of truth); this
file explains when to use what.

## Positioning

**The smart, warm coach who knows you.** A competent friend with a clipboard: confident, clear,
encouraging, never intimidating. The coaching relationship is the hero; the AI is the engine
behind it. Not "beast mode": no neon greens, no pure black, no aggressive reds, no Brazilian flag
green/yellow.

The app name is a placeholder and lives in one constant: `APP_NAME` in
[`packages/brand/src/app.ts`](packages/brand/src/app.ts). i18n strings and legal text read it.

## Color: "chalk and iron"

| Token    | Hex       | Use                                                                     |
| -------- | --------- | ----------------------------------------------------------------------- |
| graphite | `#1C1F24` | Primary dark (text on light, dark-mode background). Never pure black.   |
| chalk    | `#F4F1EA` | Primary light background, a warm off-white.                             |
| orange   | `#FF5A36` | Signal orange: primary actions, highlights, PRs and completed workouts. |
| sage     | `#8FA89A` | Recovery: rest days, recovery, calm progress states.                    |

A neutral scale (`neutral[50…900]`) runs from chalk to graphite for borders, secondary text,
surfaces and disabled states.

**Screens use semantic tokens, never raw hex** (`useColors()` on mobile, CSS variables on web):
`background`, `surface`, `surfaceElevated`, `surfaceMuted`, `border`, `textPrimary`,
`textSecondary`, `textDisabled`, `accent`, `accentPressed`, `accentText`, `accentIcon`,
`accentSoft`, `onAccent`, `recovery`, `recoveryText`, `recoverySoft`, `success`, `warning`,
`error` (+ `*Soft`), `macroProtein`/`macroCarbs`/`macroFat`, `controlSelected`, `overlay`.

### Accessibility rules (enforced by `packages/brand/src/colors.test.ts`)

- Orange `#FF5A36` is **2.7:1 on chalk**: never use it for small text or thin icons on light.
  - `accent` = fills (buttons, rings, progress, done states).
  - `accentText` = orange text (`#B5391A` light, `#FF7A5C` dark), AA 4.5:1 on every surface.
  - `accentIcon` = icons and strokes (3:1).
- On orange, text is **graphite** (`onAccent`, 5.3:1). White on orange fails (3.1:1).
- Sage is a fill; use `recoveryText` (`#52695C` light) for sage text and icons.
- Every text token is tested at 4.5:1 on every surface, graphics at 3:1. Add new pairings to the
  test when you add tokens. `apps/web/src/app/globals.css` mirrors the tokens; the test fails if
  they drift.

### Light and dark

Light: chalk background, graphite text, near-white surfaces. Dark: graphite background, chalk
text, slightly lighter graphite surfaces. The app follows the system; Configurações → Aparência
(Sistema / Claro / Escuro) overrides it on that device.

### Plate colors (use sparingly, only where they mean weight)

| Plate | Color            | Text on it |
| ----- | ---------------- | ---------- |
| 25 kg | red `#D93A3A`    | white      |
| 20 kg | blue `#2F6FD6`   | white      |
| 15 kg | yellow `#F2C230` | graphite   |
| 10 kg | green `#3E9E5C`  | graphite   |
| 5 kg  | chalk `#F4F1EA`  | graphite   |

Today: level badges (`plateForLevel`: 5 kg at level 1 → 25 kg from level 10). Good future uses:
barbell plate visualizations, weight-class badges, charts of load. Not for general decoration.

## Typography

| Role    | Font                                     | Used for                                        |
| ------- | ---------------------------------------- | ----------------------------------------------- |
| Display | **Archivo Expanded** (wdth 125), 700–900 | Weights, reps, PRs, hero numbers, screen titles |
| UI      | **Manrope**, 400–700                     | Body copy, labels, buttons, navigation          |

Type scale (`typeScale` in `packages/brand/src/typography.ts`):

| Variant   | Font / weight | Size / line | Notes                                    |
| --------- | ------------- | ----------- | ---------------------------------------- |
| displayXL | Archivo 900   | 48 / 54     | Hero numbers; tabular                    |
| displayL  | Archivo 800   | 30 / 36     | Big stats, greeting, tab-screen titles   |
| title     | Archivo 700   | 22 / 28     | Card hero titles                         |
| number    | Archivo 700   | 17 / 22     | Sets × reps, grams, kg in lists; tabular |
| heading   | Manrope 700   | 17 / 24     | Card and section headings                |
| body      | Manrope 400   | 16 / 24     |                                          |
| bodySmall | Manrope 400   | 14 / 20     |                                          |
| label     | Manrope 600   | 14 / 20     | Buttons, chips, form labels              |
| caption   | Manrope 500   | 12 / 16     |                                          |
| eyebrow   | Manrope 700   | 12 / 16     | Uppercase kicker ("TREINO DE HOJE")      |

- **Numbers are the hero.** Put weights, reps and stats in a display or `number` style.
- **Tabular figures** wherever numbers stack or tick (lists, logs, tables, timers): `tabularNums`
  on `<Txt>` (display number styles have it built in). Both fonts were verified to have `tnum`.
- Archivo Expanded is wide: keep display text short (numbers, titles). Long sentences are Manrope.
- Both fonts cover Portuguese fully (ã õ ç ê á é í ó ú â ô à), verified from the font files.
- Mobile bundles static files in `apps/mobile/assets/fonts` (SIL OFL) and loads them behind the
  splash screen; each weight is its own family, and `<Txt>` maps a `fontWeight` override to the
  right face. Web loads both from Google Fonts with `next/font` (Archivo with the `wdth` axis).

## Shape, space and texture

- Corners: 12 px for tiles and inputs, 16 px for cards, fully rounded for buttons, chips, pills.
- Spacing scale (`space`): 2, 4, 8, 12, 16, 20, 24, 32, 48. Be generous; one idea per card.
- Buttons: primary = orange with graphite text; secondary = neutral; ghost = orange text.
  Disabled turns neutral (never faded orange).
- Texture: `<Knurling>` (barbell knurling crosshatch) at ~5% opacity, only behind celebrations
  and hero areas, always fading out before text. Never at the cost of readability.
- Celebrations (completed workouts, streak milestones, future PRs) may use orange boldly: full
  orange fills, big Archivo numbers, a pop-in.

## Voice

Primary language: Brazilian Portuguese, informal **"você"**. English mirrors the same tone.

**A knowledgeable, encouraging friend.** Light humor is fine. Never shame, never hustle-culture
slogans, never "no pain no gain".

1. **Explain decisions.** Whenever the coach changes a weight, rep scheme or plan, say why.
   > Aumentei 2,5 kg no supino porque você completou todas as séries com folga na semana passada.
2. **Celebrate PRs generously.**
   > Novo recorde! 100 kg no agachamento. Isso é evolução de verdade.
3. **Treat missed workouts lightly.**
   > Semana corrida? Sem problema. Bora retomar hoje?
4. **Keep instructions short and clear.** One cue per line, verbs first.
   > Desça até a coxa ficar paralela. Suba empurrando o chão.
5. **Errors are on us, and say what to do next.**
   > Algo deu errado do nosso lado. Suas respostas estão salvas, é só tentar de novo.

Avoid: "Sem desculpas", "Destrua o treino", "Modo fera", guilt about missed days, shouting
(ALL CAPS sentences, stacked exclamation marks), medical claims.

Where copy lives: `packages/i18n/src/messages/pt-BR.ts` (default) and `en.ts` (same keys,
checked by the type checker and tests). AI replies follow the voice through the versioned
prompts in `packages/core/src/modules/*/prompts/` (new prompt version for any change).
