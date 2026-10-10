import type { Locale } from '@mycoach/i18n'
import type { DietPlan, DietStyle, Food, Meal, MealOption, MealType } from '../schemas'
import type { DietInputs } from '../types'
import { MEAL_SPLITS } from './meals'

/**
 * Deterministic diet plan built from a small table of common Brazilian foods (TACO-like values per
 * 100 g). Used by the `mock` AI provider in local dev and tests, so it must pass the same checks as
 * AI output: portions are solved per option to hit that meal's calories and protein.
 */

interface FoodInfo {
  name: Record<Locale, string>
  /** Macros per 100 g (or 100 ml when `ml`). */
  p: number
  c: number
  f: number
  ml?: boolean
  /** Diet styles that can eat it. */
  styles: readonly DietStyle[]
}

const ALL: readonly DietStyle[] = ['omnivore', 'pescatarian', 'vegetarian', 'vegan']
const NO_VEGAN: readonly DietStyle[] = ['omnivore', 'pescatarian', 'vegetarian']
const FISH: readonly DietStyle[] = ['omnivore', 'pescatarian']
const MEAT: readonly DietStyle[] = ['omnivore']

const FOODS = {
  chicken: {
    name: { 'pt-BR': 'Peito de frango grelhado', en: 'Grilled chicken breast' },
    p: 31,
    c: 0,
    f: 3.6,
    styles: MEAT,
  },
  beef: {
    name: { 'pt-BR': 'Patinho moído refogado', en: 'Lean ground beef' },
    p: 27,
    c: 0,
    f: 10,
    styles: MEAT,
  },
  tilapia: {
    name: { 'pt-BR': 'Filé de tilápia grelhado', en: 'Grilled tilapia fillet' },
    p: 26,
    c: 0,
    f: 2.7,
    styles: FISH,
  },
  tuna: { name: { 'pt-BR': 'Atum em água', en: 'Tuna in water' }, p: 26, c: 0, f: 1, styles: FISH },
  egg: { name: { 'pt-BR': 'Ovo cozido', en: 'Boiled egg' }, p: 13, c: 1, f: 10, styles: NO_VEGAN },
  yogurt: {
    name: { 'pt-BR': 'Iogurte grego zero', en: 'Fat-free Greek yogurt' },
    p: 10,
    c: 4,
    f: 0.5,
    styles: NO_VEGAN,
  },
  cottage: {
    name: { 'pt-BR': 'Queijo cottage', en: 'Cottage cheese' },
    p: 11,
    c: 3.4,
    f: 4.3,
    styles: NO_VEGAN,
  },
  milk: {
    name: { 'pt-BR': 'Leite desnatado', en: 'Skimmed milk' },
    p: 3.4,
    c: 5,
    f: 0.1,
    ml: true,
    styles: NO_VEGAN,
  },
  tofu: { name: { 'pt-BR': 'Tofu firme', en: 'Firm tofu' }, p: 12, c: 2, f: 7, styles: ALL },
  soyMeat: {
    name: { 'pt-BR': 'Proteína de soja hidratada', en: 'Rehydrated soy protein' },
    p: 16,
    c: 10,
    f: 0.5,
    styles: ALL,
  },
  soyDrink: {
    name: { 'pt-BR': 'Bebida de soja sem açúcar', en: 'Unsweetened soy drink' },
    p: 3.3,
    c: 1.6,
    f: 2,
    ml: true,
    styles: ALL,
  },
  lentils: {
    name: { 'pt-BR': 'Lentilha cozida', en: 'Cooked lentils' },
    p: 9,
    c: 20,
    f: 0.5,
    styles: ALL,
  },
  chickpeas: {
    name: { 'pt-BR': 'Grão-de-bico cozido', en: 'Cooked chickpeas' },
    p: 8.9,
    c: 27,
    f: 2.6,
    styles: ALL,
  },
  beans: {
    name: { 'pt-BR': 'Feijão carioca cozido', en: 'Cooked pinto beans' },
    p: 4.8,
    c: 13.6,
    f: 0.5,
    styles: ALL,
  },
  rice: {
    name: { 'pt-BR': 'Arroz branco cozido', en: 'Cooked white rice' },
    p: 2.5,
    c: 28,
    f: 0.2,
    styles: ALL,
  },
  brownRice: {
    name: { 'pt-BR': 'Arroz integral cozido', en: 'Cooked brown rice' },
    p: 2.6,
    c: 25.8,
    f: 1,
    styles: ALL,
  },
  sweetPotato: {
    name: { 'pt-BR': 'Batata-doce cozida', en: 'Boiled sweet potato' },
    p: 0.6,
    c: 18.4,
    f: 0.1,
    styles: ALL,
  },
  pasta: {
    name: { 'pt-BR': 'Macarrão integral cozido', en: 'Cooked wholewheat pasta' },
    p: 5,
    c: 27,
    f: 1,
    styles: ALL,
  },
  bread: { name: { 'pt-BR': 'Pão francês', en: 'Bread roll' }, p: 8, c: 58.6, f: 3.1, styles: ALL },
  wholeBread: {
    name: { 'pt-BR': 'Pão integral', en: 'Wholegrain bread' },
    p: 9.4,
    c: 49.9,
    f: 3.7,
    styles: ALL,
  },
  tapioca: { name: { 'pt-BR': 'Tapioca', en: 'Tapioca crepe' }, p: 0, c: 54, f: 0, styles: ALL },
  oats: {
    name: { 'pt-BR': 'Aveia em flocos', en: 'Rolled oats' },
    p: 13.9,
    c: 66.6,
    f: 8.5,
    styles: ALL,
  },
  banana: { name: { 'pt-BR': 'Banana', en: 'Banana' }, p: 1.3, c: 26, f: 0.1, styles: ALL },
  apple: { name: { 'pt-BR': 'Maçã', en: 'Apple' }, p: 0.3, c: 15, f: 0.2, styles: ALL },
  papaya: { name: { 'pt-BR': 'Mamão', en: 'Papaya' }, p: 0.5, c: 10.4, f: 0.1, styles: ALL },
  peanutButter: {
    name: { 'pt-BR': 'Pasta de amendoim', en: 'Peanut butter' },
    p: 25,
    c: 20,
    f: 50,
    styles: ALL,
  },
  nuts: {
    name: { 'pt-BR': 'Mix de castanhas', en: 'Mixed nuts' },
    p: 15,
    c: 20,
    f: 55,
    styles: ALL,
  },
  oliveOil: {
    name: { 'pt-BR': 'Azeite de oliva', en: 'Olive oil' },
    p: 0,
    c: 0,
    f: 100,
    ml: true,
    styles: ALL,
  },
  salad: {
    name: { 'pt-BR': 'Salada verde com tomate', en: 'Green salad with tomato' },
    p: 1,
    c: 3,
    f: 0.2,
    styles: ALL,
  },
  vegetables: {
    name: { 'pt-BR': 'Legumes cozidos', en: 'Steamed vegetables' },
    p: 2,
    c: 6,
    f: 0.3,
    styles: ALL,
  },
} satisfies Record<string, FoodInfo>

