import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false as const, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role,nama_lengkap&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false as const, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string; nama_lengkap: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return {
    ok: true as const,
    admin: {
      id: profile.id,
      role: profile.role,
      name: profile.nama_lengkap || verified.user.email || "Admin",
      email: verified.user.email,
    },
  }
}

/**
 * GET /api/studio/course-access?course_id=xxx
 * Returns allowed angkatan and unlocked profiles for a course.
 */
export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get("course_id")

  if (!courseId) return Response.json({ message: "Parameter course_id wajib disertakan." }, { status: 400 })

  const [accessRes, unlocksRes] = await Promise.all([
    supabaseRestRequest(
      `course_access?select=id,angkatan&course_id=eq.${encodeURIComponent(courseId)}&order=angkatan.asc`,
      env,
    ),
    supabaseRestRequest(
      `course_unlocks?select=id,profile_id,profiles(id,nama_lengkap,angkatan,email)&course_id=eq.${encodeURIComponent(courseId)}`,
      env,
    ),
  ])

  const accessRows = accessRes.ok ? await accessRes.json() : []
  const unlockRows = unlocksRes.ok ? await unlocksRes.json() : []

  return Response.json({
    allowed_angkatan: (accessRows as Array<{ id: string; angkatan: string }>).map((r) => r.angkatan),
    access_rows: accessRows,
    unlock_rows: unlockRows,
  })
}

/**
 * POST /api/studio/course-access
 * Body: { course_id, type: "angkatan", angkatan: "2025" }
 *    or { course_id, type: "profile", profile_id: "uuid" }
 */
export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  try {
    const body = await request.json() as { course_id: string; type: "angkatan" | "profile"; angkatan?: string; profile_id?: string }
    const { course_id, type, angkatan, profile_id } = body

    if (!course_id || !type) return Response.json({ message: "course_id dan type wajib diisi." }, { status: 400 })

    const { admin } = authCheck

    // Fetch course details for logging
    const courseRes = await supabaseRestRequest(`courses?select=title&id=eq.${course_id}&limit=1`, env)
    const courseTitle = courseRes.ok ? ((await courseRes.json() as any[])[0]?.title || course_id) : course_id

    if (type === "angkatan") {
      if (!angkatan) return Response.json({ message: "angkatan wajib diisi." }, { status: 400 })

      const res = await supabaseRestRequest("course_access", env, {
        method: "POST",
        headers: { Prefer: "return=representation,resolution=ignore-duplicates" },
        body: [{ course_id, angkatan }],
      })
      if (!res.ok) {
        const detail = await res.text()
        return Response.json({ message: "Gagal menambahkan akses angkatan.", detail }, { status: 500 })
      }

      void logActivity({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: "COURSE_ACCESS_GRANT",
        details: `Memberikan akses kelas "${courseTitle}" untuk Angkatan ${angkatan}.`,
        category: "MEMBER",
      })

      return Response.json({ ok: true })
    }

    if (type === "profile") {
      if (!profile_id) return Response.json({ message: "profile_id wajib diisi." }, { status: 400 })

      const res = await supabaseRestRequest("course_unlocks", env, {
        method: "POST",
        headers: { Prefer: "return=representation,resolution=ignore-duplicates" },
        body: [{ course_id, profile_id }],
      })
      if (!res.ok) {
        const detail = await res.text()
        return Response.json({ message: "Gagal menambahkan unlock member.", detail }, { status: 500 })
      }

      // Fetch target profile details for logging
      const targetRes = await supabaseRestRequest(`profiles?select=nama_lengkap,email,angkatan&id=eq.${profile_id}&limit=1`, env)
      const targetProfile = targetRes.ok ? ((await targetRes.json() as any[])[0]) : null
      const targetName = targetProfile ? `${targetProfile.nama_lengkap} (${targetProfile.email}, Angkatan ${targetProfile.angkatan})` : profile_id

      void logActivity({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: "MEMBER_ASSIGN",
        details: `Memberikan akses khusus (unlock) kelas "${courseTitle}" kepada ${targetName}.`,
        category: "MEMBER",
      })

      return Response.json({ ok: true })
    }

    return Response.json({ message: "type tidak dikenali. Gunakan 'angkatan' atau 'profile'." }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}

/**
 * DELETE /api/studio/course-access?type=angkatan&course_id=xxx&angkatan=2025
 *                                 ?type=profile&course_id=xxx&profile_id=uuid
 */
export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const courseId = searchParams.get("course_id")

  if (!type || !courseId) return Response.json({ message: "type dan course_id wajib disertakan." }, { status: 400 })

  const { admin } = authCheck

  // Fetch course details for logging
  const courseRes = await supabaseRestRequest(`courses?select=title&id=eq.${courseId}&limit=1`, env)
  const courseTitle = courseRes.ok ? ((await courseRes.json() as any[])[0]?.title || courseId) : courseId

  if (type === "angkatan") {
    const angkatan = searchParams.get("angkatan")
    if (!angkatan) return Response.json({ message: "angkatan wajib disertakan." }, { status: 400 })

    await supabaseRestRequest(
      `course_access?course_id=eq.${encodeURIComponent(courseId)}&angkatan=eq.${encodeURIComponent(angkatan)}`,
      env,
      { method: "DELETE" },
    )

    void logActivity({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: "COURSE_ACCESS_REVOKE",
      details: `Mencabut akses kelas "${courseTitle}" untuk Angkatan ${angkatan}.`,
      category: "MEMBER",
    })

    return Response.json({ ok: true })
  }

  if (type === "profile") {
    const profileId = searchParams.get("profile_id")
    if (!profileId) return Response.json({ message: "profile_id wajib disertakan." }, { status: 400 })

    // Fetch target profile details for logging before deleting
    const targetRes = await supabaseRestRequest(`profiles?select=nama_lengkap,email,angkatan&id=eq.${profileId}&limit=1`, env)
    const targetProfile = targetRes.ok ? ((await targetRes.json() as any[])[0]) : null
    const targetName = targetProfile ? `${targetProfile.nama_lengkap} (${targetProfile.email}, Angkatan ${targetProfile.angkatan})` : profileId

    await supabaseRestRequest(
      `course_unlocks?course_id=eq.${encodeURIComponent(courseId)}&profile_id=eq.${encodeURIComponent(profileId)}`,
      env,
      { method: "DELETE" },
    )

    void logActivity({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: "MEMBER_UNASSIGN",
      details: `Mencabut akses khusus (unlock) kelas "${courseTitle}" dari ${targetName}.`,
      category: "MEMBER",
    })

    return Response.json({ ok: true })
  }

  return Response.json({ message: "type tidak dikenali." }, { status: 400 })
}
