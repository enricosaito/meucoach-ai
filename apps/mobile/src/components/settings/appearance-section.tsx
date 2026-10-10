import { View } from 'react-native'
import { useAppearance, type AppearancePreference } from '../../lib/appearance'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { space } from '../../theme'
import { Card, Segmented, Txt } from '../ui'

/** System / light / dark. Applies instantly and is remembered on this device. */
export function AppearanceSection() {
  const { t } = useI18n()
  const { preference, setPreference } = useAppearance()
  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{t('settings.appearance')}</Txt>
        <Txt variant="caption" muted>
          {t('settings.appearanceHelp')}
        </Txt>
      </View>
      <Segmented<AppearancePreference>
        value={preference}
        options={[
          { value: 'system', label: t('settings.appearanceSystem') },
          { value: 'light', label: t('settings.appearanceLight') },
          { value: 'dark', label: t('settings.appearanceDark') },
        ]}
        onChange={(next) => {
          haptics.tap()
          setPreference(next)
        }}
      />
    </Card>
  )
}
