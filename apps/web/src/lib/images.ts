'use client'

const MAX_EDGE = 1600
const QUALITY = 0.85

/**
 * Prepares a progress photo for upload: fixes orientation, downsizes to at most 1600 px on the
 * long edge and re-encodes as JPEG. Re-encoding through a canvas also strips EXIF metadata
 * (camera model, GPS location), which matters for privacy.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not encode image'))
      },
      'image/jpeg',
      QUALITY,
    )
  })
}
