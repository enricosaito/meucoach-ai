'use client'

import { Card, ErrorText, SectionTitle } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useI18n } from '@/lib/i18n/client'
import { hasPhotoConsent } from '@/lib/training-data'
import { useWrite } from '@/lib/use-write'
import { Check, FileText, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function PrivacyCard() {
  const { t } = useI18n()
  const [consented, setConsented] = useState<boolean | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    void hasPhotoConsent().then(setConsented)
  }, [])

  const revoke = useWrite((key) =>
    unwrap(
      getApi().api.v1.me.consents[':kind'].$delete(
        { param: { kind: 'body_photos' } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function onRevoke() {
    if (!window.confirm(t('consent.revokeConfirm'))) return
    if (await revoke.run()) {
      setConsented(false)
      setDone(true)
    }
  }

  return (
    <Card>
      <SectionTitle title={t('profile.privacyTitle')} />
      <div className="flex gap-3 rounded-2xl bg-surface-2 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t('consent.statusTitle')}</p>
          <p className="text-sm text-muted">
            {consented === null
              ? t('common.loading')
              : consented
                ? t('consent.statusActive')
                : t('consent.statusInactive')}
          </p>
          {done && (
            <p className="mt-1 flex items-center gap-1 text-sm text-accent-text">
              <Check className="size-4" aria-hidden />
              {t('consent.revoked')}
            </p>
          )}
          {consented && (
            <button
              type="button"
              onClick={() => void onRevoke()}
              disabled={revoke.pending}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              {revoke.pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t('consent.revoke')}
            </button>
          )}
          <div className="mt-2">
            <ErrorText>{revoke.error}</ErrorText>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['privacy', 'terms'] as const).map((doc) => (
          <Link
            key={doc}
            href={`/${doc}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-medium hover:bg-line"
          >
            <FileText className="size-4 text-muted" aria-hidden />
            {t(`legal.${doc}`)}
          </Link>
        ))}
      </div>
    </Card>
  )
}
