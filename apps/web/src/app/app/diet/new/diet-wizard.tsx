'use client'

import { OptionCards } from '@/components/option-cards'
import {
  Button,
  Card,
  cx,
  ErrorText,
  Field,
  inputClass,
  Segmented,
  SectionTitle,
  Skeleton,
} from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { fetchDietQuestionnaire } from '@/lib/diet-data'
import { useI18n } from '@/lib/i18n/client'
import { useWrite } from '@/lib/use-write'
import {
  BUDGETS,
  COOKING_TIMES,
  DIET_STYLES,
  DIET_TEXT_MAX_LENGTH,
  MEALS_PER_DAY,
  type DietQuestionnaire,
} from '@mycoach/core/nutrition/contracts'
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { useMe } from '../../me-context'

const DEFAULTS: DietQuestionnaire = {
  mealsPerDay: 4,
  dietStyle: 'omnivore',
  budget: 'moderate',
  cookingTime: 'some',
}

export function DietWizard() {
  const { t } = useI18n()
  const [questionnaire, setQuestionnaire] = useState<DietQuestionnaire | null>(null)

  useEffect(() => {
    fetchDietQuestionnaire()
      .then((saved) => {
        setQuestionnaire(saved ?? DEFAULTS)
      })
      .catch(() => {
        setQuestionnaire(DEFAULTS)
      })
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/app/diet"
        className="-ml-2 inline-flex items-center gap-1 self-start rounded-full px-2 py-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('wizard.back')}
      </Link>
      {questionnaire ? (
        <DietForm value={questionnaire} onChange={setQuestionnaire} />
      ) : (
        <Skeleton className="h-[40rem] rounded-3xl" />
      )}
    </div>
  )
}

function DietForm({
  value,
  onChange,
}: {
  value: DietQuestionnaire
  onChange: (q: DietQuestionnaire) => void
}) {
  const { t, formatNumber } = useI18n()
  const { me } = useMe()
  const router = useRouter()

  const submit = useWrite((key) =>
    unwrap(
      getApi().api.v1.nutrition['diet-plans'].$post(
        {
          json: {
            questionnaire: {
              ...value,
              allergies: value.allergies?.trim() || undefined,
              dislikes: value.dislikes?.trim() || undefined,
            },
          },
        },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  const set = <K extends keyof DietQuestionnaire>(key: K, v: DietQuestionnaire[K]) => {
    onChange({ ...value, [key]: v })
    submit.reset()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (await submit.run()) router.push('/app/diet')
  }

  const targets = me?.targets

  return (
    <Card className="animate-rise-in">
      <SectionTitle title={t('dietWizard.title')} description={t('dietWizard.body')} />
      <form className="flex flex-col gap-6" onSubmit={(e) => void onSubmit(e)}>
        <Field label={t('dietWizard.mealsPerDay')}>
          <Segmented
            label={t('dietWizard.mealsPerDay')}
            value={String(value.mealsPerDay)}
            options={MEALS_PER_DAY.map((m) => ({ value: String(m), label: String(m) }))}
            onChange={(v) => {
              set('mealsPerDay', Number(v) as DietQuestionnaire['mealsPerDay'])
            }}
          />
        </Field>

        <OptionCards
          legend={t('dietWizard.dietStyle')}
          name="diet-style"
          value={value.dietStyle}
          options={DIET_STYLES.map((s) => ({
            value: s,
            label: t(`dietWizard.styles.${s}.label`),
            description: t(`dietWizard.styles.${s}.description`),
          }))}
          onChange={(v) => {
            set('dietStyle', v)
          }}
        />

        <OptionCards
          legend={t('dietWizard.budget')}
          name="budget"
          value={value.budget}
          options={BUDGETS.map((b) => ({
            value: b,
            label: t(`dietWizard.budgets.${b}.label`),
            description: t(`dietWizard.budgets.${b}.description`),
          }))}
          onChange={(v) => {
            set('budget', v)
          }}
        />

        <OptionCards
          legend={t('dietWizard.cookingTime')}
          name="cooking-time"
          value={value.cookingTime}
          options={COOKING_TIMES.map((c) => ({
            value: c,
            label: t(`dietWizard.cookingTimes.${c}.label`),
            description: t(`dietWizard.cookingTimes.${c}.description`),
          }))}
          onChange={(v) => {
            set('cookingTime', v)
          }}
        />

        <Field
          label={t('dietWizard.allergies')}
          htmlFor="allergies"
          hint={t('dietWizard.allergiesHint')}
        >
          <textarea
            id="allergies"
            rows={2}
            maxLength={DIET_TEXT_MAX_LENGTH}
            placeholder={t('dietWizard.allergiesPlaceholder')}
            value={value.allergies ?? ''}
            onChange={(e) => {
              set('allergies', e.target.value)
            }}
            className={cx(inputClass, 'h-auto resize-none py-3')}
          />
        </Field>

        <Field label={t('dietWizard.dislikes')} htmlFor="dislikes">
          <textarea
            id="dislikes"
            rows={2}
            maxLength={DIET_TEXT_MAX_LENGTH}
            placeholder={t('dietWizard.dislikesPlaceholder')}
            value={value.dislikes ?? ''}
            onChange={(e) => {
              set('dislikes', e.target.value)
            }}
            className={cx(inputClass, 'h-auto resize-none py-3')}
          />
        </Field>

        {targets ? (
          <p className="flex items-start gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
            {t('dietWizard.targetsNote', {
              kcal: formatNumber(targets.kcal),
              protein: formatNumber(targets.proteinG),
            })}
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-2xl bg-energy-soft px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-energy" aria-hidden />
            <Link href="/app/energy" className="font-medium underline">
              {t('diet.needsTestBody')}
            </Link>
          </p>
        )}

        <ErrorText>{submit.error}</ErrorText>

        <Button type="submit" className="w-full" loading={submit.pending} disabled={!targets}>
          {submit.pending ? t('dietWizard.sending') : t('dietWizard.generate')}
        </Button>
      </form>
    </Card>
  )
}
