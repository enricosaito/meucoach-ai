import { Directory, File, Paths } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { ImagePickerAsset } from 'expo-image-picker'
import { Platform } from 'react-native'

// Photos sent to the coach are analyzed by the AI for that one reply and never stored on our
// servers. The phone keeps its own copy (app documents folder, by message id), so the photo still
// shows in the conversation; uninstalling the app or clearing its data removes them.

const MAX_EDGE = 1280

export interface ChatPhoto {
  /** Local file of the resized JPEG (what the bubble shows). */
  uri: string
  /** The same JPEG as base64, sent with the message. */
  base64: string
}

/** Downsizes to 1280 px on the long edge and re-encodes as JPEG (which also drops EXIF/GPS). */
export async function prepareChatPhoto(asset: ImagePickerAsset): Promise<ChatPhoto> {
  const scale = Math.min(1, MAX_EDGE / Math.max(asset.width, asset.height))
  const context = ImageManipulator.manipulate(asset.uri)
  if (scale < 1) {
    context.resize({
      width: Math.round(asset.width * scale),
      height: Math.round(asset.height * scale),
    })
  }
  const image = await context.renderAsync()
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true })
  if (!saved.base64) throw new Error('Could not encode image')
  return { uri: saved.uri, base64: saved.base64 }
}

// The file system module is native-only; the web preview keeps photos for the session.
const sessionPhotos = new Map<string, string>()

function photoFile(messageId: string): File {
  return new File(new Directory(Paths.document, 'chat-photos'), `${messageId}.jpg`)
}

/** Keeps the photo of a sent message on this device. Best effort: a failure only loses the copy. */
export function rememberChatPhoto(messageId: string, uri: string): void {
  sessionPhotos.set(messageId, uri)
  if (Platform.OS === 'web') return
  try {
    const dir = new Directory(Paths.document, 'chat-photos')
    dir.create({ intermediates: true, idempotent: true })
    const target = photoFile(messageId)
    if (!target.exists) new File(uri).copy(target)
  } catch {
    // Not fatal: the bubble falls back to a "photo sent" note.
  }
}

/** This device's copy of a message's photo, if it has one. */
export function chatPhotoUri(messageId: string): string | null {
  const session = sessionPhotos.get(messageId)
  if (session) return session
  if (Platform.OS === 'web') return null
  try {
    const file = photoFile(messageId)
    return file.exists ? (file.uri ?? null) : null
  } catch {
    return null
  }
}