type FoodKey = keyof typeof FOODS

/** protein: solved for the meal's protein; base: scaled for the remaining calories; fixed: as is. */
type Role = 'protein' | 'base' | 'fixed'
type Item = [FoodKey, number, Role]

interface OptionTemplate {
  title: Record<Locale, string>
  items: Item[]
}

/** Protein sources per style, so one template works for every diet style. */
const MAIN_PROTEIN: Record<DietStyle, [FoodKey, FoodKey]> = {
  omnivore: ['chicken', 'beef'],
  pescatarian: ['tilapia', 'tuna'],
  vegetarian: ['egg', 'tofu'],
  vegan: ['tofu', 'soyMeat'],
}
const LIGHT_PROTEIN: Record<DietStyle, [FoodKey, FoodKey]> = {
  omnivore: ['egg', 'yogurt'],
  pescatarian: ['egg', 'yogurt'],
  vegetarian: ['egg', 'yogurt'],
  vegan: ['tofu', 'soyMeat'],
}
const SNACK_PROTEIN: Record<DietStyle, [FoodKey, FoodKey]> = {
  omnivore: ['yogurt', 'cottage'],
  pescatarian: ['yogurt', 'cottage'],
  vegetarian: ['yogurt', 'cottage'],
  vegan: ['soyDrink', 'tofu'],
}

