"use client"

import React, { useEffect, useState, useCallback } from "react"
import { BookOpen, Trash2, Edit3, Lock, Unlock, Eye, EyeOff, ArrowRight, FileText, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

type Course = {
  id: string
  title: string
  description: string
  image_url: string
  is_locked: boolean
  is_hidden: boolean
  created_at: string
}

type CourseWeek = {
  id: string
  course_id: string
  week_number: number
  title: string
  pdf_url: string
  youtube_url: string
  notes_markdown: string
  is_locked: boolean
  is_hidden: boolean
}

interface CourseManagementProps {
  token: string
}

export function CourseManagement({ token }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingWeeks, setLoadingWeeks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Course Form States
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDesc, setCourseDesc] = useState("")
  const [courseImage, setCourseImage] = useState("")
  const [courseIsLocked, setCourseIsLocked] = useState(false)
  const [courseIsHidden, setCourseIsHidden] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [savingCourse, setSavingCourse] = useState(false)

  // Week Form States
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null)
  const [weekTitle, setWeekTitle] = useState("")
  const [weekNum, setWeekNum] = useState("")
  const [weekPdf, setWeekPdf] = useState("")
  const [weekYoutube, setWeekYoutube] = useState("")
  const [weekNotes, setWeekNotes] = useState("")
  const [weekIsLocked, setWeekIsLocked] = useState(false)
  const [weekIsHidden, setWeekIsHidden] = useState(false)
  const [savingWeek, setSavingWeek] = useState(false)

  // Quiz Form States
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState("")
  const [quizIsLocked, setQuizIsLocked] = useState(false)
  const [quizIsHidden, setQuizIsHidden] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<Array<{ question: string; options: string[]; answer: string }>>([])
  const [quizOpenedAt, setQuizOpenedAt] = useState("")
  const [quizClosedAt, setQuizClosedAt] = useState("")
  const [quizMaxAttempts, setQuizMaxAttempts] = useState("1")
  const [quizMinScore, setQuizMinScore] = useState("70")
  
  // Loading/saving quiz states
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)

  // Temp single question state for adding to questions array
  const [newQuestionText, setNewQuestionText] = useState("")
  const [newOptA, setNewOptA] = useState("")
  const [newOptB, setNewOptB] = useState("")
  const [newOptC, setNewOptC] = useState("")
  const [newOptD, setNewOptD] = useState("")
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("A")

  // Fetch Quiz for selected week
  const fetchQuiz = useCallback(async (weekId: string) => {
    setLoadingQuiz(true)
    try {
      const res = await fetch(`/api/studio/quizzes?course_week_id=${weekId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal mengambil data kuis.")
      const data = await res.json()
      if (data.quiz) {
        setQuizId(data.quiz.id)
        setQuizTitle(data.quiz.title)
        setQuizIsLocked(data.quiz.is_locked)
        setQuizIsHidden(data.quiz.is_hidden)
        setQuizQuestions(data.questions || [])
        
        // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
        const toDatetimeLocal = (iso: string | null) => {
          if (!iso) return ""
          const d = new Date(iso)
          const pad = (n: number) => String(n).padStart(2, "0")
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        setQuizOpenedAt(toDatetimeLocal(data.quiz.opened_at))
        setQuizClosedAt(toDatetimeLocal(data.quiz.closed_at))
        setQuizMaxAttempts(String(data.quiz.max_attempts ?? 1))
        setQuizMinScore(String(data.quiz.min_score ?? 70))
      } else {
        setQuizId(null)
        setQuizTitle("")
        setQuizIsLocked(false)
        setQuizIsHidden(false)
        setQuizQuestions([])
        setQuizOpenedAt("")
        setQuizClosedAt("")
        setQuizMaxAttempts("1")
        setQuizMinScore("70")
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoadingQuiz(false)
    }
  }, [token])

  useEffect(() => {
    if (activeWeekId) {
      void fetchQuiz(activeWeekId)
    } else {
      setQuizId(null)
      setQuizTitle("")
      setQuizIsLocked(false)
      setQuizIsHidden(false)
      setQuizQuestions([])
      setQuizOpenedAt("")
      setQuizClosedAt("")
      setQuizMaxAttempts("1")
      setQuizMinScore("70")
    }
  }, [activeWeekId, fetchQuiz])

  const handleAddQuestionLocal = () => {
    if (!newQuestionText.trim() || !newOptA.trim() || !newOptB.trim() || !newOptC.trim() || !newOptD.trim()) {
      alert("Semua kolom pertanyaan dan opsi jawaban harus diisi.")
      return
    }

    const correctText = newCorrectAnswer === "A" ? newOptA.trim() : 
                         newCorrectAnswer === "B" ? newOptB.trim() : 
                         newCorrectAnswer === "C" ? newOptC.trim() : newOptD.trim()

    const newQ = {
      question: newQuestionText.trim(),
      options: [newOptA.trim(), newOptB.trim(), newOptC.trim(), newOptD.trim()],
      answer: correctText
    }

    setQuizQuestions((prev) => [...prev, newQ])
    
    // Reset temp question states
    setNewQuestionText("")
    setNewOptA("")
    setNewOptB("")
    setNewOptC("")
    setNewOptD("")
    setNewCorrectAnswer("A")
  }

  const handleDeleteQuestionLocal = (index: number) => {
    setQuizQuestions((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWeekId || !quizTitle.trim()) return

    setSavingQuiz(true)
    try {
      const url = quizId ? `/api/studio/quizzes?id=${quizId}` : "/api/studio/quizzes"
      const method = quizId ? "PATCH" : "POST"

      const payload: Record<string, unknown> = {
        title: quizTitle.trim(),
        is_locked: quizIsLocked,
        is_hidden: quizIsHidden,
        questions: quizQuestions,
        opened_at: quizOpenedAt ? new Date(quizOpenedAt).toISOString() : null,
        closed_at: quizClosedAt ? new Date(quizClosedAt).toISOString() : null,
        max_attempts: parseInt(quizMaxAttempts) || 1,
        min_score: parseInt(quizMinScore) || 70,
      }

      if (!quizId) {
        payload.course_week_id = activeWeekId
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Gagal menyimpan kuis.")
      alert("Kuis berhasil disimpan!")
      
      void fetchQuiz(activeWeekId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan kuis.")
    } finally {
      setSavingQuiz(false)
    }
  }

  const handleQuizDelete = async () => {
    if (!quizId) return
    if (!confirm("Apakah Anda yakin ingin menghapus kuis ini beserta semua pertanyaannya?")) return

    try {
      const res = await fetch(`/api/studio/quizzes?id=${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("Gagal menghapus kuis.")
      alert("Kuis berhasil dihapus.")
      
      setQuizId(null)
      setQuizTitle("")
      setQuizIsLocked(false)
      setQuizIsHidden(false)
      setQuizQuestions([])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kuis.")
    }
  }

  // Fetch Courses
  const fetchCourses = useCallback(async () => {
    setTimeout(() => {
      setLoadingCourses(true)
    }, 0)
    try {
      const res = await fetch("/api/studio/courses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal mengambil data kelas.")
      const data = await res.json()
      setCourses(data.courses ?? [])
      if (data.courses?.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data.courses[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setTimeout(() => {
        setLoadingCourses(false)
      }, 0)
    }
  }, [token, selectedCourseId])

  // Fetch Weeks for selected course
  const fetchWeeks = useCallback(async (courseId: string) => {
    setTimeout(() => {
      setLoadingWeeks(true)
    }, 0)
    try {
      const res = await fetch(`/api/studio/weeks?course_id=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal mengambil materi kelas.")
      const data = await res.json()
      setWeeks(data.weeks ?? [])
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengambil materi.")
    } finally {
      setTimeout(() => {
        setLoadingWeeks(false)
      }, 0)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCourses()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchCourses])

  useEffect(() => {
    if (selectedCourseId) {
      const timer = setTimeout(() => {
        void fetchWeeks(selectedCourseId)
        setActiveWeekId(null)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [selectedCourseId, fetchWeeks])

  // Handle Select Course
  const handleSelectCourse = (course: Course) => {
    setSelectedCourseId(course.id)
  }

  // Handle Course CRUD submit
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseTitle.trim()) return

    setSavingCourse(true)
    try {
      const url = editingCourseId ? `/api/studio/courses?id=${editingCourseId}` : "/api/studio/courses"
      const method = editingCourseId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: courseTitle.trim(),
          description: courseDesc.trim(),
          image_url: courseImage.trim(),
          is_locked: courseIsLocked,
          is_hidden: courseIsHidden,
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan kelas.")
      
      setCourseTitle("")
      setCourseDesc("")
      setCourseImage("")
      setCourseIsLocked(false)
      setCourseIsHidden(false)
      setEditingCourseId(null)
      
      await fetchCourses()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan kelas.")
    } finally {
      setSavingCourse(false)
    }
  }

  // Handle Course Delete
  const handleCourseDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini? Semua materi silabus dan nilai akan ikut terhapus.")) return

    try {
      const res = await fetch(`/api/studio/courses?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal menghapus kelas.")
      setCourses(prev => prev.filter(c => c.id !== id))
      if (selectedCourseId === id) {
        setSelectedCourseId(null)
        setWeeks([])
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kelas.")
    }
  }

  // Handle Select Week for edit
  const handleSelectWeek = (week: CourseWeek) => {
    setActiveWeekId(week.id)
    setWeekTitle(week.title)
    setWeekNum(week.week_number.toString())
    setWeekPdf(week.pdf_url || "")
    setWeekYoutube(week.youtube_url || "")
    setWeekNotes(week.notes_markdown || "")
    setWeekIsLocked(week.is_locked)
    setWeekIsHidden(week.is_hidden)
  }

  // Handle Course Week Save
  const handleWeekSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId || !weekTitle.trim() || !weekNum) return

    setSavingWeek(true)
    try {
      const url = activeWeekId ? `/api/studio/weeks?id=${activeWeekId}` : "/api/studio/weeks"
      const method = activeWeekId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: selectedCourseId,
          week_number: parseInt(weekNum),
          title: weekTitle.trim(),
          pdf_url: weekPdf.trim(),
          youtube_url: weekYoutube.trim(),
          notes_markdown: weekNotes,
          is_locked: weekIsLocked,
          is_hidden: weekIsHidden,
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan materi silabus.")

      // Reset
      setActiveWeekId(null)
      setWeekTitle("")
      setWeekNum("")
      setWeekPdf("")
      setWeekYoutube("")
      setWeekNotes("")
      setWeekIsLocked(false)
      setWeekIsHidden(false)

      await fetchWeeks(selectedCourseId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan silabus.")
    } finally {
      setSavingWeek(false)
    }
  }

  // Handle Toggle Week Lock
  const handleToggleWeekLock = async (week: CourseWeek, isLocked: boolean) => {
    try {
      const res = await fetch(`/api/studio/weeks?id=${week.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_locked: isLocked }),
      })
      if (!res.ok) throw new Error()
      setWeeks(prev => prev.map(w => w.id === week.id ? { ...w, is_locked: isLocked } : w))
    } catch {
      alert("Gagal memperbarui status kunci silabus.")
    }
  }

  // Handle Toggle Week Hide
  const handleToggleWeekHide = async (week: CourseWeek, isHidden: boolean) => {
    try {
      const res = await fetch(`/api/studio/weeks?id=${week.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_hidden: isHidden }),
      })
      if (!res.ok) throw new Error()
      setWeeks(prev => prev.map(w => w.id === week.id ? { ...w, is_hidden: isHidden } : w))
    } catch {
      alert("Gagal memperbarui status sembunyi silabus.")
    }
  }

  // Handle Delete Week
  const handleWeekDelete = async (id: string) => {
    if (!confirm("Hapus materi pertemuan silabus ini?")) return
    try {
      const res = await fetch(`/api/studio/weeks?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setWeeks(prev => prev.filter(w => w.id !== id))
      if (activeWeekId === id) {
        setActiveWeekId(null)
      }
    } catch {
      alert("Gagal menghapus materi.")
    }
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {error && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E]">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        
        {/* LEFT COLUMN: COURSE LIST & COURSE CRUD FORM */}
        <div className="space-y-6">
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
            <CardHeader className="pb-3 border-b border-[#E4E1DA]">
              <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                Kelola Daftar Kelas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {loadingCourses ? (
                <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat kelas...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#6B6862]">Belum ada kelas.</div>
              ) : (
                <div className="space-y-1.5">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedCourseId === course.id
                          ? "border-[#2B3A55] bg-[#2B3A55]/5 text-[#1C1B1A]"
                          : "border-[#E4E1DA] hover:bg-[#E4E1DA]/20 text-[#6B6862]"
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 pr-3">
                        <div className="font-bold flex items-center gap-1.5">
                          <BookOpen className="size-3.5 text-[#2B3A55]" />
                          {course.title}
                        </div>
                        <div className="text-[10px] truncate max-w-[200px]">{course.description || "Tidak ada deskripsi."}</div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingCourseId(course.id)
                            setCourseTitle(course.title)
                            setCourseDesc(course.description)
                            setCourseImage(course.image_url)
                            setCourseIsLocked(course.is_locked)
                            setCourseIsHidden(course.is_hidden)
                          }}
                          className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleCourseDelete(course.id, e)}
                          className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#B23A2E]"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <ArrowRight className={`size-3.5 text-[#2B3A55] ${selectedCourseId === course.id ? "opacity-100" : "opacity-0"}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COURSE CRUST FORM */}
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
            <CardHeader className="pb-3 border-b border-[#E4E1DA]">
              <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                {editingCourseId ? "Edit Detail Kelas" : "Tambah Kelas Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCourseSubmit} className="space-y-3.5">
                <Field>
                  <FieldLabel htmlFor="c_title" className="text-xs font-semibold text-[#1C1B1A]">Nama Kelas</FieldLabel>
                  <Input
                    id="c_title"
                    placeholder="Contoh: Nihongo N5 Dasar"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="c_desc" className="text-xs font-semibold text-[#1C1B1A]">Deskripsi Kelas</FieldLabel>
                  <Input
                    id="c_desc"
                    placeholder="Contoh: Kelas belajar hiragana, katakana, dan tata bahasa dasar."
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="c_image" className="text-xs font-semibold text-[#1C1B1A]">URL Banner Gambar</FieldLabel>
                  <Input
                    id="c_image"
                    placeholder="Pilih dari File Bank atau masukkan URL"
                    value={courseImage}
                    onChange={(e) => setCourseImage(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>

                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseIsLocked}
                      onChange={(e) => setCourseIsLocked(e.target.checked)}
                    />
                    Kunci Kelas
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseIsHidden}
                      onChange={(e) => setCourseIsHidden(e.target.checked)}
                    />
                    Sembunyikan Kelas
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={savingCourse || !courseTitle}
                    className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 flex-1 h-9 text-xs font-semibold rounded-lg shadow-none border-none"
                  >
                    {savingCourse ? "Menyimpan..." : editingCourseId ? "Simpan Perubahan" : "Simpan Kelas"}
                  </Button>
                  {editingCourseId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingCourseId(null)
                        setCourseTitle("")
                        setCourseDesc("")
                        setCourseImage("")
                        setCourseIsLocked(false)
                        setCourseIsHidden(false)
                      }}
                      className="border-[#E4E1DA] bg-[#FAF9F6] h-9 text-xs font-semibold rounded-lg"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: WEEKS LIST & WEEK EDIT FORM */}
        <div className="space-y-6">
          {selectedCourseId ? (
            <>
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                    Silabus Mingguan / Pertemuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {loadingWeeks ? (
                    <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat silabus...</div>
                  ) : weeks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
                      Belum ada materi silabus. Isi form di bawah untuk menambahkan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {weeks.map((week) => (
                        <div
                          key={week.id}
                          onClick={() => handleSelectWeek(week)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                            activeWeekId === week.id
                              ? "bg-[#2B3A55]/10 border-[#2B3A55]"
                              : "border-[#E4E1DA] hover:bg-[#E4E1DA]/10"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-[#1C1B1A]">
                              Minggu {week.week_number}: {week.title}
                            </div>
                            <div className="flex gap-3 text-[10px] text-[#6B6862] font-mono mt-1">
                              {week.pdf_url && <span className="flex items-center gap-1"><FileText className="size-3" /> PDF</span>}
                              {week.youtube_url && <span className="flex items-center gap-1"><Video className="size-3" /> Video</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                            {/* Toggle Lock */}
                            <button
                              onClick={() => handleToggleWeekLock(week, !week.is_locked)}
                              className={`p-1 rounded border transition-colors ${
                                week.is_locked ? "bg-red-50 border-red-200 text-red-700" : "bg-[#FAF9F6] border-[#E4E1DA] text-[#6B6862]"
                              }`}
                              title={week.is_locked ? "Terkunci (Siswa tidak bisa buka)" : "Terbuka"}
                            >
                              {week.is_locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                            </button>
                            
                            {/* Toggle Hide */}
                            <button
                              onClick={() => handleToggleWeekHide(week, !week.is_hidden)}
                              className={`p-1 rounded border transition-colors ${
                                week.is_hidden ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-[#FAF9F6] border-[#E4E1DA] text-[#6B6862]"
                              }`}
                              title={week.is_hidden ? "Tersembunyi" : "Terlihat"}
                            >
                              {week.is_hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>

                            <button
                              onClick={() => handleWeekDelete(week.id)}
                              className="p-1 border border-transparent hover:bg-red-50 hover:border-red-200 rounded text-[#B23A2E]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* WEEK FORM */}
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                    {activeWeekId ? "Edit Pertemuan / Materi" : "Tambah Pertemuan Silabus Baru"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleWeekSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Field className="col-span-1">
                        <FieldLabel htmlFor="w_num" className="text-xs font-semibold text-[#1C1B1A]">Minggu Ke-</FieldLabel>
                        <Input
                          id="w_num"
                          type="number"
                          placeholder="1"
                          required
                          value={weekNum}
                          onChange={(e) => setWeekNum(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                      <Field className="col-span-2">
                        <FieldLabel htmlFor="w_title" className="text-xs font-semibold text-[#1C1B1A]">Judul Pertemuan</FieldLabel>
                        <Input
                          id="w_title"
                          placeholder="Contoh: Pengenalan Huruf Hiragana"
                          required
                          value={weekTitle}
                          onChange={(e) => setWeekTitle(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="w_pdf" className="text-xs font-semibold text-[#1C1B1A]">Link PDF Materi</FieldLabel>
                      <Input
                        id="w_pdf"
                        placeholder="Tempel dari File Bank (e.g. https://.../materi.pdf)"
                        value={weekPdf}
                        onChange={(e) => setWeekPdf(e.target.value)}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="w_youtube" className="text-xs font-semibold text-[#1C1B1A]">Link Video YouTube (Embed)</FieldLabel>
                      <Input
                        id="w_youtube"
                        placeholder="https://www.youtube.com/embed/XXXXX atau link biasa"
                        value={weekYoutube}
                        onChange={(e) => setWeekYoutube(e.target.value)}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="w_notes" className="text-xs font-semibold text-[#1C1B1A]">Notes Rangkuman (Markdown)</FieldLabel>
                      <textarea
                        id="w_notes"
                        rows={5}
                        placeholder="Masukkan catatan rangkuman pelajaran dalam format Markdown..."
                        value={weekNotes}
                        onChange={(e) => setWeekNotes(e.target.value)}
                        className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-3 rounded-lg text-[#1C1B1A] font-mono focus:outline-none"
                      />
                    </Field>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weekIsLocked}
                          onChange={(e) => setWeekIsLocked(e.target.checked)}
                        />
                        Kunci Pertemuan
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={weekIsHidden}
                          onChange={(e) => setWeekIsHidden(e.target.checked)}
                        />
                        Sembunyikan
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={savingWeek || !weekTitle || !weekNum}
                        className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 flex-1 h-9 text-xs font-semibold rounded-lg shadow-none border-none"
                      >
                        {savingWeek ? "Menyimpan..." : activeWeekId ? "Simpan Perubahan" : "Simpan Pertemuan"}
                      </Button>
                      {activeWeekId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setActiveWeekId(null)
                            setWeekTitle("")
                            setWeekNum("")
                            setWeekPdf("")
                            setWeekYoutube("")
                            setWeekNotes("")
                            setWeekIsLocked(false)
                            setWeekIsHidden(false)
                          }}
                          className="border-[#E4E1DA] bg-[#FAF9F6] h-9 text-xs font-semibold rounded-lg"
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* QUIZ MANAGEMENT CARD */}
              {activeWeekId && (
                <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg mt-6">
                  <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                    <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                      {quizId ? "Kelola Kuis Pertemuan" : "Tambah Kuis Pertemuan"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {loadingQuiz ? (
                      <div className="text-xs text-[#6B6862] font-mono">Memuat data kuis...</div>
                    ) : (
                      <form onSubmit={handleQuizSubmit} className="space-y-4">
                        <Field>
                          <FieldLabel htmlFor="q_title" className="text-xs font-semibold text-[#1C1B1A]">Judul Kuis</FieldLabel>
                          <Input
                            id="q_title"
                            placeholder="Contoh: Kuis Huruf Hiragana Dasar"
                            required
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel htmlFor="q_opened" className="text-xs font-semibold text-[#1C1B1A]">Waktu Buka Kuis</FieldLabel>
                            <Input
                              id="q_opened"
                              type="datetime-local"
                              value={quizOpenedAt}
                              onChange={(e) => setQuizOpenedAt(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="q_closed" className="text-xs font-semibold text-[#1C1B1A]">Waktu Tutup Kuis (Batas)</FieldLabel>
                            <Input
                              id="q_closed"
                              type="datetime-local"
                              value={quizClosedAt}
                              onChange={(e) => setQuizClosedAt(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel htmlFor="q_attempts" className="text-xs font-semibold text-[#1C1B1A]">Maksimal Percobaan</FieldLabel>
                            <Input
                              id="q_attempts"
                              type="number"
                              min="1"
                              value={quizMaxAttempts}
                              onChange={(e) => setQuizMaxAttempts(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="q_min_score" className="text-xs font-semibold text-[#1C1B1A]">Batas Nilai Minimum Kelulusan</FieldLabel>
                            <Input
                              id="q_min_score"
                              type="number"
                              min="0"
                              max="100"
                              value={quizMinScore}
                              onChange={(e) => setQuizMinScore(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                        </div>

                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quizIsLocked}
                              onChange={(e) => setQuizIsLocked(e.target.checked)}
                            />
                            Kunci Kuis Terpisah
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-mono text-[#6B6862] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quizIsHidden}
                              onChange={(e) => setQuizIsHidden(e.target.checked)}
                            />
                            Sembunyikan Kuis Terpisah
                          </label>
                        </div>

                        {/* LIST OF CURRENT QUESTIONS */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-[#1C1B1A]">Daftar Pertanyaan ({quizQuestions.length})</span>
                          {quizQuestions.length === 0 ? (
                            <div className="text-[10px] text-[#6B6862] italic p-3 border border-dashed border-[#E4E1DA] rounded-lg">
                              Belum ada pertanyaan. Masukkan minimal 1 pertanyaan di bawah.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {quizQuestions.map((q, idx) => (
                                <div key={idx} className="p-3 border border-[#E4E1DA] rounded-lg bg-[#FAF9F6] text-xs space-y-1">
                                  <div className="flex justify-between items-start">
                                    <div className="font-bold text-[#1C1B1A]">{idx + 1}. {q.question}</div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestionLocal(idx)}
                                      className="text-[10px] text-[#B23A2E] hover:underline"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#6B6862] mt-1.5">
                                    <div>A: {q.options[0]}</div>
                                    <div>B: {q.options[1]}</div>
                                    <div>C: {q.options[2]}</div>
                                    <div>D: {q.options[3]}</div>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-600 mt-1 font-mono">
                                    Jawaban Benar: {q.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ADD NEW QUESTION FORM */}
                        <div className="border border-[#E4E1DA] rounded-lg p-3 space-y-3 bg-[#FAF9F6]/50">
                          <span className="text-xs font-bold text-[#1C1B1A]">Tambah Pertanyaan</span>
                          <Field>
                            <FieldLabel htmlFor="new_q_text" className="text-[11px] font-semibold">Teks Pertanyaan</FieldLabel>
                            <Input
                              id="new_q_text"
                              placeholder="Contoh: Apa romaji dari huruf あ?"
                              value={newQuestionText}
                              onChange={(e) => setNewQuestionText(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                            />
                          </Field>
                          <div className="grid grid-cols-2 gap-2">
                            <Field>
                              <FieldLabel htmlFor="opt_a" className="text-[10px] font-semibold">Opsi A</FieldLabel>
                              <Input
                                id="opt_a"
                                placeholder="Pilihan A"
                                value={newOptA}
                                onChange={(e) => setNewOptA(e.target.value)}
                                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="opt_b" className="text-[10px] font-semibold">Opsi B</FieldLabel>
                              <Input
                                id="opt_b"
                                placeholder="Pilihan B"
                                value={newOptB}
                                onChange={(e) => setNewOptB(e.target.value)}
                                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="opt_c" className="text-[10px] font-semibold">Opsi C</FieldLabel>
                              <Input
                                id="opt_c"
                                placeholder="Pilihan C"
                                value={newOptC}
                                onChange={(e) => setNewOptC(e.target.value)}
                                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                              />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="opt_d" className="text-[10px] font-semibold">Opsi D</FieldLabel>
                              <Input
                                id="opt_d"
                                placeholder="Pilihan D"
                                value={newOptD}
                                onChange={(e) => setNewOptD(e.target.value)}
                                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                              />
                            </Field>
                          </div>

                          <Field>
                            <FieldLabel htmlFor="correct_ans" className="text-[11px] font-semibold">Kunci Jawaban</FieldLabel>
                            <select
                              id="correct_ans"
                              value={newCorrectAnswer}
                              onChange={(e) => setNewCorrectAnswer(e.target.value)}
                              className="h-8 rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] text-[#1C1B1A] px-3 text-xs w-full focus:outline-none"
                            >
                              <option value="A">Opsi A</option>
                              <option value="B">Opsi B</option>
                              <option value="C">Opsi C</option>
                              <option value="D">Opsi D</option>
                            </select>
                          </Field>

                          <Button
                            type="button"
                            onClick={handleAddQuestionLocal}
                            className="w-full bg-[#2B3A55]/10 hover:bg-[#2B3A55]/20 text-[#2B3A55] h-8 text-xs font-semibold rounded-lg shadow-none border-none"
                          >
                            + Tambahkan ke Daftar Pertanyaan
                          </Button>
                        </div>

                        {/* SUBMIT ACTIONS */}
                        <div className="flex gap-2 pt-2 border-t border-[#E4E1DA]">
                          <Button
                            type="submit"
                            disabled={savingQuiz || !quizTitle.trim() || quizQuestions.length === 0}
                            className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 flex-1 h-9 text-xs font-semibold rounded-lg shadow-none border-none"
                          >
                            {savingQuiz ? "Menyimpan..." : "Simpan Perubahan Kuis"}
                          </Button>
                          {quizId && (
                            <Button
                              type="button"
                              onClick={handleQuizDelete}
                              className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 h-9 text-xs font-semibold rounded-lg shadow-none border-none px-4"
                            >
                              Hapus Kuis
                            </Button>
                          )}
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg p-10 text-xs text-[#6B6862] font-mono">
              Silakan pilih kelas di sebelah kiri untuk mengelola silabus mingguan.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
