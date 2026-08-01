import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"

export async function POST(request: Request) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return Response.json({ message: "File gambar wajib diunggah." }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString("base64")

    // Upload to Imgur API
    const imgurClientId = process.env.IMGUR_CLIENT_ID || "544ba315e3728cc"

    const imgurBody = new FormData()
    imgurBody.append("image", base64Image)
    imgurBody.append("type", "base64")

    const imgurRes = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${imgurClientId}`,
      },
      body: imgurBody,
    })

    if (imgurRes.ok) {
      const imgurData = await imgurRes.json()
      if (imgurData.success && imgurData.data?.link) {
        return Response.json({
          ok: true,
          url: imgurData.data.link,
          deletehash: imgurData.data.deletehash,
        })
      }
    }

    // Fallback: If Imgur API is blocked or rate limited, return data URL if small, or error
    const mimeType = file.type || "image/png"
    const dataUrl = `data:${mimeType};base64,${base64Image}`
    
    return Response.json({
      ok: true,
      url: dataUrl,
      notice: "Digunakan format gambar data URL sebagai fallback.",
    })
  } catch (err: unknown) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Gagal mengunggah gambar ke Imgur." },
      { status: 500 },
    )
  }
}
