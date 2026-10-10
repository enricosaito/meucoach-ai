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
import { Image } from 'expo-image'
import type { ImagePickerAsset } from 'expo-image-picker'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { ArrowLeft, Camera, ExternalLink, Info, ShieldCheck, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { api, newIdempotencyKey, unwrap, writeHeaders } from '../../lib/api'
import {
  pickBodyPhoto,
  prepareBodyPhoto,
  uploadBodyPhoto,
  type PhotoSource,
} from '../../lib/body-photos'
import { fetchQuestionnaire, hasPhotoConsent } from '../../lib/data'
import { env } from '../../lib/env'
import { haptics } from '../../lib/haptics'
import { errorMessage, useI18n } from '../../lib/i18n'
import { useMe } from '../../lib/me'
import { font } from '../../lib/typography'
import { radius, space, useColors } from '../../theme'
import { Appear } from '../appear'
import { Button, Card, ErrorText, Segmented, Skeleton, Txt } from '../ui'
import { Checkbox, OptionCards } from './wizard-controls'

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

type Photos = Partial<Record<BodyView, ImagePickerAsset>>

/**
 * New plan in three steps, same as the web wizard: questionnaire (prefilled with the last
 * answers), optional progress photos behind the LGPD consent, then review and submit. The plan
 * is generated in a background job; the Training tab polls for it.
 */
export function PlanWizard() {
  const { t } = useI18n()
  const colors = useColors()
  const [step, setStep] = useState(0)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [consented, setConsented] = useState<boolean | null>(null)
  const [photos, setPhotos] = useState<Photos>({})

  useEffect(() => {
    void Promise.all([
      fetchQuestionnaire().catch(() => null),
      hasPhotoConsent().catch(() => false),
    ]).then(([saved, consent]) => {
      setQuestionnaire(saved ?? DEFAULTS)
      setConsented(consent)
    })
  }, [])

  const total = 3

  return (
    <>
      <View style={{ gap: space.md }}>
        <View style={styles.rowBetween}>
          {step > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setStep((s) => s - 1)
              }}
              style={styles.row}
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Txt variant="label" muted>
                {t('wizard.back')}
              </Txt>
            </Pressable>
          ) : (
            <View />
          )}
          <Txt variant="label" muted style={{ fontWeight: '400' }}>
            {t('wizard.stepOf', { current: step + 1, total })}
          </Txt>
        </View>
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= step ? colors.accent : colors.surfaceMuted },
              ]}
            />
          ))}
        </View>
      </View>

      {!questionnaire || consented === null ? (
        <Skeleton height={560} />
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
    </>
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
  const colors = useColors()
  const set = <K extends keyof Questionnaire>(key: K, v: Questionnaire[K]) => {
    onChange({ ...value, [key]: v })
  }

  return (
    <Appear>
      <Card style={{ gap: space.xl }}>
        <View style={{ gap: 2 }}>
          <Txt variant="heading">{t('wizard.aboutTitle')}</Txt>
          <Txt variant="caption" muted>
            {t('wizard.aboutBody')}
          </Txt>
        </View>

        <OptionCards
          legend={t('wizard.experience')}
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

        <View style={{ gap: space.sm }}>
          <Txt variant="label">{t('wizard.daysPerWeek')}</Txt>
          <Segmented
            value={String(value.daysPerWeek)}
            options={DAY_OPTIONS.map((d) => ({ value: String(d), label: String(d) }))}
            onChange={(v) => {
              haptics.tap()
              set('daysPerWeek', Number(v))
            }}
          />
        </View>

        <View style={{ gap: space.sm }}>
          <Txt variant="label">{t('wizard.sessionLength')}</Txt>
          <Segmented
            value={String(value.sessionMinutes)}
            options={SESSION_MINUTES.map((m) => ({ value: String(m), label: String(m) }))}
            onChange={(v) => {
              haptics.tap()
              set('sessionMinutes', Number(v) as Questionnaire['sessionMinutes'])
            }}
          />
        </View>

        <OptionCards
          legend={t('wizard.equipment')}
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

        <View style={{ gap: space.sm }}>
          <Txt variant="label">{t('wizard.limitations')}</Txt>
          <TextInput
            multiline
            maxLength={500}
            placeholder={t('wizard.limitationsPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={value.limitations ?? ''}
            onChangeText={(text) => {
              set('limitations', text)
            }}
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
          />
        </View>

        <Button onPress={onNext} style={{ alignSelf: 'stretch' }}>
          {t('wizard.next')}
        </Button>
      </Card>
    </Appear>
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
  const colors = useColors()
  const count = Object.keys(photos).length

  return (
    <Appear style={{ gap: space.lg }}>
      {consented ? (
        <Card style={{ gap: space.lg }}>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">{t('wizard.photosTitle')}</Txt>
            <Txt variant="caption" muted>
              {t('wizard.photosBody')}
            </Txt>
          </View>
          <View style={styles.slots}>
            {BODY_VIEWS.map((view) => (
              <PhotoSlot
                key={view}
                view={view}
                asset={photos[view]}
                onChange={(asset) => {
                  const next = { ...photos }
                  if (asset) next[view] = asset
                  else delete next[view]
                  onPhotos(next)
                }}
              />
            ))}
          </View>
          <View style={styles.tip}>
            <Info size={16} color={colors.textSecondary} />
            <Txt variant="caption" muted style={{ flex: 1 }}>
              {t('wizard.photoTips')}
            </Txt>
          </View>
          <Button onPress={onNext} disabled={count === 0} style={{ alignSelf: 'stretch' }}>
            {t('wizard.next')}
          </Button>
        </Card>
      ) : (
        <ConsentCard onConsented={onConsented} />
      )}
      <Pressable onPress={onSkip} hitSlop={8} style={{ alignSelf: 'center', padding: space.sm }}>
        <Txt variant="label" muted>
          {t('wizard.skipPhotos')}
        </Txt>
      </Pressable>
    </Appear>
  )
}

/** Camera or library: an action sheet on iOS, an alert on Android, the file picker on web. */
function choosePhotoSource(
  labels: { title: string; camera: string; library: string; cancel: string },
  onPick: (source: PhotoSource) => void,
) {
  if (Platform.OS === 'web') {
    onPick('library')
  } else if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: labels.title,
        options: [labels.camera, labels.library, labels.cancel],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) onPick('camera')
        if (index === 1) onPick('library')
      },
    )
  } else {
    Alert.alert(labels.title, undefined, [
      { text: labels.camera, onPress: () => onPick('camera') },
      { text: labels.library, onPress: () => onPick('library') },
      { text: labels.cancel, style: 'cancel' },
    ])
  }
}

