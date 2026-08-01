import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

type AdminVerifyResult =
  | { ok: false; status: number; message: string }
  | { ok: true; adminProfileId: string; adminName: string }

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }): Promise<AdminVerifyResult> {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return { ok: true, adminProfileId: profile.id, adminName: profile.nama_lengkap || "Admin" }
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const category = searchParams.get("category")
  const query = searchParams.get("q")
  const limit = searchParams.get("limit") || "200"

  let endpoint = `lms_grammar?select=*&order=created_at.desc&limit=${encodeURIComponent(limit)}`

  if (level && level !== "all") {
    endpoint += `&jlpt_level=eq.${encodeURIComponent(level.trim())}`
  }

  if (category && category !== "all") {
    endpoint += `&category=ilike.*${encodeURIComponent(category.trim())}*`
  }

  if (query && query.trim()) {
    const q = encodeURIComponent(`*${query.trim()}*`)
    endpoint += `&or=(title.ilike.${q},romaji.ilike.${q},meaning.ilike.${q},explanation.ilike.${q},structure.ilike.${q})`
  }

  const response = await supabaseRestRequest(endpoint, env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data tata bahasa dari database." }, { status: 500 })
  }

  const items = await response.json()
  return Response.json({ ok: true, items })
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const body = await request.json()
    const { title, romaji, meaning, meaning_id, explanation, jlpt_level, structure, example_ja, example_id, pitch, category } = body

    if (!title || !meaning) {
      return Response.json({ message: "Judul Pola dan Arti wajib diisi." }, { status: 400 })
    }

    const insertResponse = await supabaseRestRequest(
      "lms_grammar",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          title: title.trim(),
          romaji: romaji ? romaji.trim() : "",
          meaning: meaning.trim(),
          meaning_id: meaning_id ? meaning_id.trim() : meaning.trim(),
          explanation: explanation ? explanation.trim() : "",
          jlpt_level: jlpt_level ? jlpt_level.trim() : "N5",
          structure: structure ? structure.trim() : `[Rumus] ${title.trim()}`,
          example_ja: example_ja ? example_ja.trim() : "",
          example_id: example_id ? example_id.trim() : "",
          pitch: pitch ? pitch.trim() : "［0］ 平板 (Heiban)",
          category: category ? category.trim() : "Struktur Dasar",
        }],
      },
    )

    if (!insertResponse.ok) {
      const details = await insertResponse.text()
      return Response.json({ message: "Gagal membuat pola tata bahasa baru.", details }, { status: 500 })
    }

    const data = await insertResponse.json()

    void logActivity({
      actorId: authCheck.adminProfileId,
      actorName: authCheck.adminName,
      actorRole: "admin",
      action: "TAMBAH_GRAMMAR",
      details: `Admin ${authCheck.adminName} menambah pola tata bahasa baru: ${title.trim()} (${jlpt_level || 'N5'}) - ${meaning.trim()}.`,
      category: "SILABUS",
    })

    return Response.json({ ok: true, item: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan server." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
    }

    const body = await request.json()

    const updateResponse = await supabaseRestRequest(
      `lms_grammar?id=eq.${encodeURIComponent(id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body,
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui tata bahasa.", details }, { status: 500 })
    }

    const data = await updateResponse.json()

    void logActivity({
      actorId: authCheck.adminProfileId,
      actorName: authCheck.adminName,
      actorRole: "admin",
      action: "EDIT_GRAMMAR",
      details: `Admin ${authCheck.adminName} memperbarui pola tata bahasa: ${data[0]?.title || id}.`,
      category: "SILABUS",
    })

    return Response.json({ ok: true, item: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan server." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
  }

  const deleteResponse = await supabaseRestRequest(
    `lms_grammar?id=eq.${encodeURIComponent(id)}`,
    env,
    {
      method: "DELETE",
    },
  )

  if (!deleteResponse.ok) {
    return Response.json({ message: "Gagal menghapus tata bahasa dari database." }, { status: 500 })
  }

  void logActivity({
    actorId: authCheck.adminProfileId,
    actorName: authCheck.adminName,
    actorRole: "admin",
    action: "HAPUS_GRAMMAR",
    details: `Admin ${authCheck.adminName} menghapus entri tata bahasa ID ${id} dari database.`,
    category: "SILABUS",
  })

  return Response.json({ ok: true })
}
