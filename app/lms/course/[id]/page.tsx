"use client"

import React, { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  CalendarClock
} from "lucide-react"
import Link from "next/link"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Submission = {
  id: string
  file_url: string | null
  submitted_at: string
}

type Assignment = {
  id: string
  title: string
  due_at: string | null
  submission: Submission | null
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
  is_locked: boolean
}

type CourseWeek = {
  id: string
  week_number: number
  title: string
  pdf_url: string | null
  youtube_url: string | null
  notes_markdown: string | null
  is_locked: boolean
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
}

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

  // Active state
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<"materi" | "video" | "catatan" | "tugas" | "kuis">("materi")

  // Private Student Notes (localStorage autosave)
  const [studentNotes, setStudentNotes] = useState("")
  const [notesSaveStatus, setNotesSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const notesSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Assignment upload forms
  const [assignmentUrls, setAssignmentUrls] = useState<Record<string, string>>({})
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<Record<string, { type: "success" | "error"; text: string }>>({})

  // Quiz states
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuizQuestions, setLoadingQuizQuestions] = useState(false)
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({})
  const [submittingQuizId, setSubmittingQuizId] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null)
  const [retakingQuizIds, setRetakingQuizIds] = useState<Record<string, boolean>>({})

  // Fetch course and week details
  const fetchCourseData = useCallback(async (firebaseToken: string) => {
    await Promise.resolve()
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
      
      const weeksData = data.weeks ?? []
      setWeeks(weeksData)

      if (weeksData.length > 0) {
        // Set first unlocked week as active
        const firstUnlocked = weeksData.find((w: CourseWeek) => !w.is_locked)
        setActiveWeekId(firstUnlocked?.id ?? weeksData[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }, [courseId])

  // Fetch quiz questions
  const fetchQuizQuestions = useCallback(async (quizId: string) => {
    if (!token) return
    await Promise.resolve()
    try {
      setLoadingQuizQuestions(true)
      setQuizResult(null)
      setSelectedQuizAnswers({})
      
      const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ufehqkmxqcqcmwkftqqf.supabase.co"
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_ADqd8LmH-1H_WlHoTbAZkg_uVe6tUwE"
      
      const res = await fetch(`${envUrl}/rest/v1/quiz_questions?quiz_id=eq.${quizId}&order=order_index.asc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setActiveQuizQuestions(data)
      }
    } catch (err) {
      console.error("Gagal mengambil soal kuis", err)
    } finally {
      setLoadingQuizQuestions(false)
    }
  }, [token])

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

  // Get active week details
  const activeWeek = weeks.find((w) => w.id === activeWeekId)

  // Load private student notes when active week changes
  useEffect(() => {
    if (activeWeekId) {
      const saved = localStorage.getItem(`jper_notes_${activeWeekId}`) || ""
      setStudentNotes(saved)
      setNotesSaveStatus("idle")
      
      // If quiz exists on active week, fetch its questions if not taken yet
      const activeW = weeks.find((w) => w.id === activeWeekId)
      const quiz = activeW?.quizzes?.[0]
      if (quiz && !quiz.user_answer && token) {
        void fetchQuizQuestions(quiz.id)
      } else {
        setQuizResult(null)
        setActiveQuizQuestions([])
      }
    }
  }, [activeWeekId, token, weeks, fetchQuizQuestions])

  // Handle student notes auto-save
  const handleNotesChange = (val: string) => {
    setStudentNotes(val)
    setNotesSaveStatus("saving")

    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current)
    }

    notesSaveTimeoutRef.current = setTimeout(() => {
      if (activeWeekId) {
        localStorage.setItem(`jper_notes_${activeWeekId}`, val)
        setNotesSaveStatus("saved")
        setTimeout(() => setNotesSaveStatus("idle"), 1500)
      }
    }, 1000)
  };

  // Convert youtube links to embed format
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null
    let videoId = ""
    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(new URL(url).search)
      videoId = urlParams.get("v") || ""
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || ""
    } else if (url.includes("youtube.com/embed/")) {
      return url
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  // Handle assignment submission
  const handleAssignmentSubmit = async (assignmentId: string) => {
    const url = assignmentUrls[assignmentId]
    if (!url || !url.trim() || !token) return

    setSubmittingAssignmentId(assignmentId)
    setSubmitMessage((prev) => ({ ...prev, [assignmentId]: { type: "success", text: "" } }))

    try {
      const res = await fetch(`/api/lms/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_url: url.trim() }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.message ?? "Gagal mengumpulkan tugas.")
      }

      setSubmitMessage((prev) => ({
        ...prev,
        [assignmentId]: { type: "success", text: "Tugas berhasil dikumpulkan!" },
      }))

      // Reload course data to update UI
      await fetchCourseData(token)
    } catch (err: unknown) {
      setSubmitMessage((prev) => ({
        ...prev,
        [assignmentId]: { type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." },
      }))
    } finally {
      setSubmittingAssignmentId(null)
    }
  }

  // Handle quiz submission
  const handleQuizSubmit = async (quizId: string) => {
    if (Object.keys(selectedQuizAnswers).length === 0 || !token) return

    setSubmittingQuizId(quizId)
    try {
      const res = await fetch(`/api/lms/quiz/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: selectedQuizAnswers }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.message ?? "Gagal mengirim jawaban kuis.")
      }

      setQuizResult({
        score: payload.score,
        correctCount: payload.correctCount,
        totalQuestions: payload.totalQuestions,
      })

      // Reset retaking state for this quiz
      setRetakingQuizIds((prev) => ({ ...prev, [quizId]: false }))

      // Reload course data to update state
      await fetchCourseData(token)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memproses kuis.")
    } finally {
      setSubmittingQuizId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-10 text-[#1C1B1A] md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-sm font-mono text-[#6B6862]">
          Memuat kelas...
        </div>
      </main>
    )
  }

  if (error || !course) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-10 text-[#1C1B1A] md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-center space-y-4">
          <div className="text-sm text-[#B23A2E]">{error ?? "Kelas tidak ditemukan."}</div>
          <Link href="/lms" className={cn(buttonVariants({ variant: "outline" }), "rounded-lg border-[#E4E1DA]")}>
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A]">
      {/* Top Navigation Header */}
      <div className="border-b border-[#E4E1DA] bg-[#FAF9F6] px-6 py-4 md:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
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
            <h1 className="text-lg font-bold tracking-tight">{course.title}</h1>
            <p className="text-[10px] text-[#6B6862]">LMS Siswa • Silabus Pertemuan Mingguan</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 md:grid-cols-[250px_1fr] md:px-8 lg:px-10">
        {/* Left Sidebar: Week Selector */}
        <aside className="space-y-4">
          <div className="text-xs font-mono tracking-wider uppercase text-[#6B6862] font-semibold px-2">
            DAFTAR PERTEMUAN
          </div>
          <div className="flex flex-col gap-1.5">
            {weeks.map((week) => {
              const isActive = week.id === activeWeekId
              return (
                <button
                  key={week.id}
                  onClick={() => {
                    if (!week.is_locked) {
                      setActiveWeekId(week.id)
                    }
                  }}
                  disabled={week.is_locked}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors border border-transparent w-full",
                    isActive
                      ? "bg-[#2B3A55] text-[#FAF9F6]"
                      : "bg-[#FAF9F6]/40 hover:bg-[#E4E1DA]/30 text-[#1C1B1A] border-[#E4E1DA]/40",
                    week.is_locked && "opacity-50 cursor-not-allowed bg-black/5 text-[#6B6862]"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10px] opacity-85">Minggu {week.week_number}</span>
                    <span className="font-semibold truncate max-w-[170px]">{week.title}</span>
                  </div>
                  {week.is_locked && <Lock className="size-3.5 stroke-[2] shrink-0" />}
                </button>
              )
            })}

            {weeks.length === 0 && (
              <div className="text-xs text-[#6B6862] italic px-2 py-4">Belum ada silabus dirilis.</div>
            )}
          </div>
        </aside>

        {/* Right Area: Week Contents */}
        <section className="min-w-0 space-y-6">
          {activeWeek ? (
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg overflow-hidden">
              <CardHeader className="border-b border-[#E4E1DA] bg-[#FAF9F6] p-6">
                <div className="font-mono text-xs text-[#2B3A55] font-bold">
                  PERTEMUAN MINGGU KE-{activeWeek.week_number}
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-[#1C1B1A]">
                  {activeWeek.title}
                </CardTitle>
              </CardHeader>

              {/* Sub navigation inside the active week */}
              <div className="flex border-b border-[#E4E1DA] bg-[#FAF9F6]/40 px-6 gap-6">
                <button
                  onClick={() => setActiveSubTab("materi")}
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 border-transparent text-[#6B6862] hover:text-[#1C1B1A] outline-none",
                    activeSubTab === "materi" && "border-[#2B3A55] text-[#2B3A55]"
                  )}
                >
                  <FileText className="size-4" />
                  Materi
                </button>
                <button
                  onClick={() => setActiveSubTab("video")}
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 border-transparent text-[#6B6862] hover:text-[#1C1B1A] outline-none",
                    activeSubTab === "video" && "border-[#2B3A55] text-[#2B3A55]"
                  )}
                >
                  <Video className="size-4" />
                  Video
                </button>
                <button
                  onClick={() => setActiveSubTab("catatan")}
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 border-transparent text-[#6B6862] hover:text-[#1C1B1A] outline-none",
                    activeSubTab === "catatan" && "border-[#2B3A55] text-[#2B3A55]"
                  )}
                >
                  <Edit3 className="size-4" />
                  Catatan Belajar
                </button>
                <button
                  onClick={() => setActiveSubTab("tugas")}
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 border-transparent text-[#6B6862] hover:text-[#1C1B1A] outline-none",
                    activeSubTab === "tugas" && "border-[#2B3A55] text-[#2B3A55]"
                  )}
                >
                  <Upload className="size-4" />
                  Tugas
                </button>
                <button
                  onClick={() => setActiveSubTab("kuis")}
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-xs font-semibold border-b-2 border-transparent text-[#6B6862] hover:text-[#1C1B1A] outline-none",
                    activeSubTab === "kuis" && "border-[#2B3A55] text-[#2B3A55]"
                  )}
                >
                  <HelpCircle className="size-4" />
                  Kuis
                </button>
              </div>

              <CardContent className="p-6">
                {/* 1. MATERI PDF TAB */}
                {activeSubTab === "materi" && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#1C1B1A]">Materi Pembelajaran</h3>
                    {activeWeek.pdf_url ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-[#E4E1DA] bg-[#E4E1DA]/10">
                          <span className="text-xs text-[#6B6862] font-mono truncate max-w-sm">
                            {activeWeek.pdf_url}
                          </span>
                          <a
                            href={activeWeek.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "rounded-lg border-[#E4E1DA] text-xs flex items-center gap-1 bg-[#FAF9F6]"
                            )}
                          >
                            <FileDown className="size-4" /> Buka PDF
                          </a>
                        </div>
                        {/* Embed PDF Reader using standard iframe */}
                        <iframe
                          src={activeWeek.pdf_url}
                          className="w-full h-[600px] border border-[#E4E1DA] rounded-lg bg-white"
                          title="Dokumen Materi"
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center text-xs text-[#6B6862] italic">
                        Belum ada dokumen PDF materi yang dilampirkan untuk minggu ini.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. VIDEO TAB */}
                {activeSubTab === "video" && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#1C1B1A]">Video Penjelasan</h3>
                    {activeWeek.youtube_url ? (
                      (() => {
                        const embedUrl = getYoutubeEmbedUrl(activeWeek.youtube_url)
                        if (!embedUrl) {
                          return (
                            <div className="p-4 rounded-lg border border-[#E4E1DA] bg-yellow-500/5 text-xs text-[#6B6862]">
                              Link video tidak valid:{" "}
                              <a href={activeWeek.youtube_url} target="_blank" rel="noreferrer" className="underline text-[#2B3A55] break-all font-mono">
                                {activeWeek.youtube_url}
                              </a>
                            </div>
                          )
                        }
                        return (
                          <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#E4E1DA] bg-black">
                            <iframe
                              src={embedUrl}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Video Penjelasan"
                            />
                          </div>
                        )
                      })()
                    ) : (
                      <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center text-xs text-[#6B6862] italic">
                        Belum ada video penjelasan yang disematkan untuk minggu ini.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. NOTES TAB */}
                {activeSubTab === "catatan" && (
                  <div className="space-y-6">
                    {/* Official Notes from Admin */}
                    {activeWeek.notes_markdown && (
                      <div className="space-y-2 border-b border-[#E4E1DA] pb-6">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-[#6B6862] font-semibold">
                          Ringkasan Materi
                        </h4>
                        <div className="rounded-lg border border-[#E4E1DA] bg-[#E4E1DA]/10 p-4 text-xs leading-relaxed text-[#6B6862] font-mono whitespace-pre-wrap">
                          {activeWeek.notes_markdown}
                        </div>
                      </div>
                    )}

                    {/* Private notes editor for student */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-[#6B6862] font-semibold">
                          Catatan Belajar Pribadi
                        </h4>
                        {notesSaveStatus === "saving" && (
                          <span className="text-[10px] font-mono text-[#6B6862] animate-pulse">Menyimpan...</span>
                        )}
                        {notesSaveStatus === "saved" && (
                          <span className="text-[10px] font-mono text-green-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="size-3 text-green-700" /> Tersimpan secara lokal
                          </span>
                        )}
                      </div>
                      <textarea
                        value={studentNotes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Tulis rangkuman atau catatan Anda di sini untuk belajar mandiri... (Autosave ke browser)"
                        className="w-full h-80 rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] p-4 text-xs font-mono leading-relaxed outline-none focus:border-[#2B3A55] transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* 4. ASSIGNMENT TAB */}
                {activeSubTab === "tugas" && (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-[#1C1B1A]">Pengumpulan Tugas</h3>
                    {activeWeek.assignments.map((assignment) => {
                      const sub = assignment.submission
                      const urlInput = assignmentUrls[assignment.id] ?? ""
                      const msg = submitMessage[assignment.id]

                      return (
                        <div
                          key={assignment.id}
                          className="rounded-lg border border-[#E4E1DA] p-4 space-y-4"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-[#1C1B1A]">{assignment.title}</span>
                            {assignment.due_at && (
                              <span className="text-[10px] text-[#B23A2E] font-mono">
                                Batas Pengumpulan: {new Date(assignment.due_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
                              </span>
                            )}
                          </div>

                          {sub ? (
                            <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3.5 flex flex-col gap-2">
                              <div className="text-xs text-green-800 font-semibold flex items-center gap-1.5">
                                <CheckCircle className="size-4 text-green-700" />
                                Tugas Sudah Dikumpulkan
                              </div>
                              <div className="text-[10px] text-[#6B6862] font-mono">
                                File URL:{" "}
                                <a
                                  href={sub.file_url ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline text-[#2B3A55] break-all"
                                >
                                  {sub.file_url}
                                </a>
                              </div>
                              <div className="text-[9px] text-[#6B6862] font-mono">
                                Waktu submit: {new Date(sub.submitted_at).toLocaleString("id-ID")}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="text-xs text-[#6B6862]">
                                Masukkan link unggahan file tugas Anda (contoh: Google Drive, OneDrive, atau Link Document).
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="https://drive.google.com/..."
                                  value={urlInput}
                                  onChange={(e) =>
                                    setAssignmentUrls((prev) => ({
                                      ...prev,
                                      [assignment.id]: e.target.value,
                                    }))
                                  }
                                  disabled={submittingAssignmentId === assignment.id}
                                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                                />
                                <Button
                                  onClick={() => handleAssignmentSubmit(assignment.id)}
                                  disabled={!urlInput.trim() || submittingAssignmentId === assignment.id}
                                  className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 text-xs font-semibold px-4 h-9 rounded-lg border-none shadow-none"
                                >
                                  Kirim Tugas
                                </Button>
                              </div>

                              {msg && (
                                <div
                                  className={cn(
                                    "flex items-center gap-1.5 text-[10px] font-semibold mt-1",
                                    msg.type === "success" ? "text-green-700" : "text-[#B23A2E]"
                                  )}
                                >
                                  {msg.type === "success" ? (
                                    <CheckCircle className="size-3.5" />
                                  ) : (
                                    <AlertCircle className="size-3.5" />
                                  )}
                                  {msg.text}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {activeWeek.assignments.length === 0 && (
                      <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center text-xs text-[#6B6862] italic">
                        Tidak ada tugas terdaftar untuk pertemuan minggu ini.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. QUIZ TAB */}
                {activeSubTab === "kuis" && (
                  <div className="space-y-6">
                    <h3 className="text-base font-bold text-[#1C1B1A]">Kuis Pertemuan</h3>
                    {activeWeek.quizzes.map((quiz) => {
                      const ans = quiz.user_answer
                      const attemptsUsed = ans ? (ans.attempts ?? 1) : 0
                      const hasAttemptsLeft = attemptsUsed < (quiz.max_attempts ?? 1)
                      const hasTaken = ans !== null
                      const isRetaking = retakingQuizIds[quiz.id] === true

                      const now = new Date()
                      const isNotOpenYet = quiz.opened_at && new Date(quiz.opened_at) > now
                      const isClosed = quiz.closed_at && new Date(quiz.closed_at) < now

                      if (quiz.is_locked || isNotOpenYet) {
                        return (
                          <div
                            key={quiz.id}
                            className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center space-y-3"
                          >
                            <Lock className="size-8 mx-auto text-[#6B6862]" />
                            <div className="text-sm font-bold text-[#1C1B1A]">Kuis ini Terkunci / Belum Dibuka</div>
                            <p className="text-[11px] text-[#6B6862] max-w-sm mx-auto">
                              {quiz.opened_at 
                                ? `Kuis ini baru akan dibuka pada: ${new Date(quiz.opened_at).toLocaleString("id-ID")}`
                                : "Kuis untuk pertemuan ini belum dibuka oleh pengurus atau pembina."
                              }
                            </p>
                          </div>
                        )
                      }

                      if (isClosed) {
                        return (
                          <div
                            key={quiz.id}
                            className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center space-y-3"
                          >
                            <CalendarClock className="size-8 mx-auto text-[#B23A2E]" />
                            <div className="text-sm font-bold text-[#1C1B1A]">Batas Waktu Kuis Habis</div>
                            <p className="text-[11px] text-[#6B6862] max-w-sm mx-auto">
                              Kuis ini telah ditutup pada {quiz.closed_at ? new Date(quiz.closed_at).toLocaleString("id-ID") : "-"}. Batas waktu pengerjaan telah berakhir.
                            </p>
                            {hasTaken && (
                              <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] p-4 text-left max-w-xs mx-auto">
                                <div className="text-[10px] text-[#6B6862]">Nilai Terakhir Anda:</div>
                                <div className="text-2xl font-bold font-mono text-[#2B3A55]">{ans.score} / 100</div>
                                <div className="text-[9px] text-[#6B6862] mt-1 font-mono">Percobaan digunakan: {attemptsUsed}</div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      if (hasTaken && !isRetaking) {
                        const score = ans.score ?? 0
                        const minPassing = quiz.min_score ?? 70
                        const isPassed = score >= minPassing
                        return (
                          <div
                            key={quiz.id}
                            className="rounded-lg border border-[#E4E1DA] p-6 space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-[#1C1B1A]">{quiz.title}</span>
                                <div className="text-[10px] text-[#6B6862] mt-0.5 font-mono">
                                  Terakhir dikerjakan pada: {new Date(ans.submitted_at).toLocaleString("id-ID")}
                                </div>
                                <div className="text-[9px] text-[#6B6862] mt-0.5 font-mono">
                                  Percobaan digunakan: {attemptsUsed} / {quiz.max_attempts ?? 1}
                                </div>
                              </div>
                              
                              {/* Hanko Stamp for Passed Quiz */}
                              {isPassed ? (
                                <div className="relative flex items-center justify-center w-12 h-12 border border-dashed border-[#B23A2E]/25 rounded-full shrink-0">
                                  <div className="absolute transform rotate-[6deg] flex items-center justify-center w-10 h-10 border border-[#B23A2E] rounded-full text-[10px] font-bold text-[#B23A2E] bg-white">
                                    合格
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] font-bold text-[#B23A2E] bg-[#B23A2E]/10 border border-[#B23A2E]/20 px-2.5 py-1 rounded-lg">
                                  {hasAttemptsLeft ? "Mengulang" : "Tidak Lulus"}
                                </div>
                              )}
                            </div>

                            <div className="rounded-lg border border-[#E4E1DA] bg-[#E4E1DA]/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <div className="text-xs text-[#6B6862] font-semibold">Skor Terakhir Anda</div>
                                <div className="text-3xl font-mono font-bold text-[#2B3A55] mt-1">
                                  {score} <span className="text-xs font-normal text-[#6B6862]">/ 100</span>
                                </div>
                                <div className="text-[10px] text-[#6B6862] mt-1.5">
                                  {isPassed 
                                    ? `Selamat! Anda melampaui batas nilai kelulusan kuis (${minPassing}).` 
                                    : `Belum mencapai kelulusan minimum (${minPassing}).`
                                  }
                                </div>
                              </div>

                              {hasAttemptsLeft && (
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setRetakingQuizIds(prev => ({ ...prev, [quiz.id]: true }))
                                    void fetchQuizQuestions(quiz.id)
                                  }}
                                  className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 text-xs font-semibold px-4 py-2 rounded-lg border-none shadow-none"
                                >
                                  Kerjakan Ulang ({quiz.max_attempts - attemptsUsed} Sisa Percobaan)
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      }

                      // If kuis not taken (or retaking), render questions
                      return (
                        <div key={quiz.id} className="space-y-6">
                          <div className="p-3 border-l-4 border-[#2B3A55] bg-[#E4E1DA]/25 rounded-r-lg">
                            <span className="text-xs font-bold text-[#1C1B1A]">{quiz.title}</span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#6B6862] mt-1 font-mono">
                              <span>Batas Nilai Kelulusan: <strong className="text-[#2B3A55]">{quiz.min_score ?? 70}</strong></span>
                              {quiz.closed_at && <span>Batas Waktu: <strong>{new Date(quiz.closed_at).toLocaleString("id-ID")}</strong></span>}
                              <span>Percobaan: <strong>{attemptsUsed + 1} / {quiz.max_attempts ?? 1}</strong></span>
                            </div>
                          </div>

                          {loadingQuizQuestions ? (
                            <div className="text-xs text-[#6B6862] font-mono">Memuat pertanyaan kuis...</div>
                          ) : activeQuizQuestions.length === 0 ? (
                            <div className="text-xs text-[#6B6862] italic">Belum ada pertanyaan terdaftar untuk kuis ini.</div>
                          ) : (
                            <div className="space-y-6">
                              {activeQuizQuestions.map((q, index) => (
                                <div key={q.id} className="rounded-lg border border-[#E4E1DA] p-4 space-y-3 bg-[#FAF9F6]/50">
                                  <div className="text-xs font-bold text-[#1C1B1A]">
                                    {index + 1}. {q.question}
                                  </div>
                                  
                                  {q.options && q.options.length > 0 && (
                                    <div className="grid gap-2">
                                      {q.options.map((opt) => {
                                        const isSelected = selectedQuizAnswers[q.id] === opt
                                        return (
                                          <button
                                            key={opt}
                                            onClick={() =>
                                              setSelectedQuizAnswers((prev) => ({
                                                ...prev,
                                                [q.id]: opt,
                                              }))
                                            }
                                            className={cn(
                                              "text-left text-xs px-3 py-2 rounded-lg border transition-colors w-full font-medium",
                                              isSelected
                                                ? "bg-[#2B3A55]/10 border-[#2B3A55] text-[#2B3A55]"
                                                : "bg-[#FAF9F6] border-[#E4E1DA] text-[#6B6862] hover:bg-[#E4E1DA]/20"
                                            )}
                                          >
                                            {opt}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {quizResult && (
                                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                                  <div className="text-xs font-bold text-green-800">Kuis Selesai!</div>
                                  <div className="text-xl font-mono font-bold text-green-900">
                                    Skor: {quizResult.score} / 100
                                  </div>
                                  <div className="text-[10px] text-green-700">
                                    Berhasil menjawab {quizResult.correctCount} dari {quizResult.totalQuestions} soal dengan benar.
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-end pt-2">
                                <Button
                                  onClick={() => handleQuizSubmit(quiz.id)}
                                  disabled={
                                    submittingQuizId === quiz.id ||
                                    Object.keys(selectedQuizAnswers).length < activeQuizQuestions.length
                                  }
                                  className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 text-xs font-semibold px-6 py-2 rounded-lg border-none shadow-none"
                                >
                                  {submittingQuizId === quiz.id ? "Mengirim Jawaban..." : "Submit Jawaban Kuis"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {activeWeek.quizzes.length === 0 && (
                      <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-8 text-center text-xs text-[#6B6862] italic">
                        Tidak ada kuis terdaftar untuk pertemuan minggu ini.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-xs text-[#6B6862] italic py-8 text-center border border-dashed border-[#E4E1DA] rounded-lg">
              Silakan pilih pertemuan di menu sebelah kiri.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
