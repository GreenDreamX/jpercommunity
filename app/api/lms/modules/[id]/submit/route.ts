import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

/**
 * POST /api/lms/modules/[id]/submit
 * Submit assignment for a module.
 * Body: { file_url, file_name, file_size }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: moduleId } = await params

  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 })

  // Get profile
  const profileRes = await supabaseRestRequest(
    `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileRes.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

  const profiles = await profileRes.json() as Array<{ id: string }>
  const profile = profiles[0]
  if (!profile) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

  try {
    const body = await request.json() as { file_url: string; file_name?: string; file_size?: number }
    const { file_url, file_name, file_size } = body

    if (!file_url) return Response.json({ message: "file_url wajib diisi." }, { status: 400 })

    // Upsert submission (one per student per module)
    const res = await supabaseRestRequest("module_submissions", env, {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: [{
        module_id: moduleId,
        profile_id: profile.id,
        file_url,
        file_name: file_name ?? null,
        file_size: file_size ?? null,
        submitted_at: new Date().toISOString(),
      }],
    })

    if (!res.ok) {
      const detail = await res.text()
      return Response.json({ message: "Gagal menyimpan submission.", detail }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}
