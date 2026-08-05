import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: quizId } = await params

  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  // Get user profile first
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  }
  const profiles = await profileResponse.json() as Array<{ id: string }>
  const profileId = profiles[0]?.id
  if (!profileId) {
    return Response.json({ message: "Profile belum sinkron." }, { status: 404 })
  }

  // Fetch quiz details for restrictions
  const quizResponse = await supabaseRestRequest(
    `quizzes?select=opened_at,closed_at,max_attempts,min_score,is_locked&id=eq.${quizId}&limit=1`,
    env,
  )
  if (!quizResponse.ok) {
    return Response.json({ message: "Gagal memuat detail kuis." }, { status: 500 })
  }
  const quizzes = await quizResponse.json() as Array<{
    opened_at: string | null
    closed_at: string | null
    max_attempts: number
    min_score: number
    is_locked: boolean
  }>
  const quiz = quizzes[0]
  if (!quiz) {
    return Response.json({ message: "Kuis tidak ditemukan." }, { status: 404 })
  }

  // Validate lock state & time windows
  if (quiz.is_locked) {
    return Response.json({ message: "Kuis ini sedang terkunci." }, { status: 403 })
  }
  const now = new Date()
  if (quiz.opened_at && new Date(quiz.opened_at) > now) {
    return Response.json({ message: "Akses ditolak. Kuis ini belum dibuka." }, { status: 403 })
  }
  if (quiz.closed_at && new Date(quiz.closed_at) < now) {
    return Response.json({ message: "Batas waktu pengerjaan kuis ini telah habis (sudah ditutup)." }, { status: 403 })
  }

  // Fetch user current attempts
  const answerResponse = await supabaseRestRequest(
    `quiz_answers?select=attempts&quiz_id=eq.${quizId}&profile_id=eq.${profileId}&limit=1`,
    env,
  )
  let currentAttempts = 0
  if (answerResponse.ok) {
    const answers = await answerResponse.json() as Array<{ attempts: number }>
    if (answers[0]) {
      currentAttempts = answers[0].attempts
    }
  }

  if (currentAttempts >= quiz.max_attempts) {
    return Response.json(
      { message: `Batas percobaan (${quiz.max_attempts} kali) telah habis.` },
      { status: 403 },
    )
  }

  // Parse request body
  let body: { answers?: Record<string, string> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const userAnswers = body.answers ?? {}

  // Fetch all questions for this quiz
  const questionsResponse = await supabaseRestRequest(
    `quiz_questions?select=id,answer,type&quiz_id=eq.${quizId}`,
    env,
  )
  if (!questionsResponse.ok) {
    return Response.json({ message: "Gagal memuat pertanyaan kuis." }, { status: 500 })
  }

  const questions = await questionsResponse.json() as Array<{ id: string; answer: string; type?: string }>
  if (questions.length === 0) {
    return Response.json({ message: "Kuis ini tidak memiliki pertanyaan." }, { status: 400 })
  }

  // Calculate score
  let correctCount = 0
  let hasShortAnswer = false
  questions.forEach((q) => {
    const qType = q.type || "multiple_choice"
    if (qType === "short_answer") {
      hasShortAnswer = true
      return
    }

    const userAnswer = userAnswers[q.id]
    if (qType === "multiple_select") {
      try {
        const correctArr = JSON.parse(q.answer) as string[]
        const studentArr = Array.isArray(userAnswer)
          ? userAnswer
          : (typeof userAnswer === "string" && userAnswer.startsWith("[")
              ? JSON.parse(userAnswer) as string[]
              : [userAnswer].filter(Boolean))
        
        const cSorted = [...correctArr].map(x => String(x).trim().toLowerCase()).sort()
        const sSorted = [...studentArr].map(x => String(x).trim().toLowerCase()).sort()
        if (JSON.stringify(cSorted) === JSON.stringify(sSorted)) {
          correctCount++
        }
      } catch {
        if (userAnswer && String(userAnswer).trim().toLowerCase() === q.answer.trim().toLowerCase()) {
          correctCount++
        }
      }
    } else {
      const userAnswerStr = typeof userAnswer === "string" ? userAnswer.trim() : ""
      const correctAnswer = q.answer.trim()
      if (userAnswerStr && userAnswerStr.toLowerCase() === correctAnswer.toLowerCase()) {
        correctCount++
      }
    }
  })

  const score = hasShortAnswer ? null : Math.round((correctCount / questions.length) * 100)
  const isPassed = score !== null ? score >= quiz.min_score : false

  // Save to quiz_answers (upsert on_conflict)
  const insertResponse = await supabaseRestRequest(
    "quiz_answers?on_conflict=quiz_id,profile_id",
    env,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [{
        quiz_id: quizId,
        profile_id: profileId,
        score,
        attempts: currentAttempts + 1,
        selected_answers: userAnswers,
      }],
    },
  )

  if (!insertResponse.ok) {
    const errorDetails = await insertResponse.text()
    return Response.json(
      { message: "Gagal menyimpan hasil kuis.", details: errorDetails },
      { status: 500 },
    )
  }

  return Response.json({
    ok: true,
    score,
    correctCount,
    totalQuestions: questions.length,
    attemptsUsed: currentAttempts + 1,
    maxAttempts: quiz.max_attempts,
    minScore: quiz.min_score,
    isPassed,
    message: hasShortAnswer 
      ? "Jawaban kuis telah terkirim. Pengurus akan mengoreksi jawaban isian singkat Anda terlebih dahulu."
      : `Kuis berhasil diselesaikan dengan nilai ${score}. Kelulusan: ${isPassed ? "LULUS (合格)" : "TIDAK LULUS (不合格)"}`,
  })
}
