import { NativeTabs } from 'expo-router/unstable-native-tabs'
import type { ImageSourcePropType } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { useColors } from '../../theme'

/**
 * Lucide icons (the web app's set) as template PNGs, so the native tab bar tints them like SF
 * Symbols. Regenerate with `pnpm --filter @mycoach/mobile tab-icons`.
 */
const ICONS = {
  home: require('../../../assets/images/tabs/home.png') as ImageSourcePropType,
  training: require('../../../assets/images/tabs/training.png') as ImageSourcePropType,
  diet: require('../../../assets/images/tabs/diet.png') as ImageSourcePropType,
  coach: require('../../../assets/images/tabs/coach.png') as ImageSourcePropType,
  profile: require('../../../assets/images/tabs/profile.png') as ImageSourcePropType,
}

/** The real iOS tab bar (Liquid Glass on iOS 26) and Material tabs on Android. */
export default function TabsLayout() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <NativeTabs tintColor={colors.accent} labelStyle={{ color: colors.muted }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('nav.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.home} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="training">
        <NativeTabs.Trigger.Label>{t('nav.training')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.training} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="diet">
        <NativeTabs.Trigger.Label>{t('nav.diet')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.diet} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coach">
        <NativeTabs.Trigger.Label>{t('nav.coach')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.coach} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('nav.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.profile} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
