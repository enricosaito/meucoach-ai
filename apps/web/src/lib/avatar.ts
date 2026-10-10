'use client'

import { AVATARS_BUCKET } from '@mycoach/core/profile/contracts'
import { getSupabaseBrowserClient } from './supabase-browser'

const SIZE = 512

/**
 * Center-crops to a square, resizes to 512 px and re-encodes as JPEG (strips EXIF/GPS metadata).
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  )
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not encode image'))
      },
      'image/jpeg',
      0.88,
    )
  })
}

/** Public URL of an avatar (the bucket is public; paths are unguessable and change on upload). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return getSupabaseBrowserClient().storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function uploadAvatar(path: string, token: string, blob: Blob): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .storage.from(AVATARS_BUCKET)
    .uploadToSignedUrl(path, token, blob, { contentType: 'image/jpeg' })
  if (error) throw error
}
