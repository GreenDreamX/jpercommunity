"use client"

import React, { use, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import {
  ArrowLeft,
  Lock,
  FileText,
  Video,
  Edit3,
  Upload,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  FileDown,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Award,
  Layers,
} from "lucide-react"
import Link from "next/link"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ModuleSubmission = {
  id: string
  file_url: string
  file_name: string | null
  file_size: number | null
  submitted_at: string
}

type QuizAnswer = {
  id: string
  score: number | null
  submitted_at: string
  attempts: number
}

type Quiz = {
  id: string
  title: string
  user_answer: QuizAnswer | null
  opened_at: string | null
  closed_at: string | null
  max_attempts: number
  min_score: number
  time_limit_minutes: number
  is_locked: boolean
  allow_review?: boolean
  show_correct_answers?: boolean
  jumlah_soal_ditampilkan?: number
}

type WeekModule = {
  id: string
  course_week_id: string
  type: "file" | "video" | "notes" | "quiz" | "assignment"
  title: string
  content: Record<string, any>
  is_locked: boolean
  is_hidden: boolean
  order_index: number
  quiz?: Quiz | null
  user_answer?: QuizAnswer | null
  submission?: ModuleSubmission | null
}

type Assignment = {
  id: string
  title: string
  due_at: string | null
  submission: { id: string; file_url: string | null; submitted_at: string } | null
}

type CourseWeek = {
  id: string
  week_number: number
  title: string
  pdf_url: string | null
  youtube_url: string | null
  notes_markdown: string | null
  is_locked: boolean
  modules: WeekModule[]
  assignments: Assignment[]
  quizzes: Quiz[]
}

type Course = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_locked: boolean
}

type QuizQuestion = {
  id: string
  question: string
  options: string[] | null
  order_index: number
  type?: string
}

