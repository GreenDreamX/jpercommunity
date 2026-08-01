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
  const category = searchParams.get("category")
  const query = searchParams.get("q")
  const limit = searchParams.get("limit") || "200"

  let endpoint = `lms_dictionary?select=*&order=created_at.desc&limit=${encodeURIComponent(limit)}`

  if (category && category !== "all") {
    endpoint += `&category=ilike.*${encodeURIComponent(category.trim())}*`
  }

  if (query && query.trim()) {
    const q = encodeURIComponent(`*${query.trim()}*`)
    endpoint += `&or=(term.ilike.${q},reading.ilike.${q},romaji.ilike.${q},meaning.ilike.${q},meaning_id.ilike.${q})`
  }

  const response = await supabaseRestRequest(endpoint, env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data kamus dari database." }, { status: 500 })
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
    const { term, reading, romaji, pos, meaning, meaning_id, pitch, pitch_position, example_ja, example_id, category, frequency } = body

    if (!term || !meaning) {
      return Response.json({ message: "Kanji/Term dan Arti wajib diisi." }, { status: 400 })
    }

    const insertResponse = await supabaseRestRequest(
      "lms_dictionary",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          term: term.trim(),
          reading: reading ? reading.trim() : term.trim(),
          romaji: romaji ? romaji.trim() : "",
          pos: pos ? pos.trim() : "JLPT N5",
          meaning: meaning.trim(),
          meaning_id: meaning_id ? meaning_id.trim() : meaning.trim(),
          pitch: pitch ? pitch.trim() : "［0］ 平板 (Heiban)",
          pitch_position: pitch_position ? Number(pitch_position) : 0,
          example_ja: example_ja ? example_ja.trim() : "",
          example_id: example_id ? example_id.trim() : "",
          category: category ? category.trim() : "JLPT N5",
          frequency: frequency ? Number(frequency) : null,
        }],
      },
    )

    if (!insertResponse.ok) {
      const details = await insertResponse.text()
      return Response.json({ message: "Gagal menambah kosakata baru ke database.", details }, { status: 500 })
    }

    const data = await insertResponse.json()

    void logActivity({
      actorId: authCheck.adminProfileId,
      actorName: authCheck.adminName,
      actorRole: "admin",
      action: "TAMBAH_KOSAKATA",
      details: `Admin ${authCheck.adminName} menambah kosakata baru: ${term.trim()} (${reading || term}) - ${meaning.trim()}.`,
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
      `lms_dictionary?id=eq.${encodeURIComponent(id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body,
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui kosakata.", details }, { status: 500 })
    }

    const data = await updateResponse.json()

    void logActivity({
      actorId: authCheck.adminProfileId,
      actorName: authCheck.adminName,
      actorRole: "admin",
      action: "EDIT_KOSAKATA",
      details: `Admin ${authCheck.adminName} memperbarui kosakata: ${data[0]?.term || id}.`,
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
    `lms_dictionary?id=eq.${encodeURIComponent(id)}`,
    env,
    {
      method: "DELETE",
    },
  )

  if (!deleteResponse.ok) {
    return Response.json({ message: "Gagal menghapus kosakata dari database." }, { status: 500 })
  }

  void logActivity({
    actorId: authCheck.adminProfileId,
    actorName: authCheck.adminName,
    actorRole: "admin",
    action: "HAPUS_KOSAKATA",
    details: `Admin ${authCheck.adminName} menghapus entri kosakata ID ${id} dari database.`,
    category: "SILABUS",
  })

  return Response.json({ ok: true })
}
