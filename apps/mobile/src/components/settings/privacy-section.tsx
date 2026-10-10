import * as WebBrowser from 'expo-web-browser'
import { Check, ExternalLink, ShieldCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import { api, unwrap, writeHeaders } from '../../lib/api'
import { hasPhotoConsent } from '../../lib/data'
import { env } from '../../lib/env'
import { haptics } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useWrite } from '../../lib/use-write'
import { radius, space, useColors } from '../../theme'
import { Card, ErrorText, Txt } from '../ui'

/**
 * Body-photo consent (LGPD): status and revoke, which deletes every stored photo and analysis.
 * Links to the Privacy Policy and Terms (served by the web app).
 */
export function PrivacySection() {
  const { t } = useI18n()
  const colors = useColors()
  const [consented, setConsented] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    void hasPhotoConsent()
      .then(setConsented)
      .catch(() => {
        setConsented(false)
      })
  }, [])

  const revoke = useWrite((key) =>
    unwrap(
      api.me.consents[':kind'].$delete(
        { param: { kind: 'body_photos' } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function doRevoke() {
    if (await revoke.run()) {
      setConsented(false)
      setDone(true)
      haptics.success()
    }
  }

  function confirmRevoke() {
    haptics.tap()
    if (Platform.OS === 'web') {
      void doRevoke()
      return
    }
    Alert.alert(t('consent.revoke'), t('consent.revokeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('consent.revoke'), style: 'destructive', onPress: () => void doRevoke() },
    ])
  }

  return (
    <Card style={{ gap: space.lg }}>
      <Txt variant="heading">{t('profile.privacyTitle')}</Txt>
      <View style={[styles.status, { backgroundColor: colors.surface2 }]}>
        <ShieldCheck size={20} color={colors.accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="label" style={{ fontWeight: '600' }}>
            {t('consent.statusTitle')}
          </Txt>
          <Txt variant="caption" muted>
            {consented === null
              ? t('common.loading')
              : consented
                ? t('consent.statusActive')
                : t('consent.statusInactive')}
          </Txt>
          {done && (
            <View style={styles.row}>
              <Check size={14} color={colors.accent} />
              <Txt variant="caption" color="accent">
                {t('consent.revoked')}
              </Txt>
            </View>
          )}
          {consented && (
            <Pressable onPress={confirmRevoke} disabled={revoke.pending} hitSlop={6}>
              <Txt variant="label" color="danger" style={{ marginTop: 4 }}>
                {t('consent.revoke')}
              </Txt>
            </Pressable>
          )}
          <ErrorText>{revoke.error}</ErrorText>
        </View>
      </View>
      <View style={styles.links}>
        {(['privacy', 'terms'] as const).map((doc) => (
          <Pressable
            key={doc}
            onPress={() => void WebBrowser.openBrowserAsync(`${env.apiUrl}/${doc}`)}
            style={[styles.link, { backgroundColor: colors.surface2 }]}
          >
            <Txt variant="caption">{t(`legal.${doc}`)}</Txt>
            <ExternalLink size={12} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  links: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    height: 32,
    borderRadius: radius.full,
  },
})
