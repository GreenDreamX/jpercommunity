import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

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

  return { ok: true, profile }
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
  const courseWeekId = searchParams.get("course_week_id")

  if (!courseWeekId) {
    return Response.json({ message: "Parameter course_week_id wajib disertakan." }, { status: 400 })
  }

  // 1. Fetch all grades for a specific course week
  const response = await supabaseRestRequest(
    `grades?select=*&course_week_id=eq.${encodeURIComponent(courseWeekId)}`,
    env,
  )

  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data nilai." }, { status: 500 })
  }

  const rawGradesData = await response.json()

  // 2. Fetch assignment modules for this week
  const modulesRes = await supabaseRestRequest(
    `week_modules?course_week_id=eq.${encodeURIComponent(courseWeekId)}&type=eq.assignment&select=id,title`,
    env,
  )
  const modules = modulesRes.ok ? (await modulesRes.json() as Array<{ id: string; title: string }>) : []
  const moduleIds = modules.map(m => m.id)

  // 3. Fetch submissions for these modules
  let submissions: Array<{ id: string; module_id: string; profile_id: string; file_url: string; file_name: string; submitted_at: string }> = []
  if (moduleIds.length > 0) {
    const subsRes = await supabaseRestRequest(
      `module_submissions?select=*&module_id=in.(${moduleIds.map(id => `"${id}"`).join(",")})`,
      env,
    )
    if (subsRes.ok) {
      submissions = await subsRes.json()
    }
  }

  // 4. Fetch quizzes and quiz answers for this week
  const quizzesRes = await supabaseRestRequest(
    `quizzes?select=id,title&course_week_id=eq.${encodeURIComponent(courseWeekId)}`,
    env
  )
  const quizzes = quizzesRes.ok ? (await quizzesRes.json() as Array<{ id: string; title: string }>) : []
  const quizIds = quizzes.map(q => q.id)

  let quizAnswers: Array<{ id: string; quiz_id: string; profile_id: string; score: number | null; selected_answers: any }> = []
  let quizQuestions: Array<{ id: string; quiz_id: string; question: string; options: string[] | null; answer: string; type: string }> = []
  if (quizIds.length > 0) {
    const answersRes = await supabaseRestRequest(
      `quiz_answers?select=id,quiz_id,profile_id,score,selected_answers&quiz_id=in.(${quizIds.map(id => `"${id}"`).join(",")})`,
      env
    )
    if (answersRes.ok) {
      quizAnswers = await answersRes.json()
    }

    const questionsRes = await supabaseRestRequest(
      `quiz_questions?select=id,quiz_id,question,options,answer,type&quiz_id=in.(${quizIds.map(id => `"${id}"`).join(",")})`,
      env
    )
    if (questionsRes.ok) {
      quizQuestions = await questionsRes.json()
    }
  }

  // 5. Fetch all weeks for this course to calculate overall averages
  const overallAverages: Record<string, number> = {}
  let allWeekIds: string[] = []
  
  const weekDetailRes = await supabaseRestRequest(
    `course_weeks?id=eq.${encodeURIComponent(courseWeekId)}&select=course_id`,
    env,
  )
  if (weekDetailRes.ok) {
    const weekDetail = await weekDetailRes.json()
    const courseId = weekDetail[0]?.course_id
    if (courseId) {
      const allWeeksRes = await supabaseRestRequest(
        `course_weeks?course_id=eq.${encodeURIComponent(courseId)}&select=id`,
        env,
      )
      if (allWeeksRes.ok) {
        const allWeeks = await allWeeksRes.json() as Array<{ id: string }>
        allWeekIds = allWeeks.map(w => w.id)
      }
    }
  }

  // 6. Fetch attendance sessions and records for all weeks to enforce "absen alpa = nilai 0"
  const attendanceMap: Record<string, Record<string, string>> = {} // course_week_id -> profile_id -> status
  if (allWeekIds.length > 0) {
    const sessionsRes = await supabaseRestRequest(
      `attendance_sessions?select=id,course_week_id&course_week_id=in.(${allWeekIds.map(id => `"${id}"`).join(",")})`,
      env
    )
    if (sessionsRes.ok) {
      const sessions = await sessionsRes.json() as Array<{ id: string; course_week_id: string }>
      const sessionIds = sessions.map(s => s.id)
      const sessionWeekMapping = sessions.reduce((acc, s) => {
        acc[s.id] = s.course_week_id
        return acc
      }, {} as Record<string, string>)

      if (sessionIds.length > 0) {
        const recordsRes = await supabaseRestRequest(
          `attendance_records?select=attendance_session_id,profile_id,status&attendance_session_id=in.(${sessionIds.map(id => `"${id}"`).join(",")})`,
          env
        )
        if (recordsRes.ok) {
          const records = await recordsRes.json() as Array<{ attendance_session_id: string; profile_id: string; status: string }>
          records.forEach(r => {
            const weekId = sessionWeekMapping[r.attendance_session_id]
            if (weekId) {
              if (!attendanceMap[weekId]) attendanceMap[weekId] = {}
              attendanceMap[weekId][r.profile_id] = r.status
            }
          })
        }
      }
    }
  }

  // 7. Calculate overall averages with the override: if status is 'alpa', that week's score is 0
  if (allWeekIds.length > 0) {
    const allGradesRes = await supabaseRestRequest(
      `grades?select=profile_id,score,course_week_id&course_week_id=in.(${allWeekIds.map(id => `"${id}"`).join(",")})`,
      env
    )
    const allGrades = allGradesRes.ok ? (await allGradesRes.json() as Array<{ profile_id: string; score: number; course_week_id: string }>) : []
    
    const gradesDbMap: Record<string, Record<string, number>> = {}
    allGrades.forEach(g => {
      if (!gradesDbMap[g.profile_id]) gradesDbMap[g.profile_id] = {}
      gradesDbMap[g.profile_id][g.course_week_id] = g.score
    })

    const allProfileIds = new Set<string>([
      ...allGrades.map(g => g.profile_id),
      ...Object.values(attendanceMap).flatMap(map => Object.keys(map))
    ])

    allProfileIds.forEach(pId => {
      const studentScores: number[] = []
      allWeekIds.forEach(wId => {
        const attendanceStatus = attendanceMap[wId]?.[pId]
        
        // RULE: If absent (alpa), week grade is 0
        if (attendanceStatus === "alpa") {
          studentScores.push(0)
        } else {
          const dbScore = gradesDbMap[pId]?.[wId]
          if (dbScore !== undefined) {
            studentScores.push(dbScore)
          }
        }
      })

      if (studentScores.length > 0) {
        overallAverages[pId] = Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length)
      }
    })
  }

  // 8. Override current week's grades to 0 in response if student is alpa
  const currentWeekAttendance = attendanceMap[courseWeekId] || {}
  const enrichedGrades = rawGradesData.map((g: any) => {
    if (currentWeekAttendance[g.profile_id] === "alpa") {
      return { ...g, score: 0 }
    }
    return g
  })

  return Response.json({
    grades: enrichedGrades,
    overallAverages,
    assignments: modules,
    submissions,
    quizzes,
    quizAnswers,
    quizQuestions,
    attendanceMap: currentWeekAttendance
  })
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
    const { profile_id, course_week_id, score, note, nilai_tugas, nilai_kuis, nilai_kumpulan } = body

    if (!profile_id || !course_week_id) {
      return Response.json({ message: "Parameter profile_id dan course_week_id wajib disertakan." }, { status: 400 })
    }

    // Check if grade already exists for this student on this week to determine update or insert
    const checkResponse = await supabaseRestRequest(
      `grades?select=id&profile_id=eq.${encodeURIComponent(profile_id)}&course_week_id=eq.${encodeURIComponent(course_week_id)}&limit=1`,
      env,
    )

    if (!checkResponse.ok) {
      return Response.json({ message: "Gagal memverifikasi duplikasi nilai." }, { status: 500 })
    }

    const checkRows = await checkResponse.json()
    const existingId = checkRows[0]?.id

    let upsertResponse
    const payload = {
      score: score !== null && score !== undefined ? parseInt(score.toString()) : null,
      note: note || "",
      nilai_tugas: nilai_tugas !== null && nilai_tugas !== undefined ? parseInt(nilai_tugas.toString()) : null,
      nilai_kuis: nilai_kuis !== null && nilai_kuis !== undefined ? parseInt(nilai_kuis.toString()) : null,
      nilai_kumpulan: nilai_kumpulan !== null && nilai_kumpulan !== undefined ? parseInt(nilai_kumpulan.toString()) : null,
    }

    if (existingId) {
      // Update
      upsertResponse = await supabaseRestRequest(
        `grades?id=eq.${existingId}`,
        env,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: payload,
        },
      )
    } else {
      // Insert
      upsertResponse = await supabaseRestRequest(
        "grades",
        env,
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: [{
            profile_id,
            course_week_id,
            ...payload
          }],
        },
      )
    }

    if (!upsertResponse.ok) {
      const details = await upsertResponse.text()
      return Response.json({ message: "Gagal menyimpan data nilai.", details }, { status: 500 })
    }

    const data = await upsertResponse.json()
    if (authCheck.profile) {
      void logActivity({
        actorId: authCheck.profile.id,
        actorName: authCheck.profile.nama_lengkap,
        actorRole: "admin",
        action: "UPDATE_NILAI",
        details: `Admin ${authCheck.profile.nama_lengkap} menginput/merubah nilai siswa. Tugas: ${nilai_tugas ?? '-'}, Kuis: ${nilai_kuis ?? '-'}, Kumpulan: ${nilai_kumpulan ?? '-'} (catatan: "${note || '-'}").`,
        category: "NILAI",
      })
    }
    return Response.json({ ok: true, grade: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
