import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function safeArrayRequest<T>(path: string, env: { supabaseUrl: string; supabaseSecret: string }) {
  const response = await supabaseRestRequest(path, env)
  if (!response.ok) {
    return [] as T[]
  }

  return (await response.json()) as T[]
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
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<Record<string, any>>
  const profile = profileRows[0]

  if (!profile) {
    return Response.json(
      { message: "Profile belum tersinkronisasi. Lakukan register ulang." },
      { status: 404 },
    )
  }

  const [courses, assignments, grades, attendance, quizzes, quizAnswers] = await Promise.all([
    safeArrayRequest<{ id: string; title: string; description: string | null }>(
      "courses?select=id,title,description&is_hidden=eq.false&limit=6",
      env,
    ),
    safeArrayRequest<{ title: string; due_at: string | null }>(
      "assignments?select=title,due_at&order=due_at.asc&limit=5",
      env,
    ),
    safeArrayRequest<{ score: number | null }>(
      `grades?select=score&profile_id=eq.${encodeURIComponent(profile.id)}&limit=50`,
      env,
    ),
    safeArrayRequest<{ id: string }>(
      `attendance_records?select=id&profile_id=eq.${encodeURIComponent(profile.id)}&limit=200`,
      env,
    ),
    safeArrayRequest<{ id: string; title: string; closed_at: string | null }>(
      "quizzes?select=id,title,closed_at&is_hidden=eq.false&order=closed_at.asc&limit=5",
      env,
    ),
    safeArrayRequest<{ quiz_id: string }>(
      `quiz_answers?select=quiz_id&profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
    ),
  ])

  const reminderItems: string[] = []

  // Add assignment reminders
  assignments
    .filter((assignment) => assignment.due_at)
    .slice(0, 3)
    .forEach((assignment) => {
      if (assignment.due_at) {
        const formattedDate = new Date(assignment.due_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
        reminderItems.push(`Tugas: ${assignment.title} - batas ${formattedDate}`)
      }
    })

  // Add quiz reminders (only if untaken and has a due date)
  quizzes
    .filter((quiz) => quiz.closed_at && !quizAnswers.some((qa) => qa.quiz_id === quiz.id))
    .slice(0, 3)
    .forEach((quiz) => {
      if (quiz.closed_at) {
        const formattedDate = new Date(quiz.closed_at).toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
        reminderItems.push(`Kuis: ${quiz.title} - batas ${formattedDate}`)
      }
    })

  const validScores = grades
    .map((grade) => grade.score)
    .filter((score): score is number => typeof score === "number")

  const averageScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, score) => acc + score, 0) / validScores.length)
      : null

  return Response.json({
    ok: true,
    profile,
    reminders: reminderItems,
    courses,
    stats: {
      totalCourses: courses.length,
      totalAssignments: assignments.length,
      attendanceCount: attendance.length,
      averageScore,
    },
  })
}