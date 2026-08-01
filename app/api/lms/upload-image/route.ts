import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv } from "@/lib/server/supabase-rest"

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ message: "File gambar tidak ditemukan." }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ message: "File yang diunggah harus berupa format gambar (PNG, JPG, WEBP, GIF)." }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() || "png"
    const fileName = `avatar-${verified.user.uid}-${Date.now()}.${ext}`

    // 1. Ensure jper_uploads public bucket exists
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

    // 2. Upload object to public bucket
    const uploadRes = await fetch(`${env.supabaseUrl}/storage/v1/object/jper_uploads/${fileName}`, {
      method: "POST",
      headers: {
        apikey: env.supabaseSecret,
        Authorization: `Bearer ${env.supabaseSecret}`,
        "Content-Type": file.type || "image/png",
        "x-upsert": "true",
      },
      body: fileBuffer,
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      return Response.json({ message: "Gagal mengunggah gambar ke cloud.", details: errorText }, { status: 500 })
    }

    const publicUrl = `${env.supabaseUrl}/storage/v1/object/public/jper_uploads/${fileName}`
    return Response.json({ ok: true, url: publicUrl })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah gambar." }, { status: 500 })
  }
}
