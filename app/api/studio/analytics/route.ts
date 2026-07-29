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

  try {
    // 1. Fetch profiles of students
    const studentsRes = await supabaseRestRequest("profiles?select=id,nama_lengkap,email,angkatan&role=eq.student", env)
    if (!studentsRes.ok) {
      return Response.json({ message: "Gagal mengambil data siswa." }, { status: 500 })
    }
    const students = (await studentsRes.json()) as Array<{ id: string; nama_lengkap: string; email: string; angkatan: string }>

    // 2. Fetch courses count
    const coursesRes = await supabaseRestRequest("courses?select=id", env)
    const coursesCount = coursesRes.ok ? ((await coursesRes.json()) as Array<unknown>).length : 0

    // 3. Fetch all quiz answers
    const quizAnswersRes = await supabaseRestRequest("quiz_answers?select=profile_id,score,quiz_id", env)
    const quizAnswers = quizAnswersRes.ok
      ? ((await quizAnswersRes.json()) as Array<{ profile_id: string; score: number; quiz_id: string }>)
      : []

    // 4. Fetch all attendance records
    const attendanceRes = await supabaseRestRequest("attendance_records?select=profile_id", env)
    const attendanceRecords = attendanceRes.ok
      ? ((await attendanceRes.json()) as Array<{ profile_id: string }>)
      : []

    // 5. Fetch attendance sessions to calculate average rate
    const sessionsRes = await supabaseRestRequest("attendance_sessions?select=id", env)
    const sessionsCount = sessionsRes.ok ? ((await sessionsRes.json()) as Array<unknown>).length : 0

    // Aggregate statistics
    const totalStudents = students.length

    // Cohort breakdown
    const cohorts: Record<string, number> = {
      alumni: 0,
      "2024": 0,
      "2025": 0,
      "2026": 0,
      "2027_2028": 0,
    }

    students.forEach((s) => {
      const ang = s.angkatan
      if (ang === "2024") cohorts["2024"]++
      else if (ang === "2025") cohorts["2025"]++
      else if (ang === "2026") cohorts["2026"]++
      else if (ang === "2027" || ang === "2028" || ang === "2027-2028") cohorts["2027_2028"]++
      else cohorts["alumni"]++
    })

    // Average quiz score
    const validScores = quizAnswers.map((a) => a.score).filter((s) => typeof s === "number")
    const averageQuizScore =
      validScores.length > 0 ? Math.round(validScores.reduce((acc, s) => acc + s, 0) / validScores.length) : 0

    // Average attendance rate
    // rate = (total attendance rows) / (total students * total sessions)
    const expectedTotal = totalStudents * sessionsCount
    const attendanceRate =
      expectedTotal > 0 ? Math.round((attendanceRecords.length / expectedTotal) * 100) : 0

    // Inactive/At-Risk student logic
    // Criteria: has 0 attendance records OR average quiz score < 70
    const atRiskStudents = students
      .map((student) => {
        const studentAnswers = quizAnswers.filter((a) => a.profile_id === student.id)
        const studentScores = studentAnswers.map((a) => a.score).filter((s) => typeof s === "number")
        const avgScore =
          studentScores.length > 0 ? Math.round(studentScores.reduce((acc, s) => acc + s, 0) / studentScores.length) : null
        
        const attendanceCount = attendanceRecords.filter((r) => r.profile_id === student.id).length

        return {
          id: student.id,
          nama_lengkap: student.nama_lengkap,
          email: student.email,
          angkatan: student.angkatan,
          attendanceCount,
          avgScore,
        }
      })
      .filter((student) => {
        // filter: 0 attendance OR (has quiz scores and avg < 70)
        return student.attendanceCount === 0 || (student.avgScore !== null && student.avgScore < 70)
      })
      .slice(0, 5) // top 5 at risk

    // Weekly Averages placeholder (group by quiz_id/week)
    // Map unique quiz_ids to mock weeks
    const uniqueQuizzes = Array.from(new Set(quizAnswers.map((a) => a.quiz_id)))
    const weeklyAverages = uniqueQuizzes.map((qId, idx) => {
      const qScores = quizAnswers.filter((a) => a.quiz_id === qId).map((a) => a.score)
      const avg = qScores.length > 0 ? Math.round(qScores.reduce((acc, s) => acc + s, 0) / qScores.length) : 0
      return {
        week: idx + 1,
        avg,
      }
    }).sort((a, b) => a.week - b.week)

    return Response.json({
      ok: true,
      stats: {
        totalStudents,
        totalCourses: coursesCount,
        averageQuizScore,
        attendanceRate: Math.min(attendanceRate, 100),
      },
      cohorts,
      weeklyAverages: weeklyAverages.length > 0 ? weeklyAverages : [
        { week: 1, avg: 70 },
        { week: 2, avg: 78 },
        { week: 3, avg: 85 }
      ],
      atRiskStudents,
    })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