function templatesFor(type: MealType, style: DietStyle): [OptionTemplate, OptionTemplate] {
  const [main1, main2] = MAIN_PROTEIN[style]
  const [light1, light2] = LIGHT_PROTEIN[style]
  const [snack1, snack2] = SNACK_PROTEIN[style]
  const pt = (n: FoodKey) => FOODS[n].name['pt-BR'].toLowerCase()
  const en = (n: FoodKey) => FOODS[n].name.en.toLowerCase()
  // Plant proteins are less dense: main meals get a second source so high targets stay reachable.
  const extra = (main: FoodKey): Item[] =>
    style === 'vegetarian' || style === 'vegan'
      ? [[main === 'soyMeat' ? 'tofu' : 'soyMeat', 60, 'protein']]
      : []

  switch (type) {
    case 'breakfast':
      return [
        {
          title: {
            'pt-BR': `Pão integral com ${pt(light1)} e fruta`,
            en: `Wholegrain bread with ${en(light1)} and fruit`,
          },
          items: [
            [light1, 100, 'protein'],
            ['wholeBread', 50, 'base'],
            ['papaya', 150, 'fixed'],
          ],
        },
        {
          title: {
            'pt-BR': `Aveia com ${pt(light2)} e banana`,
            en: `Oats with ${en(light2)} and banana`,
          },
          items: [
            [light2, 150, 'protein'],
            ['oats', 30, 'base'],
            ['banana', 80, 'base'],
          ],
        },
      ]
    case 'morning_snack':
    case 'afternoon_snack':
    case 'supper':
      return [
        {
          title: {
            'pt-BR': `${FOODS[snack1].name['pt-BR']} com fruta`,
            en: `${FOODS[snack1].name.en} with fruit`,
          },
          items: [
            [snack1, 150, 'protein'],
            ['apple', 100, 'base'],
            ['nuts', 10, 'base'],
          ],
        },
        {
          title: {
            'pt-BR': `${FOODS[snack2].name['pt-BR']} com tapioca`,
            en: `${FOODS[snack2].name.en} with tapioca`,
          },
          items: [
            [snack2, 100, 'protein'],
            ['tapioca', 40, 'base'],
          ],
        },
      ]
    case 'lunch':
      return [
        {
          title: {
            'pt-BR': `${FOODS[main1].name['pt-BR']} com arroz e feijão`,
            en: `${FOODS[main1].name.en} with rice and beans`,
          },
          items: [
            [main1, 120, 'protein'],
            ...extra(main1),
            ['rice', 120, 'base'],
            ['beans', 100, 'base'],
            ['salad', 100, 'fixed'],
            ['oliveOil', 5, 'base'],
          ],
        },
        {
          title: {
            'pt-BR': `${FOODS[main2].name['pt-BR']} com batata-doce`,
            en: `${FOODS[main2].name.en} with sweet potato`,
          },
          items: [
            [main2, 120, 'protein'],
            ...extra(main2),
            ['sweetPotato', 150, 'base'],
            ['lentils', 80, 'base'],
            ['vegetables', 120, 'fixed'],
            ['oliveOil', 5, 'base'],
          ],
        },
      ]
    case 'dinner':
      return [
        {
          title: {
            'pt-BR': `${FOODS[main2].name['pt-BR']} com macarrão integral`,
            en: `${FOODS[main2].name.en} with wholewheat pasta`,
          },
          items: [
            [main2, 120, 'protein'],
            ...extra(main2),
            ['pasta', 120, 'base'],
            ['vegetables', 120, 'fixed'],
            ['oliveOil', 5, 'base'],
          ],
        },
        {
          title: {
            'pt-BR': `${FOODS[main1].name['pt-BR']} com arroz integral`,
            en: `${FOODS[main1].name.en} with brown rice`,
          },
          items: [
            [main1, 120, 'protein'],
            ...extra(main1),
            ['brownRice', 120, 'base'],
            ['chickpeas', 60, 'base'],
            ['salad', 100, 'fixed'],
          ],
        },
      ]
  }
}

const per = (key: FoodKey, grams: number) => {
  const food: FoodInfo = FOODS[key]
  return { p: (food.p * grams) / 100, c: (food.c * grams) / 100, f: (food.f * grams) / 100 }
}
const kcalOf = (m: { p: number; c: number; f: number }) => m.p * 4 + m.c * 4 + m.f * 9

const MIN_GRAMS = 5
const MAX_PROTEIN_GRAMS = 350
const round5 = (g: number) => Math.max(MIN_GRAMS, Math.round(g / 5) * 5)

