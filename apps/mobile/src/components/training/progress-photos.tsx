import type { BodyScan } from '@mycoach/core/training/contracts'
import { Image } from 'expo-image'
import { Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import { api, unwrap, writeHeaders } from '../../lib/api'
import { signedPhotoUrls } from '../../lib/body-photos'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useWrite } from '../../lib/use-write'
import { radius, space, useColors } from '../../theme'
import { Card, ErrorText, Txt } from '../ui'

/** History of progress photo sets, newest first, for comparing changes over time. */
export function ProgressPhotos({ scans, onChange }: { scans: BodyScan[]; onChange: () => void }) {
  const { t } = useI18n()
  const [urls, setUrls] = useState<Record<string, string>>({})

  const pathsKey = scans.flatMap((s) => s.photos.map((p) => p.path)).join('|')
  useEffect(() => {
    if (!pathsKey) return
    void signedPhotoUrls(pathsKey.split('|'))
      .then(setUrls)
      .catch(() => {
        setUrls({})
      })
  }, [pathsKey])

  if (scans.length === 0) return null

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{t('training.progressTitle')}</Txt>
        <Txt variant="caption" muted>
          {t('training.progressBody')}
        </Txt>
      </View>
      {scans.map((scan) => (
        <ScanRow key={scan.id} scan={scan} urls={urls} onDeleted={onChange} />
      ))}
    </Card>
  )
}

function ScanRow({
  scan,
  urls,
  onDeleted,
}: {
  scan: BodyScan
  urls: Record<string, string>
  onDeleted: () => void
}) {
  const { t, formatDate } = useI18n()
  const colors = useColors()
  const remove = useWrite((key) =>
    unwrap(
      api.training['body-scans'][':scanId'].$delete(
        { param: { scanId: scan.id } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function doDelete() {
    if (await remove.run()) {
      haptics.success()
      onDeleted()
    }
  }

  function confirmDelete() {
    haptics.tap()
    if (Platform.OS === 'web') {
      void doDelete()
      return
    }
    Alert.alert(t('training.deleteScan'), t('training.deleteScanConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('training.deleteScan'), style: 'destructive', onPress: () => void doDelete() },
    ])
  }

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt style={{ fontWeight: '600' }}>{formatDate(scan.createdAt)}</Txt>
          <Txt variant="caption" muted>
            {scan.status === 'completed' && scan.analysis
              ? `${String(scan.analysis.bodyFatPercentLow)}–${String(scan.analysis.bodyFatPercentHigh)}% · ${t(`training.bodyTypes.${scan.analysis.bodyType}`)}`
              : scan.status === 'pending'
                ? t('training.scanPending')
                : t('training.scanUnusable')}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('training.deleteScan')}
          onPress={confirmDelete}
          disabled={remove.pending}
          hitSlop={8}
          style={[styles.delete, { backgroundColor: colors.dangerSoft }]}
        >
          {remove.pending ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={16} color={colors.danger} />
          )}
        </Pressable>
      </View>
      <View style={styles.grid}>
        {scan.photos.map((photo) => {
          const uri = urls[photo.path]
          return (
            <View key={photo.path} style={{ flex: 1, gap: 4 }}>
              <View style={[styles.photo, { backgroundColor: colors.surface2 }]}>
                {uri && (
                  // Signed, short-lived URL: don't keep it in the disk cache.
                  <Image
                    source={{ uri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory"
                    transition={200}
                    accessibilityLabel={t(`training.views.${photo.view}`)}
                  />
                )}
              </View>
              <Txt variant="caption" muted style={{ textAlign: 'center' }}>
                {t(`training.views.${photo.view}`)}
              </Txt>
            </View>
          )
        })}
        {/* Keep thirds even when a set has fewer than three photos. */}
        {Array.from({ length: 3 - scan.photos.length }, (_, i) => (
          <View key={`empty-${String(i)}`} style={{ flex: 1 }} />
        ))}
      </View>
      <ErrorText>{remove.error}</ErrorText>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  delete: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', gap: space.sm },
  photo: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: 'hidden' },
})
