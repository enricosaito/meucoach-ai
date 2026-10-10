import { TabList, Tabs, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui'
import {
  Dumbbell,
  House,
  MessageCircle,
  Salad,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native'
import { forwardRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { font } from '../../lib/typography'
import { useColors } from '../../theme'

/**
 * Web only (dev preview): native tabs fall back to a top bar on web, which covers the screen
 * headers. This bottom bar mirrors the phone layout so the preview matches iOS.
 */
export default function WebTabsLayout() {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[styles.bar, { backgroundColor: colors.background, borderTopColor: colors.border }]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon={House} label={t('nav.home')} />
        </TabTrigger>
        <TabTrigger name="training" href="/training" asChild>
          <TabButton icon={Dumbbell} label={t('nav.training')} />
        </TabTrigger>
        <TabTrigger name="diet" href="/diet" asChild>
          <TabButton icon={Salad} label={t('nav.diet')} />
        </TabTrigger>
        <TabTrigger name="coach" href="/coach" asChild>
          <TabButton icon={MessageCircle} label={t('nav.coach')} />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon={UserRound} label={t('nav.profile')} />
        </TabTrigger>
      </TabList>
    </Tabs>
  )
}

const TabButton = forwardRef<View, TabTriggerSlotProps & { icon: LucideIcon; label: string }>(
  function TabButton({ icon: Icon, label, isFocused, ...props }, ref) {
    const colors = useColors()
    const color = isFocused ? colors.accentText : colors.textSecondary
    return (
      <Pressable ref={ref} {...props} style={styles.tab}>
        <Icon size={22} color={color} strokeWidth={isFocused ? 2.4 : 1.9} />
        <Text style={[font('ui', 600), { color, fontSize: 11 }]}>{label}</Text>
      </Pressable>
    )
  },
)

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
})
