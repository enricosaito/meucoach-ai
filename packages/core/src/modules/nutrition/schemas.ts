import { z } from 'zod'

// ---------------------------------------------------------------------------
// Diet questionnaire
// ---------------------------------------------------------------------------

export const MEALS_PER_DAY = [3, 4, 5, 6] as const
export type MealsPerDay = (typeof MEALS_PER_DAY)[number]

export const DIET_STYLES = ['omnivore', 'pescatarian', 'vegetarian', 'vegan'] as const
export type DietStyle = (typeof DIET_STYLES)[number]

export const BUDGETS = ['economic', 'moderate', 'flexible'] as const
export type Budget = (typeof BUDGETS)[number]

export const COOKING_TIMES = ['minimal', 'some', 'enjoy'] as const
export type CookingTime = (typeof COOKING_TIMES)[number]

export const DIET_TEXT_MAX_LENGTH = 300

export const dietQuestionnaireSchema = z.strictObject({
  mealsPerDay: z.union(MEALS_PER_DAY.map((m) => z.literal(m))),
  dietStyle: z.enum(DIET_STYLES),
  budget: z.enum(BUDGETS),
  cookingTime: z.enum(COOKING_TIMES),
  /** Allergies and intolerances: never included in the plan. */
  allergies: z.string().trim().max(DIET_TEXT_MAX_LENGTH).optional(),
  /** Foods the user doesn't like: avoided where possible. */
  dislikes: z.string().trim().max(DIET_TEXT_MAX_LENGTH).optional(),
})
export type DietQuestionnaire = z.infer<typeof dietQuestionnaireSchema>

export const requestDietPlanSchema = z.strictObject({
  questionnaire: dietQuestionnaireSchema,
})
export type RequestDietPlanInput = z.infer<typeof requestDietPlanSchema>

// ---------------------------------------------------------------------------
// AI output. Kept simple (no numeric bounds) so it translates cleanly to the structured-output
// JSON schema; business bounds are checked afterwards in domain/diet-validation.ts. Calories are
// never asked for: they are derived from the macros (4/4/9 kcal per gram), so they always add up.
// ---------------------------------------------------------------------------

export const MEAL_TYPES = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'supper',
] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const foodSchema = z.object({
  name: z.string().describe('Food name in the user’s language'),
  quantity: z
    .string()
    .describe(
      'Household measure with grams or ml, e.g. "4 colheres de sopa (80 g)" or "1 unidade (50 g)"',
    ),
  proteinG: z.number().describe('Protein in grams for this quantity'),
  carbsG: z.number().describe('Carbohydrates in grams for this quantity'),
  fatG: z.number().describe('Fat in grams for this quantity'),
})
export type Food = z.infer<typeof foodSchema>

export const mealOptionSchema = z.object({
  title: z.string().describe('Short name of the dish, e.g. "Frango grelhado com arroz e feijão"'),
  foods: z.array(foodSchema),
  preparation: z.string().describe('One short preparation tip, or an empty string'),
})
export type MealOption = z.infer<typeof mealOptionSchema>

export const mealSchema = z.object({
  type: z.enum(MEAL_TYPES),
  time: z.string().describe('Suggested time, 24 h "HH:MM"'),
  options: z
    .array(mealOptionSchema)
    .describe('2 interchangeable options with similar calories and protein'),
})
export type Meal = z.infer<typeof mealSchema>

export const dietPlanSchema = z.object({
  name: z.string().describe('Short, motivating plan name'),
  summary: z.string().describe('2–3 sentences: how this plan supports the goal'),
  meals: z.array(mealSchema),
  hydration: z.string().describe('One sentence on daily water intake'),
  tips: z.array(z.string()).describe('3–5 short practical tips'),
  shoppingList: z.array(z.string()).describe('8–20 items for a week, grouped naturally'),
})
export type DietPlan = z.infer<typeof dietPlanSchema>
