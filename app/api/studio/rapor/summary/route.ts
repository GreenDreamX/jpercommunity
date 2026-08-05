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

  if (!courseId) {
    return Response.json({ message: "Parameter course_id wajib disertakan." }, { status: 400 })
  }

  // 1. Fetch weeks in this course
  const weeksRes = await supabaseRestRequest(
    `course_weeks?course_id=eq.${encodeURIComponent(courseId)}&select=id,week_number&order=week_number.asc`,
    env,
  )
  if (!weeksRes.ok) {
    return Response.json({ message: "Gagal mengambil data silabus pertemuan." }, { status: 500 })
  }
  const weeks = await weeksRes.json()
  const weekIds = weeks.map((w: any) => w.id)

  if (weekIds.length === 0) {
    return Response.json({ summaries: [] })
  }

  // 2. Fetch allowed cohorts for this course
  const accessRes = await supabaseRestRequest(
    `course_access?course_id=eq.${encodeURIComponent(courseId)}&select=allowed_angkatan,unlock_rows:course_individual_unlocks(profile_id)`,
    env,
  )
  let allowedCohorts: string[] = []
  let unlockedProfileIds: string[] = []

  if (accessRes.ok) {
    const accessData = await accessRes.json()
    const access = accessData[0]
    if (access) {
      allowedCohorts = (access.allowed_angkatan || []).map(String)
      unlockedProfileIds = (access.unlock_rows || []).map((r: any) => r.profile_id)
    }
  }

  // 3. Fetch all profiles
  const profilesRes = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,angkatan,role&order=nama_lengkap.asc`,
    env,
  )
  if (!profilesRes.ok) {
    return Response.json({ message: "Gagal mengambil data profil." }, { status: 500 })
  }
  const allProfiles = await profilesRes.json()

  // Filter profiles based on course access
  const targetProfiles = allProfiles.filter((p: any) => {
    if (unlockedProfileIds.includes(p.id)) return true
    if (allowedCohorts.length === 0 && unlockedProfileIds.length === 0) return true
    return allowedCohorts.includes(String(p.angkatan || ""))
  })
  const targetProfileIds = targetProfiles.map((p: any) => p.id)

  if (targetProfileIds.length === 0) {
    return Response.json({ summaries: [] })
  }

  // 4. Fetch student academic info for these profiles to get school class (kelas)
  const academicRes = await supabaseRestRequest(
    `student_academic_info?profile_id=in.(${targetProfileIds.map((id: string) => `"${id}"`).join(",")})&select=profile_id,kelas,asal_sekolah`,
    env,
  )
  const academicRows = academicRes.ok ? await academicRes.json() : []
  const academicMap = academicRows.reduce((acc: any, r: any) => {
    acc[r.profile_id] = r
    return acc
  }, {} as Record<string, { kelas?: string; asal_sekolah?: string }>)

  // 5. Fetch grades for these profiles and weeks
  const gradesRes = await supabaseRestRequest(
    `grades?profile_id=in.(${targetProfileIds.map((id: string) => `"${id}"`).join(",")})&course_week_id=in.(${weekIds.map((id: string) => `"${id}"`).join(",")})`,
    env,
  )
  const gradesRows = gradesRes.ok ? await gradesRes.json() : []

  // 6. Fetch attendance sessions for these weeks
  const sessionsRes = await supabaseRestRequest(
    `attendance_sessions?course_week_id=in.(${weekIds.map((id: string) => `"${id}"`).join(",")})&select=id,course_week_id`,
    env,
  )
  const sessions = sessionsRes.ok ? await sessionsRes.json() : []
  const sessionIds = sessions.map((s: any) => s.id)
  const sessionToWeekMap = sessions.reduce((acc: any, s: any) => {
    acc[s.id] = s.course_week_id
    return acc
  }, {} as Record<string, string>)

  // 7. Fetch attendance records
  let attendanceRows: any[] = []
  if (sessionIds.length > 0) {
    const attRes = await supabaseRestRequest(
      `attendance_records?profile_id=in.(${targetProfileIds.map((id: string) => `"${id}"`).join(",")})&attendance_session_id=in.(${sessionIds.map((id: string) => `"${id}"`).join(",")})&select=profile_id,attendance_session_id,status`,
      env,
    )
    if (attRes.ok) {
      attendanceRows = await attRes.json()
    }
  }

  // 8. Compile calculations per profile
  const summaries = targetProfiles.map((p: any) => {
    const pGrades = gradesRows.filter((g: any) => g.profile_id === p.id)
    const pAtts = attendanceRows.filter((a: any) => a.profile_id === p.id)

    let sumTugas = 0
    let countTugas = 0
    let sumKuis = 0
    let countKuis = 0
    let sumKumpulan = 0
    let countKumpulan = 0
    let presentCount = 0

    weekIds.forEach((wId: string) => {
      // Check attendance
      const wSessionIds = sessions.filter((s: any) => s.course_week_id === wId).map((s: any) => s.id)
      const weekAtt = pAtts.find((a: any) => wSessionIds.includes(a.attendance_session_id))
      const isAlpa = weekAtt?.status === "alpa"

      if (weekAtt && weekAtt.status !== "alpa") {
        presentCount++
      }

      // Check grades
      const grade = pGrades.find((g: any) => g.course_week_id === wId)
      const wk = weeks.find((w: any) => w.id === wId)
      const weekNum = wk?.week_number

      let t = isAlpa ? 0 : (grade?.nilai_tugas !== null && grade?.nilai_tugas !== undefined ? Number(grade.nilai_tugas) : null)
      let k = isAlpa ? 0 : (grade?.nilai_kuis !== null && grade?.nilai_kuis !== undefined ? Number(grade.nilai_kuis) : null)
      let kum = isAlpa ? 0 : (grade?.score !== null && grade?.score !== undefined ? Number(grade.score) : null)

      // Fallback week 1 scores to 100 if missing and not absent
      if (weekNum === 1 && !isAlpa) {
        if (t === null) t = 100
        if (k === null) k = 100
        if (kum === null) kum = 100
      }

      if (t !== null) {
        sumTugas += t
        countTugas++
      }
      if (k !== null) {
        sumKuis += k
        countKuis++
      }
      if (kum !== null) {
        sumKumpulan += kum
        countKumpulan++
      }
    })

    const acad = academicMap[p.id] || {}

    return {
      profile_id: p.id,
      nama_lengkap: p.nama_lengkap,
      angkatan: p.angkatan,
      role: p.role,
      kelas_asal: acad.kelas || "-",
      asal_sekolah: acad.asal_sekolah || "-",
      attendance_present: presentCount,
      attendance_total: weekIds.length,
      avg_tugas: countTugas > 0 ? Math.round(sumTugas / countTugas) : 0,
      avg_kuis: countKuis > 0 ? Math.round(sumKuis / countKuis) : 0,
      avg_kumpulan: countKumpulan > 0 ? Math.round(sumKumpulan / countKumpulan) : 0,
    }
  })

  return Response.json({ summaries })
}
