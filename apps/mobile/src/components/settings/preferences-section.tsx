import type { UnitSystem } from '@mycoach/core/profile/contracts'
import { LOCALES, type Locale } from '@mycoach/i18n'
import { useState } from 'react'
import { View } from 'react-native'
import { api, newIdempotencyKey, unwrap, writeHeaders } from '../../lib/api'
import { haptics } from '../../lib/haptics'
import { errorMessage, useI18n } from '../../lib/i18n'
import { useMe, type Me } from '../../lib/me'
import { space } from '../../theme'
import { Card, ErrorText, Segmented, Txt } from '../ui'

/** Language and units save on change; the time zone follows the device automatically. */
export function PreferencesSection({ profile }: { profile: Me['profile'] }) {
  const { t } = useI18n()
  const { setProfile } = useMe()
  const [error, setError] = useState('')

  async function save(patch: { locale?: Locale; units?: UnitSystem }) {
    haptics.tap()
    setError('')
    try {
      const result = await unwrap(
        api.me.profile.$patch({ json: patch }, { headers: writeHeaders(newIdempotencyKey()) }),
      )
      // A new language is applied app-wide by MeProvider once the profile updates.
      setProfile(result.profile)
    } catch (e) {
      setError(errorMessage(t, e))
    }
  }

  return (
    <Card style={{ gap: space.lg }}>
      <Txt variant="heading">{t('settings.preferences')}</Txt>
      <Field label={t('language.label')} hint={t('profile.languageHelp')}>
        <Segmented
          value={profile.locale}
          options={LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) }))}
          onChange={(locale) => void save({ locale })}
        />
      </Field>
      <Field label={t('profile.units')} hint={t('profile.unitsHelp')}>
        <Segmented
          value={profile.units}
          options={[
            { value: 'metric', label: t('profile.unitsMetric') },
            { value: 'imperial', label: t('profile.unitsImperial') },
          ]}
          onChange={(units) => void save({ units })}
        />
      </Field>
      <Field label={t('profile.timezone')} hint={t('profile.timezoneHelp')}>
        <Txt muted>{profile.timezone.replaceAll('_', ' ')}</Txt>
      </Field>
      <ErrorText>{error}</ErrorText>
    </Card>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">{label}</Txt>
      {children}
      <Txt variant="caption" muted>
        {hint}
      </Txt>
    </View>
  )
}
