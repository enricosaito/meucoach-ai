import { addDays, localDay } from '@mycoach/core/gamification/contracts'
import { cmToFeetInches, greetingName, kgToPounds } from '@mycoach/core/profile/contracts'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { Check, Flame, Ruler, Settings, Star, Target } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ProgressRing } from '../../components/progress-ring'
import { Avatar, Card, Screen, Skeleton, Txt } from '../../components/ui'
import { fetchActivityDays, fetchRecentSessions } from '../../lib/data'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useMe, type Me } from '../../lib/me'
import { radius, space, useColors } from '../../theme'

/** Read-only overview (Sweatcoin-style). Everything editable lives behind the cog. */
export default function ProfileScreen() {
  const { t } = useI18n()
  const colors = useColors()
  const { me } = useMe()

  return (
    <Screen
      title={t('profile.title')}
      showAvatar={false}
      headerRight={
        <Link href="/settings" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.settings')}
            onPress={haptics.tap}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Settings size={20} color={colors.textPrimary} />
          </Pressable>
        </Link>
      }
    >
      {me ? (
        <>
          <Hero me={me} />
          <Txt variant="heading">{t('profile.highlights')}</Txt>
          <LastSevenDays me={me} />
          <BodyCard me={me} />
        </>
      ) : (
        <>
          <Skeleton height={340} />
          <Skeleton height={140} />
        </>
      )}
    </Screen>
  )
}

function Hero({ me }: { me: Me }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  const { profile, level, streak } = me
  const goal = profile.goals.primary
  const stats = [
    { value: formatNumber(level.level), label: t('profile.level') },
    { value: formatNumber(streak.current), label: t('profile.streak') },
    { value: formatNumber(streak.longest), label: t('profile.bestStreak') },
  ]

  return (
    <View style={[styles.hero, { borderColor: colors.border }]}>
      <LinearGradient
        colors={[colors.accentSoft, colors.surface]}
        locations={[0, 0.85]}
        style={StyleSheet.absoluteFill}
      />
      <View>
        <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
          <Avatar name={greetingName(profile)} path={profile.avatarPath} size={112} />
        </View>
        {/* Level badge (Sweatcoin's corner badge). */}
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: colors.accent, borderColor: colors.surface },
          ]}
        >
          <Star size={12} color={colors.onAccent} fill={colors.onAccent} />
          <Txt variant="caption" style={{ color: colors.onAccent, fontWeight: '800' }}>
            {formatNumber(level.level)}
          </Txt>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 2 }}>
        <Txt variant="title">{greetingName(profile)}</Txt>
        <Txt muted>@{profile.username}</Txt>
      </View>

      {goal && (
        <View style={[styles.goalChip, { backgroundColor: colors.surface }]}>
          <Target size={14} color={colors.accentIcon} />
          <Txt variant="label" color="accentText">
            {t(`goals.${goal}.label`)}
          </Txt>
        </View>
      )}

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Txt style={styles.statValue}>{s.value}</Txt>
            <Txt variant="caption" muted>
              {s.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  )
}

/** The last 7 local days: a full green ring when you trained, orange when you only checked in. */
function LastSevenDays({ me }: { me: Me }) {
  const { t } = useI18n()
  const colors = useColors()
  const weekdays = t('home.weekdaysShort').split(',')
  const [data, setData] = useState<{ active: Set<string>; trained: Set<string> } | null>(null)
  const today = localDay(new Date(), me.profile.timezone)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  const load = useCallback(async () => {
    const [active, sessions] = await Promise.all([
      fetchActivityDays(addDays(today, -6)),
      fetchRecentSessions(8),
    ])
    setData({ active: new Set(active), trained: new Set(sessions.map((s) => s.localDate)) })
  }, [today])

  useEffect(() => {
    void load().catch(() => {
      setData({ active: new Set(), trained: new Set() })
    })
  }, [load])

  return (
    <Card>
      <Txt variant="label" muted>
        {t('profile.last7Days')}
      </Txt>
      <View style={styles.daysRow}>
        {days.map((day) => {
          const trained = data?.trained.has(day) ?? false
          const active = data?.active.has(day) ?? false
          const isToday = day === today
          return (
            <View key={day} style={styles.dayCol}>
              <Txt
                variant="caption"
                style={{
                  color: isToday ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isToday ? '700' : '400',
                }}
              >
                {weekdays[(new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7] ?? ''}
              </Txt>
              <ProgressRing
                size={36}
                stroke={4}
                progress={trained || active ? 1 : 0}
                color={trained ? colors.accentIcon : colors.recovery}
                trackColor={colors.surfaceMuted}
              >
                {trained ? (
                  <Check size={14} color={colors.accentIcon} strokeWidth={3} />
                ) : active ? (
                  <Flame size={12} color={colors.recoveryText} />
                ) : null}
              </ProgressRing>
            </View>
          )
        })}
      </View>
      <View style={styles.legend}>
        <Legend color={colors.accentIcon} label={t('profile.legendTrained')} />
        <Legend color={colors.recoveryText} label={t('profile.legendActive')} />
      </View>
    </Card>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Txt variant="caption" muted>
        {label}
      </Txt>
    </View>
  )
}

function BodyCard({ me }: { me: Me }) {
  const { t, formatNumber, formatDate } = useI18n()
  const colors = useColors()
  const a = me.latestAssessment
  if (!a) {
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Flame size={20} color={colors.accentIcon} />
        <Txt muted style={{ flex: 1 }}>
          {t('profile.bodyEmpty')}
        </Txt>
      </Card>
    )
  }
  const imperial = me.profile.units === 'imperial'
  const { feet, inches } = cmToFeetInches(a.heightCm)
  const rows: [string, string][] = [
    [
      t('profile.height'),
      imperial ? `${String(feet)}′ ${String(inches)}″` : `${formatNumber(a.heightCm)} cm`,
    ],
    [
      t('profile.weight'),
      imperial ? `${formatNumber(kgToPounds(a.weightKg))} lb` : `${formatNumber(a.weightKg)} kg`,
    ],
    [t('profile.age'), t('profile.ageYears', { count: a.ageYears })],
    [t('profile.activityLevel'), t(`activity.${a.activityLevel}.label`)],
  ]
  return (
    <Card>
      <View style={styles.rowBetween}>
        <View style={styles.legendItem}>
          <Ruler size={16} color={colors.accentIcon} />
          <Txt variant="label">{t('profile.bodyTitle')}</Txt>
        </View>
        <Txt variant="caption" muted>
          {t('profile.measuredOn', {
            date: formatDate(a.createdAt, { day: 'numeric', month: 'short' }),
          })}
        </Txt>
      </View>
      <View style={styles.grid}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.gridItem}>
            <Txt variant="caption" muted>
              {label}
            </Txt>
            <Txt variant="label" style={{ fontWeight: '600' }}>
              {value}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
  },
  avatarRing: { borderWidth: 3, borderRadius: 64, padding: 3 },
  levelBadge: {
    position: 'absolute',
    left: -4,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
  },
  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: space.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  legend: { flexDirection: 'row', gap: space.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  gridItem: { width: '50%', gap: 2 },
})