function PhotoSlot({
  view,
  asset,
  onChange,
}: {
  view: BodyView
  asset: ImagePickerAsset | undefined
  onChange: (asset: ImagePickerAsset | undefined) => void
}) {
  const { t } = useI18n()
  const colors = useColors()
  const viewLabel = t(`training.views.${view}`)

  function add() {
    haptics.tap()
    choosePhotoSource(
      {
        title: viewLabel,
        camera: t('wizard.takePhoto'),
        library: t('wizard.choosePhoto'),
        cancel: t('common.cancel'),
      },
      (source) => {
        void pickBodyPhoto(source).then((picked) => {
          if (picked) onChange(picked)
        })
      },
    )
  }

  return (
    <View style={{ flex: 1, gap: 6 }}>
      {asset ? (
        <View style={[styles.slot, { backgroundColor: colors.surfaceMuted }]}>
          {/* Local file preview; never leaves the device until upload. */}
          <Image source={{ uri: asset.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('wizard.removePhoto')}: ${viewLabel}`}
            onPress={() => {
              haptics.tap()
              onChange(undefined)
            }}
            hitSlop={6}
            style={[styles.remove, { backgroundColor: colors.overlay }]}
          >
            <X size={14} color={colors.onOverlay} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('wizard.addPhoto')}: ${viewLabel}`}
          onPress={add}
          style={({ pressed }) => [
            styles.slot,
            styles.emptySlot,
            {
              borderColor: pressed ? colors.accentIcon : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Camera size={22} color={colors.textSecondary} />
          <Txt variant="caption" muted style={{ fontWeight: '500', textAlign: 'center' }}>
            {t('wizard.addPhoto')}
          </Txt>
        </Pressable>
      )}
      <Txt variant="caption" muted style={{ textAlign: 'center', fontWeight: '500' }}>
        {viewLabel}
      </Txt>
    </View>
  )
}

function ConsentCard({ onConsented }: { onConsented: () => void }) {
  const { t } = useI18n()
  const colors = useColors()
  const [adult, setAdult] = useState(false)
  const [agree, setAgree] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const key = useRef(newIdempotencyKey())

  async function accept() {
    setPending(true)
    setError('')
    try {
      await unwrap(
        api.me.consents[':kind'].$put(
          { param: { kind: 'body_photos' }, json: { version: CONSENT_VERSIONS.body_photos } },
          { headers: writeHeaders(key.current) },
        ),
      )
      haptics.success()
      onConsented()
    } catch (e) {
      setError(errorMessage(t, e))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card style={{ gap: space.lg }}>
      <View style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}>
        <ShieldCheck size={24} color={colors.accentIcon} />
      </View>
      <View style={{ gap: space.xs }}>
        <Txt variant="heading">{t('consent.title')}</Txt>
        <Txt muted>{t('consent.body')}</Txt>
      </View>
      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(`${env.apiUrl}/privacy`)}
        style={styles.row}
        hitSlop={6}
      >
        <Txt variant="label" color="accentText">
          {t('consent.readPolicy')}
        </Txt>
        <ExternalLink size={14} color={colors.accentIcon} />
      </Pressable>
      <View style={{ gap: space.md }}>
        <Checkbox checked={adult} onChange={setAdult}>
          {t('consent.adult')}
        </Checkbox>
        <Checkbox checked={agree} onChange={setAgree}>
          {t('consent.agree')}
        </Checkbox>
      </View>
      <ErrorText>{error}</ErrorText>
      <Button
        onPress={() => void accept()}
        disabled={!adult || !agree}
        loading={pending}
        style={{ alignSelf: 'stretch' }}
      >
        {t('consent.accept')}
      </Button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Step 3: review and submit
// ---------------------------------------------------------------------------

type Phase = 'idle' | 'uploading' | 'sending'

function ReviewStep({ questionnaire, photos }: { questionnaire: Questionnaire; photos: Photos }) {
  const { t } = useI18n()
  const colors = useColors()
  const { me } = useMe()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  // Kept across retries: photos are uploaded once, and the plan request reuses its key.
  const uploadedScan = useRef<{ scanId: string; views: BodyView[] } | null>(null)
  const planKey = useRef(newIdempotencyKey())

  const views = BODY_VIEWS.filter((v) => photos[v])
  const limitations = questionnaire.limitations?.trim()

  async function uploadPhotos() {
    if (uploadedScan.current || views.length === 0) return uploadedScan.current
    setPhase('uploading')
    let bodies: ArrayBuffer[]
    try {
      bodies = await Promise.all(views.map((v) => prepareBodyPhoto(photos[v] as ImagePickerAsset)))
    } catch {
      throw new PhotoReadError()
    }
    const { scanId, uploads } = await unwrap(
      api.training.photos['upload-urls'].$post(
        { json: { views, contentType: 'image/jpeg' } },
        // A fresh scan on each attempt: a retry never re-uploads to a half-used signed URL.
        { headers: writeHeaders() },
      ),
    )
    await Promise.all(
      uploads.map((upload) => {
        const body = bodies[views.indexOf(upload.view)]
        if (!body) throw new Error(`Missing photo for ${upload.view}`)
        return uploadBodyPhoto(upload.path, upload.token, body)
      }),
    )
    uploadedScan.current = { scanId, views }
    return uploadedScan.current
  }

  async function submit() {
    haptics.tap()
    setError('')
    try {
      const scan = await uploadPhotos()
      setPhase('sending')
      await unwrap(
        api.training.plans.$post(
          {
            json: {
              questionnaire: { ...questionnaire, limitations: limitations || undefined },
              bodyScan: scan ? { ...scan, contentType: 'image/jpeg' } : null,
            },
          },
          { headers: writeHeaders(planKey.current) },
        ),
      )
      haptics.success()
      router.back()
    } catch (e) {
      setError(e instanceof PhotoReadError ? t('wizard.photoTooLarge') : errorMessage(t, e))
      setPhase('idle')
    }
  }

  const rows: [string, string][] = [
    [t('wizard.experience'), t(`wizard.experienceLevels.${questionnaire.experience}.label`)],
    [t('wizard.daysPerWeek'), String(questionnaire.daysPerWeek)],
    [t('wizard.sessionLength'), t('wizard.minutesOption', { count: questionnaire.sessionMinutes })],
    [t('wizard.equipment'), t(`wizard.equipmentOptions.${questionnaire.equipment}.label`)],
    ...(limitations ? [[t('wizard.limitations'), limitations] as [string, string]] : []),
    [
      t('wizard.photosTitle'),
      views.length
        ? `${t('wizard.photosCount', { count: views.length })} · ${views.map((v) => t(`training.views.${v}`)).join(', ')}`
        : t('wizard.noPhotos'),
    ],
  ]

  return (
    <Appear>
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: 2 }}>
          <Txt variant="heading">{t('wizard.reviewTitle')}</Txt>
          <Txt variant="caption" muted>
            {t('wizard.reviewBody')}
          </Txt>
        </View>
        <View>
          {rows.map(([label, value], i) => (
            <View
              key={label}
              style={[
                styles.reviewRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
              ]}
            >
              <Txt muted>{label}</Txt>
              <Txt style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{value}</Txt>
            </View>
          ))}
        </View>
        {me && !me.latestAssessment && (
          <View style={[styles.hint, { backgroundColor: colors.warningSoft }]}>
            <Info size={16} color={colors.warning} />
            <Txt variant="caption" style={{ flex: 1 }}>
              {t('wizard.energyHint')}
            </Txt>
          </View>
        )}
        <ErrorText>{error}</ErrorText>
        <Button
          onPress={() => void submit()}
          loading={phase !== 'idle'}
          style={{ alignSelf: 'stretch' }}
        >
          {phase === 'uploading'
            ? t('wizard.uploading')
            : phase === 'sending'
              ? t('wizard.sending')
              : t('wizard.generate')}
        </Button>
      </Card>
    </Appear>
  )
}

/** A picked photo couldn't be decoded or re-encoded on the device. */
class PhotoReadError extends Error {}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  textarea: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    fontSize: 16,
    ...font('ui', 500),
    textAlignVertical: 'top',
  },
  slots: { flexDirection: 'row', gap: space.sm },
  slot: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden' },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: space.xs,
  },
  remove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: { flexDirection: 'row', gap: space.sm },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRow: { flexDirection: 'row', gap: space.lg, paddingVertical: space.md },
  hint: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md },
})
