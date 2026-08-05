import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]

async function verifyStudio(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false as const, status: verified.status, message: verified.message, profile: null }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false as const, status: 404, message: "Profile tidak ditemukan.", profile: null }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const profile = profileRows[0]

  if (!profile || !ALLOWED_STUDIO_ROLES.includes(profile.role)) {
    return { ok: false as const, status: 403, message: "Akses ditolak. Khusus pengurus.", profile: null }
  }

  return { ok: true as const, profile }
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyStudio(request, env)
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

  const authCheck = await verifyStudio(request, env)
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
    const session = data[0]

    // Populate default 'alpa' records for all active student members
    const studentsResponse = await supabaseRestRequest(
      "profiles?select=id&role=eq.student",
      env,
    )
    if (studentsResponse.ok) {
      const students = (await studentsResponse.json()) as Array<{ id: string }>
      if (students.length > 0) {
        const recordsBody = students.map((s) => ({
          attendance_session_id: session.id,
          profile_id: s.id,
          status: "alpa",
          scanned_at: new Date().toISOString(),
        }))
        const recordsResponse = await supabaseRestRequest("attendance_records", env, {
          method: "POST",
          body: recordsBody,
        })
        if (!recordsResponse.ok) {
          console.error("Gagal membuat record default absensi alpa:", await recordsResponse.text())
        }
      }
    }

    if (authCheck.profile) {
      void logActivity({
        actorId: authCheck.profile.id,
        actorName: authCheck.profile.nama_lengkap,
        actorRole: "admin",
        action: "MEMBUKA_SESI_ABSENSI",
        details: `Admin ${authCheck.profile.nama_lengkap} membuka sesi absensi QR baru.`,
        category: "ABSENSI",
      })
    }
    return Response.json({ ok: true, session })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyStudio(request, env)
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
    if (authCheck.profile) {
      void logActivity({
        actorId: authCheck.profile.id,
        actorName: authCheck.profile.nama_lengkap,
        actorRole: "admin",
        action: close_session ? "MENUTUP_SESI_ABSENSI" : "UPDATE_SESI_ABSENSI",
        details: close_session
          ? `Admin ${authCheck.profile.nama_lengkap} menutup sesi absensi dan mengisi jurnal materi: "${materi_diajarkan || '-'}"`
          : `Admin ${authCheck.profile.nama_lengkap} memperbarui jurnal sesi absensi.`,
        category: "ABSENSI",
      })
    }
    return Response.json({ ok: true, session: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyStudio(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
    }

    // 1. Delete associated attendance records
    await supabaseRestRequest(
      `attendance_records?attendance_session_id=eq.${encodeURIComponent(id)}`,
      env,
      { method: "DELETE" },
    )

    // 2. Delete attendance session
    const deleteResponse = await supabaseRestRequest(
      `attendance_sessions?id=eq.${encodeURIComponent(id)}`,
      env,
      { method: "DELETE" },
    )

    if (!deleteResponse.ok) {
      const details = await deleteResponse.text()
      return Response.json({ message: "Gagal menghapus sesi absensi.", details }, { status: 500 })
    }

    if (authCheck.profile) {
      void logActivity({
        actorId: authCheck.profile.id,
        actorName: authCheck.profile.nama_lengkap,
        actorRole: "admin",
        action: "HAPUS_SESI_ABSENSI",
        details: `Admin ${authCheck.profile.nama_lengkap} menghapus sesi absensi beserta seluruh catatan kehadiran terkait.`,
        category: "ABSENSI",
      })
    }

    return Response.json({ ok: true, message: "Sesi absensi berhasil dihapus." })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

