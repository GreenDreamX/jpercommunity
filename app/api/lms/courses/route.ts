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

  const response = await supabaseRestRequest("courses?select=id,title,description,image_url,is_locked,course_weeks(id)&is_hidden=eq.false&order=created_at.desc", env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil daftar kelas." }, { status: 500 })
  }

  const rawCourses = await response.json() as Array<{
    id: string
    title: string
    description: string | null
    image_url: string | null
    is_locked: boolean
    course_weeks?: Array<{ id: string }>
  }>

  const courses = rawCourses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    image_url: c.image_url,
    is_locked: c.is_locked,
    weekCount: c.course_weeks?.length ?? 0,
  }))

  return Response.json({ ok: true, courses })
}
