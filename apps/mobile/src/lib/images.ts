// Image helpers shared by avatars and progress photos.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Decodes base64 without relying on atob/Blob (not reliable across React Native runtimes). */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let byte = 0
  for (let i = 0; i < clean.length; i += 4) {
    const [a, b, c, d] = [0, 1, 2, 3].map((k) => ALPHABET.indexOf(clean[i + k] ?? 'A'))
    const n = ((a ?? 0) << 18) | ((b ?? 0) << 12) | ((c ?? 0) << 6) | (d ?? 0)
    bytes[byte++] = (n >> 16) & 0xff
    if (i + 2 < clean.length) bytes[byte++] = (n >> 8) & 0xff
    if (i + 3 < clean.length) bytes[byte++] = n & 0xff
  }
  return bytes.buffer.slice(0, byte)
}
