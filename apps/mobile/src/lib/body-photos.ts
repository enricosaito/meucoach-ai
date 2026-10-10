import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { base64ToArrayBuffer } from './images'
import { supabase } from './supabase'

// Progress photos live in the private `body-photos` bucket under {userId}/... (storage RLS: own
// folder only). Uploads use signed URLs from the API; display uses short-lived signed URLs.
const BUCKET = 'body-photos'
const MAX_EDGE = 1600

export type PhotoSource = 'camera' | 'library'

/**
 * Takes or picks one photo. The OS permission prompt appears only here, after the in-app consent
 * (docs/mobile-permissions.md). Returns null if the user cancels or denies access.
 */
export async function pickBodyPhoto(
  source: PhotoSource,
): Promise<ImagePicker.ImagePickerAsset | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 }
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return null
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options)
  return result.canceled ? null : (result.assets[0] ?? null)
}

/**
 * Downsizes to at most 1600 px on the long edge and re-encodes as JPEG, which also strips EXIF
 * metadata (GPS, device). Same output as the web app's preparePhoto.
 */
export async function prepareBodyPhoto(asset: ImagePicker.ImagePickerAsset): Promise<ArrayBuffer> {
  const scale = Math.min(1, MAX_EDGE / Math.max(asset.width, asset.height))
  const context = ImageManipulator.manipulate(asset.uri)
  if (scale < 1) {
    context.resize({
      width: Math.round(asset.width * scale),
      height: Math.round(asset.height * scale),
    })
  }
  const image = await context.renderAsync()
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true })
  if (!saved.base64) throw new Error('Could not encode image')
  return base64ToArrayBuffer(saved.base64)
}

export async function uploadBodyPhoto(
  path: string,
  token: string,
  body: ArrayBuffer,
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(path, token, body, { contentType: 'image/jpeg' })
  if (error) throw error
}

/** Short-lived URLs (1 h) for displaying private photos, keyed by storage path. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60)
  if (error) throw error
  return Object.fromEntries(
    data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
  )
}
