import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

type VerifyAdminResult =
  | { ok: false; status: number; message: string }
  | { ok: true; admin: { id: string; role: string; name: string; email: string | null } }

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }): Promise<VerifyAdminResult> {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return { ok: false, status: verified.status, message: verified.message }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role,nama_lengkap&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) return { ok: false, status: 404, message: "Profile tidak ditemukan." }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string; nama_lengkap?: string }>
  const profile = profileRows[0]

  const ALLOWED_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus pengurus." }
  }

  return {
    ok: true,
    admin: {
      id: profile.id,
      role: profile.role,
      name: profile.nama_lengkap || verified.user.email || "Pengurus",
      email: verified.user.email,
    },
  }
}

type ModuleContent =
  | { url: string; filename: string; size?: number }           // file
  | { url: string; embed_url: string }                          // video
  | { markdown: string }                                        // notes
  | { quiz_id: string }                                         // quiz
  | { description: string; due_at: string | null; max_size_mb: number } // assignment
  | { deck_title?: string; cards: Array<{ word: string; kana?: string; romaji?: string; meaning: string; example?: string }> } // flashcard
  | { audio_url: string; filename?: string; duration_seconds?: number; transcript?: string; translation?: string } // audio
  | { pattern: string; jlpt_level?: string; meaning: string; formula?: string; examples?: Array<{ japanese: string; romaji?: string; meaning: string }> } // grammar
  | { url: string; platform?: string; button_text?: string; is_embed?: boolean; embed_height?: number } // external_link
  | { platform: string; meeting_url: string; start_time: string; end_time?: string; passcode?: string; notes?: string; recording_url?: string } // live_session

/**
 * GET /api/studio/modules?course_week_id=xxx
 * Returns all modules for a week, ordered by order_index.
 */
export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  const { searchParams } = new URL(request.url)
  const courseWeekId = searchParams.get("course_week_id")
  if (!courseWeekId) return Response.json({ message: "Parameter course_week_id wajib disertakan." }, { status: 400 })

  const res = await supabaseRestRequest(
    `week_modules?course_week_id=eq.${encodeURIComponent(courseWeekId)}&order=order_index.asc,created_at.asc`,
    env,
  )
  if (!res.ok) return Response.json({ message: "Gagal mengambil modul." }, { status: 500 })

  const modules = await res.json()
  return Response.json({ modules })
}

/**
 * POST /api/studio/modules
 * Create a new module for a week.
 * Body: { course_week_id, type, title, content, is_locked, is_hidden, order_index }
 */
export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  try {
    const body = await request.json() as {
      course_week_id: string
      type: "file" | "video" | "notes" | "quiz" | "assignment" | "flashcard" | "audio" | "grammar" | "external_link" | "live_session"
      title: string
      content: ModuleContent
      is_locked?: boolean
      is_hidden?: boolean
      order_index?: number
    }

    const { course_week_id, type, title, content, is_locked, is_hidden, order_index } = body

    if (!course_week_id || !type || !content) {
      return Response.json({ message: "course_week_id, type, dan content wajib diisi." }, { status: 400 })
    }

    const validTypes = [
      "file", "video", "notes", "quiz", "assignment",
      "flashcard", "audio", "grammar", "external_link", "live_session"
    ]
    if (!validTypes.includes(type)) {
      return Response.json({ message: `Tipe modul tidak valid: ${type}` }, { status: 400 })
    }

    const res = await supabaseRestRequest("week_modules", env, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: [{
        course_week_id,
        type,
        title: title || "",
        content,
        is_locked: is_locked === true,
        is_hidden: is_hidden === true,
        order_index: order_index ?? 0,
      }],
    })

    if (!res.ok) {
      const detail = await res.text()
      return Response.json({ message: "Gagal membuat modul.", detail }, { status: 500 })
    }

    const rows = await res.json() as unknown[]
    const { admin } = authCheck

    // Fetch week info for descriptive logging
    const weekRes = await supabaseRestRequest(
      `course_weeks?select=title,week_number,courses(title)&id=eq.${course_week_id}&limit=1`,
      env,
    )
    let weekInfo = `Pertemuan ID ${course_week_id}`
    if (weekRes.ok) {
      const weekRows = await weekRes.json() as any[]
      if (weekRows && weekRows.length > 0) {
        const week = weekRows[0]
        weekInfo = `Pertemuan ${week.week_number} (${week.title}) di kelas "${week.courses?.title || "Kelas"}"`
      }
    }

    void logActivity({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: "MODULE_CREATE",
      details: `Membuat modul ${type.toUpperCase()} baru "${title || ""}" pada ${weekInfo}.`,
      category: "SILABUS",
    })

    return Response.json({ ok: true, module: rows[0] }, { status: 201 })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}

