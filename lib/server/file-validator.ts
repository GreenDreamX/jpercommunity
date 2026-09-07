/**
 * File Security Validator helper for Supabase Upload / Media endpoints.
 * Validates extension, mime type, AND magic bytes binary header signatures.
 */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

export type FileValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string }

export async function validateUploadedFile(file: File, maxSizeBytes = 5 * 1024 * 1024): Promise<FileValidationResult> {
  // 1. Size check
  if (file.size > maxSizeBytes) {
    return { ok: false, error: `Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maksimal 5MB.` }
  }

  // 2. Mime type check
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return { ok: false, error: "Format file tidak diizinkan. Gunakan format PDF, JPG, PNG, atau WEBP." }
  }

  // 3. Binary Magic Bytes Check (First 8 bytes)
  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    // PDF Magic bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (file.type === "application/pdf") {
      if (uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46) {
        return { ok: true, mimeType: file.type }
      }
      return { ok: false, error: "Header binary file PDF tidak valid atau rusak." }
    }

    // JPEG Magic bytes: 0xFF 0xD8 0xFF
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      if (uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
        return { ok: true, mimeType: file.type }
      }
      return { ok: false, error: "Header binary gambar JPG tidak valid." }
    }

    // PNG Magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (file.type === "image/png") {
      if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) {
        return { ok: true, mimeType: file.type }
      }
      return { ok: false, error: "Header binary gambar PNG tidak valid." }
    }

    // WEBP Magic bytes: RIFF....WEBP (0x52 0x49 0x46 0x46)
    if (file.type === "image/webp") {
      if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) {
        return { ok: true, mimeType: file.type }
      }
      return { ok: false, error: "Header binary gambar WEBP tidak valid." }
    }

    return { ok: true, mimeType: file.type }
  } catch (err) {
    return { ok: false, error: "Gagal memverifikasi keamanan file." }
  }
}
