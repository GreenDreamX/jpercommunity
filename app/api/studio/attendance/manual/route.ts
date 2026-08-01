import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const actor = profileRows[0]

  if (!actor || !ALLOWED_STUDIO_ROLES.includes(actor.role)) {
    return Response.json({ message: "Akses ditolak. Khusus pengurus." }, { status: 403 })
  }

  let body: {
    session_id: string
    profile_id: string
    member_name: string
    status: "hadir" | "izin" | "sakit" | "alpa" | "dispen"
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const { session_id, profile_id, member_name, status } = body

  if (!session_id || !profile_id || !status) {
    return Response.json({ message: "Parameter session_id, profile_id, status wajib diisi." }, { status: 400 })
  }

  const VALID_STATUSES = ["hadir", "izin", "sakit", "alpa", "dispen"]
  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ message: "Status tidak valid." }, { status: 400 })
  }

  // Cek apakah sesi masih aktif
  const sessionRes = await supabaseRestRequest(
    `attendance_sessions?select=id,closed_at&id=eq.${encodeURIComponent(session_id)}&limit=1`,
    env,
  )
  if (!sessionRes.ok) {
    return Response.json({ message: "Gagal verifikasi sesi." }, { status: 500 })
  }
  const sessions = (await sessionRes.json()) as Array<{ id: string; closed_at: string | null }>
  const session = sessions[0]
  if (!session) {
    return Response.json({ message: "Sesi tidak ditemukan." }, { status: 404 })
  }
  if (session.closed_at) {
    return Response.json({ message: "Sesi sudah ditutup, tidak bisa mengubah absensi." }, { status: 400 })
  }

  // Cek apakah sudah ada record untuk member ini di sesi ini
  const checkRes = await supabaseRestRequest(
    `attendance_records?select=id&attendance_session_id=eq.${encodeURIComponent(session_id)}&profile_id=eq.${encodeURIComponent(profile_id)}&limit=1`,
    env,
  )
  const existing = checkRes.ok ? ((await checkRes.json()) as Array<{ id: string }>) : []

  let upsertRes: Response

  if (existing.length > 0) {
    // UPDATE record yang sudah ada
    upsertRes = await supabaseRestRequest(
      `attendance_records?id=eq.${encodeURIComponent(existing[0].id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: { status, scanned_at: new Date().toISOString() },
      },
    )
  } else {
    // INSERT record baru
    upsertRes = await supabaseRestRequest(
      "attendance_records",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          attendance_session_id: session_id,
          profile_id,
          status,
          scanned_at: new Date().toISOString(),
        }],
      },
    )
  }

  if (!upsertRes.ok) {
    const errText = await upsertRes.text()
    return Response.json({ message: "Gagal menyimpan absensi manual.", details: errText }, { status: 500 })
  }

  // Log ke activity_logs
  void logActivity({
    actorId: actor.id,
    actorName: actor.nama_lengkap,
    actorRole: actor.role,
    action: "ABSEN_MANUAL",
    details: `${actor.nama_lengkap} (${actor.role}) mencatat absensi manual: ${member_name} → ${status.toUpperCase()} (sesi: ${session_id.substring(0, 8)}...)`,
    category: "ABSENSI",
  })

  return Response.json({ ok: true, message: `Absensi ${member_name} berhasil dicatat: ${status}` })
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }
  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string }>
  const actor = profileRows[0]
  if (!actor || !ALLOWED_STUDIO_ROLES.includes(actor.role)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return Response.json({ message: "Parameter session_id diperlukan." }, { status: 400 })
  }

  // Ambil semua records dari sesi ini dengan info profile
  const recordsRes = await supabaseRestRequest(
    `attendance_records?select=id,profile_id,status,scanned_at&attendance_session_id=eq.${encodeURIComponent(sessionId)}`,
    env,
  )

  const records = recordsRes.ok
    ? ((await recordsRes.json()) as Array<{ id: string; profile_id: string; status: string; scanned_at: string }>)
    : []

  return Response.json({ ok: true, records })
}
