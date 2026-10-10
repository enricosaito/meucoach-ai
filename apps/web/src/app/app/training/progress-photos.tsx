'use client'

import { Card, ErrorText, SectionTitle } from '@/components/ui'
import { getApi, unwrap, writeHeaders } from '@/lib/api'
import { useI18n } from '@/lib/i18n/client'
import { signedPhotoUrls } from '@/lib/training-data'
import { useWrite } from '@/lib/use-write'
import type { BodyScan } from '@mycoach/core/training/contracts'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

/** History of progress photo sets, newest first, for comparing changes over time. */
export function ProgressPhotos({ scans, onChange }: { scans: BodyScan[]; onChange: () => void }) {
  const { t } = useI18n()
  const [urls, setUrls] = useState<Record<string, string>>({})

  const paths = scans.flatMap((s) => s.photos.map((p) => p.path))
  const pathsKey = paths.join('|')
  useEffect(() => {
    if (!pathsKey) return
    void signedPhotoUrls(pathsKey.split('|')).then(setUrls)
  }, [pathsKey])

  if (scans.length === 0) return null

  return (
    <Card>
      <SectionTitle title={t('training.progressTitle')} description={t('training.progressBody')} />
      <ul className="flex flex-col gap-4">
        {scans.map((scan) => (
          <ScanRow key={scan.id} scan={scan} urls={urls} onDeleted={onChange} />
        ))}
      </ul>
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
  const remove = useWrite((key) =>
    unwrap(
      getApi().api.v1.training['body-scans'][':scanId'].$delete(
        { param: { scanId: scan.id } },
        { headers: writeHeaders(key) },
      ),
    ),
  )

  async function onDelete() {
    if (!window.confirm(t('training.deleteScanConfirm'))) return
    if (await remove.run()) onDeleted()
  }

  return (
    <li className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{formatDate(scan.createdAt)}</p>
          <p className="text-sm text-muted">
            {scan.status === 'completed' && scan.analysis
              ? `${scan.analysis.bodyFatPercentLow}–${scan.analysis.bodyFatPercentHigh}% · ${t(`training.bodyTypes.${scan.analysis.bodyType}`)}`
              : scan.status === 'pending'
                ? t('training.scanPending')
                : t('training.scanUnusable')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onDelete()}
          disabled={remove.pending}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          {remove.pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden />
          )}
          {t('training.deleteScan')}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {scan.photos.map((photo) => (
          <figure key={photo.path} className="overflow-hidden rounded-2xl bg-surface-2">
            {urls[photo.path] ? (
              // Signed, short-lived URLs to private storage: next/image optimisation would cache them.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urls[photo.path]}
                alt={t(`training.views.${photo.view}`)}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[3/4] w-full animate-pulse" />
            )}
            <figcaption className="px-2 py-1.5 text-center text-xs text-muted">
              {t(`training.views.${photo.view}`)}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-2">
        <ErrorText>{remove.error}</ErrorText>
      </div>
    </li>
  )
}
