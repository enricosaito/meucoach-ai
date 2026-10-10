import { greetingName } from '@mycoach/core/profile/contracts'
import { Flame, LogOut, Star, Trophy } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Avatar, Button, Card, Screen, Skeleton, Txt } from '../../components/ui'
import { useI18n } from '../../lib/i18n'
import { useMe } from '../../lib/me'
import { supabase } from '../../lib/supabase'
import { space, useColors } from '../../theme'

/** Read-only overview (editing comes with the Settings port). */
export default function ProfileScreen() {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const { me } = useMe()

  return (
    <Screen title={t('profile.title')} showAvatar={false}>
      {me ? (
        <>
          <Card style={{ alignItems: 'center' }}>
            <Avatar name={greetingName(me.profile)} path={me.profile.avatarPath} size={88} />
            <Txt variant="heading">{greetingName(me.profile)}</Txt>
            <Txt muted>@{me.profile.username}</Txt>
            {me.profile.goals.primary && (
              <Txt variant="label" color="accent">
                {t(`goals.${me.profile.goals.primary}.label`)}
              </Txt>
            )}
          </Card>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Stat
              icon={<Star size={16} color={colors.accent} fill={colors.accent} />}
              label={t('profile.level')}
              value={formatNumber(me.level.level)}
            />
            <Stat
              icon={<Flame size={16} color={colors.energy} />}
              label={t('profile.streak')}
              value={formatNumber(me.streak.current)}
            />
            <Stat
              icon={<Trophy size={16} color={colors.fat} />}
              label={t('profile.bestStreak')}
              value={formatNumber(me.streak.longest)}
            />
          </View>
        </>
      ) : (
        <Skeleton height={220} />
      )}
      <Button
        variant="secondary"
        onPress={() => void supabase.auth.signOut()}
        icon={<LogOut size={16} color={colors.fg} />}
      >
        {t('auth.signOut')}
      </Button>
    </Screen>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: space.lg, gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon}
        <Txt variant="caption" muted numberOfLines={1}>
          {label}
        </Txt>
      </View>
      <Txt variant="title">{value}</Txt>
    </Card>
  )
}
