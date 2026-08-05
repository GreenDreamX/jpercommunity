import pkg from "../../../../package.json"
import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

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
    `profiles?select=*,student_academic_info(*)&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return Response.json({ message: "Profile admin tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<Record<string, any>>
  const profile = profileRows[0]

  const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (!profile || !ALLOWED_STUDIO_ROLES.includes(profile.role)) {
    return Response.json({ message: "Akses Studio khusus pengurus komunitas." }, { status: 403 })
  }

  // Auto-log system update if version has changed or not yet logged
  const version = pkg.version || "0.0.1"
  const checkLogRes = await supabaseRestRequest(
    `activity_logs?select=id&action=eq.SYSTEM_BOOT&details=ilike.*versi%20${encodeURIComponent(version)}*&limit=1`,
    env,
  )
  if (checkLogRes.ok) {
    const logRows = await checkLogRes.json() as any[]
    if (!logRows || logRows.length === 0) {
      void logActivity({
        actorId: profile.id,
        actorName: "Sistem JPER",
        actorRole: "admin",
        action: "SYSTEM_BOOT",
        details: `Aplikasi JPER Community berhasil dijalankan/diperbarui ke versi ${version}.`,
        category: "SISTEM",
      })
    }
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