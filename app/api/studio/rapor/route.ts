import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
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

  return { ok: true, profileId: profile.id }
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
  const courseId = searchParams.get("course_id")
  const profileId = searchParams.get("profile_id")

  if (!courseId || !profileId) {
    return Response.json({ message: "Parameter course_id dan profile_id wajib disertakan." }, { status: 400 })
  }

  // 1. Fetch all weeks in this course
  const weeksRes = await supabaseRestRequest(
    `course_weeks?course_id=eq.${encodeURIComponent(courseId)}&select=id,week_number,title&order=week_number.asc`,
    env,
  )
  if (!weeksRes.ok) {
    return Response.json({ message: "Gagal mengambil data silabus pertemuan." }, { status: 500 })
  }
  const weeks = await weeksRes.json()
  const weekIds = weeks.map((w: any) => w.id)

  if (weekIds.length === 0) {
    return Response.json({ weeks: [], grades: [], attendance: [] })
  }

  // 2. Fetch grades for this profile in these weeks
  const gradesRes = await supabaseRestRequest(
    `grades?profile_id=eq.${encodeURIComponent(profileId)}&course_week_id=in.(${weekIds.map((id: string) => `"${id}"`).join(",")})`,
    env,
  )
  const grades = gradesRes.ok ? await gradesRes.json() : []

  // 3. Fetch attendance sessions for these weeks
  const sessionsRes = await supabaseRestRequest(
    `attendance_sessions?course_week_id=in.(${weekIds.map((id: string) => `"${id}"`).join(",")})&select=id,course_week_id`,
    env,
  )
  const sessions = sessionsRes.ok ? await sessionsRes.json() : []
  const sessionIds = sessions.map((s: any) => s.id)

  // Map session_id to week_id
  const sessionToWeekMap = sessions.reduce((acc: any, s: any) => {
    acc[s.id] = s.course_week_id
    return acc
  }, {} as Record<string, string>)

  // 4. Fetch attendance records for this profile in these sessions
  let attendanceRecords: any[] = []
  if (sessionIds.length > 0) {
    const recordsRes = await supabaseRestRequest(
      `attendance_records?profile_id=eq.${encodeURIComponent(profileId)}&attendance_session_id=in.(${sessionIds.map((id: string) => `"${id}"`).join(",")})&select=attendance_session_id,status`,
      env,
    )
    if (recordsRes.ok) {
      const rawRecords = await recordsRes.json()
      attendanceRecords = rawRecords.map((r: any) => ({
        week_id: sessionToWeekMap[r.attendance_session_id],
        status: r.status,
      }))
    }
  }

  return Response.json({
    weeks,
    grades,
    attendance: attendanceRecords,
  })
}
