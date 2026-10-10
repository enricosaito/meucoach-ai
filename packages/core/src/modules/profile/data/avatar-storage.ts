import { AppError, dbError, type AdminClient } from '../../../shared'

import { AVATARS_BUCKET } from '../schemas'

/** Signed upload for a new avatar at {userId}/{uuid}.jpg (a new path each time, so no caching). */
export async function createAvatarUpload(
  db: AdminClient,
  userId: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { data, error } = await db.storage.from(AVATARS_BUCKET).createSignedUploadUrl(path)
  if (error) throw dbError('createAvatarUpload', error)
  return { path, token: data.token, signedUrl: data.signedUrl }
}

export async function assertAvatarUploaded(
  db: AdminClient,
  userId: string,
  path: string,
): Promise<void> {
  const name = path.slice(userId.length + 1)
  const { data, error } = await db.storage.from(AVATARS_BUCKET).list(userId, { search: name })
  if (error) throw dbError('listAvatars', error)
  if (!data.some((file) => file.name === name)) {
    throw new AppError('bad_request', 'The photo was not uploaded. Try again.')
  }
}

/** Deletes every avatar file in the user's folder except `keep`. */
export async function removeAvatars(db: AdminClient, userId: string, keep?: string): Promise<void> {
  const bucket = db.storage.from(AVATARS_BUCKET)
  const { data, error } = await bucket.list(userId, { limit: 100 })
  if (error) throw dbError('listAvatars', error)
  const paths = data.map((file) => `${userId}/${file.name}`).filter((path) => path !== keep)
  if (paths.length === 0) return
  const { error: removeError } = await bucket.remove(paths)
  if (removeError) throw dbError('removeAvatars', removeError)
}
