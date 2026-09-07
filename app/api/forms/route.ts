import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export type FormQuestion = {
  id?: string
  form_id?: string
  question_text: string
  question_type: "short_text" | "long_text" | "dropdown" | "single_choice" | "rating" | "file_upload"
  options?: string[] | null
  placeholder?: string | null
  is_required: boolean
  order_index: number
}

export type DynamicForm = {
  id: string
  slug: string
  title: string
  description?: string | null
  is_published: boolean
  created_at?: string
  questions?: FormQuestion[]
}

export async function GET() {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ ok: false, message: env.message }, { status: 500 })
  }

  try {
    const res = await supabaseRestRequest("forms?select=*,form_questions(*)&is_published=eq.true&order=created_at.desc", env)
    if (!res.ok) {
      return Response.json({ ok: false, forms: [] })
    }
    const data = await res.json()
    return Response.json({ ok: true, forms: Array.isArray(data) ? data : [] })
  } catch (err: unknown) {
    return Response.json({ ok: false, message: err instanceof Error ? err.message : "Gagal memuat formulir." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  try {
    const body = await request.json() as {
      id?: string
      slug: string
      title: string
      description?: string
      is_published?: boolean
      questions?: Array<{
        id?: string
        question_text: string
        question_type: "short_text" | "long_text" | "dropdown" | "single_choice" | "rating" | "file_upload"
        options?: string[]
        placeholder?: string
        is_required?: boolean
        order_index?: number
      }>
    }

    const { id, slug, title, description, is_published = true, questions = [] } = body

    if (!slug || !title) {
      return Response.json({ message: "Slug dan Judul Form wajib diisi." }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "")

    let formId = id

    // Insert or update form
    if (formId) {
      const updateRes = await supabaseRestRequest(`forms?id=eq.${formId}`, env, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: {
          slug: cleanSlug,
          title,
          description: description || null,
          is_published,
          updated_at: new Date().toISOString(),
        },
      })
      if (!updateRes.ok) {
        return Response.json({ message: "Gagal memperbarui formulir." }, { status: 500 })
      }
    } else {
      const insertRes = await supabaseRestRequest("forms", env, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: {
          slug: cleanSlug,
          title,
          description: description || null,
          is_published,
        },
      })

      if (!insertRes.ok) {
        const errText = await insertRes.text()
        if (errText.includes("duplicate") || errText.includes("unique")) {
          return Response.json({ message: `Slug "/${cleanSlug}" sudah digunakan.` }, { status: 409 })
        }
        return Response.json({ message: "Gagal membuat formulir baru." }, { status: 500 })
      }

      const rows = await insertRes.json()
      if (Array.isArray(rows) && rows[0]) {
        formId = rows[0].id
      }
    }

    if (!formId) {
      return Response.json({ message: "Gagal memproses ID Formulir." }, { status: 500 })
    }

    // Delete existing questions and replace with new set
    await supabaseRestRequest(`form_questions?form_id=eq.${formId}`, env, { method: "DELETE" })

    if (questions.length > 0) {
      const formattedQuestions = questions.map((q, idx) => ({
        form_id: formId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: JSON.stringify(q.options || []),
        placeholder: q.placeholder || null,
        is_required: q.is_required !== undefined ? q.is_required : true,
        order_index: idx + 1,
      }))

      await supabaseRestRequest("form_questions", env, {
        method: "POST",
        body: formattedQuestions,
      })
    }

    return Response.json({ ok: true, form_id: formId, message: "Formulir berhasil disimpan." })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}
