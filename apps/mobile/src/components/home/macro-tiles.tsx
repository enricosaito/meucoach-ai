import type { DailyTargets } from '@mycoach/core/nutrition/contracts'
import { Beef, Droplet, Wheat, type LucideIcon } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors, type Colors } from '../../theme'
import { ProgressRing } from '../progress-ring'
import { Txt } from '../ui'

const MACROS: {
  key: 'proteinG' | 'carbsG' | 'fatG'
  label: 'targets.protein' | 'targets.carbs' | 'targets.fat'
  color: keyof Colors
  kcalPerGram: number
  icon: LucideIcon
}[] = [
  { key: 'proteinG', label: 'targets.protein', color: 'macroProtein', kcalPerGram: 4, icon: Beef },
  { key: 'carbsG', label: 'targets.carbs', color: 'macroCarbs', kcalPerGram: 4, icon: Wheat },
  { key: 'fatG', label: 'targets.fat', color: 'macroFat', kcalPerGram: 9, icon: Droplet },
]

/** Daily macro targets as three tiles; each ring shows the macro's share of the calories. */
export function MacroTiles({ targets }: { targets: DailyTargets }) {
  const { t, formatNumber } = useI18n()
  const colors = useColors()
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.header}>
        <Txt variant="label" muted>
          {t('targets.title')}
        </Txt>
        <Txt variant="label">
          {formatNumber(targets.kcal)} {t('common.kcalPerDay')}
        </Txt>
      </View>
      <View style={styles.row}>
        {MACROS.map((m) => {
          const share = (targets[m.key] * m.kcalPerGram) / targets.kcal
          const Icon = m.icon
          return (
            <View
              key={m.key}
              style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Txt variant="number">
                {t('common.grams', { value: formatNumber(targets[m.key]) })}
              </Txt>
              <Txt variant="caption" muted>
                {t(m.label)}
              </Txt>
              <ProgressRing
                size={52}
                stroke={5}
                progress={share}
                color={colors[m.color]}
                trackColor={colors.surfaceMuted}
              >
                <Icon size={18} color={colors[m.color]} />
              </ProgressRing>
              <Txt variant="caption" muted>
                {t('home.ofCalories', {
                  percent: formatNumber(share, { style: 'percent', maximumFractionDigits: 0 }),
                })}
              </Txt>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
