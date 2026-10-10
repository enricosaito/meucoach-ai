import { AppError, dbError, type AdminClient } from '../../../shared'
import type { BodyView, PhotoContentType } from '../schemas'

export const BODY_PHOTOS_BUCKET = 'body-photos'

const EXTENSIONS: Record<PhotoContentType, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
}

/** {userId}/{scanId}/{view}.{ext}: the first segment must be the owner (storage RLS relies on it). */
export function photoPath(
  userId: string,
  scanId: string,
  view: BodyView,
  contentType: PhotoContentType,
): string {
  return `${userId}/${scanId}/${view}.${EXTENSIONS[contentType]}`
}

export interface SignedUpload {
  view: BodyView
  path: string
  token: string
  signedUrl: string
}

export async function createSignedUploads(
  db: AdminClient,
  userId: string,
  scanId: string,
  views: BodyView[],
  contentType: PhotoContentType,
): Promise<SignedUpload[]> {
  return Promise.all(
    views.map(async (view) => {
      const path = photoPath(userId, scanId, view, contentType)
      const { data, error } = await db.storage
        .from(BODY_PHOTOS_BUCKET)
        .createSignedUploadUrl(path, { upsert: true })
      if (error) throw dbError('createSignedUploadUrl', error)
      return { view, path, token: data.token, signedUrl: data.signedUrl }
    }),
  )
}

/** Throws unless every expected photo was actually uploaded to the user's scan folder. */
export async function assertPhotosUploaded(
  db: AdminClient,
  userId: string,
  scanId: string,
  paths: string[],
): Promise<void> {
  const { data, error } = await db.storage
    .from(BODY_PHOTOS_BUCKET)
    .list(`${userId}/${scanId}`, { limit: 10 })
  if (error) throw dbError('listPhotos', error)
  const present = new Set(data.map((file) => `${userId}/${scanId}/${file.name}`))
  const missing = paths.filter((path) => !present.has(path))
  if (missing.length > 0) {
    throw new AppError('bad_request', 'Some photos were not uploaded. Try uploading them again.', {
      details: { missing },
    })
  }
}

export async function downloadPhotoBase64(db: AdminClient, path: string): Promise<string> {
  const { data, error } = await db.storage.from(BODY_PHOTOS_BUCKET).download(path)
  if (error) throw dbError('downloadPhoto', error)
  return Buffer.from(await data.arrayBuffer()).toString('base64')
}

export async function removePhotos(db: AdminClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await db.storage.from(BODY_PHOTOS_BUCKET).remove(paths)
  if (error) throw dbError('removePhotos', error)
}

/**
 * Removes every photo in the user's folder, including uploads that never became a scan (e.g. an
 * abandoned wizard). Used when photo consent is revoked.
 */
export async function removeAllUserPhotos(db: AdminClient, userId: string): Promise<number> {
  const bucket = db.storage.from(BODY_PHOTOS_BUCKET)
  const { data: folders, error } = await bucket.list(userId, { limit: 1000 })
  if (error) throw dbError('listUserPhotoFolders', error)
  const paths: string[] = []
  for (const folder of folders) {
    const { data: files, error: filesError } = await bucket.list(`${userId}/${folder.name}`, {
      limit: 100,
    })
    if (filesError) throw dbError('listUserPhotos', filesError)
    paths.push(...files.map((file) => `${userId}/${folder.name}/${file.name}`))
  }
  await removePhotos(db, paths)
  return paths.length
}
