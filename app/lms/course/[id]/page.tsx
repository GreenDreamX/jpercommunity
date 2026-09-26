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
  Headphones,
  Sparkles,
  ExternalLink,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Volume2,
  Check,
  Calendar,
  Link2,
} from "lucide-react"
import Link from "next/link"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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

type ModuleType =
  | "file"
  | "video"
  | "notes"
  | "quiz"
  | "assignment"
  | "flashcard"
  | "audio"
  | "grammar"
  | "external_link"
  | "live_session"

type WeekModule = {
  id: string
  course_week_id: string
  type: ModuleType
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

// ─── Subcomponent: 3D Interactive Flashcard Viewer ───────────

function FlashcardViewer({ cards, deckTitle }: { cards: Array<{ word: string; kana?: string; romaji?: string; meaning: string; example?: string }>; deckTitle?: string }) {
  const [deck, setDeck] = useState(cards || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    setDeck(cards || [])
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards])

  if (!deck || deck.length === 0) {
    return <p className="text-xs text-[#6B6862] italic">Belum ada kartu flashcard pada set ini.</p>
  }

  const currentCard = deck[currentIndex]

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % deck.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length)
  }

  const handleShuffle = () => {
    setIsFlipped(false)
    const shuffled = [...deck].sort(() => Math.random() - 0.5)
    setDeck(shuffled)
    setCurrentIndex(0)
  }

  return (
    <div className="space-y-4 bg-[#F5F3EE] p-5 rounded-xl border border-[#E4E1DA]">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-[#1C1B1A]">{deckTitle || "Flashcard Kosakata"}</h4>
          <p className="text-[10px] text-[#6B6862] font-mono">Kartu {currentIndex + 1} dari {deck.length}</p>
        </div>
        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2B3A55] hover:underline bg-white px-2.5 py-1 rounded-lg border border-[#E4E1DA]"
        >
          <Shuffle className="size-3" /> Acak Dek
        </button>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped((v) => !v)}
        className="w-full min-h-[220px] p-6 rounded-xl border-2 border-[#2B3A55]/20 bg-white cursor-pointer select-none shadow-sm transition-all hover:border-[#2B3A55] hover:shadow-md flex flex-col justify-between items-center text-center relative overflow-hidden"
      >
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#6B6862] bg-[#F5F3EE] px-2 py-0.5 rounded-full border border-[#E4E1DA]">
          {isFlipped ? "Sisi Belakang (Arti & Contoh)" : "Sisi Depan (Klik/Tap untuk Membalik)"}
        </span>

        {!isFlipped ? (
          <div className="my-auto space-y-2">
            <div className="text-3xl font-extrabold text-[#1C1B1A] tracking-wide">{currentCard.word}</div>
            {currentCard.kana && (
              <div className="text-sm font-semibold text-[#2B3A55] font-mono">{currentCard.kana}</div>
            )}
            {currentCard.romaji && (
              <div className="text-xs text-[#6B6862] font-mono italic">[{currentCard.romaji}]</div>
            )}
          </div>
        ) : (
          <div className="my-auto space-y-3">
            <div className="text-lg font-bold text-[#2B3A55]">{currentCard.meaning}</div>
            {currentCard.example && (
              <div className="text-xs text-[#1C1B1A] bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E4E1DA] font-mono">
                &quot;{currentCard.example}&quot;
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] text-[#6B6862]/80 italic">
          💡 Klik di mana saja pada kartu untuk melihat {isFlipped ? "sisi depan" : "arti"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className="flex-1 py-2 rounded-lg border border-[#E4E1DA] bg-white text-xs font-semibold text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors"
        >
          ◄ Sebelumnya
        </button>
        <button
          type="button"
          onClick={() => setIsFlipped((v) => !v)}
          className="px-4 py-2 rounded-lg bg-[#2B3A55] text-white text-xs font-bold hover:bg-[#2B3A55]/90 transition-colors"
        >
          🔄 Balik Kartu
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-2 rounded-lg border border-[#E4E1DA] bg-white text-xs font-semibold text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors"
        >
          Selanjutnya ►
        </button>
      </div>
    </div>
  )
}

// ─── Subcomponent: Choukai Audio Player ──────────────────────

function AudioChoukaiPlayer({ audioUrl, transcript, translation }: { audioUrl: string; transcript?: string; translation?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [showTranscript, setShowTranscript] = useState(false)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      void audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (audioRef.current) audioRef.current.playbackRate = rate
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4 bg-[#F5F3EE] p-5 rounded-xl border border-[#E4E1DA]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Main Audio Player Card */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E4E1DA] shadow-xs">
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[#2B3A55] text-white flex items-center justify-center hover:bg-[#2B3A55]/90 transition-transform active:scale-95 shadow-md flex-shrink-0"
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B6862]">
            <span className="font-semibold text-[#1C1B1A] flex items-center gap-1">
              <Headphones className="size-3.5 text-[#2B3A55]" /> Audio Choukai
            </span>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const val = Number(e.target.value)
              setCurrentTime(val)
              if (audioRef.current) audioRef.current.currentTime = val
            }}
            className="w-full h-1.5 bg-[#E4E1DA] rounded-lg appearance-none cursor-pointer accent-[#2B3A55]"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          {[0.8, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                playbackRate === rate ? "bg-[#2B3A55] text-white" : "bg-[#F5F3EE] text-[#6B6862] hover:text-[#1C1B1A]"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Accordion */}
      {(transcript || translation) && (
        <div className="border border-[#E4E1DA] rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="w-full px-4 py-2.5 bg-[#FAF9F6] flex items-center justify-between text-xs font-bold text-[#1C1B1A] hover:bg-[#F5F3EE] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              📜 Transkrip & Terjemahan Percakapan
            </span>
            {showTranscript ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {showTranscript && (
            <div className="p-4 space-y-4 border-t border-[#E4E1DA] text-xs leading-relaxed">
              {transcript && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#2B3A55] uppercase">Jepang / Kana</div>
                  <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E4E1DA] font-mono text-[#1C1B1A] whitespace-pre-wrap">
                    {transcript}
                  </div>
                </div>
              )}
              {translation && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono font-bold text-[#6B6862] uppercase">Terjemahan Indonesia</div>
                  <div className="p-3 bg-[#FAF9F6] rounded-lg border border-[#E4E1DA] text-[#1C1B1A] whitespace-pre-wrap">
                    {translation}
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

// ─── Subcomponent: Bunpou Grammar Card ───────────────────────

function GrammarCard({
  pattern,
  jlptLevel,
  meaning,
  formula,
  examples,
}: {
  pattern: string
  jlptLevel?: string
  meaning: string
  formula?: string
  examples?: Array<{ japanese: string; romaji?: string; meaning: string }>
}) {
  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-[#E4E1DA] shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#2B3A55]" />
          <h4 className="text-base font-extrabold text-[#1C1B1A]">{pattern}</h4>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2B3A55] text-white">
          {jlptLevel || "JLPT N5"}
        </span>
      </div>

      {/* Formula & Meaning */}
      <div className="space-y-2">
        <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] space-y-1">
          <div className="text-[10px] font-mono font-bold text-[#6B6862] uppercase">Makna / Meaning</div>
          <div className="text-xs font-bold text-[#1C1B1A]">{meaning}</div>
        </div>

        {formula && (
          <div className="p-3 rounded-lg bg-[#2B3A55]/5 border border-[#2B3A55]/20 space-y-1">
            <div className="text-[10px] font-mono font-bold text-[#2B3A55] uppercase">Rumus Pembentukan (Formula)</div>
            <div className="text-xs font-mono font-bold text-[#2B3A55]">{formula}</div>
          </div>
        )}
      </div>

      {/* Example Sentences */}
      {examples && examples.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E4E1DA]">
          <div className="text-xs font-bold text-[#1C1B1A]">Contoh Kalimat (例文)</div>
          <div className="space-y-2">
            {examples.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] space-y-1 text-xs">
                <div className="font-bold text-[#1C1B1A]">{ex.japanese}</div>
                {ex.romaji && <div className="text-[11px] font-mono text-[#6B6862]">{ex.romaji}</div>}
                <div className="text-[11px] text-[#2B3A55] font-semibold">&quot;{ex.meaning}&quot;</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Subcomponent: Live Session Card ─────────────────────────

function LiveSessionCard({
  platform,
  meetingUrl,
  startTime,
  endTime,
  passcode,
  notes,
  recordingUrl,
}: {
  platform: string
  meetingUrl: string
  startTime: string
  endTime?: string
  passcode?: string
  notes?: string
  recordingUrl?: string
}) {
  const start = new Date(startTime)
  const now = new Date()
  const isFinished = endTime ? new Date(endTime) < now : false
  const isLiveNow = now >= start && !isFinished

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-[#E4E1DA] shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
        <div className="flex items-center gap-2">
          <Radio className={`size-5 ${isLiveNow ? "text-red-600 animate-pulse" : "text-[#2B3A55]"}`} />
          <h4 className="text-sm font-bold text-[#1C1B1A]">Sesi Tatap Muka Daring ({platform})</h4>
        </div>
        {isLiveNow ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
            🔴 LIVE SEKARANG
          </span>
        ) : isFinished ? (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-200 text-stone-700">
            Selesai
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
            Terjadwal
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA]">
          <div className="text-[10px] font-mono text-[#6B6862] font-semibold">Waktu Mulai</div>
          <div className="font-bold text-[#1C1B1A] mt-0.5">
            {start.toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
          </div>
        </div>
        {passcode && (
          <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E1DA]">
            <div className="text-[10px] font-mono text-[#6B6862] font-semibold">Passcode / Room Code</div>
            <div className="font-mono font-bold text-[#2B3A55] mt-0.5">{passcode}</div>
          </div>
        )}
      </div>

      {notes && (
        <div className="text-xs text-[#6B6862] bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
          📌 {notes}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        {meetingUrl && !isFinished && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#2B3A55] text-white text-xs font-bold hover:bg-[#2B3A55]/90 transition-colors shadow-sm"
          >
            <Radio className="size-4" /> Gabung Sesi Live ({platform})
          </a>
        )}
        {recordingUrl && (
          <a
            href={recordingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors"
          >
            <Video className="size-4 text-red-600" /> Lihat Rekaman Sesi
          </a>
        )}
      </div>
    </div>
  )
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
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null)
  const [retaking, setRetaking] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

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

  useEffect(() => {
    if (module.type === "quiz" && quiz?.time_limit_minutes && quiz.time_limit_minutes > 0 && !module.user_answer && quizQuestions.length > 0) {
      setTimerSeconds(quiz.time_limit_minutes * 60)
    }
  }, [module.type, quiz, module.user_answer, quizQuestions])

  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerSeconds])

  const handleStudentUpload = async (file: File) => {
    setUploading(true)
    setUploadMsg(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "submissions")
      const uploadRes = await fetch("/api/studio/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!uploadRes.ok) throw new Error("Gagal mengunggah file.")
      const blobData = await uploadRes.json() as { url: string; name: string; size: number }

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
          {module.type === "flashcard" && <Layers className="size-5 text-indigo-600" />}
          {module.type === "audio" && <Headphones className="size-5 text-cyan-600" />}
          {module.type === "grammar" && <Sparkles className="size-5 text-[#2B3A55]" />}
          {module.type === "external_link" && <ExternalLink className="size-5 text-teal-600" />}
          {module.type === "live_session" && <Radio className="size-5 text-rose-600" />}
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
            <div className="text-[11px] font-mono text-[#B23A2E] flex items-center gap-1.5 font-medium">
              <CalendarClock className="size-3.5" /> Batas Pengumpulan: {new Date(module.content.due_at).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
            </div>
          )}

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
            <div className="rounded-lg border border-[#E4E1DA] p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1C1B1A]">{quiz.title}</h4>
                  <p className="text-[10px] text-[#6B6862] font-mono mt-0.5">
                    Diselesaikan pada: {new Date(module.user_answer.submitted_at).toLocaleString("id-ID")}
                  </p>
                </div>
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
            <div className="space-y-4">
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

      {/* 6. FLASHCARD MODULE */}
      {module.type === "flashcard" && (
        <FlashcardViewer
          cards={module.content?.cards || []}
          deckTitle={module.content?.deck_title || module.title}
        />
      )}

      {/* 7. AUDIO MODULE */}
      {module.type === "audio" && (
        <AudioChoukaiPlayer
          audioUrl={module.content?.audio_url || ""}
          transcript={module.content?.transcript}
          translation={module.content?.translation}
        />
      )}

      {/* 8. GRAMMAR MODULE */}
      {module.type === "grammar" && (
        <GrammarCard
          pattern={module.content?.pattern || module.title}
          jlptLevel={module.content?.jlpt_level}
          meaning={module.content?.meaning || ""}
          formula={module.content?.formula}
          examples={module.content?.examples}
        />
      )}

      {/* 9. EXTERNAL LINK / EMBED MODULE */}
      {module.type === "external_link" && (
        <div className="space-y-4 bg-white p-5 rounded-xl border border-[#E4E1DA] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="size-5 text-teal-600" />
              <h4 className="text-sm font-bold text-[#1C1B1A]">
                {module.title || "Tautan / Embed Eksternal"}
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
              {module.content?.platform || "External Link"}
            </span>
          </div>

          {module.content?.is_embed && module.content?.url ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#E4E1DA]">
              <iframe
                src={module.content.url}
                className="w-full h-full border-0"
                title={module.title}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E1DA] flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-[#6B6862] font-mono truncate max-w-md">
                {module.content?.url || "Tautan Eksternal"}
              </span>
              {module.content?.url && (
                <a
                  href={module.content.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#2B3A55] text-white text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors shadow-xs"
                >
                  <ExternalLink className="size-3.5" /> {module.content?.button_text || "Buka Resource Eksternal"}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 10. LIVE SESSION MODULE */}
      {module.type === "live_session" && (
        <LiveSessionCard
          platform={module.content?.platform || "Google Meet"}
          meetingUrl={module.content?.meeting_url || ""}
          startTime={module.content?.start_time || new Date().toISOString()}
          endTime={module.content?.end_time}
          passcode={module.content?.passcode}
          notes={module.content?.notes}
          recordingUrl={module.content?.recording_url}
        />
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
      <main className="min-h-svh bg-white p5-subtle-grid px-6 py-12 text-black flex items-center justify-center">
        <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_#111] text-center space-y-3 font-mono text-xs font-black uppercase tracking-wider text-black">
          <Loader2 className="size-6 animate-spin mx-auto text-[#E60012]" />
          <span>Memuat Kelas dan Silabus...</span>
        </div>
      </main>
    )
  }

  if (error || !course) {
    return (
      <main className="min-h-svh bg-white p5-subtle-grid px-6 py-12 text-black flex items-center justify-center">
        <div className="mx-auto w-full max-w-md text-center space-y-4 p-6 border-2 border-black bg-white shadow-[8px_8px_0px_#111]">
          <AlertCircle className="size-8 text-[#E60012] mx-auto" />
          <div className="text-sm font-black uppercase text-[#E60012]">{error ?? "Kelas tidak ditemukan."}</div>
          <Link href="/lms" className="inline-block border-2 border-black bg-[#E60012] text-white px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#FFC700] hover:bg-[#FFC700] hover:text-black">
            ← Kembali ke Dashboard LMS
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-white p5-subtle-grid text-black pb-16">
      {/* Top Header Navigation */}
      <div className="border-b-2 border-black bg-[#FAF9F5] px-6 py-4 md:px-8 lg:px-10 shadow-[0px_3px_0px_#111]">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4">
          <Link
            href="/lms"
            className="flex items-center justify-center border-2 border-black bg-white p-2 text-black shadow-[2px_2px_0px_#111] hover:bg-[#E60012] hover:text-white transition-all"
            title="Kembali ke Dashboard LMS"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block bg-[#E60012] text-white px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[1px_1px_0px_#FFC700]">
                COURSE DETAIL
              </span>
            </div>
            <h1 className="font-heading text-xl md:text-2xl font-black uppercase tracking-tight text-black mt-0.5">{course.title}</h1>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-600 flex items-center gap-1.5 mt-0.5">
              <Layers className="size-3 text-[#E60012]" /> LMS JPER Community • {weeks.length} PERTEMUAN SILABUS
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 py-8 md:px-8 lg:px-10 space-y-6">
        {/* Banner Section */}
        {course.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.image_url} alt={course.title} className="w-full h-48 md:h-56 object-cover border-2 border-black shadow-[6px_6px_0px_#111]" />
        )}

        {course.description && (
          <div className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_#111] text-xs font-bold text-black leading-relaxed">
            {course.description}
          </div>
        )}

        {/* Weeks Accordion / List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="font-heading text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Layers className="size-4 text-[#E60012]" /> Silabus Pertemuan &amp; Modul
            </h2>
            <span className="font-mono text-xs font-black bg-black text-[#FFC700] px-2.5 py-0.5 border border-black">
              {weeks.length} SESI
            </span>
          </div>

          {weeks.length === 0 ? (
            <div className="border-2 border-black bg-white p-12 text-center text-xs font-black uppercase text-zinc-600 shadow-[4px_4px_0px_#111]">
              Belum ada pertemuan yang dipublikasikan untuk kelas ini.
            </div>
          ) : (
            weeks.map((w) => {
              const isOpen = openWeekId === w.id
              return (
                <div key={w.id} className="border-2 border-black bg-white shadow-[5px_5px_0px_#111] overflow-hidden mb-4">
                  {/* Week Accordion Bar */}
                  <div
                    onClick={() => setOpenWeekId(isOpen ? null : w.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F5] transition-colors select-none border-b-2 border-black"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-9 h-9 border-2 border-black bg-[#E60012] text-white font-mono text-xs font-black -skew-x-6 shadow-[2px_2px_0px_#FFC700]">
                        <span className="skew-x-6">{w.week_number}</span>
                      </div>
                      <div>
                        <h3 className="font-heading text-sm font-black uppercase text-black">{w.title}</h3>
                        <p className="text-[10px] text-zinc-600 font-mono font-bold uppercase mt-0.5">
                          PERTEMUAN KE-{w.week_number} • {w.modules?.length ?? 0} MODUL KONTEN
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {w.is_locked && (
                        <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 bg-red-100 text-[#E60012] border border-black flex items-center gap-1 -skew-x-6">
                          <Lock className="size-3 text-[#E60012] skew-x-6" /> TERKUNCI
                        </span>
                      )}
                      {isOpen ? <ChevronUp className="size-5 text-black" /> : <ChevronDown className="size-5 text-black" />}
                    </div>
                  </div>

                  {/* Week Content Drawer */}
                  {isOpen && (
                    <div className="p-5 bg-[#FAF9F5] space-y-4">
                      {w.is_locked ? (
                        <div className="p-4 border-2 border-black bg-red-50 text-xs font-bold text-red-900 space-y-1 shadow-[3px_3px_0px_#111]">
                          <div className="font-black uppercase flex items-center gap-2 text-[#E60012]">
                            <Lock className="size-4 text-[#E60012]" /> Sesi Pertemuan Ini Dikunci
                          </div>
                          <p className="text-xs text-zinc-700">
                            Sesi ini dikunci oleh pembina. Silakan selesaikan pertemuan sebelumnya atau hubungi pengurus.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Render week modules */}
                          {w.modules && w.modules.length > 0 ? (
                            w.modules.map((m) => (
                              <LMSModuleCard
                                key={m.id}
                                module={m}
                                token={token || ""}
                                onRefresh={() => { if (token) void fetchCourseData(token) }}
                              />
                            ))
                          ) : (
                            <div className="border-2 border-black bg-white p-6 text-center text-xs font-bold uppercase text-zinc-500 italic shadow-[2px_2px_0px_#111]">
                              Belum ada modul di pertemuan ini.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
