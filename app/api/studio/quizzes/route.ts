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
  const courseWeekId = searchParams.get("course_week_id")

  if (!courseWeekId) {
    return Response.json({ message: "Parameter course_week_id wajib disertakan." }, { status: 400 })
  }

  // Fetch quiz
  const quizRes = await supabaseRestRequest(
    `quizzes?select=*&course_week_id=eq.${encodeURIComponent(courseWeekId)}&limit=1`,
    env,
  )

  if (!quizRes.ok) {
    return Response.json({ message: "Gagal mengambil data kuis." }, { status: 500 })
  }

  const quizRows = (await quizRes.json()) as Array<{ id: string; title: string; is_locked: boolean; is_hidden: boolean }>
  const quiz = quizRows[0]

  if (!quiz) {
    return Response.json({ quiz: null })
  }

  // Fetch questions
  const questionsRes = await supabaseRestRequest(
    `quiz_questions?select=*&quiz_id=eq.${quiz.id}&order=order_index.asc`,
    env,
  )

  const questions = questionsRes.ok ? await questionsRes.json() : []

  return Response.json({ quiz, questions })
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
    const {
      course_week_id,
      title,
      is_locked,
      is_hidden,
      questions,
      opened_at,
      closed_at,
      max_attempts,
      min_score,
      time_limit_minutes,
      jumlah_soal_ditampilkan,
      randomize_questions,
      randomize_options,
      allow_review,
      show_correct_answers,
    } = body

    if (!course_week_id || !title) {
      return Response.json({ message: "Parameter course_week_id dan title wajib diisi." }, { status: 400 })
    }

    // Insert Quiz
    const quizResponse = await supabaseRestRequest(
      "quizzes",
      env,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [{
          course_week_id,
          title,
          is_locked: is_locked === true,
          is_hidden: is_hidden === true,
          opened_at: opened_at || null,
          closed_at: closed_at || null,
          max_attempts: max_attempts !== undefined ? parseInt(String(max_attempts)) : 1,
          min_score: min_score !== undefined ? parseInt(String(min_score)) : 70,
          time_limit_minutes: time_limit_minutes !== undefined ? parseInt(String(time_limit_minutes)) : 0,
          jumlah_soal_ditampilkan: jumlah_soal_ditampilkan !== undefined ? parseInt(String(jumlah_soal_ditampilkan)) : 0,
          randomize_questions: randomize_questions === true,
          randomize_options: randomize_options === true,
          allow_review: allow_review !== false,
          show_correct_answers: show_correct_answers !== false,
        }],
      },
    )

    if (!quizResponse.ok) {
      const details = await quizResponse.text()
      return Response.json({ message: "Gagal membuat kuis baru.", details }, { status: 500 })
    }

    const quizData = await quizResponse.json()
    const quiz = quizData[0]

    // Insert questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionsPayload = questions.map((q, idx) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        answer: q.answer,
        order_index: idx,
        type: q.type || "multiple_choice",
      }))

      const questionsResponse = await supabaseRestRequest(
        "quiz_questions",
        env,
        {
          method: "POST",
          body: questionsPayload,
        },
      )

      if (!questionsResponse.ok) {
        return Response.json({ message: "Kuis dibuat tetapi gagal memasukkan pertanyaan." }, { status: 500 })
      }
    }

    return Response.json({ ok: true, quiz })
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
    const {
      title,
      is_locked,
      is_hidden,
      questions,
      opened_at,
      closed_at,
      max_attempts,
      min_score,
      time_limit_minutes,
      jumlah_soal_ditampilkan,
      randomize_questions,
      randomize_options,
      allow_review,
      show_correct_answers,
    } = body

    const updateBody: Record<string, string | boolean | number | null> = {}
    if (title !== undefined) updateBody.title = title
    if (is_locked !== undefined) updateBody.is_locked = is_locked
    if (is_hidden !== undefined) updateBody.is_hidden = is_hidden
    if (opened_at !== undefined) updateBody.opened_at = opened_at || null
    if (closed_at !== undefined) updateBody.closed_at = closed_at || null
    if (max_attempts !== undefined) updateBody.max_attempts = parseInt(String(max_attempts))
    if (min_score !== undefined) updateBody.min_score = parseInt(String(min_score))
    if (time_limit_minutes !== undefined) updateBody.time_limit_minutes = parseInt(String(time_limit_minutes))
    if (jumlah_soal_ditampilkan !== undefined) updateBody.jumlah_soal_ditampilkan = parseInt(String(jumlah_soal_ditampilkan))
    if (randomize_questions !== undefined) updateBody.randomize_questions = randomize_questions === true
    if (randomize_options !== undefined) updateBody.randomize_options = randomize_options === true
    if (allow_review !== undefined) updateBody.allow_review = allow_review === true
    if (show_correct_answers !== undefined) updateBody.show_correct_answers = show_correct_answers === true

    if (Object.keys(updateBody).length > 0) {
      const quizResponse = await supabaseRestRequest(
        `quizzes?id=eq.${encodeURIComponent(id)}`,
        env,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: updateBody,
        },
      )

      if (!quizResponse.ok) {
        const details = await quizResponse.text()
        return Response.json({ message: "Gagal memperbarui kuis.", details }, { status: 500 })
      }
    }

    // Handle questions replacement
    if (questions && Array.isArray(questions)) {
      // 1. Delete existing
      await supabaseRestRequest(
        `quiz_questions?quiz_id=eq.${encodeURIComponent(id)}`,
        env,
        { method: "DELETE" },
      )

      // 2. Insert new
      if (questions.length > 0) {
        const questionsPayload = questions.map((q, idx) => ({
          quiz_id: id,
          question: q.question,
          options: q.options,
          answer: q.answer,
          order_index: idx,
          type: q.type || "multiple_choice",
        }))

        const questionsResponse = await supabaseRestRequest(
          "quiz_questions",
          env,
          {
            method: "POST",
            body: questionsPayload,
          },
        )

        if (!questionsResponse.ok) {
          return Response.json({ message: "Kuis berhasil diperbarui, tetapi gagal memperbarui pertanyaan." }, { status: 500 })
        }
      }
    }

    return Response.json({ ok: true })
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
    `quizzes?id=eq.${encodeURIComponent(id)}`,
    env,
    { method: "DELETE" },
  )

  if (!deleteResponse.ok) {
    return Response.json({ message: "Gagal menghapus kuis." }, { status: 500 })
  }

  return Response.json({ ok: true })
}
