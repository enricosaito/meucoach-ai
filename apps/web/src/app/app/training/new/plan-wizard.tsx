'use client'

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
import { getApi, newIdempotencyKey, unwrap, writeHeaders } from '@/lib/api'
import { errorMessage, useI18n } from '@/lib/i18n/client'
import { preparePhoto } from '@/lib/images'
import { fetchQuestionnaire, hasPhotoConsent, uploadToSignedUrl } from '@/lib/training-data'
import { CONSENT_VERSIONS } from '@mycoach/core/profile/contracts'
import {
  BODY_VIEWS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  MAX_DAYS_PER_WEEK,
  MIN_DAYS_PER_WEEK,
  SESSION_MINUTES,
  type BodyView,
  type Questionnaire,
} from '@mycoach/core/training/contracts'
import { ArrowLeft, Camera, Check, Info, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMe } from '../../me-context'
import { OptionCards } from '@/components/option-cards'

const DEFAULTS: Questionnaire = {
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 45,
  equipment: 'full_gym',
}

const DAY_OPTIONS = Array.from(
  { length: MAX_DAYS_PER_WEEK - MIN_DAYS_PER_WEEK + 1 },
  (_, i) => MIN_DAYS_PER_WEEK + i,
)

type Photos = Partial<Record<BodyView, File>>

