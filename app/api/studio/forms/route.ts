import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET() {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ ok: false, message: env.message }, { status: 500 })
  }

  try {
    const formsRes = await supabaseRestRequest("forms?select=*,form_questions(*),form_responses(*)&order=created_at.desc", env)
    if (!formsRes.ok) {
      return Response.json({ ok: true, forms: [] })
    }

    const forms = await formsRes.json()
    if (!Array.isArray(forms)) {
      return Response.json({ ok: true, forms: [] })
    }

    // Process responses and questions
    const processedForms = forms.map((f) => {
      const questions = Array.isArray(f.form_questions)
        ? f.form_questions
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
            .map((q: { options: unknown }) => ({
              ...q,
              options: typeof q.options === "string" ? JSON.parse(q.options) : q.options || [],
            }))
        : []

      const responses = Array.isArray(f.form_responses)
        ? f.form_responses
            .sort((a: { submitted_at: string }, b: { submitted_at: string }) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
            .map((r: { answers: unknown }) => ({
              ...r,
              answers: typeof r.answers === "string" ? JSON.parse(r.answers) : r.answers || {},
            }))
        : []

      return {
        ...f,
        form_questions: questions,
        form_responses: responses,
        response_count: responses.length,
      }
    })

    return Response.json({ ok: true, forms: processedForms })
  } catch (err: unknown) {
    return Response.json({ ok: false, message: err instanceof Error ? err.message : "Gagal memuat data formulir Studio." }, { status: 500 })
  }
}
