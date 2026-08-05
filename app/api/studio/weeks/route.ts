import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

type VerifyAdminResult =
  | { ok: false; status: number; message: string }
  | { ok: true; admin: { id: string; role: string; name: string; email: string | null } }

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }): Promise<VerifyAdminResult> {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role,nama_lengkap&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string; nama_lengkap?: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return {
    ok: true,
    admin: {
      id: profile.id,
      role: profile.role,
      name: profile.nama_lengkap || verified.user.email || "Admin",
      email: verified.user.email,
    },
  }
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get("course_id")

  if (!courseId) {
    return Response.json({ message: "Parameter course_id wajib disertakan." }, { status: 400 })
  }

  const response = await supabaseRestRequest(
    `course_weeks?select=*&course_id=eq.${encodeURIComponent(courseId)}&order=week_number.asc`,
    env,
  )

  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil daftar silabus mingguan." }, { status: 500 })
  }

  const data = await response.json()
  return Response.json({ weeks: data })
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const body = await request.json()
    const { course_id, week_number, title, pdf_url, youtube_url, notes_markdown, is_locked, is_hidden, assignment_title, assignment_due_at, assignment_description } = body

    if (!course_id || week_number === undefined || !title) {
      return Response.json({ message: "Parameter course_id, week_number, dan title wajib diisi." }, { status: 400 })
    }

    const insertResponse = await supabaseRestRequest(
      "course_weeks",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          course_id,
          week_number: parseInt(week_number.toString()),
          title,
          pdf_url: pdf_url || "",
          youtube_url: youtube_url || "",
          notes_markdown: notes_markdown || "",
          is_locked: is_locked === true,
          is_hidden: is_hidden === true,
          assignment_title: assignment_title || null,
          assignment_due_at: assignment_due_at || null,
          assignment_description: assignment_description || null,
        }],
      },
    )

    if (!insertResponse.ok) {
      const details = await insertResponse.text()
      return Response.json({ message: "Gagal menyimpan silabus mingguan baru.", details }, { status: 500 })
    }

    const data = await insertResponse.json()
    const { admin } = authCheck

    // Fetch course details
    const courseRes = await supabaseRestRequest(`courses?select=title&id=eq.${course_id}&limit=1`, env)
    const courseTitle = courseRes.ok ? ((await courseRes.json() as any[])[0]?.title || course_id) : course_id

    void logActivity({
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: "WEEK_CREATE",
      details: `Membuat Pertemuan ${week_number} ("${title}") pada kelas "${courseTitle}".`,
      category: "SILABUS",
    })

    return Response.json({ ok: true, week: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
    }

    const body = await request.json()
    const { week_number, title, pdf_url, youtube_url, notes_markdown, is_locked, is_hidden, assignment_title, assignment_due_at, assignment_description } = body

    const updateBody: Record<string, string | number | boolean | null> = {}
    if (week_number !== undefined) updateBody.week_number = parseInt(week_number.toString())
    if (title !== undefined) updateBody.title = title
    if (pdf_url !== undefined) updateBody.pdf_url = pdf_url
    if (youtube_url !== undefined) updateBody.youtube_url = youtube_url
    if (notes_markdown !== undefined) updateBody.notes_markdown = notes_markdown
    if (is_locked !== undefined) updateBody.is_locked = is_locked
    if (is_hidden !== undefined) updateBody.is_hidden = is_hidden
    if (assignment_title !== undefined) updateBody.assignment_title = assignment_title || null
    if (assignment_due_at !== undefined) updateBody.assignment_due_at = assignment_due_at || null
    if (assignment_description !== undefined) updateBody.assignment_description = assignment_description || null

    // Fetch original week details for logging
    const originalRes = await supabaseRestRequest(`course_weeks?select=title,week_number,course_id&id=eq.${id}&limit=1`, env)
    let original: any = null
    if (originalRes.ok) {
      original = (await originalRes.json() as any[])[0]
    }

    const updateResponse = await supabaseRestRequest(
      `course_weeks?id=eq.${encodeURIComponent(id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: updateBody,
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui silabus.", details }, { status: 500 })
    }

    const data = await updateResponse.json()
    const { admin } = authCheck

    if (original) {
      // Fetch course details
      const courseRes = await supabaseRestRequest(`courses?select=title&id=eq.${original.course_id}&limit=1`, env)
      const courseTitle = courseRes.ok ? ((await courseRes.json() as any[])[0]?.title || original.course_id) : original.course_id

      const changes: string[] = []
      if (title !== undefined && title !== original.title) changes.push(`judul menjadi "${title}"`)
      if (week_number !== undefined && parseInt(week_number.toString()) !== original.week_number) changes.push(`nomor pertemuan menjadi ${week_number}`)
      if (is_locked !== undefined) changes.push(is_locked ? "dikunci" : "dibuka kunci")
      if (is_hidden !== undefined) changes.push(is_hidden ? "disembunyikan" : "ditampilkan")

      const detailsText = changes.length > 0
        ? `Mengupdate Pertemuan ${original.week_number} ("${original.title}") pada kelas "${courseTitle}": ${changes.join(", ")}.`
        : `Mengupdate Pertemuan ${original.week_number} ("${original.title}") pada kelas "${courseTitle}".`

      void logActivity({
        actorId: admin.id,
        actorName: admin.name,
        actorRole: admin.role,
        action: "WEEK_UPDATE",
        details: detailsText,
        category: "SILABUS",
      })
    }

    return Response.json({ ok: true, week: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
  }

  const { admin } = authCheck

  // Fetch original week details for logging before deleting
  const originalRes = await supabaseRestRequest(`course_weeks?select=title,week_number,course_id&id=eq.${id}&limit=1`, env)
  let logText = `Menghapus Pertemuan ID ${id}`
  if (originalRes.ok) {
    const originalRows = await originalRes.json() as any[]
    if (originalRows && originalRows.length > 0) {
      const original = originalRows[0]
      const courseRes = await supabaseRestRequest(`courses?select=title&id=eq.${original.course_id}&limit=1`, env)
      const courseTitle = courseRes.ok ? ((await courseRes.json() as any[])[0]?.title || original.course_id) : original.course_id
      logText = `Menghapus Pertemuan ${original.week_number} ("${original.title}") dari kelas "${courseTitle}".`
    }
  }

  const deleteResponse = await supabaseRestRequest(
    `course_weeks?id=eq.${encodeURIComponent(id)}`,
    env,
    {
      method: "DELETE",
    },
  )

  if (!deleteResponse.ok) {
    return Response.json({ message: "Gagal menghapus materi pertemuan." }, { status: 500 })
  }

  void logActivity({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "WEEK_DELETE",
    details: logText,
    category: "SILABUS",
  })

  return Response.json({ ok: true })
}