export function PlanWizard() {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [consented, setConsented] = useState<boolean | null>(null)
  const [photos, setPhotos] = useState<Photos>({})

  useEffect(() => {
    void Promise.all([fetchQuestionnaire(), hasPhotoConsent()]).then(([saved, consent]) => {
      setQuestionnaire(saved ?? DEFAULTS)
      setConsented(consent)
    })
  }, [])

  const steps = [t('wizard.aboutTitle'), t('wizard.photosTitle'), t('wizard.reviewTitle')]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between text-sm">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setStep((s) => s - 1)
              }}
              className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted hover:text-fg"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('wizard.back')}
            </button>
          ) : (
            <Link
              href="/app/training"
              className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted hover:text-fg"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('wizard.back')}
            </Link>
          )}
          <span className="text-muted">
            {t('wizard.stepOf', { current: step + 1, total: steps.length })}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {steps.map((label, i) => (
            <span
              key={label}
              className={cx(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                i <= step ? 'bg-accent' : 'bg-surface-2',
              )}
            />
          ))}
        </div>
      </div>

      {!questionnaire || consented === null ? (
        <Skeleton className="h-[36rem] rounded-3xl" />
      ) : step === 0 ? (
        <AboutStep
          value={questionnaire}
          onChange={setQuestionnaire}
          onNext={() => {
            setStep(1)
          }}
        />
      ) : step === 1 ? (
        <PhotosStep
          consented={consented}
          onConsented={() => {
            setConsented(true)
          }}
          photos={photos}
          onPhotos={setPhotos}
          onNext={() => {
            setStep(2)
          }}
          onSkip={() => {
            setPhotos({})
            setStep(2)
          }}
        />
      ) : (
        <ReviewStep questionnaire={questionnaire} photos={photos} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: questionnaire
// ---------------------------------------------------------------------------

function AboutStep({
  value,
  onChange,
  onNext,
}: {
  value: Questionnaire
  onChange: (q: Questionnaire) => void
  onNext: () => void
}) {
  const { t } = useI18n()
  const set = <K extends keyof Questionnaire>(key: K, v: Questionnaire[K]) => {
    onChange({ ...value, [key]: v })
  }

  return (
    <Card className="animate-rise-in">
      <SectionTitle title={t('wizard.aboutTitle')} description={t('wizard.aboutBody')} />
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          onNext()
        }}
      >
        <OptionCards
          legend={t('wizard.experience')}
          name="experience"
          value={value.experience}
          options={EXPERIENCE_LEVELS.map((level) => ({
            value: level,
            label: t(`wizard.experienceLevels.${level}.label`),
            description: t(`wizard.experienceLevels.${level}.description`),
          }))}
          onChange={(v) => {
            set('experience', v)
          }}
        />

        <Field label={t('wizard.daysPerWeek')}>
          <Segmented
            label={t('wizard.daysPerWeek')}
            value={String(value.daysPerWeek)}
            options={DAY_OPTIONS.map((d) => ({ value: String(d), label: String(d) }))}
            onChange={(v) => {
              set('daysPerWeek', Number(v))
            }}
          />
        </Field>

        <Field label={t('wizard.sessionLength')}>
          <Segmented
            label={t('wizard.sessionLength')}
            value={String(value.sessionMinutes)}
            options={SESSION_MINUTES.map((m) => ({ value: String(m), label: String(m) }))}
            onChange={(v) => {
              set('sessionMinutes', Number(v) as Questionnaire['sessionMinutes'])
            }}
          />
        </Field>

        <OptionCards
          legend={t('wizard.equipment')}
          name="equipment"
          value={value.equipment}
          options={EQUIPMENT_OPTIONS.map((e) => ({
            value: e,
            label: t(`wizard.equipmentOptions.${e}.label`),
            description: t(`wizard.equipmentOptions.${e}.description`),
          }))}
          onChange={(v) => {
            set('equipment', v)
          }}
        />

        <Field label={t('wizard.limitations')} htmlFor="limitations">
          <textarea
            id="limitations"
            rows={3}
            maxLength={500}
            placeholder={t('wizard.limitationsPlaceholder')}
            value={value.limitations ?? ''}
            onChange={(e) => {
              set('limitations', e.target.value)
            }}
            className={cx(inputClass, 'h-auto resize-none py-3')}
          />
        </Field>

        <Button type="submit" className="w-full">
          {t('wizard.next')}
        </Button>
      </form>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Step 2: photos (consent first)
// ---------------------------------------------------------------------------

function PhotosStep({
  consented,
  onConsented,
  photos,
  onPhotos,
  onNext,
  onSkip,
}: {
  consented: boolean
  onConsented: () => void
  photos: Photos
  onPhotos: (photos: Photos) => void
  onNext: () => void
  onSkip: () => void
}) {
  const { t } = useI18n()
  const count = Object.keys(photos).length

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      {consented ? (
        <Card>
          <SectionTitle title={t('wizard.photosTitle')} description={t('wizard.photosBody')} />
          <div className="grid grid-cols-3 gap-2.5">
            {BODY_VIEWS.map((view) => (
              <PhotoSlot
                key={view}
                view={view}
                file={photos[view]}
                onChange={(file) => {
                  const next = { ...photos }
                  if (file) next[view] = file
                  else delete next[view]
                  onPhotos(next)
                }}
              />
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('wizard.photoTips')}
          </p>
          <Button type="button" className="mt-5 w-full" disabled={count === 0} onClick={onNext}>
            {t('wizard.next')}
          </Button>
        </Card>
      ) : (
        <ConsentCard onConsented={onConsented} />
      )}
      <button
        type="button"
        onClick={onSkip}
        className="self-center rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-fg"
      >
        {t('wizard.skipPhotos')}
      </button>
    </div>
  )
}

function PhotoSlot({
  view,
  file,
  onChange,
}: {
  view: BodyView
  file: File | undefined
  onChange: (file: File | undefined) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`${t('wizard.addPhoto')}: ${t(`training.views.${view}`)}`}
        onChange={(e) => {
          onChange(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {file && preview ? (
        <div className="relative overflow-hidden rounded-2xl bg-surface-2">
          {/* Local object URL preview; never leaves the device until upload. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-[3/4] w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              onChange(undefined)
            }}
            aria-label={t('wizard.removePhoto')}
            className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-surface text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Camera className="size-6" aria-hidden />
          <span className="text-xs font-medium">{t('wizard.addPhoto')}</span>
        </button>
      )}
      <span className="text-center text-xs font-medium text-muted">
        {t(`training.views.${view}`)}
      </span>
    </div>
  )
}

function ConsentCard({ onConsented }: { onConsented: () => void }) {
  const { t } = useI18n()
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function accept() {
    setPending(true)
    setError('')
    try {
      await unwrap(
        getApi().api.v1.me.consents[':kind'].$put(
          { param: { kind: 'body_photos' }, json: { version: CONSENT_VERSIONS.body_photos } },
          { headers: writeHeaders() },
        ),
      )
      onConsented()
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
        <ShieldCheck className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{t('consent.title')}</h2>
      <p className="mt-1.5 text-[15px] text-muted">{t('consent.body')}</p>
      <Link
        href="/privacy"
        target="_blank"
        className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
      >
        {t('consent.readPolicy')}
      </Link>
      <div className="mt-5 flex flex-col gap-3">
        <Checkbox checked={adult} onChange={setAdult}>
          {t('consent.adult')}
        </Checkbox>
        <Checkbox checked={agree} onChange={setAgree}>
          {t('consent.agree')}
        </Checkbox>
      </div>
      <div className="mt-4">
        <ErrorText>{error}</ErrorText>
      </div>
      <Button
        type="button"
        className="mt-4 w-full"
        disabled={!adult || !agree}
        loading={pending}
        onClick={() => void accept()}
      >
        {t('consent.accept')}
      </Button>
    </Card>
  )
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[15px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked)
        }}
        className="peer sr-only"
      />
      <span
        className={cx(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
          checked ? 'border-accent bg-accent text-accent-fg' : 'border-line',
        )}
        aria-hidden
      >
        {checked && <Check className="size-3" strokeWidth={3.5} />}
      </span>
      <span>{children}</span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Step 3: review and submit
// ---------------------------------------------------------------------------

type Phase = 'idle' | 'uploading' | 'sending'

function ReviewStep({ questionnaire, photos }: { questionnaire: Questionnaire; photos: Photos }) {
  const { t } = useI18n()
  const { me } = useMe()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  // Kept across retries: photos are uploaded once, and the plan request reuses its key.
  const uploadedScan = useRef<{ scanId: string; views: BodyView[] } | null>(null)
  const planKey = useRef(newIdempotencyKey())

  const views = BODY_VIEWS.filter((v) => photos[v])

  async function uploadPhotos() {
    if (uploadedScan.current || views.length === 0) return uploadedScan.current
    setPhase('uploading')
    const blobs = await Promise.all(views.map((v) => preparePhoto(photos[v] as File)))
    const { scanId, uploads } = await unwrap(
      getApi().api.v1.training.photos['upload-urls'].$post(
        { json: { views, contentType: 'image/jpeg' } },
        { headers: writeHeaders() },
      ),
    )
    await Promise.all(
      uploads.map((upload) => {
        const blob = blobs[views.indexOf(upload.view)]
        if (!blob) throw new Error(`Missing photo for ${upload.view}`)
        return uploadToSignedUrl(upload.path, upload.token, blob)
      }),
    )
    uploadedScan.current = { scanId, views }
    return uploadedScan.current
  }

  async function submit() {
    setError('')
    try {
      const scan = await uploadPhotos()
      setPhase('sending')
      await unwrap(
        getApi().api.v1.training.plans.$post(
          {
            json: {
              questionnaire: {
                ...questionnaire,
                limitations: questionnaire.limitations?.trim() || undefined,
              },
              bodyScan: scan ? { ...scan, contentType: 'image/jpeg' } : null,
            },
          },
          { headers: writeHeaders(planKey.current) },
        ),
      )
      router.push('/app/training')
    } catch (e) {
      setError(e instanceof DOMException ? t('wizard.photoTooLarge') : errorMessage(t, e))
      setPhase('idle')
    }
  }

  const rows: [string, string][] = [
    [t('wizard.experience'), t(`wizard.experienceLevels.${questionnaire.experience}.label`)],
    [t('wizard.daysPerWeek'), String(questionnaire.daysPerWeek)],
    [t('wizard.sessionLength'), t('wizard.minutesOption', { count: questionnaire.sessionMinutes })],
    [t('wizard.equipment'), t(`wizard.equipmentOptions.${questionnaire.equipment}.label`)],
    [
      t('wizard.photosTitle'),
      views.length
        ? `${t('wizard.photosCount', { count: views.length })} · ${views.map((v) => t(`training.views.${v}`)).join(', ')}`
        : t('wizard.noPhotos'),
    ],
  ]
  if (questionnaire.limitations?.trim()) {
    rows.splice(4, 0, [t('wizard.limitations'), questionnaire.limitations.trim()])
  }

  return (
    <Card className="animate-rise-in">
      <SectionTitle title={t('wizard.reviewTitle')} description={t('wizard.reviewBody')} />
      <dl className="flex flex-col divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-[15px]">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {me && !me.latestAssessment && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-energy-soft px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-energy" aria-hidden />
          <span>
            <Link href="/app/energy" className="font-medium underline">
              {t('wizard.energyHint')}
            </Link>
          </span>
        </p>
      )}
      <div className="mt-4">
        <ErrorText>{error}</ErrorText>
      </div>
      <Button
        type="button"
        className="mt-4 w-full"
        loading={phase !== 'idle'}
        onClick={() => void submit()}
      >
        {phase === 'uploading'
          ? t('wizard.uploading')
          : phase === 'sending'
            ? t('wizard.sending')
            : t('wizard.generate')}
      </Button>
    </Card>
  )
}
