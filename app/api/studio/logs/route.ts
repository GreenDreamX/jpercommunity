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

  // Check admin role
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile admin tidak ditemukan." }, { status: 404 })
  }
  const profiles = (await profileResponse.json()) as Array<{ id: string; role: string }>
  const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (!profiles[0] || !ALLOWED_STUDIO_ROLES.includes(profiles[0].role)) {
    return Response.json({ message: "Akses ditolak. Khusus pengurus." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")

  const limitParam = searchParams.get("limit")
  const limit = limitParam ? parseInt(limitParam) : 30
  let path = `activity_logs?select=*&order=created_at.desc&limit=${limit}`
  if (category && category !== "SEMUA") {
    path += `&category=eq.${encodeURIComponent(category)}`
  }
  if (search) {
    path += `&or=(actor_name.ilike.*${encodeURIComponent(search)}*,details.ilike.*${encodeURIComponent(search)}*,action.ilike.*${encodeURIComponent(search)}*)`
  }

  const logsResponse = await supabaseRestRequest(path, env)
  if (!logsResponse.ok) {
    return Response.json({ message: "Gagal mengambil log aktivitas." }, { status: 500 })
  }

  const logs = await logsResponse.json()
  return Response.json({ ok: true, logs })
}
