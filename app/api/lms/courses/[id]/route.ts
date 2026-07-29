import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params

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

  // Get course details
  const courseResponse = await supabaseRestRequest(`courses?select=*&id=eq.${courseId}&limit=1`, env)
  if (!courseResponse.ok) {
    return Response.json({ message: "Gagal mengambil data kelas." }, { status: 500 })
  }
  const courses = await courseResponse.json() as Array<unknown>
  const course = courses[0]
  if (!course) {
    return Response.json({ message: "Kelas tidak ditemukan." }, { status: 404 })
  }

  // Get weeks
  const weeksResponse = await supabaseRestRequest(
    `course_weeks?select=*&course_id=eq.${courseId}&is_hidden=eq.false&order=week_number.asc`,
    env,
  )
  if (!weeksResponse.ok) {
    return Response.json({ message: "Gagal mengambil materi kelas." }, { status: 500 })
  }
  const weeks = await weeksResponse.json() as Array<{
    id: string
    week_number: number
    title: string
    pdf_url: string | null
    youtube_url: string | null
    notes_markdown: string | null
    is_locked: boolean
  }>

  if (weeks.length === 0) {
    return Response.json({ ok: true, course, weeks: [] })
  }

  const weekIds = weeks.map((w) => w.id)

  // Fetch assignments, submissions, quizzes, and quiz answers in parallel
  const [assignmentsRes, quizzesRes] = await Promise.all([
    supabaseRestRequest(`assignments?select=*&course_week_id=in.(${weekIds.map((id) => `"${id}"`).join(",")})`, env),
    supabaseRestRequest(`quizzes?select=*&course_week_id=in.(${weekIds.map((id) => `"${id}"`).join(",")})`, env),
  ])

  const assignments = assignmentsRes.ok ? (await assignmentsRes.json() as Array<{ id: string; course_week_id: string; title: string; due_at: string | null }>) : []
  const quizzes = quizzesRes.ok ? (await quizzesRes.json() as Array<{ id: string; course_week_id: string; title: string; is_hidden: boolean; is_locked: boolean }>) : []

  // Fetch user's submissions
  let submissions: Array<{ id: string; assignment_id: string; file_url: string | null; submitted_at: string }> = []
  if (assignments.length > 0) {
    const assignmentIds = assignments.map((a) => a.id)
    const submissionsRes = await supabaseRestRequest(
      `submissions?select=*&profile_id=eq.${profileId}&assignment_id=in.(${assignmentIds.map((id) => `"${id}"`).join(",")})`,
      env,
    )
    if (submissionsRes.ok) {
      submissions = await submissionsRes.json() as typeof submissions
    }
  }

  // Fetch user's quiz answers
  let quizAnswers: Array<{ id: string; quiz_id: string; score: number | null; submitted_at: string }> = []
  if (quizzes.length > 0) {
    const quizIds = quizzes.map((q) => q.id)
    const quizAnswersRes = await supabaseRestRequest(
      `quiz_answers?select=*&profile_id=eq.${profileId}&quiz_id=in.(${quizIds.map((id) => `"${id}"`).join(",")})`,
      env,
    )
    if (quizAnswersRes.ok) {
      quizAnswers = await quizAnswersRes.json() as typeof quizAnswers
    }
  }

  // Map everything back to the weeks
  const mappedWeeks = weeks.map((week) => {
    const weekAssignments = assignments
      .filter((a) => a.course_week_id === week.id)
      .map((a) => {
        const submission = submissions.find((s) => s.assignment_id === a.id) || null
        return {
          ...a,
          submission,
        }
      })

    const weekQuizzes = quizzes
      .filter((q) => q.course_week_id === week.id && !q.is_hidden)
      .map((q) => {
        const answer = quizAnswers.find((qa) => qa.quiz_id === q.id) || null
        return {
          ...q,
          user_answer: answer,
        }
      })

    return {
      ...week,
      assignments: weekAssignments,
      quizzes: weekQuizzes,
    }
  })

  return Response.json({ ok: true, course, weeks: mappedWeeks })
}
