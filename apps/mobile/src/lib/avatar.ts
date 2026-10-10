import { AVATARS_BUCKET } from '@mycoach/core/profile/contracts'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { base64ToArrayBuffer } from './images'
import { supabase } from './supabase'

const SIZE = 512

/** Public URL of an avatar in the avatars bucket, or null when the user has none. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Opens the photo library with a square crop. Returns null if the user cancels. */
export async function pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  })
  return result.canceled ? null : (result.assets[0] ?? null)
}

/**
 * Center-crops to a square, resizes to 512 px and re-encodes as JPEG, which also drops EXIF
 * metadata (location, device). Same output as the web app's prepareAvatar.
 */
export async function prepareAvatar(asset: ImagePicker.ImagePickerAsset): Promise<ArrayBuffer> {
  const side = Math.min(asset.width, asset.height)
  const image = await ImageManipulator.manipulate(asset.uri)
    .crop({
      originX: Math.floor((asset.width - side) / 2),
      originY: Math.floor((asset.height - side) / 2),
      width: side,
      height: side,
    })
    .resize({ width: SIZE, height: SIZE })
    .renderAsync()
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88, base64: true })
  if (!saved.base64) throw new Error('Could not encode image')
  return base64ToArrayBuffer(saved.base64)
}

export async function uploadAvatar(path: string, token: string, body: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .uploadToSignedUrl(path, token, body, { contentType: 'image/jpeg' })
  if (error) throw error
}