function getYoutubeEmbedUrl(url: string | null) {
  if (!url) return null
  let videoId = ""
  if (url.includes("youtube.com/watch")) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search)
      videoId = urlParams.get("v") || ""
    } catch {
      // not a valid URL
    }
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || ""
  } else if (url.includes("youtube.com/embed/")) {
    return url
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

// ─── Module Renderer Component for LMS ─────────────────────────

function LMSModuleCard({
  module,
  token,
  onRefresh,
}: {
  module: WeekModule
  token: string
  onRefresh: () => void
}) {
  // File upload state for assignments
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null)
  const [retaking, setRetaking] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

  // Quiz Review States
  const [showReview, setShowReview] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([])
  const [reviewSelectedAnswers, setReviewSelectedAnswers] = useState<Record<string, string>>({})
  const [loadingReview, setLoadingReview] = useState(false)

  const isOptionSelected = useCallback((qId: string, opt: string) => {
    const currentVal = answers[qId]
    if (!currentVal) return false
    try {
      const arr = JSON.parse(currentVal)
      if (Array.isArray(arr)) return arr.includes(opt)
    } catch {
      // ignore
    }
    return currentVal === opt
  }, [answers])

  const handleToggleMultipleSelect = useCallback((qId: string, opt: string) => {
    setAnswers((prev) => {
      const currentVal = prev[qId]
      let currentArr: string[] = []
      try {
        if (currentVal) {
          currentArr = JSON.parse(currentVal)
          if (!Array.isArray(currentArr)) currentArr = [currentVal]
        }
      } catch {
        currentArr = currentVal ? [currentVal] : []
      }

      const isSelected = currentArr.includes(opt)
      let nextArr: string[] = []
      if (isSelected) {
        nextArr = currentArr.filter(x => x !== opt)
      } else {
        nextArr = [...currentArr, opt]
      }

      return {
        ...prev,
        [qId]: JSON.stringify(nextArr)
      }
    })
  }, [])

  const quiz = module.quiz

  const fetchQuizReview = useCallback(async () => {
    if (!quiz) return
    setLoadingReview(true)
    try {
      const res = await fetch(`/api/lms/quiz/${quiz.id}/questions?review=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReviewQuestions(data.questions || [])
        setReviewSelectedAnswers(data.selected_answers || {})
        setShowReview(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReview(false)
    }
  }, [quiz, token])

  const fetchQuestions = useCallback(async (quizId: string) => {
    setLoadingQuestions(true)
    try {
      const res = await fetch(`/api/lms/quiz/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setQuizQuestions(data.questions || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingQuestions(false)
    }
  }, [token])

  useEffect(() => {
    if (module.type === "quiz" && quiz && (!module.user_answer || retaking)) {
      void fetchQuestions(quiz.id)
    }
  }, [module.type, quiz, module.user_answer, retaking, fetchQuestions])

  // Timer countdown if quiz has time limit
  useEffect(() => {
    if (module.type === "quiz" && quiz?.time_limit_minutes && quiz.time_limit_minutes > 0 && !module.user_answer && quizQuestions.length > 0) {
      setTimerSeconds(quiz.time_limit_minutes * 60)
    }
  }, [module.type, quiz, module.user_answer, quizQuestions])

  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerSeconds])

  // Student file upload submission handler
  const handleStudentUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "Ukuran file melebihi batas maksimum 5 MB." })
      return
    }
    setUploading(true)
    setUploadMsg(null)
    try {
      // 1. Upload to Vercel Blob via API
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "submissions")

      const uploadRes = await fetch("/api/lms/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!uploadRes.ok) {
        const errData = await uploadRes.json() as { message?: string }
        throw new Error(errData.message || "Gagal upload file.")
      }
      const blobData = await uploadRes.json() as { url: string; name: string; size: number }

      // 2. Submit record to module_submissions
      const subRes = await fetch(`/api/lms/modules/${module.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          file_url: blobData.url,
          file_name: blobData.name,
          file_size: blobData.size,
        }),
      })

      if (!subRes.ok) throw new Error("Gagal menyimpan data tugas.")

      setUploadMsg({ type: "success", text: "Tugas berhasil dikumpulkan!" })
      onRefresh()
    } catch (err: unknown) {
      setUploadMsg({ type: "error", text: err instanceof Error ? err.message : "Upload gagal." })
    } finally {
      setUploading(false)
    }
  }

  // Quiz submission
  const handleQuizSubmit = useCallback(async () => {
    if (!quiz) return
    setSubmittingQuiz(true)
    try {
      const res = await fetch(`/api/lms/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) throw new Error("Gagal mengirim jawaban.")
      const data = await res.json()
      setQuizResult({ score: data.score, correctCount: data.correctCount, totalQuestions: data.totalQuestions })
      setRetaking(false)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim kuis.")
    } finally {
      setSubmittingQuiz(false)
    }
  }, [quiz, token, answers, onRefresh])

  // Auto submit quiz when timer runs out
  useEffect(() => {
    if (timerSeconds === 0 && !module.user_answer && !submittingQuiz) {
      void handleQuizSubmit()
    }
  }, [timerSeconds, module.user_answer, submittingQuiz, handleQuizSubmit])

  if (module.is_locked) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-[#1C1B1A] space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-red-800">
          <Lock className="size-4 text-red-600" />
          {module.title || "Modul Terkunci"}
        </div>
        <p className="text-[11px] text-[#6B6862]">Modul ini dikunci oleh pembina/pengurus ekskul.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] p-5 space-y-4 shadow-none transition-all hover:border-[#2B3A55]/30">
      {/* Module Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DA]/60">
        <div className="flex items-center gap-2.5">
          {module.type === "file" && <FileText className="size-5 text-blue-600" />}
          {module.type === "video" && <Video className="size-5 text-red-600" />}
          {module.type === "notes" && <Edit3 className="size-5 text-emerald-600" />}
          {module.type === "quiz" && <HelpCircle className="size-5 text-amber-600" />}
          {module.type === "assignment" && <Upload className="size-5 text-purple-600" />}
          <h3 className="text-sm font-bold text-[#1C1B1A]">{module.title}</h3>
        </div>
        <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-[#E4E1DA]/40 text-[#2B3A55]">
          {module.type}
        </span>
      </div>

      {/* 1. FILE MODULE */}
      {module.type === "file" && (
        <div className="space-y-3">
          {module.content?.url ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E4E1DA] bg-[#E4E1DA]/20">
                <span className="text-xs text-[#1C1B1A] font-mono truncate max-w-sm">
                  📄 {module.content.filename || "Dokumen Materi PDF"}
                </span>
                <a
                  href={module.content.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors"
                >
                  <FileDown className="size-3.5" /> Unduh PDF
                </a>
              </div>
              {module.content.url.endsWith(".pdf") || module.content.url.includes("blob") ? (
                <iframe
                  src={module.content.url}
                  className="w-full h-[500px] border border-[#E4E1DA] rounded-lg bg-white"
                  title={module.title}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-[#6B6862] italic">Belum ada file terlampir.</p>
          )}
        </div>
      )}

      {/* 2. VIDEO MODULE */}
      {module.type === "video" && (
        <div className="space-y-2">
          {module.content?.url && getYoutubeEmbedUrl(module.content.url) ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#E4E1DA] bg-black">
              <iframe
                src={getYoutubeEmbedUrl(module.content.url)!}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={module.title}
              />
            </div>
          ) : (
            <p className="text-xs text-[#6B6862] italic">Belum ada video terlampir.</p>
          )}
        </div>
      )}

      {/* 3. NOTES MODULE */}
      {module.type === "notes" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-[#E4E1DA] bg-white p-4 text-xs leading-relaxed text-[#1C1B1A] prose prose-sm max-w-none prose-headings:font-bold prose-code:bg-[#E4E1DA]/40 prose-code:px-1 prose-code:rounded">
            {module.content?.markdown ? (
              <ReactMarkdown>{module.content.markdown}</ReactMarkdown>
            ) : (
              <span className="text-[#6B6862] italic">Belum ada catatan.</span>
            )}
          </div>
        </div>
      )}

      {/* 4. ASSIGNMENT MODULE */}
      {module.type === "assignment" && (
        <div className="space-y-4">
          {module.content?.description && (
            <div className="text-xs text-[#6B6862] bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
              <ReactMarkdown>{module.content.description}</ReactMarkdown>
            </div>
          )}

          {module.content?.due_at && (
            <div className="text-[11px] font-mono text-[#B23A2E] flex items-center gap-1.5">
              <CalendarClock className="size-3.5" /> Batas Pengumpulan: {new Date(module.content.due_at).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
            </div>
          )}

          {/* Submission status or upload form */}
          {module.submission ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-green-800">
                <CheckCircle className="size-4 text-green-600" />
                Tugas Sudah Dikumpulkan
              </div>
              <div className="text-xs text-[#6B6862] font-mono">
                File:{" "}
                <a href={module.submission.file_url} target="_blank" rel="noreferrer" className="underline text-[#2B3A55] font-semibold">
                  {module.submission.file_name || "Lihat File Pengumpulan"}
                </a>
              </div>
              <div className="text-[10px] text-[#6B6862] font-mono">
                Waktu submit: {new Date(module.submission.submitted_at).toLocaleString("id-ID")}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  {uploading ? "Mengunggah..." : "Unggah File Tugas (Max 5MB)"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleStudentUpload(f)
                    e.target.value = ""
                  }}
                />
              </div>

              {uploadMsg && (
                <div className={cn("text-xs font-medium flex items-center gap-1.5", uploadMsg.type === "success" ? "text-green-700" : "text-[#B23A2E]")}>
                  {uploadMsg.type === "success" ? <CheckCircle className="size-3.5" /> : <AlertCircle className="size-3.5" />}
                  {uploadMsg.text}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. QUIZ MODULE */}
      {module.type === "quiz" && (
        <div className="space-y-4">
          {!quiz ? (
            <p className="text-xs text-[#6B6862] italic">Belum ada kuis yang ditautkan ke modul ini.</p>
          ) : module.user_answer && !retaking ? (
            // Quiz completed view with Hanko Stamp
            <div className="rounded-lg border border-[#E4E1DA] p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1C1B1A]">{quiz.title}</h4>
                  <p className="text-[10px] text-[#6B6862] font-mono mt-0.5">
                    Diselesaikan pada: {new Date(module.user_answer.submitted_at).toLocaleString("id-ID")}
                  </p>
                </div>
                {/* Hanko stamp or Pending status */}
                {module.user_answer.score === null ? (
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                    Menunggu Koreksi
                  </span>
                ) : (module.user_answer.score ?? 0) >= (quiz.min_score ?? 70) ? (
                  <div className="relative flex items-center justify-center w-12 h-12 border border-dashed border-[#B23A2E]/30 rounded-full">
                    <div className="transform rotate-12 text-[11px] font-extrabold text-[#B23A2E] bg-white border-2 border-[#B23A2E] rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                      合格
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Perlu Mengulang
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-[#F5F3EE] border border-[#E4E1DA]">
                <div>
                  <div className="text-[11px] text-[#6B6862] font-semibold">Skor Akhir Kuis</div>
                  <div className="text-3xl font-mono font-bold text-[#2B3A55] mt-1">
                    {module.user_answer.score !== null ? (
                      <>{module.user_answer.score} <span className="text-xs font-normal text-[#6B6862]">/ 100</span></>
                    ) : (
                      <span className="text-sm font-semibold text-stone-500 font-sans">Menunggu Penilaian</span>
                    )}
                  </div>
                  <div className="text-[9px] text-[#6B6862] font-mono mt-0.5">Percobaan: {module.user_answer.attempts ?? 1} dari maks {quiz.max_attempts ?? 1}</div>
                </div>
                {(module.user_answer.attempts ?? 1) < (quiz.max_attempts ?? 1) && (
                  <Button
                    type="button"
                    onClick={() => {
                      setRetaking(true)
                      setAnswers({})
                      setQuizQuestions([])
                    }}
                    className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 text-xs font-semibold h-8 rounded-lg"
                  >
                    Kerjakan Ulang
                  </Button>
                )}
              </div>

              {quiz.allow_review !== false && (
                <div className="pt-2 border-t border-[#E4E1DA]/60">
                  {!showReview ? (
                    <Button
                      type="button"
                      disabled={loadingReview}
                      onClick={fetchQuizReview}
                      className="w-full bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#E4E1DA]/30 text-[#1C1B1A] text-xs font-bold h-9 rounded-lg shadow-none"
                    >
                      {loadingReview ? "Memuat Pembahasan..." : "Lihat Pembahasan & Kunci Jawaban"}
                    </Button>
                  ) : (
                    <div className="space-y-4 mt-3 pt-3 border-t border-[#E4E1DA] animate-in fade-in duration-200">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-xs font-bold text-[#1C1B1A]">Review Jawaban Anda</h5>
                        <button
                          onClick={() => setShowReview(false)}
                          className="text-stone-400 hover:text-stone-700 text-xs font-semibold"
                        >
                          Sembunyikan
                        </button>
                      </div>

                      {reviewQuestions.map((q, idx) => {
                        const qType = q.type || "multiple_choice"
                        const studentChoice = reviewSelectedAnswers[q.id]
                        
                        let isCorrect = false
                        let studentChoiceList: string[] = []
                        let correctList: string[] = []

                        if (qType === "multiple_select") {
                          try {
                            correctList = JSON.parse(q.answer) as string[]
                            studentChoiceList = typeof studentChoice === "string" && studentChoice.startsWith("[")
                              ? JSON.parse(studentChoice) as string[]
                              : (studentChoice ? [studentChoice] : [])
                            
                            const cSorted = [...correctList].map(x => x.trim().toLowerCase()).sort()
                            const sSorted = [...studentChoiceList].map(x => x.trim().toLowerCase()).sort()
                            isCorrect = JSON.stringify(cSorted) === JSON.stringify(sSorted)
                          } catch {
                            isCorrect = studentChoice?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                          }
                        } else {
                          isCorrect = studentChoice?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                        }
                        
                        return (
                          <div key={q.id} className="p-3.5 rounded-lg border border-[#E4E1DA]/80 bg-[#FAF9F6]/40 space-y-2 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#1C1B1A]">{idx + 1}.</span>
                              <div className="font-semibold text-[#1C1B1A]">{q.question}</div>
                            </div>

                            {qType === "short_answer" ? (
                              <div className="pl-4 space-y-1.5">
                                <div className="p-2 rounded border border-[#E4E1DA] bg-white text-stone-800 font-medium">
                                  {studentChoice || <span className="text-red-500 italic">Tidak menjawab</span>}
                                </div>
                                {quiz.show_correct_answers !== false && (
                                  <div className="text-[10px] text-emerald-700 font-bold font-mono bg-emerald-50 border border-emerald-100 p-1.5 rounded">
                                    ✓ Kunci Referensi: {q.answer}
                                  </div>
                                )}
                              </div>
                            ) : q.options && Array.isArray(q.options) && (
                              <div className="grid gap-1.5 pl-4">
                                {q.options.map((opt: string) => {
                                  const isSelected = qType === "multiple_select"
                                    ? studentChoiceList.includes(opt)
                                    : studentChoice === opt
                                  const isOptionCorrect = qType === "multiple_select"
                                    ? correctList.includes(opt)
                                    : opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                                  
                                  let optClass = "p-2 rounded border border-[#E4E1DA] text-stone-700 bg-white"
                                  if (quiz.show_correct_answers !== false) {
                                    if (isOptionCorrect) {
                                      optClass = "p-2 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                                    } else if (isSelected && !isOptionCorrect) {
                                      optClass = "p-2 rounded border border-red-300 bg-red-50 text-red-800 font-medium"
                                    }
                                  } else {
                                    if (isSelected) {
                                      optClass = "p-2 rounded border border-stone-600 bg-stone-100 text-stone-900 font-medium"
                                    }
                                  }

                                  return (
                                    <div key={opt} className={optClass}>
                                      {opt}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            <div className="pl-4 pt-1 flex items-center gap-1.5 text-[10px] font-mono">
                              <span className="text-[#6B6862]">Jawaban Anda:</span>
                              {qType === "short_answer" ? (
                                <span className="font-bold text-purple-700">
                                  Menunggu Koreksi Pengurus
                                </span>
                              ) : studentChoice ? (
                                <span className={isCorrect ? "text-emerald-700 font-bold" : "text-[#B23A2E] font-bold"}>
                                  {qType === "multiple_select" ? studentChoiceList.join(", ") : studentChoice} ({isCorrect ? "BENAR" : "SALAH"})
                                </span>
                              ) : (
                                <span className="text-[#B23A2E] font-bold">Tidak Dijawab (SALAH)</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Quiz taking form
            <div className="space-y-4">
              {/* Quiz details header & Timer */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#2B3A55]/5 border border-[#2B3A55]/20">
                <div className="text-xs text-[#2B3A55] font-semibold flex items-center gap-1.5">
                  <Award className="size-4" /> Batas Kelulusan: {quiz.min_score ?? 70} / 100
                </div>
                {timerSeconds !== null && (
                  <div className={cn("text-xs font-mono font-bold flex items-center gap-1 px-2.5 py-1 rounded-md border", timerSeconds < 60 ? "bg-red-50 border-red-300 text-red-700 animate-pulse" : "bg-white border-[#E4E1DA] text-[#1C1B1A]")}>
                    <Clock className="size-3.5" />
                    Timer: {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                  </div>
                )}
              </div>

              {loadingQuestions ? (
                <div className="text-xs font-mono text-[#6B6862] text-center py-4">Memuat soal kuis...</div>
              ) : quizQuestions.length === 0 ? (
                <p className="text-xs text-[#6B6862] italic">Belum ada pertanyaan pada kuis ini.</p>
              ) : (
                <div className="space-y-4">
                  {quizQuestions.map((q, idx) => {
                    const qType = q.type || "multiple_choice"
                    
                    return (
                      <div key={q.id} className="p-4 rounded-lg border border-[#E4E1DA] bg-white space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#1C1B1A]">{idx + 1}. {q.question}</p>
                          {qType === "multiple_select" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 w-fit shrink-0">
                              Pilih beberapa
                            </span>
                          )}
                          {qType === "short_answer" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 w-fit shrink-0">
                              Isian Singkat
                            </span>
                          )}
                        </div>

                        {qType === "short_answer" ? (
                          <Input
                            placeholder="Ketik jawaban singkat Anda di sini..."
                            value={answers[q.id] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A] focus:ring-1 focus:ring-[#2B3A55] font-semibold"
                          />
                        ) : q.options && (
                          <div className="grid gap-2">
                            {q.options.map((opt) => {
                              const isSelected = qType === "multiple_select"
                                ? isOptionSelected(q.id, opt)
                                : answers[q.id] === opt
                              
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    if (qType === "multiple_select") {
                                      handleToggleMultipleSelect(q.id, opt)
                                    } else {
                                      setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                    }
                                  }}
                                  className={cn(
                                    "text-left text-xs px-3.5 py-2.5 rounded-lg border transition-all font-medium",
                                    isSelected
                                      ? "bg-[#2B3A55]/10 border-[#2B3A55] text-[#2B3A55] font-bold"
                                      : "bg-[#FAF9F6] border-[#E4E1DA] text-[#1C1B1A] hover:border-[#2B3A55]/40"
                                  )}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {quizResult && (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-xs text-green-900 space-y-1">
                      <div className="font-bold">Hasil Kuis: Skor {quizResult.score} / 100</div>
                      <div>Benar {quizResult.correctCount} dari {quizResult.totalQuestions} soal.</div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={submittingQuiz || Object.keys(answers).length < quizQuestions.length}
                      className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 text-xs font-semibold px-5 h-9 rounded-lg"
                    >
                      {submittingQuiz ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                      {submittingQuiz ? "Mengirim..." : "Kirim Jawaban Kuis"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Course Detail Page ──────────────────────────────────

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.id
  const router = useRouter()

  const { user, loading: authLoading } = useFirebaseUser()
  const [token, setToken] = useState<string | null>(null)

  const [course, setCourse] = useState<Course | null>(null)
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active open week accordion state (supports multi-open or active selection)
  const [openWeekId, setOpenWeekId] = useState<string | null>(null)

  const fetchCourseData = useCallback(async (firebaseToken: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/lms/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal memuat detail kelas.")
      }
      const data = await res.json()
      setCourse(data.course)

      const weeksData: CourseWeek[] = data.weeks ?? []
      setWeeks(weeksData)

      if (weeksData.length > 0) {
        const firstUnlocked = weeksData.find((w) => !w.is_locked)
        setOpenWeekId(firstUnlocked?.id ?? weeksData[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }

    user.getIdToken().then((t) => {
      setToken(t)
      void fetchCourseData(t)
    })
  }, [authLoading, user, router, fetchCourseData])

  if (authLoading || loading) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-12 text-[#1C1B1A]">
        <div className="mx-auto w-full max-w-4xl text-center space-y-3 font-mono text-xs text-[#6B6862]">
          <Loader2 className="size-6 animate-spin mx-auto text-[#2B3A55]" />
          Memuat kelas dan silabus...
        </div>
      </main>
    )
  }

  if (error || !course) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-12 text-[#1C1B1A]">
        <div className="mx-auto w-full max-w-md text-center space-y-4 p-6 border border-[#E4E1DA] rounded-xl bg-[#FAF9F6]">
          <AlertCircle className="size-8 text-[#B23A2E] mx-auto" />
          <div className="text-sm font-semibold text-[#B23A2E]">{error ?? "Kelas tidak ditemukan."}</div>
          <Link href="/lms" className={cn(buttonVariants({ variant: "outline" }), "rounded-lg border-[#E4E1DA] text-xs")}>
            Kembali ke Dashboard LMS
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] pb-16">
      {/* Navigation Bar */}
      <div className="border-b border-[#E4E1DA] bg-[#FAF9F6] px-6 py-4 md:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
          <Link
            href="/lms"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "rounded-lg border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A]"
            )}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#1C1B1A]">{course.title}</h1>
            <p className="text-[11px] text-[#6B6862] flex items-center gap-1.5 mt-0.5">
              <Layers className="size-3 text-[#2B3A55]" /> LMS JPER Community • {weeks.length} Pertemuan Sesi
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-8 lg:px-10 space-y-6">
        {/* Course Banner Card */}
        {course.image_url && (
          <div className="rounded-xl overflow-hidden border border-[#E4E1DA] aspect-[21/6] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        {course.description && (
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl p-5">
            <p className="text-xs text-[#6B6862] leading-relaxed">{course.description}</p>
          </Card>
        )}

        {/* Modular Accordion / Sidebar Sesi Pertemuan */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
            <Layers className="size-4 text-[#2B3A55]" /> Silabus & Modul Pembelajaran
          </h2>

          {weeks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E4E1DA] rounded-xl text-xs text-[#6B6862] italic bg-[#FAF9F6]">
              Belum ada materi atau pertemuan yang dirilis untuk kelas ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
              {/* Left Column / Sidebar (desktop only) */}
              <div className="hidden md:flex flex-col gap-2 sticky top-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
                {weeks.map((week) => {
                  const isActive = openWeekId === week.id
                  return (
                    <button
                      key={week.id}
                      disabled={week.is_locked}
                      onClick={() => setOpenWeekId(week.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all w-full select-none",
                        week.is_locked
                          ? "opacity-50 bg-[#E4E1DA]/25 border-[#E4E1DA] cursor-not-allowed"
                          : isActive
                          ? "border-[#2B3A55] bg-[#2B3A55]/5 text-[#2B3A55] font-semibold shadow-xs"
                          : "border-[#E4E1DA] hover:border-[#2B3A55]/40 text-[#1C1B1A] bg-[#FAF9F6]"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold font-mono shrink-0 transition-colors",
                        isActive ? "bg-[#2B3A55] text-white" : "bg-[#2B3A55]/10 text-[#2B3A55]"
                      )}>
                        {week.week_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{week.title}</div>
                        <div className="text-[9px] text-[#6B6862] font-mono mt-0.5">
                          {week.is_locked ? "Terkunci" : `${week.modules?.length ?? 0} modul`}
                        </div>
                      </div>
                      {week.is_locked && <Lock className="size-3 text-red-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Right Column / Content (desktop only) */}
              <div className="hidden md:block space-y-4">
                {(() => {
                  const activeWeek = weeks.find((w) => w.id === openWeekId)
                  if (!activeWeek) {
                    return (
                      <div className="text-center py-12 border border-dashed border-[#E4E1DA] rounded-xl text-xs text-[#6B6862] italic bg-[#FAF9F6]">
                        Pilih pertemuan dari sidebar di kiri untuk melihat modul.
                      </div>
                    )
                  }
                  const moduleCount = activeWeek.modules?.length ?? 0
                  return (
                    <div className="space-y-4">
                      <div className="border border-[#E4E1DA] bg-[#F5F3EE] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-[#2B3A55] bg-[#2B3A55]/10 px-2 py-0.5 rounded-full">
                            Pertemuan {activeWeek.week_number}
                          </span>
                          <h2 className="text-sm font-bold text-[#1C1B1A] mt-1.5">{activeWeek.title}</h2>
                        </div>
                        <span className="text-xs text-[#6B6862] font-mono">{moduleCount} modul aktif</span>
                      </div>

                      <div className="space-y-4">
                        {activeWeek.modules && activeWeek.modules.length > 0 ? (
                          activeWeek.modules.map((m) => (
                            <LMSModuleCard
                              key={m.id}
                              module={m}
                              token={token!}
                              onRefresh={() => void fetchCourseData(token!)}
                            />
                          ))
                        ) : (
                          // Fallback view for legacy non-modular weeks if any
                          <div className="space-y-4">
                            {activeWeek.pdf_url && (
                              <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#1C1B1A]">📄 Dokumen PDF Materi</span>
                                  <a href={activeWeek.pdf_url} target="_blank" rel="noreferrer" className="text-xs underline text-[#2B3A55]">
                                    Unduh File
                                  </a>
                                </div>
                                <iframe src={activeWeek.pdf_url} className="w-full h-[400px] rounded border border-[#E4E1DA]" title="Materi PDF" />
                              </div>
                            )}

                            {activeWeek.youtube_url && getYoutubeEmbedUrl(activeWeek.youtube_url) && (
                              <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-2">
                                <span className="text-xs font-bold text-[#1C1B1A]">🎬 Video Penjelasan</span>
                                <div className="aspect-video w-full rounded overflow-hidden">
                                  <iframe src={getYoutubeEmbedUrl(activeWeek.youtube_url)!} className="w-full h-full" allowFullScreen title="Video" />
                                </div>
                              </div>
                            )}

                            {activeWeek.notes_markdown && (
                              <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-2 text-xs">
                                <span className="font-bold text-[#1C1B1A]">📝 Rangkuman Catatan</span>
                                <div className="prose prose-sm"><ReactMarkdown>{activeWeek.notes_markdown}</ReactMarkdown></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Mobile View / Accordions stack */}
              <div className="md:hidden space-y-4 w-full">
                {weeks.map((week) => {
                  const isOpen = openWeekId === week.id
                  const moduleCount = week.modules?.length ?? 0

                  return (
                    <div
                      key={week.id}
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all bg-[#FAF9F6]",
                        week.is_locked
                          ? "opacity-60 border-[#E4E1DA]"
                          : isOpen
                          ? "border-[#2B3A55] shadow-sm"
                          : "border-[#E4E1DA] hover:border-[#2B3A55]/40"
                      )}
                    >
                      {/* Accordion Week Header Bar */}
                      <div
                        onClick={() => {
                          if (!week.is_locked) setOpenWeekId(isOpen ? null : week.id)
                        }}
                        className={cn(
                          "flex items-center justify-between p-4 cursor-pointer select-none transition-colors",
                          isOpen ? "bg-[#F5F3EE]" : "hover:bg-[#F5F3EE]",
                          week.is_locked && "cursor-not-allowed bg-[#E4E1DA]/20"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2B3A55]/10 text-xs font-bold font-mono text-[#2B3A55] shrink-0">
                            {week.week_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#1C1B1A] truncate">{week.title}</div>
                            <div className="text-[10px] text-[#6B6862] font-mono mt-0.5">
                              {week.is_locked ? "Terkunci" : `${moduleCount} modul aktif`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {week.is_locked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              <Lock className="size-3" /> Terkunci
                            </span>
                          ) : (
                            <div className="text-[#6B6862]">
                              {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Accordion Content Body: List of Modules */}
                      {isOpen && !week.is_locked && (
                        <div className="p-5 border-t border-[#E4E1DA] bg-[#F7F6F2] space-y-4">
                          {week.modules && week.modules.length > 0 ? (
                            week.modules.map((m) => (
                              <LMSModuleCard
                                key={m.id}
                                module={m}
                                token={token!}
                                onRefresh={() => void fetchCourseData(token!)}
                              />
                            ))
                          ) : (
                            // Fallback view for legacy non-modular weeks if any
                            <div className="space-y-4">
                              {week.pdf_url && (
                                <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#1C1B1A]">📄 Dokumen PDF Materi</span>
                                    <a href={week.pdf_url} target="_blank" rel="noreferrer" className="text-xs underline text-[#2B3A55]">
                                      Unduh File
                                    </a>
                                  </div>
                                  <iframe src={week.pdf_url} className="w-full h-[400px] rounded border border-[#E4E1DA]" title="Materi PDF" />
                                </div>
                              )}

                              {week.youtube_url && getYoutubeEmbedUrl(week.youtube_url) && (
                                <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-2">
                                  <span className="text-xs font-bold text-[#1C1B1A]">🎬 Video Penjelasan</span>
                                  <div className="aspect-video w-full rounded overflow-hidden">
                                    <iframe src={getYoutubeEmbedUrl(week.youtube_url)!} className="w-full h-full" allowFullScreen title="Video" />
                                  </div>
                                </div>
                              )}

                              {week.notes_markdown && (
                                <div className="p-4 rounded-xl border border-[#E4E1DA] bg-white space-y-2 text-xs">
                                  <span className="font-bold text-[#1C1B1A]">📝 Rangkuman Catatan</span>
                                  <div className="prose prose-sm"><ReactMarkdown>{week.notes_markdown}</ReactMarkdown></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
