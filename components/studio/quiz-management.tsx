"use client"

import React, { useEffect, useState, useCallback } from "react"
import { HelpCircle, Plus, Trash2, Save, ArrowLeft, Loader2, Check, AlertCircle, Edit, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Course = {
  id: string
  title: string
}

type CourseWeek = {
  id: string
  course_id: string
  week_number: number
  title: string
}

type QuizQuestion = {
  id?: string
  question: string
  options: string[]
  answer: string
  type?: string
}

type Quiz = {
  id?: string
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
}

interface QuizManagementProps {
  token: string
}

export function QuizManagement({ token }: QuizManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>("")

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Fetch courses list
  useEffect(() => {
    fetch("/api/studio/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses ?? [])
        if (data.courses?.length > 0) {
          setSelectedCourseId(data.courses[0].id)
        }
      })
  }, [token])

  // Fetch weeks list when course changes
  useEffect(() => {
    if (selectedCourseId) {
      fetch(`/api/studio/weeks?course_id=${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setWeeks(data.weeks ?? [])
          if (data.weeks?.length > 0) {
            setSelectedWeekId(data.weeks[0].id)
          } else {
            setSelectedWeekId("")
          }
        })
    }
  }, [selectedCourseId, token])

  // Fetch quiz & questions for selected week
  const fetchQuizData = useCallback(async () => {
    if (!selectedWeekId) return
    setLoading(true)
    setQuiz(null)
    setQuestions([])
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/studio/quizzes?course_week_id=${selectedWeekId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.quiz) {
          setQuiz({
            id: data.quiz.id,
            title: data.quiz.title,
            is_locked: data.quiz.is_locked ?? false,
            is_hidden: data.quiz.is_hidden ?? false,
            opened_at: data.quiz.opened_at || null,
            closed_at: data.quiz.closed_at || null,
            max_attempts: data.quiz.max_attempts ?? 1,
            min_score: data.quiz.min_score ?? 70,
            time_limit_minutes: data.quiz.time_limit_minutes ?? 0,
            jumlah_soal_ditampilkan: data.quiz.jumlah_soal_ditampilkan ?? 0,
            randomize_questions: data.quiz.randomize_questions ?? false,
            randomize_options: data.quiz.randomize_options ?? false,
            allow_review: data.quiz.allow_review !== false,
            show_correct_answers: data.quiz.show_correct_answers !== false,
          })
          setQuestions(data.questions || [])
        } else {
          setQuiz(null)
          setQuestions([])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedWeekId, token])

  useEffect(() => {
    if (selectedWeekId) {
      void fetchQuizData()
    }
  }, [selectedWeekId, fetchQuizData])

  // Initializing new empty quiz structure
  const handleCreateNewQuiz = () => {
    setQuiz({
      title: "Kuis Baru",
      is_locked: false,
      is_hidden: false,
      opened_at: null,
      closed_at: null,
      max_attempts: 1,
      min_score: 70,
      time_limit_minutes: 15,
      jumlah_soal_ditampilkan: 0,
      randomize_questions: false,
      randomize_options: false,
      allow_review: true,
      show_correct_answers: true,
    })
    setQuestions([
      {
        question: "Contoh Soal Pertama?",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        answer: "Pilihan A",
        type: "multiple_choice",
      }
    ])
  }

  // Adding a new question to the bank
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: "",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        answer: "Pilihan A",
        type: "multiple_choice",
      }
    ])
  }

  // Deleting a question from the bank
  const handleDeleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  // Changing question type
  const handleQuestionTypeChange = (idx: number, newType: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === idx) {
        const isShort = newType === "short_answer"
        const isMulti = newType === "multiple_select"
        return {
          ...q,
          type: newType,
          options: isShort ? [] : ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
          answer: isShort ? "" : isMulti ? JSON.stringify(["Pilihan A"]) : "Pilihan A",
        }
      }
      return q
    }))
  }

  // Editing question text
  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question: text } : q))
  }

  // Editing option choices
  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOpts = [...q.options]
        newOpts[optIdx] = text
        return { ...q, options: newOpts }
      }
      return q
    }))
  }

  // Choosing the correct answer option
  const handleSelectCorrectAnswer = (qIdx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, answer: val } : q))
  }

  // Toggling multiple correct answers (checkboxes)
  const handleToggleCorrectAnswerMultiple = (qIdx: number, optValue: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        let currentList: string[] = []
        try {
          currentList = JSON.parse(q.answer)
          if (!Array.isArray(currentList)) currentList = []
        } catch {
          currentList = q.answer ? [q.answer] : []
        }
        const exists = currentList.includes(optValue)
        const nextList = exists
          ? currentList.filter(x => x !== optValue)
          : [...currentList, optValue]
        
        return {
          ...q,
          answer: JSON.stringify(nextList)
        }
      }
      return q
    }))
  }

  // Check if an option is correct under multiple selection
  const isOptionCorrectMultiple = (q: QuizQuestion, optValue: string) => {
    try {
      const arr = JSON.parse(q.answer)
      if (Array.isArray(arr)) return arr.includes(optValue)
    } catch {
      // ignore
    }
    return q.answer === optValue
  }

  // Saving the quiz state to the backend
  const handleSaveQuiz = async () => {
    if (!quiz || !selectedWeekId) return
    
    // Validations
    if (!quiz.title.trim()) {
      setStatusMsg({ type: "error", text: "Judul kuis tidak boleh kosong." })
      return
    }
    const emptyQuestion = questions.some(q => !q.question.trim())
    if (emptyQuestion) {
      setStatusMsg({ type: "error", text: "Semua pertanyaan wajib diisi." })
      return
    }
    const emptyAnswer = questions.some(q => !q.answer.trim())
    if (emptyAnswer) {
      setStatusMsg({ type: "error", text: "Semua pertanyaan wajib memiliki kunci jawaban." })
      return
    }

    setSaving(true)
    setStatusMsg(null)

    try {
      const url = quiz.id 
        ? `/api/studio/quizzes?id=${quiz.id}` 
        : `/api/studio/quizzes`
      const method = quiz.id ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_week_id: selectedWeekId,
          title: quiz.title,
          is_locked: quiz.is_locked,
          is_hidden: quiz.is_hidden,
          opened_at: quiz.opened_at,
          closed_at: quiz.closed_at,
          max_attempts: quiz.max_attempts,
          min_score: quiz.min_score,
          time_limit_minutes: quiz.time_limit_minutes,
          jumlah_soal_ditampilkan: quiz.jumlah_soal_ditampilkan,
          randomize_questions: quiz.randomize_questions,
          randomize_options: quiz.randomize_options,
          allow_review: quiz.allow_review,
          show_correct_answers: quiz.show_correct_answers,
          questions,
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan kuis.")
      setStatusMsg({ type: "success", text: "Kuis dan Bank Soal berhasil disimpan!" })
      void fetchQuizData()
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan." })
    } finally {
      setSaving(false)
    }
  }

  // Deleting the entire quiz
  const handleDeleteQuiz = async () => {
    if (!quiz || !quiz.id) return
    if (!confirm("Apakah Anda yakin ingin menghapus kuis ini beserta semua pertanyaannya?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/studio/quizzes?id=${quiz.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal menghapus kuis.")
      setQuiz(null)
      setQuestions([])
      setStatusMsg({ type: "success", text: "Kuis berhasil dihapus." })
    } catch (err) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Gagal menghapus." })
    } finally {
      setLoading(false)
    }
  }

  // Datetime-local format converters
  const toDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ""
    const offsetMs = date.getTimezoneOffset() * 60 * 1000
    const localTime = new Date(date.getTime() - offsetMs)
    return localTime.toISOString().substring(0, 16)
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
        <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A]">Bank Soal & Manajemen Kuis</CardTitle>
            <CardDescription className="text-xs">Konfigurasi bank soal, jadwal pembukaan kuis, batas waktu, dan aturan review.</CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            {/* Course Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Pilih Kelas Ekskul</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="h-9 border border-[#E4E1DA] bg-white rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Week Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Pertemuan/Week</label>
              <select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="h-9 border border-[#E4E1DA] bg-white rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
              >
                <option value="" disabled>Pilih Pertemuan</option>
                {weeks.map(w => (
                  <option key={w.id} value={w.id}>Week {w.week_number}: {w.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#6B6862] font-mono">Memuat detail kuis...</div>
          ) : !selectedWeekId ? (
            <div className="text-center py-10 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
              Silakan pilih kelas dan pertemuan di atas untuk mengelola kuis.
            </div>
          ) : !quiz ? (
            <div className="text-center py-12 border border-dashed border-[#E4E1DA] rounded-lg space-y-4 bg-white/50">
              <HelpCircle className="size-10 mx-auto stroke-[1.2] text-[#6B6862]/60" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1C1B1A]">Belum Ada Kuis Minggu Ini</h4>
                <p className="text-xs text-[#6B6862] max-w-sm mx-auto">Pertemuan ini belum memiliki kuis. Anda dapat membuatnya sebagai modul interaktif baru.</p>
              </div>
              <Button
                onClick={handleCreateNewQuiz}
                className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold h-9 px-4 rounded-lg border-none"
              >
                <Plus className="size-3.5 mr-1" />
                Buat Kuis & Bank Soal
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {statusMsg && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  statusMsg.type === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {statusMsg.type === "success" ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Advanced Settings Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 bg-white border border-[#E4E1DA] p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6862] border-b border-[#E4E1DA] pb-2">Aturan Pengerjaan & Parameter Kuis</h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Judul Kuis</label>
                      <Input
                        value={quiz.title}
                        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Durasi (Menit)</label>
                        <Input
                          type="number"
                          min={0}
                          value={quiz.time_limit_minutes}
                          onChange={(e) => setQuiz({ ...quiz, time_limit_minutes: parseInt(e.target.value) || 0 })}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                          placeholder="0 = Tanpa batas"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Soal Diambil (Jumlah)</label>
                        <Input
                          type="number"
                          min={0}
                          value={quiz.jumlah_soal_ditampilkan}
                          onChange={(e) => setQuiz({ ...quiz, jumlah_soal_ditampilkan: parseInt(e.target.value) || 0 })}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                          placeholder="0 = Tampilkan semua"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Maks Percobaan</label>
                        <Input
                          type="number"
                          min={1}
                          value={quiz.max_attempts}
                          onChange={(e) => setQuiz({ ...quiz, max_attempts: parseInt(e.target.value) || 1 })}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Kkm Kelulusan (%)</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={quiz.min_score}
                          onChange={(e) => setQuiz({ ...quiz, min_score: parseInt(e.target.value) || 70 })}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1C1B1A]">
                        <input
                          type="checkbox"
                          checked={quiz.randomize_questions}
                          onChange={(e) => setQuiz({ ...quiz, randomize_questions: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-[#2B3A55] focus:ring-[#2B3A55]"
                        />
                        Acak Soal (Random)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1C1B1A]">
                        <input
                          type="checkbox"
                          checked={quiz.randomize_options}
                          onChange={(e) => setQuiz({ ...quiz, randomize_options: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-[#2B3A55] focus:ring-[#2B3A55]"
                        />
                        Acak Pilihan Ganda
                      </label>
                    </div>
                  </div>
                </div>

                {/* Scheduling and Review Options */}
                <div className="space-y-4 bg-white border border-[#E4E1DA] p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6862] border-b border-[#E4E1DA] pb-2">Jadwal & Review Hasil Kuis</h3>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Mulai Dibuka</label>
                      <Input
                        type="datetime-local"
                        value={toDatetimeLocal(quiz.opened_at)}
                        onChange={(e) => setQuiz({ ...quiz, opened_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg datetime-input text-[#1C1B1A] font-semibold pr-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1B1A] mb-1">Selesai/Ditutup</label>
                      <Input
                        type="datetime-local"
                        value={toDatetimeLocal(quiz.closed_at)}
                        onChange={(e) => setQuiz({ ...quiz, closed_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg datetime-input text-[#1C1B1A] font-semibold pr-2"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#E4E1DA]/60">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1C1B1A]">
                        <input
                          type="checkbox"
                          checked={quiz.allow_review}
                          onChange={(e) => setQuiz({ ...quiz, allow_review: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-[#2B3A55] focus:ring-[#2B3A55]"
                        />
                        Izinkan Review Soal & Jawaban
                      </label>
                      <label className={`flex items-center gap-2 cursor-pointer font-medium text-[#1C1B1A] ${!quiz.allow_review ? "opacity-40 text-stone-400" : ""}`}>
                        <input
                          type="checkbox"
                          checked={quiz.show_correct_answers}
                          disabled={!quiz.allow_review}
                          onChange={(e) => setQuiz({ ...quiz, show_correct_answers: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-[#2B3A55] focus:ring-[#2B3A55] disabled:bg-stone-200 disabled:border-stone-300"
                        />
                        Tunjukkan Kunci Jawaban yang Benar
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E4E1DA]/60">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-red-600">
                        <input
                          type="checkbox"
                          checked={quiz.is_locked}
                          onChange={(e) => setQuiz({ ...quiz, is_locked: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-red-600 focus:ring-red-500"
                        />
                        Kunci Kuis (Siswa block)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#6B6862]">
                        <input
                          type="checkbox"
                          checked={quiz.is_hidden}
                          onChange={(e) => setQuiz({ ...quiz, is_hidden: e.target.checked })}
                          className="rounded border-[#E4E1DA] bg-white text-[#6B6862] focus:ring-stone-500"
                        />
                        Sembunyikan Kuis di LMS
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Bank List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6862] flex items-center gap-1.5">
                    <ListTodo className="size-4 text-amber-600" />
                    Bank Soal Pertanyaan ({questions.length} Soal)
                  </h3>
                  <Button
                    size="sm"
                    onClick={handleAddQuestion}
                    className="h-8 px-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold rounded-lg border-none"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Tambah Soal
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white border border-[#E4E1DA] p-4 rounded-xl space-y-3.5 relative">
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-[#B23A2E] transition-colors"
                        title="Hapus Soal"
                      >
                        <Trash2 className="size-4" />
                      </button>

                      <div className="text-xs font-bold text-[#6B6862] font-mono">SOAL #{qIdx + 1}</div>

                      {/* Question Text & Type Selector */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="text-xs">
                          <label className="block font-semibold text-[#1C1B1A] mb-1">Pertanyaan Soal</label>
                          <Input
                            placeholder="Tulis soal pertanyaan di sini..."
                            value={q.question}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg text-[#1C1B1A] font-semibold"
                          />
                        </div>
                        <div className="text-xs">
                          <label className="block font-semibold text-[#1C1B1A] mb-1">Tipe Pertanyaan</label>
                          <select
                            value={q.type || "multiple_choice"}
                            onChange={(e) => handleQuestionTypeChange(qIdx, e.target.value)}
                            className="w-full h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
                          >
                            <option value="multiple_choice">Pilihan Ganda (Satu Kunci)</option>
                            <option value="multiple_select">Pilihan Ganda Kompleks (Banyak Kunci)</option>
                            <option value="short_answer">Isian Singkat (Esai)</option>
                          </select>
                        </div>
                      </div>

                      {/* Conditional Editor Input based on Type */}
                      {(q.type || "multiple_choice") === "short_answer" ? (
                        <div className="text-xs space-y-1">
                          <label className="block font-semibold text-[#1C1B1A]">Kunci Jawaban Singkat (Referensi Koreksi)</label>
                          <Input
                            placeholder="Tulis referensi kunci jawaban yang benar (misal: Tokyo)..."
                            value={q.answer}
                            onChange={(e) => handleSelectCorrectAnswer(qIdx, e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg text-[#1C1B1A] font-semibold"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs">
                          <label className="block font-semibold text-[#1C1B1A]">
                            Opsi Pilihan Ganda {(q.type || "multiple_choice") === "multiple_select" ? "(Pilih beberapa kunci jawaban)" : "(Pilih satu kunci jawaban)"}
                          </label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => {
                              const isMc = (q.type || "multiple_choice") === "multiple_choice"
                              const isCorrect = isMc
                                ? (q.answer !== "" && q.answer === opt)
                                : isOptionCorrectMultiple(q, opt)
                              
                              return (
                                <div key={optIdx} className={`flex items-center gap-2 p-2 rounded-lg border bg-white transition-colors ${
                                  isCorrect ? "border-emerald-300 bg-emerald-50/20" : "border-[#E4E1DA]"
                                }`}>
                                  <input
                                    type={isMc ? "radio" : "checkbox"}
                                    name={isMc ? `correct-ans-${qIdx}` : undefined}
                                    checked={isCorrect}
                                    onChange={() => {
                                      if (isMc) {
                                        handleSelectCorrectAnswer(qIdx, opt)
                                      } else {
                                        handleToggleCorrectAnswerMultiple(qIdx, opt)
                                      }
                                    }}
                                    className="text-emerald-600 focus:ring-emerald-500 bg-white border border-[#E4E1DA] cursor-pointer"
                                  />
                                  <span className="font-bold font-mono text-[10px] text-[#6B6862]">{String.fromCharCode(65 + optIdx)}.</span>
                                  <input
                                    placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}...`}
                                    value={opt}
                                    onChange={(e) => {
                                      const oldOpt = opt
                                      handleOptionTextChange(qIdx, optIdx, e.target.value)
                                      
                                      // Sync correct answer value if option text changed
                                      if (isMc) {
                                        if (q.answer === oldOpt) {
                                          handleSelectCorrectAnswer(qIdx, e.target.value)
                                        }
                                      } else {
                                        try {
                                          const arr = JSON.parse(q.answer) as string[]
                                          if (Array.isArray(arr) && arr.includes(oldOpt)) {
                                            const nextArr = arr.map(x => x === oldOpt ? e.target.value : x)
                                            handleSelectCorrectAnswer(qIdx, JSON.stringify(nextArr))
                                          }
                                        } catch {
                                          // ignore
                                        }
                                      }
                                    }}
                                    className="flex-1 bg-transparent border-none p-0 text-xs text-[#1C1B1A] font-semibold focus:ring-0 focus:outline-none h-6"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {questions.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg bg-white/30">
                    Belum ada pertanyaan. Tambahkan pertanyaan kuis di atas.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteQuiz}
                  className="h-9 px-3 text-xs text-[#B23A2E] hover:bg-red-50 border-[#E4E1DA] font-semibold"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Hapus Kuis & Bank Soal
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveQuiz}
                    disabled={saving}
                    className="h-9 px-4 bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none font-bold shadow-none rounded-lg"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
                    {saving ? "Menyimpan..." : "Simpan Kuis & Bank Soal"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        .datetime-input::-webkit-calendar-picker-indicator {
          filter: invert(22%) sepia(35%) saturate(1100%) hue-rotate(180deg) brightness(95%) contrast(95%);
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.15s ease;
        }
        .datetime-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}} />
    </div>
  )
}
