'use client'

import { Card, cx } from '@/components/ui'
import { useI18n } from '@/lib/i18n/client'
import {
  dayTotals,
  foodKcal,
  optionTotals,
  type DailyTargets,
  type DietPlan,
  type MacroTotals,
  type Meal,
} from '@mycoach/core/nutrition/contracts'
import { Clock, Droplets, Lightbulb, ShoppingBasket, Utensils } from 'lucide-react'
import { useState } from 'react'

const MACROS = [
  { key: 'proteinG', label: 'targets.protein', color: 'bg-accent' },
  { key: 'carbsG', label: 'targets.carbs', color: 'bg-energy' },
  { key: 'fatG', label: 'targets.fat', color: 'bg-fat' },
] as const

export function DietPlanView({ plan, targets }: { plan: DietPlan; targets: DailyTargets | null }) {
  const { t, formatNumber } = useI18n()
  // Which option the user is looking at for each meal; the day totals follow it.
  const [choice, setChoice] = useState<number[]>(() => plan.meals.map(() => 0))
  const totals = dayTotals(plan.meals, choice)

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <Card className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full bg-accent-soft blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-tight">{plan.name}</h2>
          <p className="mt-1.5 text-[15px] text-muted">{plan.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
              <Utensils className="size-4" aria-hidden />
              {t('diet.mealsPerDay', { count: plan.meals.length })}
            </li>
          </ul>
        </div>
      </Card>

      <DayTotals totals={totals} targets={targets} />

      {plan.meals.map((meal, i) => (
        <MealCard
          key={`${meal.type}-${String(i)}`}
          meal={meal}
          selected={choice[i] ?? 0}
          onSelect={(option) => {
            setChoice((current) => current.map((c, j) => (j === i ? option : c)))
          }}
        />
      ))}

      <Card>
        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
          <Droplets className="size-4 text-fat" aria-hidden />
          {t('diet.hydration')}
        </h3>
        <p className="mt-1.5 text-[15px] text-muted">{plan.hydration}</p>
        <h3 className="mt-5 flex items-center gap-2 font-semibold tracking-tight">
          <Lightbulb className="size-4 text-energy" aria-hidden />
          {t('diet.tips')}
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {plan.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-[15px] text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      {plan.shoppingList.length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
              <ShoppingBasket className="size-4 text-accent-text" aria-hidden />
              <span className="flex-1">{t('diet.shoppingList')}</span>
              <span className="text-sm font-normal text-muted tabular-nums">
                {formatNumber(plan.shoppingList.length)}
              </span>
            </summary>
            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[15px] text-muted sm:grid-cols-2">
              {plan.shoppingList.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-line" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </details>
        </Card>
      )}

      <p className="px-1 text-xs text-muted">{t('diet.disclaimer')}</p>
    </div>
  )
}

function DayTotals({ totals, targets }: { totals: MacroTotals; targets: DailyTargets | null }) {
  const { t, formatNumber } = useI18n()
  return (
    <Card>
      <p className="text-sm font-medium text-muted">{t('diet.dayTotal')}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatNumber(totals.kcal)}
        </span>
        <span className="text-[15px] text-muted">kcal</span>
        {targets && (
          <span className="text-sm text-muted">
            · {t('diet.target', { kcal: formatNumber(targets.kcal) })}
          </span>
        )}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {MACROS.map((m) => {
          const target = targets?.[m.key]
          const share = target ? Math.min(1, totals[m.key] / target) : 0
          return (
            <div key={m.key}>
              <dt className="flex items-center gap-1.5 text-sm text-muted">
                <span className={`size-2 rounded-full ${m.color}`} aria-hidden />
                {t(m.label)}
              </dt>
              <dd className="mt-0.5">
                <span className="text-xl font-semibold tabular-nums">
                  {t('common.grams', { value: formatNumber(totals[m.key]) })}
                </span>
                {target !== undefined && (
                  <>
                    <span className="ml-1 text-xs text-muted tabular-nums">
                      / {formatNumber(target)}
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className={`block h-full rounded-full ${m.color} transition-[width] duration-300`}
                        style={{ width: `${(share * 100).toFixed(1)}%` }}
                      />
                    </span>
                  </>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </Card>
  )
}

function MealCard({
  meal,
  selected,
  onSelect,
}: {
  meal: Meal
  selected: number
  onSelect: (option: number) => void
}) {
  const { t, formatNumber } = useI18n()
  const option = meal.options[selected] ?? meal.options[0]
  if (!option) return null
  const totals = optionTotals(option)

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{t(`diet.meals.${meal.type}`)}</h3>
        <span className="inline-flex items-center gap-1 text-sm text-muted tabular-nums">
          <Clock className="size-3.5" aria-hidden />
          {meal.time}
        </span>
      </div>

      {meal.options.length > 1 && (
        <div role="tablist" aria-label={t(`diet.meals.${meal.type}`)} className="mt-3 flex gap-2">
          {meal.options.map((o, i) => (
            <button
              key={`${o.title}-${String(i)}`}
              role="tab"
              type="button"
              aria-selected={i === selected}
              onClick={() => {
                onSelect(i)
              }}
              className={cx(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                i === selected
                  ? 'bg-fg text-bg'
                  : 'bg-surface-2 text-muted hover:bg-line hover:text-fg',
              )}
            >
              {t('diet.option', { number: i + 1 })}
            </button>
          ))}
        </div>
      )}

      <div role="tabpanel" key={selected} className="animate-rise-in">
        <p className="mt-4 font-medium">{option.title}</p>
        <p className="mt-0.5 text-sm text-muted tabular-nums">
          {t('diet.kcal', { count: formatNumber(totals.kcal) })} ·{' '}
          {t('diet.macros', {
            protein: formatNumber(totals.proteinG),
            carbs: formatNumber(totals.carbsG),
            fat: formatNumber(totals.fatG),
          })}
        </p>
        <ul className="mt-3 flex flex-col divide-y divide-line">
          {option.foods.map((food, i) => (
            <li
              key={`${food.name}-${String(i)}`}
              className="flex items-baseline justify-between gap-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block text-[15px]">{food.name}</span>
                <span className="block text-sm text-muted">{food.quantity}</span>
              </span>
              <span className="shrink-0 text-sm text-muted tabular-nums">
                {t('diet.kcal', {
                  count: formatNumber(Math.round(foodKcal(food))),
                })}
              </span>
            </li>
          ))}
        </ul>
        {option.preparation && (
          <p className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
            {option.preparation}
          </p>
        )}
      </div>
    </Card>
  )
}