/** Solves portions so the option lands on `kcal` and (at least close to) `proteinG`. */
function solveOption(
  template: OptionTemplate,
  kcal: number,
  proteinG: number,
): Map<number, number> {
  const grams = new Map(template.items.map(([, g], i) => [i, g]))
  const indexes = (role: Role) => template.items.flatMap(([, , r], i) => (r === role ? [i] : []))
  const proteinIdx = indexes('protein')
  const baseIdx = indexes('base')

  const sum = (idx: number[], pick: (m: { p: number; c: number; f: number }) => number) =>
    idx.reduce((acc, i) => {
      const item = template.items[i]
      return item ? acc + pick(per(item[0], grams.get(i) ?? 0)) : acc
    }, 0)
  const others = (exclude: number[]) =>
    template.items.flatMap((_, i) => (exclude.includes(i) ? [] : [i]))

  for (let round = 0; round < 4; round++) {
    // 1. Protein sources cover what the rest of the meal doesn't.
    const missing = Math.max(0, proteinG - sum(others(proteinIdx), (m) => m.p))
    for (const i of proteinIdx) {
      const item = template.items[i]
      if (!item) continue
      const p100 = FOODS[item[0]].p
      const g = ((missing / proteinIdx.length) * 100) / Math.max(p100, 0.1)
      grams.set(i, Math.min(MAX_PROTEIN_GRAMS, Math.max(30, g)))
    }
    // 2. Base foods fill the remaining calories.
    const fixedKcal = sum(others(baseIdx), kcalOf)
    const baseKcal = sum(baseIdx, kcalOf)
    if (baseKcal > 0) {
      const factor = Math.min(4, Math.max(0.2, (kcal - fixedKcal) / baseKcal))
      for (const i of baseIdx) grams.set(i, (grams.get(i) ?? 0) * factor)
    }
  }
  for (const [i, g] of grams) grams.set(i, round5(g))
  return grams
}

function toFood(key: FoodKey, grams: number, locale: Locale): Food {
  const info: FoodInfo = FOODS[key]
  const m = per(key, grams)
  const round1 = (n: number) => Math.round(n * 10) / 10
  return {
    name: info.name[locale],
    quantity: `${grams} ${info.ml ? 'ml' : 'g'}`,
    proteinG: round1(m.p),
    carbsG: round1(m.c),
    fatG: round1(m.f),
  }
}

function allowed(template: OptionTemplate, style: DietStyle): boolean {
  return template.items.every(([key]) => FOODS[key].styles.includes(style))
}

const NAMES: Record<NonNullable<DietInputs['goal']> | 'default', Record<Locale, string>> = {
  lose_fat: { 'pt-BR': 'Dieta para secar', en: 'Lean-down meal plan' },
  build_muscle: { 'pt-BR': 'Dieta para ganhar massa', en: 'Muscle-building meal plan' },
  maintain: { 'pt-BR': 'Dieta de manutenção', en: 'Maintenance meal plan' },
  improve_health: { 'pt-BR': 'Dieta equilibrada', en: 'Balanced meal plan' },
  default: { 'pt-BR': 'Dieta equilibrada', en: 'Balanced meal plan' },
}

export function buildTemplateDiet(inputs: DietInputs): DietPlan {
  const { locale, targets, questionnaire } = inputs
  const style = questionnaire.dietStyle

  const meals: Meal[] = MEAL_SPLITS[questionnaire.mealsPerDay].map(({ type, share, time }) => {
    const options: MealOption[] = templatesFor(type, style)
      .filter((template) => allowed(template, style))
      .map((template) => {
        const grams = solveOption(template, targets.kcal * share, targets.proteinG * share)
        return {
          title: template.title[locale],
          foods: template.items.map(([key], i) => toFood(key, grams.get(i) ?? MIN_GRAMS, locale)),
          preparation: '',
        }
      })
    return { type, time, options }
  })

  const shoppingList = [
    ...new Set(meals.flatMap((m) => m.options.flatMap((o) => o.foods.map((f) => f.name)))),
  ]
  const pt = locale === 'pt-BR'
  const liters = Math.round(inputs.body.weightKg * 0.035 * 10) / 10

  return {
    name: NAMES[inputs.goal ?? 'default'][locale],
    summary: pt
      ? `Plano com ${String(meals.length)} refeições por dia, ajustado para cerca de ${String(targets.kcal)} kcal e ${String(targets.proteinG)} g de proteína. Cada refeição tem duas opções equivalentes para você variar.`
      : `A ${String(meals.length)}-meal plan tuned to about ${String(targets.kcal)} kcal and ${String(targets.proteinG)} g of protein per day. Each meal has two equivalent options so you can vary.`,
    meals,
    hydration: pt
      ? `Beba cerca de ${String(liters).replace('.', ',')} L de água por dia, mais nos dias de treino.`
      : `Drink about ${String(liters)} L of water a day, more on training days.`,
    tips: pt
      ? [
          'Pese os alimentos nas primeiras semanas para calibrar as porções.',
          'Prepare as proteínas da semana com antecedência.',
          'Troque opções da mesma refeição livremente: elas têm calorias parecidas.',
        ]
      : [
          'Weigh your food for the first weeks to calibrate portions.',
          'Batch-cook the week’s protein in advance.',
          'Swap options within a meal freely: they have similar calories.',
        ],
    shoppingList,
  }
}
