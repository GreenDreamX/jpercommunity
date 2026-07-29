import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return { ok: true }
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

  const response = await supabaseRestRequest(
    "attendance_sessions?select=*,course_weeks(title,course_id)&order=opened_at.desc",
    env,
  )

  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil daftar sesi absensi." }, { status: 500 })
  }

  const data = await response.json()
  return Response.json({ sessions: data })
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
    const { course_week_id, qr_token } = body

    if (!course_week_id || !qr_token) {
      return Response.json({ message: "Parameter course_week_id dan qr_token wajib disertakan." }, { status: 400 })
    }

    const insertResponse = await supabaseRestRequest(
      "attendance_sessions",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          course_week_id,
          qr_token,
          opened_at: new Date().toISOString(),
          closed_at: null,
          materi_diajarkan: "",
          feedback: "",
          dokumentasi_url: "",
        }],
      },
    )

    if (!insertResponse.ok) {
      const details = await insertResponse.text()
      return Response.json({ message: "Gagal membuka sesi absensi.", details }, { status: 500 })
    }

    const data = await insertResponse.json()
    return Response.json({ ok: true, session: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
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
    const { materi_diajarkan, feedback, dokumentasi_url, close_session } = body

    const updateBody: Record<string, string | null> = {}
    if (materi_diajarkan !== undefined) updateBody.materi_diajarkan = materi_diajarkan
    if (feedback !== undefined) updateBody.feedback = feedback
    if (dokumentasi_url !== undefined) updateBody.dokumentasi_url = dokumentasi_url
    if (close_session === true) {
      updateBody.closed_at = new Date().toISOString()
    }

    const updateResponse = await supabaseRestRequest(
      `attendance_sessions?id=eq.${encodeURIComponent(id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: updateBody,
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui / menutup sesi absensi.", details }, { status: 500 })
    }

    const data = await updateResponse.json()
    return Response.json({ ok: true, session: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
