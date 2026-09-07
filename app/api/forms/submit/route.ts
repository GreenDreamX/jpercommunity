import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  try {
    const body = await request.json() as {
      form_id: string
      respondent_name?: string
      respondent_email?: string
      respondent_phone?: string
      answers: Record<string, unknown>
    }

    const { form_id, respondent_name, respondent_email, respondent_phone, answers } = body

    if (!form_id) {
      return Response.json({ message: "ID Formulir wajib disertakan." }, { status: 400 })
    }

    if (!answers || typeof answers !== "object") {
      return Response.json({ message: "Jawaban formulir wajib diisi." }, { status: 400 })
    }

    const insertRes = await supabaseRestRequest("form_responses", env, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        form_id,
        respondent_name: respondent_name || "Siswa / Anonim",
        respondent_email: respondent_email || null,
        respondent_phone: respondent_phone || null,
        answers: JSON.stringify(answers),
        submitted_at: new Date().toISOString(),
      },
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      if (errText.includes("PGRST205") || errText.includes("schema cache")) {
        return Response.json({ message: "Tabel form_responses belum dibuat di Supabase. Silakan jalankan file SQL migration 013_dynamic_forms.sql." }, { status: 500 })
      }
      return Response.json({ message: "Gagal menyimpan respon ke Supabase." }, { status: 500 })
    }

    // Log Activity in Supabase
    void supabaseRestRequest("activity_logs", env, {
      method: "POST",
      body: {
        actor_name: respondent_name || "Siswa / Member",
        actor_role: "student",
        action: "SUBMIT_FORM_RESPONSE",
        details: `Mengirim respon formulir (ID: ${form_id})`,
        category: "FORM_RESPONSE",
      },
    })

    return Response.json({ ok: true, message: "Evaluasi/Respon berhasil dikirim. Terima kasih atas masukan Anda! ✨" })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan." }, { status: 500 })
  }
}
