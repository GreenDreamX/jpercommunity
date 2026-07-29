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

  const response = await supabaseRestRequest("courses?select=id,title,description,image_url,is_locked&is_hidden=eq.false&order=created_at.desc", env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil daftar kelas." }, { status: 500 })
  }

  const courses = await response.json()
  return Response.json({ ok: true, courses })
}
