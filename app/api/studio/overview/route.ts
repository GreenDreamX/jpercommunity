import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function safeCount(path: string, env: { supabaseUrl: string; supabaseSecret: string }) {
  const response = await supabaseRestRequest(path, env)
  if (!response.ok) {
    return 0
  }

  const rows = (await response.json()) as Array<{ id: string }>
  return rows.length
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
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return Response.json({ message: "Profile admin tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<{
    id: string
    nama_lengkap: string
    role: string
  }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return Response.json({ message: "Akses Studio hanya untuk admin." }, { status: 403 })
  }

  const [memberCount, courseCount, sessionCount] = await Promise.all([
    safeCount("profiles?select=id", env),
    safeCount("courses?select=id", env),
    safeCount("attendance_sessions?select=id", env),
  ])

  return Response.json({
    ok: true,
    profile,
    stats: {
      memberCount,
      courseCount,
      sessionCount,
    },
    agenda: [
      "Review pendaftaran baru dan verifikasi role.",
      "Buka sesi absensi pertemuan berjalan.",
      "Input nilai minggu ini untuk course aktif.",
    ],
    modules: [
      "Course management",
      "Silabus & lock/unlock materi",
      "Input nilai per minggu",
      "Member management",
    ],
  })
}