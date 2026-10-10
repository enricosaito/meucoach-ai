import Constants from 'expo-constants'
import { ChevronRight, Info, LogOut } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Card, Txt } from '../components/ui'
import { haptics } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { radius, space, useColors } from '../theme'

/**
 * Settings, opened from the cog on Profile (native push with a back button). Today: account and
 * app info; the profile, goal, language and privacy editors are ported next.
 */
export default function SettingsScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const version = Constants.expoConfig?.version ?? '—'

  function confirmSignOut() {
    haptics.tap()
    if (Platform.OS === 'web') {
      void supabase.auth.signOut()
      return
    }
    Alert.alert(t('auth.signOutTitle'), t('auth.signOutDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => void supabase.auth.signOut(),
      },
    ])
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <Info size={18} color={colors.muted} />
        <Txt muted style={{ flex: 1 }}>
          {t('settings.comingSoon')}
        </Txt>
      </Card>

      <View style={{ gap: space.sm }}>
        <Txt variant="caption" muted style={styles.sectionLabel}>
          {t('settings.account').toUpperCase()}
        </Txt>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Row
            icon={<LogOut size={18} color={colors.danger} />}
            label={t('auth.signOut')}
            labelColor={colors.danger}
            onPress={confirmSignOut}
          />
        </View>
      </View>

      <Txt variant="caption" muted style={{ textAlign: 'center' }}>
        {t('settings.version', { version })}
      </Txt>
    </ScrollView>
  )
}

function Row({
  icon,
  label,
  labelColor,
  onPress,
}: {
  icon: ReactNode
  label: string
  labelColor?: string
  onPress: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surface2 : 'transparent' },
      ]}
    >
      {icon}
      <Txt style={{ flex: 1, color: labelColor ?? colors.fg }}>{label}</Txt>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  sectionLabel: { paddingHorizontal: space.sm, letterSpacing: 0.5 },
  group: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 52,
  },
})
