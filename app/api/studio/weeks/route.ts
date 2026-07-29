import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return { ok: true }
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
    const { course_id, week_number, title, pdf_url, youtube_url, notes_markdown, is_locked, is_hidden } = body

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
        }],
      },
    )

    if (!insertResponse.ok) {
      const details = await insertResponse.text()
      return Response.json({ message: "Gagal menyimpan silabus mingguan baru.", details }, { status: 500 })
    }

    const data = await insertResponse.json()
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
    const { week_number, title, pdf_url, youtube_url, notes_markdown, is_locked, is_hidden } = body

    const updateBody: Record<string, string | number | boolean | null> = {}
    if (week_number !== undefined) updateBody.week_number = parseInt(week_number.toString())
    if (title !== undefined) updateBody.title = title
    if (pdf_url !== undefined) updateBody.pdf_url = pdf_url
    if (youtube_url !== undefined) updateBody.youtube_url = youtube_url
    if (notes_markdown !== undefined) updateBody.notes_markdown = notes_markdown
    if (is_locked !== undefined) updateBody.is_locked = is_locked
    if (is_hidden !== undefined) updateBody.is_hidden = is_hidden

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

  return Response.json({ ok: true })
}
