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
    const file = (formData.get("file") || formData.get("image")) as File | null

    if (!file) {
      return Response.json({ message: "File gambar tidak ditemukan." }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ message: "File yang diunggah harus berupa format gambar (PNG, JPG, WEBP, GIF)." }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const base64Image = fileBuffer.toString("base64")

    // Upload to Imgur API
    const imgurClientId = process.env.IMGUR_CLIENT_ID || "544ba315e3728cc"

    const imgurFormData = new FormData()
    imgurFormData.append("image", base64Image)
    imgurFormData.append("type", "base64")

    try {
      const imgurRes = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${imgurClientId}`,
        },
        body: imgurFormData,
      })

      if (imgurRes.ok) {
        const imgurData = await imgurRes.json()
        if (imgurData.success && imgurData.data?.link) {
          return Response.json({
            ok: true,
            url: imgurData.data.link,
          })
        }
      }
    } catch (imgurErr) {
      console.warn("Imgur upload failed, fallback to Supabase storage:", imgurErr)
    }

    // Fallback: Upload to Supabase Storage if Imgur is rate-limited
    const ext = file.name.split(".").pop() || "png"
    const fileName = `jper-${verified.user.uid}-${Date.now()}.${ext}`

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
      return Response.json({ message: "Gagal mengunggah gambar ke storage.", details: errorText }, { status: 500 })
    }

    const publicUrl = `${env.supabaseUrl}/storage/v1/object/public/jper_uploads/${fileName}`
    return Response.json({ ok: true, url: publicUrl })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah gambar." }, { status: 500 })
  }
}
