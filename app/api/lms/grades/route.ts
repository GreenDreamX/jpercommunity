import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(request: Request) {
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

  // Get grades with week and course details
  const gradesResponse = await supabaseRestRequest(
    `grades?select=id,score,note,nilai_tugas,nilai_kuis,nilai_kumpulan,created_at,course_weeks(week_number,title,courses(title))&profile_id=eq.${profileId}&order=created_at.desc`,
    env,
  )

  if (!gradesResponse.ok) {
    return Response.json({ message: "Gagal mengambil data nilai." }, { status: 500 })
  }

  const grades = await gradesResponse.json()
  return Response.json({ ok: true, grades })
}
