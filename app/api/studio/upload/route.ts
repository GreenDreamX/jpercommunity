import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv } from "@/lib/server/supabase-rest"

const MAX_ADMIN_SIZE = 50 * 1024 * 1024  // 50 MB for studio uploads
const MAX_STUDENT_SIZE = 5 * 1024 * 1024  // 5 MB for student submissions

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]

/**
 * POST /api/studio/upload
 * Multipart form: file, folder (optional, default: "materials")
 *
 * folder = "materials" → admin upload, max 50MB
 * folder = "submissions" → student upload, max 5MB
 * folder = "images" → course banner, max 10MB
 *
 * Returns: { url, name, size }
 */
export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string | null) ?? "materials"

    if (!file) {
      return Response.json({ message: "File tidak ditemukan dalam request." }, { status: 400 })
    }

    // Determine size limit based on folder
    const isSubmission = folder === "submissions"
    const maxSize = isSubmission ? MAX_STUDENT_SIZE : MAX_ADMIN_SIZE
    const maxLabel = isSubmission ? "5 MB" : "50 MB"

    if (file.size > maxSize) {
      return Response.json(
        { message: `Ukuran file melebihi batas ${maxLabel} (saat ini: ${(file.size / 1024 / 1024).toFixed(1)} MB).` },
        { status: 413 },
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json({ message: `Tipe file tidak didukung: ${file.type}` }, { status: 415 })
    }

    // Sanitize filename and build path
    const uid = verified.user.uid.slice(0, 8)
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const pathname = `${folder}/${timestamp}-${uid}-${safeName}`

    // Ensure the bucket exists
    await fetch(`${env.supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: env.supabaseSecret,
        Authorization: `Bearer ${env.supabaseSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "jper_uploads",
        name: "jper_uploads",
        public: true,
      }),
    }).catch(() => {})

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uploadRes = await fetch(`${env.supabaseUrl}/storage/v1/object/jper_uploads/${pathname}`, {
      method: "POST",
      headers: {
        apikey: env.supabaseSecret,
        Authorization: `Bearer ${env.supabaseSecret}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: fileBuffer,
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      return Response.json({ message: "Gagal mengupload file ke Supabase Storage.", details: errorText }, { status: 500 })
    }

    const publicUrl = `${env.supabaseUrl}/storage/v1/object/public/jper_uploads/${pathname}`

    return Response.json({
      ok: true,
      url: publicUrl,
      name: file.name,
      size: file.size,
    })
  } catch (err: unknown) {
    console.error("[upload] Supabase Storage error:", err)
    return Response.json(
      { message: err instanceof Error ? err.message : "Gagal mengupload file." },
      { status: 500 },
    )
  }
}
