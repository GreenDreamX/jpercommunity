import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  const { searchParams } = new URL(request.url)
  const angkatanFilter = searchParams.get("angkatan")

  // Fetch student profile to locate current user ID
  const myProfileRes = await supabaseRestRequest(
    `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  const myProfileRows = myProfileRes.ok ? (await myProfileRes.json() as Array<{ id: string }>) : []
  const myProfileId = myProfileRows[0]?.id

  // Build query URL
  let queryUrl = `profiles?select=id,nama_lengkap,email,role,angkatan,avatar_url,xp,streak_count&order=xp.desc,streak_count.desc,created_at.asc`
  if (angkatanFilter && angkatanFilter !== "all") {
    queryUrl += `&angkatan=eq.${encodeURIComponent(angkatanFilter)}`
  }

  const res = await supabaseRestRequest(queryUrl, env)
  if (!res.ok) return Response.json({ message: "Gagal mengambil data papan peringkat." }, { status: 500 })

  type LeaderboardMember = {
    id: string
    nama_lengkap: string
    email: string
    role: string
    angkatan: string | null
    avatar_url: string | null
    xp: number
    streak_count: number
    rank?: number
  }

  const allMembers = (await res.json() as LeaderboardMember[]).map((m, idx) => ({
    ...m,
    xp: m.xp ?? 0,
    streak_count: m.streak_count ?? 0,
    rank: idx + 1,
  }))

  const podium = allMembers.slice(0, 3)
  const rankings = allMembers.slice(3)

  const myMember = allMembers.find((m) => m.id === myProfileId) || null

  return Response.json({
    ok: true,
    podium,
    rankings,
    myMember,
    totalMembers: allMembers.length,
  })
}
