import type { LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { useI18n } from '../lib/i18n'
import { radius, space, useColors } from '../theme'
import { Card, Screen, Txt } from './ui'

/** Placeholder for tabs that are still being ported from the web app. */
export function ComingSoon({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Screen title={title}>
      <Card>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.xs,
          }}
        >
          <Icon size={24} color={colors.accentIcon} />
        </View>
        <Txt variant="heading">{t('mobile.comingSoonTitle')}</Txt>
        <Txt muted>{t('mobile.comingSoonBody')}</Txt>
      </Card>
    </Screen>
  )
}
