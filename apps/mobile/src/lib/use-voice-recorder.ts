import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from 'expo-audio'
import { File } from 'expo-file-system'
import { Platform } from 'react-native'

/** Voice notes are capped at 2 minutes (the API accepts a little more for timing slack). */
export const VOICE_LIMIT_MS = 120_000

// Speech doesn't need music quality: mono AAC at 48 kbps is ~0.35 MB a minute.
const VOICE_PRESET: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 22_050,
  numberOfChannels: 1,
  bitRate: 48_000,
}

export interface VoiceNote {
  base64: string
  mediaType: 'audio/m4a' | 'audio/mp4' | 'audio/webm'
  durationMs: number
}

async function readRecording(uri: string): Promise<Omit<VoiceNote, 'durationMs'>> {
  if (Platform.OS === 'web') {
    // The web recorder gives a blob: URL (MediaRecorder, usually WebM).
    const blob = await (await fetch(uri)).blob()
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(String(reader.result).split(',')[1] ?? '')
      }
      reader.onerror = () => {
        reject(reader.error ?? new Error('Could not read the recording'))
      }
      reader.readAsDataURL(blob)
    })
    return { base64, mediaType: blob.type.startsWith('audio/mp4') ? 'audio/mp4' : 'audio/webm' }
  }
  return { base64: await new File(uri).base64(), mediaType: 'audio/m4a' }
}

/**
 * Records a voice note for the coach. The OS permission prompt appears the first time the user
 * taps the mic (never at launch). The recording is read once, sent, and left in the cache.
 */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(VOICE_PRESET)
  const state = useAudioRecorderState(recorder, 200)

  /** Starts recording; false if the user denied the microphone. */
  async function start(): Promise<boolean> {
    const permission = await AudioModule.requestRecordingPermissionsAsync()
    if (!permission.granted) return false
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
    await recorder.prepareToRecordAsync()
    recorder.record()
    return true
  }

  async function finish(): Promise<string | null> {
    await recorder.stop()
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    return recorder.uri
  }

  /** Stops and returns the note to send (null if nothing was recorded). */
  async function stop(): Promise<VoiceNote | null> {
    const durationMs = Math.min(state.durationMillis, VOICE_LIMIT_MS)
    const uri = await finish()
    if (!uri || durationMs < 500) return null
    return { ...(await readRecording(uri)), durationMs }
  }

  /** Stops and throws the recording away. */
  async function cancel(): Promise<void> {
    await finish()
  }

  return {
    isRecording: state.isRecording,
    durationMs: state.durationMillis,
    start,
    stop,
    cancel,
  }
}
