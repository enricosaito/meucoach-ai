import type { BodyAnalysis } from '@mycoach/core/training/contracts'
import { ScanLine } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { useI18n } from '../../lib/i18n'
import { radius, space, useColors } from '../../theme'
import { Card, Txt } from '../ui'

/** What the AI read from the progress photos the plan was built from. */
export function BodyAnalysisCard({ analysis }: { analysis: BodyAnalysis }) {
  const { t } = useI18n()
  const colors = useColors()
  return (
    <Card style={{ gap: space.lg }}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <ScanLine size={16} color={colors.accentIcon} />
          <Txt variant="heading">{t('training.analysisTitle')}</Txt>
        </View>
        <Txt variant="caption" muted>
          {t('training.confidence', {
            level: t(`training.confidenceLevels.${analysis.confidence}`),
          })}
        </Txt>
      </View>

      <View style={styles.stats}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="caption" muted>
            {t('training.bodyFat')}
          </Txt>
          <Txt variant="displayL" tabularNums>
            {analysis.bodyFatPercentLow}–{analysis.bodyFatPercentHigh}%
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="caption" muted>
            {t('training.bodyType')}
          </Txt>
          <Txt variant="label" style={{ fontWeight: '600' }}>
            {t(`training.bodyTypes.${analysis.bodyType}`)}
          </Txt>
        </View>
      </View>

      <Txt>{analysis.summary}</Txt>

      {analysis.priorityAreas.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Txt variant="label" muted>
            {t('training.priorities')}
          </Txt>
          {analysis.priorityAreas.map((p, i) => (
            <View
              key={`${p.area}-${String(i)}`}
              style={[styles.priority, { backgroundColor: colors.surfaceMuted }]}
            >
              <View style={[styles.number, { backgroundColor: colors.accent }]}>
                <Txt variant="caption" style={{ color: colors.onAccent, fontWeight: '700' }}>
                  {i + 1}
                </Txt>
              </View>
              <Txt style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '600' }}>{t(`training.areas.${p.area}`)}</Txt>
                <Txt muted> · {p.reason}</Txt>
              </Txt>
            </View>
          ))}
        </View>
      )}
      {analysis.postureNotes ? (
        <Txt variant="caption" muted>
          {analysis.postureNotes}
        </Txt>
      ) : null}
      <Txt variant="caption" muted>
        {t('training.analysisDisclaimer')}
      </Txt>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  stats: { flexDirection: 'row', gap: space.lg },
  priority: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