/**
 * PATCH /api/studio/modules?id=xxx
 * Update a module (partial update).
 */
export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })

  try {
    const body = await request.json() as {
      title?: string
      content?: ModuleContent
      is_locked?: boolean
      is_hidden?: boolean
      order_index?: number
    }

    const updateBody: Record<string, unknown> = {}
    if (body.title !== undefined) updateBody.title = body.title
    if (body.content !== undefined) updateBody.content = body.content
    if (body.is_locked !== undefined) updateBody.is_locked = body.is_locked
    if (body.is_hidden !== undefined) updateBody.is_hidden = body.is_hidden
    if (body.order_index !== undefined) updateBody.order_index = body.order_index

    if (Object.keys(updateBody).length === 0) {
      return Response.json({ message: "Tidak ada perubahan yang dikirim." }, { status: 400 })
    }

    // Fetch original module details for logging
    const originalRes = await supabaseRestRequest(`week_modules?select=title,type,course_week_id&id=eq.${id}&limit=1`, env)
    let original: any = null
    if (originalRes.ok) {
      original = (await originalRes.json() as any[])[0]
    }

    const res = await supabaseRestRequest(
      `week_modules?id=eq.${encodeURIComponent(id)}`,
      env,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: updateBody },
    )

    if (!res.ok) {
      const detail = await res.text()
      return Response.json({ message: "Gagal mengupdate modul.", detail }, { status: 500 })
    }

    const { admin } = authCheck
    if (original) {
      // Fetch week details
      const weekRes = await supabaseRestRequest(
        `course_weeks?select=title,week_number,courses(title)&id=eq.${original.course_week_id}&limit=1`,
        env,
      )
      let weekInfo = `Pertemuan ID ${original.course_week_id}`
      if (weekRes.ok) {
        const weekRows = await weekRes.json() as any[]
        if (weekRows && weekRows.length > 0) {
          const week = weekRows[0]
          weekInfo = `Pertemuan ${week.week_number} (${week.title}) di kelas "${week.courses?.title || "Kelas"}"`
        }
      }

      // Build log details depending on fields changed
      const changes: string[] = []
      if (body.title !== undefined && body.title !== original.title) changes.push(`judul menjadi "${body.title}"`)
      if (body.is_locked !== undefined) changes.push(body.is_locked ? "dikunci" : "dibuka kunci")
      if (body.is_hidden !== undefined) changes.push(body.is_hidden ? "disembunyikan" : "ditampilkan")
      if (body.order_index !== undefined) changes.push(`urutan diubah menjadi ${body.order_index}`)

      const detailsText = changes.length > 0
        ? `Mengupdate modul ${original.type.toUpperCase()} "${body.title || original.title}": ${changes.join(", ")} pada ${weekInfo}.`
        : `Mengupdate modul ${original.type.toUpperCase()} "${body.title || original.title}" pada ${weekInfo}.`

      void logActivity({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: "MODULE_UPDATE",
        details: detailsText,
        category: "SILABUS",
      })
    }

    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}

/**
 * DELETE /api/studio/modules?id=xxx
 */
export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) return Response.json({ message: authCheck.message }, { status: authCheck.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })

  const { admin } = authCheck

  // Fetch original module details first before deleting
  const originalRes = await supabaseRestRequest(`week_modules?select=title,type,course_week_id&id=eq.${id}&limit=1`, env)
  let logText = `Menghapus modul ID ${id}`
  if (originalRes.ok) {
    const originalRows = await originalRes.json() as any[]
    if (originalRows && originalRows.length > 0) {
      const original = originalRows[0]
      // Fetch week details
      const weekRes = await supabaseRestRequest(
        `course_weeks?select=title,week_number,courses(title)&id=eq.${original.course_week_id}&limit=1`,
        env,
      )
      let weekInfo = `Pertemuan ID ${original.course_week_id}`
      if (weekRes.ok) {
        const weekRows = await weekRes.json() as any[]
        if (weekRows && weekRows.length > 0) {
          const week = weekRows[0]
          weekInfo = `Pertemuan ${week.week_number} (${week.title}) di kelas "${week.courses?.title || "Kelas"}"`
        }
      }
      logText = `Menghapus modul ${original.type.toUpperCase()} "${original.title}" dari ${weekInfo}.`
    }
  }

  await supabaseRestRequest(
    `week_modules?id=eq.${encodeURIComponent(id)}`,
    env,
    { method: "DELETE" },
  )

  void logActivity({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "MODULE_DELETE",
    details: logText,
    category: "SILABUS",
  })

  return Response.json({ ok: true })
}
