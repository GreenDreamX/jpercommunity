import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params

  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  // Get user profile
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,angkatan&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

  const profiles = await profileResponse.json() as Array<{ id: string; angkatan: string | null }>
  const profile = profiles[0]
  if (!profile?.id) return Response.json({ message: "Profile belum sinkron." }, { status: 404 })
  const profileId = profile.id
  const studentAngkatan = profile.angkatan

  // Get course details
  const courseResponse = await supabaseRestRequest(`courses?select=*&id=eq.${courseId}&limit=1`, env)
  if (!courseResponse.ok) return Response.json({ message: "Gagal mengambil data kelas." }, { status: 500 })

  const courses = await courseResponse.json() as Array<{ id: string; is_locked: boolean }>
  const course = courses[0]
  if (!course) return Response.json({ message: "Kelas tidak ditemukan." }, { status: 404 })

  // Check if course access has restrictions
  const [accessRes, unlocksRes] = await Promise.all([
    supabaseRestRequest(
      `course_access?select=angkatan&course_id=eq.${encodeURIComponent(courseId)}`,
      env,
    ),
    supabaseRestRequest(
      `course_unlocks?select=profile_id&course_id=eq.${encodeURIComponent(courseId)}`,
      env,
    ),
  ])

  const accessRows = accessRes.ok ? (await accessRes.json() as Array<{ angkatan: string }>) : []
  const unlockRows = unlocksRes.ok ? (await unlocksRes.json() as Array<{ profile_id: string }>) : []

  // If the course itself is locked, only allow access if the student is individually unlocked
  if (course.is_locked) {
    const isProfileUnlocked = unlockRows.some((r) => r.profile_id === profileId)
    if (!isProfileUnlocked) {
      return Response.json(
        { message: "Akses ditolak. Kelas ini dikunci oleh Admin. Anda harus di-assign secara khusus untuk membukanya." },
        { status: 403 }
      )
    }
  } else if (accessRows.length > 0 || unlockRows.length > 0) {
    // If not locked but has cohort or member restrictions, verify that student has access
    const allowedCohorts = accessRows.map((r) => String(r.angkatan))
    const unlockedProfileIds = unlockRows.map((r) => r.profile_id)

    const isCohortAllowed = studentAngkatan && allowedCohorts.includes(String(studentAngkatan))
    const isProfileUnlocked = unlockedProfileIds.includes(profileId)

    if (!isCohortAllowed && !isProfileUnlocked) {
      return Response.json(
        { message: "Akses ditolak. Kelas ini dibatasi khusus untuk anggota yang di-assign oleh Admin." },
        { status: 403 }
      )
    }
  }

  // Get visible weeks
  const weeksResponse = await supabaseRestRequest(
    `course_weeks?select=*&course_id=eq.${courseId}&is_hidden=eq.false&order=week_number.asc`,
    env,
  )
  if (!weeksResponse.ok) return Response.json({ message: "Gagal mengambil materi kelas." }, { status: 500 })

  const weeks = await weeksResponse.json() as Array<{
    id: string
    week_number: number
    title: string
    pdf_url: string | null
    youtube_url: string | null
    notes_markdown: string | null
    is_locked: boolean
  }>

  if (weeks.length === 0) return Response.json({ ok: true, course, weeks: [] })

  const weekIds = weeks.map((w) => w.id)
  const weekIdList = weekIds.map((id) => `"${id}"`).join(",")

  // Fetch modules, quizzes, quiz answers in parallel
  const [modulesRes, assignmentsRes, quizzesRes] = await Promise.all([
    // New: week_modules (visible only to students)
    supabaseRestRequest(
      `week_modules?course_week_id=in.(${weekIdList})&is_hidden=eq.false&order=order_index.asc,created_at.asc`,
      env,
    ),
    // Legacy: assignments (backward compat)
    supabaseRestRequest(
      `assignments?select=*&course_week_id=in.(${weekIdList})`,
      env,
    ),
    // Legacy + new: quizzes (referenced by modules)
    supabaseRestRequest(
      `quizzes?select=*&course_week_id=in.(${weekIdList})`,
      env,
    ),
  ])

  type RawModule = {
    id: string
    course_week_id: string
    type: "file" | "video" | "notes" | "quiz" | "assignment"
    title: string
    content: Record<string, unknown>
    is_locked: boolean
    is_hidden: boolean
    order_index: number
    created_at: string
  }

  const rawModules = modulesRes.ok ? (await modulesRes.json() as RawModule[]) : []
  const assignments = assignmentsRes.ok ? (await assignmentsRes.json() as Array<{ id: string; course_week_id: string; title: string; due_at: string | null }>) : []
  const quizzes = quizzesRes.ok ? (await quizzesRes.json() as Array<{ id: string; course_week_id: string; title: string; is_hidden: boolean; is_locked: boolean; opened_at: string | null; closed_at: string | null; max_attempts: number; min_score: number; time_limit_minutes: number }>) : []

  // Fetch quiz IDs from quiz modules to load questions presence
  const quizModuleIds = rawModules
    .filter((m) => m.type === "quiz" && m.content?.quiz_id)
    .map((m) => m.content.quiz_id as string)

  // Fetch module submissions for this student
  const moduleIds = rawModules
    .filter((m) => m.type === "assignment")
    .map((m) => m.id)

  // Fetch quiz answers and module submissions in parallel
  const [quizAnswersRes, moduleSubRes] = await Promise.all([
    quizzes.length > 0
      ? supabaseRestRequest(
          `quiz_answers?select=*&profile_id=eq.${profileId}&quiz_id=in.(${[...quizzes.map((q) => q.id), ...quizModuleIds].map((id) => `"${id}"`).join(",")})`,
          env,
        )
      : Promise.resolve(null),
    moduleIds.length > 0
      ? supabaseRestRequest(
          `module_submissions?select=*&profile_id=eq.${profileId}&module_id=in.(${moduleIds.map((id) => `"${id}"`).join(",")})`,
          env,
        )
      : Promise.resolve(null),
  ])

  // Legacy submissions
  let submissions: Array<{ id: string; assignment_id: string; file_url: string | null; submitted_at: string }> = []
  if (assignments.length > 0) {
    const assignmentIds = assignments.map((a) => a.id)
    const submissionsRes = await supabaseRestRequest(
      `submissions?select=*&profile_id=eq.${profileId}&assignment_id=in.(${assignmentIds.map((id) => `"${id}"`).join(",")})`,
      env,
    )
    if (submissionsRes.ok) submissions = await submissionsRes.json() as typeof submissions
  }

  const quizAnswers = quizAnswersRes?.ok ? (await quizAnswersRes.json() as Array<{ id: string; quiz_id: string; score: number | null; submitted_at: string; attempts: number }>) : []
  const moduleSubmissions = moduleSubRes?.ok ? (await moduleSubRes.json() as Array<{ id: string; module_id: string; file_url: string; file_name: string | null; file_size: number | null; submitted_at: string }>) : []

  // Enrich modules with quiz data and submission data
  const enrichedModules = rawModules.map((m) => {
    if (m.type === "quiz") {
      const quizId = m.content.quiz_id as string | undefined
      const quiz = quizId ? quizzes.find((q) => q.id === quizId) : null
      const userAnswer = quizId ? quizAnswers.find((qa) => qa.quiz_id === quizId) || null : null
      return { ...m, quiz, user_answer: userAnswer }
    }
    if (m.type === "assignment") {
      const sub = moduleSubmissions.find((s) => s.module_id === m.id) || null
      return { ...m, submission: sub }
    }
    return m
  })

  // Map weeks with new modules + legacy data
  const mappedWeeks = weeks.map((week) => {
    const weekModules = enrichedModules.filter((m) => m.course_week_id === week.id)

    // Legacy assignments
    const weekAssignments = assignments
      .filter((a) => a.course_week_id === week.id)
      .map((a) => ({
        ...a,
        submission: submissions.find((s) => s.assignment_id === a.id) || null,
      }))

    // Legacy quizzes
    const weekQuizzes = quizzes
      .filter((q) => q.course_week_id === week.id && !q.is_hidden)
      .map((q) => ({
        ...q,
        user_answer: quizAnswers.find((qa) => qa.quiz_id === q.id) || null,
      }))

    return {
      ...week,
      modules: weekModules,        // NEW: modular content
      assignments: weekAssignments, // LEGACY backward compat
      quizzes: weekQuizzes,         // LEGACY backward compat
    }
  })

  return Response.json({ ok: true, course, weeks: mappedWeeks })
}
