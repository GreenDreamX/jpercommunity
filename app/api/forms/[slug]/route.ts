import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ ok: false, message: env.message }, { status: 500 })
  }

  const cleanSlug = slug.toLowerCase().trim()

  try {
    const res = await supabaseRestRequest(
      `forms?select=*,form_questions(*)&slug=eq.${encodeURIComponent(cleanSlug)}&is_published=eq.true&limit=1`,
      env
    )

    if (!res.ok) {
      return Response.json({ ok: false, message: "Formulir tidak ditemukan." }, { status: 404 })
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      return Response.json({ ok: false, message: "Formulir tidak ditemukan atau belum dipublikasikan." }, { status: 404 })
    }

    const form = data[0]
    // Sort questions by order_index
    if (Array.isArray(form.form_questions)) {
      form.form_questions.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      // Parse JSON options if string
      form.form_questions = form.form_questions.map((q: { options: unknown }) => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options) : q.options || [],
      }))
    }

    return Response.json({ ok: true, form })
  } catch (err: unknown) {
    return Response.json({ ok: false, message: err instanceof Error ? err.message : "Kesalahan server." }, { status: 500 })
  }
}
