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
    `profiles?select=id,nama_lengkap,email,role,angkatan&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<{
    id: string
    nama_lengkap: string
    email: string
    role: string
    angkatan: string
  }>
  const profile = profileRows[0]

  if (!profile) {
    return Response.json(
      { message: "Profile belum tersinkronisasi. Lakukan register ulang." },
      { status: 404 },
    )
  }

  const [courses, assignments, grades, attendance] = await Promise.all([
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
  ])

  const reminderItems = assignments
    .filter((assignment) => assignment.due_at)
    .slice(0, 3)
    .map((assignment) => `${assignment.title} - batas ${assignment.due_at}`)

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