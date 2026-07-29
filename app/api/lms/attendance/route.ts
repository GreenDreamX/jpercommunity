import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  // Get user profile first
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }
  const profiles = await profileResponse.json() as Array<{ id: string }>
  const profileId = profiles[0]?.id
  if (!profileId) {
    return Response.json({ message: "Profile belum sinkron." }, { status: 404 })
  }

  // Get attendance records with session and course week details
  const attendanceResponse = await supabaseRestRequest(
    `attendance_records?select=id,scanned_at,attendance_sessions(opened_at,materi_diajarkan,course_weeks(week_number,title))&profile_id=eq.${profileId}&order=scanned_at.desc`,
    env,
  )

  if (!attendanceResponse.ok) {
    return Response.json({ message: "Gagal mengambil riwayat absensi." }, { status: 500 })
  }

  const records = await attendanceResponse.json()
  return Response.json({ ok: true, records })
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  // Get user profile
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }
  const profiles = await profileResponse.json() as Array<{ id: string }>
  const profileId = profiles[0]?.id
  if (!profileId) {
    return Response.json({ message: "Profile belum sinkron." }, { status: 404 })
  }

  let body: { qr_token?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const { qr_token: qrToken } = body
  if (!qrToken) {
    return Response.json({ message: "QR token absensi diperlukan." }, { status: 400 })
  }

  // Look up attendance session by token
  const sessionResponse = await supabaseRestRequest(
    `attendance_sessions?select=id,opened_at,closed_at&qr_token=eq.${encodeURIComponent(qrToken)}&limit=1`,
    env,
  )
  if (!sessionResponse.ok) {
    return Response.json({ message: "Gagal memverifikasi sesi absensi." }, { status: 500 })
  }
  const sessions = await sessionResponse.json() as Array<{ id: string; opened_at: string; closed_at: string | null }>
  const session = sessions[0]

  if (!session) {
    return Response.json({ message: "Sesi absensi tidak ditemukan atau QR token tidak valid." }, { status: 400 })
  }

  if (session.closed_at) {
    return Response.json({ message: "Sesi absensi ini sudah ditutup oleh admin." }, { status: 400 })
  }

  // Token is short-lived: verify if session opened_at is less than 10 minutes ago
  const openedTime = new Date(session.opened_at).getTime()
  const now = Date.now()
  const expiryDuration = 10 * 60 * 1000 // 10 menit
  if (now - openedTime > expiryDuration) {
    return Response.json({ message: "QR token sudah kedaluwarsa. Silakan minta kode QR baru ke admin." }, { status: 400 })
  }

  // Check if user already scanned for this session
  const checkResponse = await supabaseRestRequest(
    `attendance_records?select=id&attendance_session_id=eq.${session.id}&profile_id=eq.${profileId}&limit=1`,
    env,
  )
  if (checkResponse.ok) {
    const existing = await checkResponse.json() as Array<unknown>
    if (existing.length > 0) {
      return Response.json({ message: "Anda sudah melakukan absensi untuk sesi ini." }, { status: 400 })
    }
  }

  // Insert attendance record
  const insertResponse = await supabaseRestRequest(
    "attendance_records",
    env,
    {
      method: "POST",
      body: [{
        attendance_session_id: session.id,
        profile_id: profileId,
      }],
    },
  )

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text()
    return Response.json({ message: "Gagal menyimpan absensi.", details: errorText }, { status: 500 })
  }

  return Response.json({ ok: true, message: "Absensi berhasil dicatat." })
}
