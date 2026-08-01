import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

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
  // Only return records with status='hadir' for percentage calculation
  const attendanceResponse = await supabaseRestRequest(
    `attendance_records?select=id,scanned_at,status,attendance_sessions(opened_at,materi_diajarkan,course_weeks(week_number,title))&profile_id=eq.${profileId}&order=scanned_at.desc`,
    env,
  )

  if (!attendanceResponse.ok) {
    return Response.json({ message: "Gagal mengambil riwayat absensi." }, { status: 500 })
  }

  const allRecords = await attendanceResponse.json() as Array<Record<string, unknown> & { status: string }>
  // Records with status='hadir' count toward attendance percentage
  const hadirRecords = allRecords.filter(r => r.status === "hadir")
  return Response.json({ ok: true, records: allRecords, hadirCount: hadirRecords.length, totalCount: allRecords.length })

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
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }
  const profiles = await profileResponse.json() as Array<{ id: string; nama_lengkap: string; role: string }>
  const userProfile = profiles[0]
  const profileId = userProfile?.id
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

  let session: { id: string; opened_at: string; closed_at: string | null } | null = null

  // Check if token is dynamic 30s format: jper-att-${sessionId}-${timeBlock}
  const dynamicMatch = qrToken.match(/^jper-att-([a-f0-9\-]+)-(\d+)$/i)

  if (dynamicMatch) {
    const sessionId = dynamicMatch[1]
    const scannedBlock = parseInt(dynamicMatch[2], 10)
    const currentBlock = Math.floor(Date.now() / 30000)

    // Validate 30-second window (allow +-1 block for latency)
    if (Math.abs(currentBlock - scannedBlock) > 1) {
      return Response.json(
        { message: "Kode QR ini sudah kedaluwarsa (diperbarui setiap 30 detik). Silakan pindai QR terbaru dari layar admin." },
        { status: 400 },
      )
    }

    const sessionResponse = await supabaseRestRequest(
      `attendance_sessions?select=id,opened_at,closed_at&id=eq.${encodeURIComponent(sessionId)}&limit=1`,
      env,
    )
    if (!sessionResponse.ok) {
      return Response.json({ message: "Gagal memverifikasi sesi absensi." }, { status: 500 })
    }
    const sessions = (await sessionResponse.json()) as Array<{ id: string; opened_at: string; closed_at: string | null }>
    session = sessions[0] || null
  } else {
    // Fallback lookup by static qr_token
    const sessionResponse = await supabaseRestRequest(
      `attendance_sessions?select=id,opened_at,closed_at&qr_token=eq.${encodeURIComponent(qrToken)}&limit=1`,
      env,
    )
    if (!sessionResponse.ok) {
      return Response.json({ message: "Gagal memverifikasi sesi absensi." }, { status: 500 })
    }
    const sessions = (await sessionResponse.json()) as Array<{ id: string; opened_at: string; closed_at: string | null }>
    session = sessions[0] || null
  }

  if (!session) {
    return Response.json({ message: "Sesi absensi tidak ditemukan atau QR token tidak valid." }, { status: 400 })
  }

  if (session.closed_at) {
    return Response.json({ message: "Sesi absensi ini sudah ditutup oleh admin." }, { status: 400 })
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

  // Insert attendance record (QR scan = always 'hadir')
  const insertResponse = await supabaseRestRequest(
    "attendance_records",
    env,
    {
      method: "POST",
      body: [{
        attendance_session_id: session.id,
        profile_id: profileId,
        status: "hadir",
      }],
    },
  )

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text()
    return Response.json({ message: "Gagal menyimpan absensi.", details: errorText }, { status: 500 })
  }

  void logActivity({
    actorId: userProfile.id,
    actorName: userProfile.nama_lengkap || "Siswa JPER",
    actorRole: userProfile.role || "student",
    action: "SCAN_ABSENSI",
    details: `${userProfile.nama_lengkap || "Siswa"} berhasil melakukan scan absensi kelas.`,
    category: "ABSENSI",
  })

  return Response.json({ ok: true, message: "Absensi berhasil dicatat." })
}
