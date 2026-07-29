import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params

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

  // Parse request body
  let body: { file_url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const { file_url: fileUrl } = body
  if (!fileUrl) {
    return Response.json({ message: "URL file tugas diperlukan." }, { status: 400 })
  }

  // Upsert into submissions table
  const insertResponse = await supabaseRestRequest(
    "submissions?on_conflict=assignment_id,profile_id",
    env,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [{
        assignment_id: assignmentId,
        profile_id: profileId,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
      }],
    },
  )

  if (!insertResponse.ok) {
    const errorDetails = await insertResponse.text()
    return Response.json(
      { message: "Gagal menyimpan pengumpulan tugas.", details: errorDetails },
      { status: 500 },
    )
  }

  const rows = await insertResponse.json()
  return Response.json({
    ok: true,
    submission: rows[0],
    message: "Tugas berhasil dikumpulkan.",
  })
}
