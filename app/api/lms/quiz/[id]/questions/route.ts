import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * GET /api/lms/quiz/[id]/questions
 * Params: ?review=true (optional)
 *
 * Safe endpoint to get quiz questions:
 * 1. Sanitizes (strips the 'answer' field) during active quiz attempts.
 * 2. Handles question count limits, question shuffling, and options shuffling.
 * 3. Returns correct answers and student selections ONLY during reviews (if allowed).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: quizId } = await params
  const { searchParams } = new URL(request.url)
  const isReview = searchParams.get("review") === "true"

  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  // 1. Fetch student profile
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })
  const profiles = await profileResponse.json() as Array<{ id: string; role: string }>
  const profileId = profiles[0]?.id
  if (!profileId) return Response.json({ message: "Profile belum sinkron." }, { status: 404 })

  // 2. Fetch quiz config details
  const quizResponse = await supabaseRestRequest(
    `quizzes?select=*&id=eq.${quizId}&limit=1`,
    env,
  )
  if (!quizResponse.ok) return Response.json({ message: "Gagal memuat detail kuis." }, { status: 500 })
  const quizzes = await quizResponse.json() as Array<{
    id: string
    title: string
    is_locked: boolean
    is_hidden: boolean
    opened_at: string | null
    closed_at: string | null
    max_attempts: number
    min_score: number
    time_limit_minutes: number
    jumlah_soal_ditampilkan: number
    randomize_questions: boolean
    randomize_options: boolean
    allow_review: boolean
    show_correct_answers: boolean
  }>
  const quiz = quizzes[0]
  if (!quiz) return Response.json({ message: "Kuis tidak ditemukan." }, { status: 404 })

  // 3. Fetch student's attempt record
  const answerResponse = await supabaseRestRequest(
    `quiz_answers?select=*&quiz_id=eq.${quizId}&profile_id=eq.${profileId}&limit=1`,
    env,
  )
  interface StudentQuizAnswer {
    score: number
    attempts: number
    selected_answers: Record<string, string>
  }
  let studentAnswer: StudentQuizAnswer | null = null
  if (answerResponse.ok) {
    const answers = await answerResponse.json() as StudentQuizAnswer[]
    if (answers[0]) studentAnswer = answers[0]
  }

  // 4. Handle Quiz Review Flow
  if (isReview) {
    if (!studentAnswer || studentAnswer.attempts === 0) {
      return Response.json({ message: "Anda belum mengambil kuis ini." }, { status: 400 })
    }
    if (!quiz.allow_review) {
      return Response.json({ message: "Admin mematikan review pembahasan untuk kuis ini." }, { status: 403 })
    }

    // Fetch all questions with answers for review
    const questionsResponse = await supabaseRestRequest(
      `quiz_questions?select=*&quiz_id=eq.${quizId}&order=order_index.asc`,
      env,
    )
    if (!questionsResponse.ok) return Response.json({ message: "Gagal memuat pertanyaan." }, { status: 500 })
    const questions = await questionsResponse.json()

    return Response.json({
      ok: true,
      quiz,
      questions, // includes correct 'answer' field
      selected_answers: studentAnswer.selected_answers || {},
      show_correct_answers: quiz.show_correct_answers,
      score: studentAnswer.score,
      attempts: studentAnswer.attempts,
    })
  }

  // 5. Handle Active Quiz Flow
  // Check active rules
  if (quiz.is_locked) {
    return Response.json({ message: "Kuis ini sedang terkunci." }, { status: 403 })
  }
  const now = new Date()
  if (quiz.opened_at && new Date(quiz.opened_at) > now) {
    return Response.json({ message: "Kuis ini belum dibuka." }, { status: 403 })
  }
  if (quiz.closed_at && new Date(quiz.closed_at) < now) {
    return Response.json({ message: "Kuis ini telah berakhir/ditutup." }, { status: 403 })
  }

  // Check attempt limits
  if (studentAnswer && studentAnswer.attempts >= quiz.max_attempts) {
    return Response.json({ message: `Batas percobaan (${quiz.max_attempts} kali) telah habis.` }, { status: 403 })
  }

  // Fetch quiz questions
  const questionsResponse = await supabaseRestRequest(
    `quiz_questions?select=id,question,options,order_index,type&quiz_id=eq.${quizId}`,
    env,
  )
  if (!questionsResponse.ok) return Response.json({ message: "Gagal memuat pertanyaan." }, { status: 500 })
  let questions = await questionsResponse.json() as Array<{
    id: string
    question: string
    options: string[] | null
    order_index: number
    type?: string
  }>

  if (questions.length === 0) {
    return Response.json({ message: "Kuis ini belum memiliki pertanyaan." }, { status: 400 })
  }

  // A. Randomize Options
  if (quiz.randomize_options) {
    questions = questions.map((q) => ({
      ...q,
      options: q.options && Array.isArray(q.options) ? shuffleArray(q.options) : q.options,
    }))
  }

  // B. Randomize Questions Shuffling
  if (quiz.randomize_questions) {
    questions = shuffleArray(questions)
  } else {
    // Sort by order_index
    questions.sort((a, b) => a.order_index - b.order_index)
  }

  // C. Display Limit (Question Bank selection)
  if (quiz.jumlah_soal_ditampilkan > 0 && quiz.jumlah_soal_ditampilkan < questions.length) {
    questions = questions.slice(0, quiz.jumlah_soal_ditampilkan)
  }

  // Note: Correct answers are NOT selected in query (`select=id,question,options,order_index`)
  // so correct answers are 100% secure from inspection.

  return Response.json({
    ok: true,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      time_limit_minutes: quiz.time_limit_minutes,
      max_attempts: quiz.max_attempts,
      min_score: quiz.min_score,
      attempts_used: studentAnswer ? studentAnswer.attempts : 0,
    },
    questions,
  })
}
