import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

type LogPayload = {
  action: "LOGIN" | "LOGOUT" | "CHANGE_PASSWORD" | "UPDATE_PROFILE" | string
  details?: string
  category?: "ABSENSI" | "NILAI" | "MEMBER" | "PROFIL" | "SILABUS" | "SISTEM" | "UMUM"
  actorName?: string
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown IP"

  let body: LogPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Payload log tidak valid." }, { status: 400 })
  }

  const { action, details, category } = body
  if (!action) {
    return Response.json({ message: "Parameter action wajib disertakan." }, { status: 400 })
  }

  // Skip Firebase Auth check for LOGIN_FAILED as user is not logged in yet
  if (action === "LOGIN_FAILED") {
    const actorName = body.actorName || "Anonymous"
    const det = `${details || `Percobaan login gagal untuk email: ${actorName}.`} (IP: ${ip})`
    void logActivity({
      actorId: null,
      actorName,
      actorRole: "student",
      action: "LOGIN_FAILED",
      details: det,
      category: "MEMBER",
    })
    return Response.json({ ok: true })
  }

  // Normal authenticated logging
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  // Fetch actor profile from Supabase
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,email,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  let actorId = null
  let actorName = verified.user.email || "Pengguna"
  let actorRole = "student"

  if (profileResponse.ok) {
    const rows = await profileResponse.json()
    if (rows && rows.length > 0) {
      actorId = rows[0].id
      actorName = rows[0].nama_lengkap || rows[0].email || actorName
      actorRole = rows[0].role || actorRole
    }
  }

  // Determine category and details defaults if not provided
  let cat = category || "UMUM"
  let det = details || ""

  if (action === "LOGIN") {
    cat = "MEMBER"
    det = det || `Pengguna ${actorName} (${actorRole}) berhasil login ke sistem.`
  } else if (action === "CHANGE_PASSWORD") {
    cat = "PROFIL"
    det = det || `Pengguna ${actorName} berhasil memperbarui kata sandi (password).`
  }

  // Always append IP to the details
  det = `${det} (IP: ${ip})`

  void logActivity({
    actorId,
    actorName,
    actorRole,
    action,
    details: det,
    category: cat,
  })

  return Response.json({ ok: true })
}
