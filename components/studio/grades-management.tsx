"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Search, Edit3, ExternalLink, AlertCircle, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

type Student = {
  id: string
  nama_lengkap: string
  email: string
  angkatan: string
}

type Grade = {
  id?: string
  profile_id: string
  course_week_id: string
  score: number | string
  note: string
  nilai_tugas?: number | string | null
  nilai_kuis?: number | string | null
  nilai_kumpulan?: number | string | null
}

interface GradesManagementProps {
  token: string
}

export function GradesManagement({ token }: GradesManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>("")
  
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Record<string, Grade>>({}) // Keyed by profile_id
  const [overallAverages, setOverallAverages] = useState<Record<string, number>>({})
  const [weekAssignments, setWeekAssignments] = useState<Array<{ id: string; title: string }>>([])
  const [submissions, setSubmissions] = useState<Array<{ id: string; module_id: string; profile_id: string; file_url: string; file_name: string; submitted_at: string }>>([])
  const [weekQuizzes, setWeekQuizzes] = useState<Array<{ id: string; title: string }>>([])
  const [quizAnswers, setQuizAnswers] = useState<Array<{ id: string; quiz_id: string; profile_id: string; score: number | null; selected_answers: any }>>([])
  const [quizQuestions, setQuizQuestions] = useState<Array<{ id: string; quiz_id: string; question: string; options: string[] | null; answer: string; type: string }>>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
  
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({})

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStudent, setModalStudent] = useState<Student | null>(null)
  const [modalTugas, setModalTugas] = useState<string>("")
  const [modalKuis, setModalKuis] = useState<string>("")
  const [modalKumpulan, setModalKumpulan] = useState<string>("")
  const [modalNote, setModalNote] = useState<string>("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(30)

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

  // Fetch students list (profiles with role='student' who have access to the selected course) & existing grades for the selected week
  const fetchStudentsAndGrades = useCallback(async () => {
    if (!selectedWeekId || !selectedCourseId) return
    setLoading(true)
    try {
      // 1. Fetch course access data
      const accessRes = await fetch(`/api/studio/course-access?course_id=${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      let allowedAngkatan: string[] = []
      let unlockedProfileIds: string[] = []
      if (accessRes.ok) {
        const accessData = await accessRes.json()
        allowedAngkatan = accessData.allowed_angkatan || []
        unlockedProfileIds = (accessData.unlock_rows || []).map((r: any) => r.profile_id)
      }

      // 2. Fetch members list
      const membersRes = await fetch("/api/studio/members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const membersData = await membersRes.json()
      const studentsList = (membersData.members ?? []).filter((m: { role: string; id: string; angkatan: string }) => {
        if (unlockedProfileIds.includes(m.id)) return true
        if (allowedAngkatan.length === 0 && unlockedProfileIds.length === 0) return true
        
        const allowedCohortsStr = allowedAngkatan.map(String)
        const studentCohortStr = m.angkatan ? String(m.angkatan) : ""
        return allowedCohortsStr.includes(studentCohortStr)
      })
      setStudents(studentsList)

      // 3. Fetch existing grades, overall averages, assignments and submissions for this week
      const gradesRes = await fetch(`/api/studio/grades?course_week_id=${selectedWeekId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const gradesData = await gradesRes.json()
      const gradesList: Grade[] = gradesData.grades ?? []
      
      // Map list to profile_id map
      const mapped: Record<string, Grade> = {}
      gradesList.forEach(g => {
        mapped[g.profile_id] = g
      })
      setGrades(mapped)
      setOverallAverages(gradesData.overallAverages || {})
      setWeekAssignments(gradesData.assignments || [])
      setSubmissions(gradesData.submissions || [])
      setWeekQuizzes(gradesData.quizzes || [])
      setQuizAnswers(gradesData.quizAnswers || [])
      setQuizQuestions(gradesData.quizQuestions || [])
      setAttendanceMap(gradesData.attendanceMap || {})
      setSaveStatus({})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedWeekId, selectedCourseId, token])

  useEffect(() => {
    if (selectedWeekId && selectedCourseId) {
      void fetchStudentsAndGrades()
    } else {
      setStudents([])
      setGrades({})
      setOverallAverages({})
      setWeekAssignments([])
      setSubmissions([])
      setWeekQuizzes([])
      setQuizAnswers([])
      setQuizQuestions([])
      setAttendanceMap({})
    }
  }, [selectedWeekId, selectedCourseId, fetchStudentsAndGrades])

  // Open modal dialog for detailed grading
  const openEditModal = (student: Student) => {
    const isAbsent = attendanceMap[student.id] === "alpa"
    const hasSubmitted = submissions.some(s => s.profile_id === student.id)
    const studentQuizAnswers = quizAnswers.filter(qa => qa.profile_id === student.id)
    const bestQuizScore = studentQuizAnswers.length > 0
      ? Math.max(...studentQuizAnswers.map(qa => qa.score || 0))
      : null

    const dbGrade = grades[student.id] || {}

    let finalTugas = dbGrade.nilai_tugas !== null && dbGrade.nilai_tugas !== undefined ? String(dbGrade.nilai_tugas) : ""
    let finalKuis = dbGrade.nilai_kuis !== null && dbGrade.nilai_kuis !== undefined ? String(dbGrade.nilai_kuis) : ""
    let finalKumpulan = dbGrade.nilai_kumpulan !== null && dbGrade.nilai_kumpulan !== undefined 
      ? String(dbGrade.nilai_kumpulan) 
      : (dbGrade.score !== null && dbGrade.score !== undefined ? String(dbGrade.score) : "")
    let finalNote = dbGrade.note || ""

    if (isAbsent) {
      finalTugas = "0"
      finalKuis = "0"
      finalKumpulan = "0"
      finalNote = "Otomatis 0 (Absen Alpa)"
    } else {
      if (finalTugas === "" && !hasSubmitted) finalTugas = "0"
      if (finalKuis === "") finalKuis = bestQuizScore !== null ? String(bestQuizScore) : "0"
      if (finalKumpulan === "") {
        const t = finalTugas ? Number(finalTugas) : 0
        const k = finalKuis ? Number(finalKuis) : 0
        finalKumpulan = String(Math.round((t + k) / 2))
      }
    }

    setModalStudent(student)
    setModalTugas(finalTugas)
    setModalKuis(finalKuis)
    setModalKumpulan(finalKumpulan)
    setModalNote(finalNote)
    setIsModalOpen(true)
  }

  // Save detailed grades from modal
  const handleSaveModalGrade = async () => {
    if (!modalStudent || !selectedWeekId) return
    const studentId = modalStudent.id
    
    setSaveStatus((prev) => ({ ...prev, [studentId]: "saving" }))
    setIsModalOpen(false)

    try {
      const res = await fetch("/api/studio/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_id: studentId,
          course_week_id: selectedWeekId,
          nilai_tugas: modalTugas !== "" ? parseInt(modalTugas) : null,
          nilai_kuis: modalKuis !== "" ? parseInt(modalKuis) : null,
          nilai_kumpulan: modalKumpulan !== "" ? parseInt(modalKumpulan) : null,
          score: modalKumpulan !== "" ? parseInt(modalKumpulan) : 0, // Fallback score
          note: modalNote.trim(),
        }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan.")
      const data = await res.json()

      setGrades((prev) => ({
        ...prev,
        [studentId]: data.grade,
      }))
      setSaveStatus((prev) => ({ ...prev, [studentId]: "saved" }))
      
      // Reload overall averages
      void fetchStudentsAndGrades()
    } catch {
      setSaveStatus((prev) => ({ ...prev, [studentId]: "error" }))
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  )

  // Pagination calculation
  const totalItems = filteredStudents.length
  const totalPages = Math.ceil(totalItems / limit)
  const startIndex = (currentPage - 1) * limit
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + limit)

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
        <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A]">Lembar Penilaian Siswa</CardTitle>
            <CardDescription className="text-xs">Kelola nilai tugas, kuis, dan nilai kumpulan siswa per angkatan.</CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            {/* Course Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Pilih Kelas Ekskul</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value)
                  setCurrentPage(1)
                }}
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
                onChange={(e) => {
                  setSelectedWeekId(e.target.value)
                  setCurrentPage(1)
                }}
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
        <CardContent className="pt-4 space-y-4">
          {/* Search & Limit dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-[#6B6862]" />
              <Input
                placeholder="Cari siswa..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8 border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 rounded-lg"
              />
            </div>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 px-2 rounded-lg text-[#1C1B1A] font-semibold focus:outline-none"
            >
              <option value={30}>30 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs text-[#6B6862] font-mono">Memuat lembar penilaian...</div>
          ) : !selectedWeekId ? (
            <div className="text-center py-10 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
              Pilih kelas dan pertemuan terlebih dahulu untuk memuat daftar siswa.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
              Tidak ada siswa aktif yang ditemukan.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-[#E4E1DA] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono bg-[#FAF9F6]">
                      <th className="p-3 font-medium">Nama Siswa & Kontak</th>
                      <th className="p-3 font-medium">Angkatan</th>
                      <th className="p-3 font-medium text-center">Nilai Tugas</th>
                      <th className="p-3 font-medium text-center">Nilai Kuis</th>
                      <th className="p-3 font-medium text-center">Nilai Kumpulan</th>
                      <th className="p-3 font-medium">Keterangan</th>
                      <th className="p-3 font-medium text-right w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => {
                      const isAbsent = attendanceMap[student.id] === "alpa"
                      const hasSubmitted = submissions.some(s => s.profile_id === student.id)
                      const studentQuizAnswers = quizAnswers.filter(qa => qa.profile_id === student.id)
                      const bestQuizScore = studentQuizAnswers.length > 0
                        ? Math.max(...studentQuizAnswers.map(qa => qa.score || 0))
                        : null

                      const dbGrade = grades[student.id] || {}
                      const status = saveStatus[student.id] || "idle"

                      // Fallbacks
                      let finalTugas = dbGrade.nilai_tugas !== null && dbGrade.nilai_tugas !== undefined ? Number(dbGrade.nilai_tugas) : null
                      let finalKuis = dbGrade.nilai_kuis !== null && dbGrade.nilai_kuis !== undefined ? Number(dbGrade.nilai_kuis) : null
                      let finalKumpulan = dbGrade.nilai_kumpulan !== null && dbGrade.nilai_kumpulan !== undefined 
                        ? Number(dbGrade.nilai_kumpulan) 
                        : (dbGrade.score !== null && dbGrade.score !== undefined ? Number(dbGrade.score) : null)

                      if (isAbsent) {
                        finalTugas = 0
                        finalKuis = 0
                        finalKumpulan = 0
                      } else {
                        if (finalTugas === null && !hasSubmitted) finalTugas = 0
                        if (finalKuis === null) finalKuis = bestQuizScore !== null ? bestQuizScore : 0
                        if (finalKumpulan === null) {
                          finalKumpulan = Math.round(((finalTugas || 0) + (finalKuis || 0)) / 2)
                        }
                      }

                      return (
                        <tr key={student.id} className="border-b border-[#E4E1DA]/50 hover:bg-[#E4E1DA]/10 transition-colors last:border-none">
                          <td className="p-3">
                            <div className="font-semibold text-[#1C1B1A] flex items-center gap-1.5">
                              {student.nama_lengkap}
                              {isAbsent && (
                                <span className="text-[8px] font-mono font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded border border-red-200">
                                  ALPA
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#6B6862] font-mono">{student.email}</div>
                          </td>
                          <td className="p-3 font-mono">
                            {student.angkatan}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            {finalTugas !== null ? (
                              <span className={finalTugas >= 70 ? "text-emerald-700" : "text-[#B23A2E]"}>
                                {finalTugas}
                              </span>
                            ) : (
                              <span className="text-[#6B6862] italic text-[10px]">Belum Dinilai</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            {finalKuis !== null ? (
                              <span className={finalKuis >= 70 ? "text-emerald-700" : "text-[#B23A2E]"}>
                                {finalKuis}
                              </span>
                            ) : (
                              <span className="text-[#6B6862] italic text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {finalKumpulan !== null ? (
                              <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                                finalKumpulan >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                finalKumpulan >= 70 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {finalKumpulan} / 100
                              </span>
                            ) : (
                              <span className="text-[#6B6862]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-stone-600 max-w-[150px] truncate" title={dbGrade.note || ""}>
                            {dbGrade.note || <span className="text-stone-300 italic text-[10px]">-</span>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {status === "saving" && <span className="text-[10px] font-mono text-[#6B6862] animate-pulse">Saving...</span>}
                              {status === "saved" && <span className="text-[10px] font-mono text-emerald-600 font-semibold">Saved</span>}
                              {status === "error" && <span className="text-[10px] font-mono text-[#B23A2E]">Failed</span>}
                              
                              <Button
                                size="sm"
                                onClick={() => openEditModal(student)}
                                className="h-8 px-2.5 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-none border-none"
                              >
                                <Edit3 className="size-3" />
                                Edit Nilai
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA] text-[11px]">
                <div className="text-[#6B6862]">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + limit, totalItems)} dari {totalItems} siswa
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                  >
                    Sebelumnya
                  </Button>
                  <span className="font-mono text-[10px] text-[#1C1B1A]">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Grades Dialog Box Modal */}
      {isModalOpen && modalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col text-[#1C1B1A]">
            <div className="p-4 border-b border-[#E4E1DA] bg-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-[#1C1B1A]">Edit Lembar Nilai Siswa</h4>
                <p className="text-[10px] text-[#6B6862] font-mono">{modalStudent.nama_lengkap} • Angkatan {modalStudent.angkatan}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-mono"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
              {attendanceMap[modalStudent.id] === "alpa" && (
                <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E] flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>Siswa ini tercatat <strong>ALPA (Tidak Hadir)</strong> minggu ini. Semua nilai tugas, kuis, dan kumpulan otomatis dikunci menjadi 0.</span>
                </div>
              )}

              {/* 1. TUGAS / ASSIGNMENT */}
              <div className="space-y-1.5 pb-3 border-b border-[#E4E1DA]/60">
                <div className="text-[11px] font-bold text-[#6B6862] uppercase tracking-wider">Nilai Tugas</div>
                {/* Submission file preview links */}
                <div className="text-[10px] pb-1">
                  {submissions.filter(s => s.profile_id === modalStudent.id).length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[#6B6862] block mb-0.5 font-medium">Berkas tugas yang diunggah siswa:</span>
                      {submissions.filter(s => s.profile_id === modalStudent.id).map(sub => {
                        const assignment = weekAssignments.find(a => a.id === sub.module_id)
                        return (
                          <a
                            key={sub.id}
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 bg-white border border-[#E4E1DA] p-1.5 rounded-lg w-full"
                          >
                            📎 {assignment ? assignment.title : "Tugas"}: {sub.file_name || "File"}
                            <ExternalLink className="size-3 ml-auto text-stone-400" />
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-[#B23A2E] font-semibold font-mono bg-red-50 border border-red-200/50 px-2 py-1 rounded block text-center">
                      ⚠️ Belum mengumpulkan tugas (Otomatis 0)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#1C1B1A] font-medium">Input Nilai Tugas:</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={modalTugas}
                    disabled={attendanceMap[modalStudent.id] === "alpa"}
                    onChange={(e) => {
                      setModalTugas(e.target.value)
                      // Auto calculate average
                      const t = Number(e.target.value || 0)
                      const k = Number(modalKuis || 0)
                      setModalKumpulan(String(Math.round((t + k) / 2)))
                    }}
                    className="w-20 font-mono text-xs h-8 bg-white border-[#E4E1DA] rounded disabled:bg-red-50 disabled:text-red-700 disabled:border-red-100"
                  />
                </div>
              </div>

              {/* 2. KUIS */}
              <div className="space-y-1.5 pb-3 border-b border-[#E4E1DA]/60">
                <div className="text-[11px] font-bold text-[#6B6862] uppercase tracking-wider">Nilai Kuis LMS</div>
                <div className="text-[10px] pb-1">
                  {quizAnswers.filter(qa => qa.profile_id === modalStudent.id).length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[#6B6862] block mb-0.5 font-medium">Pengerjaan kuis otomatis oleh siswa:</span>
                      {quizAnswers.filter(qa => qa.profile_id === modalStudent.id).map(qa => {
                        const quiz = weekQuizzes.find(q => q.id === qa.quiz_id)
                        return (
                          <div key={qa.id} className="space-y-1.5 bg-white border border-[#E4E1DA] p-2.5 rounded-lg text-[#1C1B1A]">
                            <div className="font-semibold flex justify-between items-center font-mono text-[10px]">
                              <span>📝 {quiz ? quiz.title : "Kuis"}</span>
                              <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9px]">
                                Auto: {qa.score !== null ? `${qa.score} / 100` : "Awaiting Essay Review"}
                              </span>
                            </div>

                            {/* Collapsible Questions Detail Review */}
                            {(() => {
                              const studentAnswers = qa.selected_answers || {}
                              const qList = quizQuestions.filter(q => q.quiz_id === qa.quiz_id)
                              if (qList.length === 0) {
                                return <div className="text-[9px] text-stone-400 italic">Tidak ada rincian soal kuis ditemukan.</div>
                              }
                              
                              let correctCount = 0
                              qList.forEach(q => {
                                const qType = q.type || "multiple_choice"
                                const ans = studentAnswers[q.id]
                                if (qType === "multiple_select") {
                                  try {
                                    const correctArr = JSON.parse(q.answer) as string[]
                                    const studentArr = Array.isArray(ans)
                                      ? ans
                                      : (typeof ans === "string" && ans.startsWith("[") ? JSON.parse(ans) : [ans].filter(Boolean))
                                    const cSorted = [...correctArr].map(x => String(x).trim().toLowerCase()).sort()
                                    const sSorted = [...studentArr].map(x => String(x).trim().toLowerCase()).sort()
                                    if (JSON.stringify(cSorted) === JSON.stringify(sSorted)) {
                                      correctCount++
                                    }
                                  } catch {
                                    if (ans && String(ans).trim().toLowerCase() === q.answer.trim().toLowerCase()) {
                                      correctCount++
                                    }
                                  }
                                } else {
                                  if (ans && String(ans).trim().toLowerCase() === q.answer.trim().toLowerCase()) {
                                    correctCount++
                                  }
                                }
                              })

                              return (
                                <details className="mt-2 bg-[#FAF9F6] border border-[#E4E1DA]/60 rounded-lg p-2 text-[10px] text-[#1C1B1A]">
                                  <summary className="cursor-pointer font-bold text-[#2B3A55] select-none hover:underline">
                                    👁️ Tinjau Detail Jawaban ({correctCount} / {qList.length} Benar)
                                  </summary>
                                  <div className="space-y-3 mt-2.5 pt-2.5 border-t border-[#E4E1DA]/60 max-h-60 overflow-y-auto">
                                    {qList.map((q, idx) => {
                                      const qType = q.type || "multiple_choice"
                                      const ans = studentAnswers[q.id]
                                      
                                      let isCorrect = false
                                      let studentChoiceList: string[] = []
                                      let correctList: string[] = []
                                      
                                      if (qType === "multiple_select") {
                                        try {
                                          correctList = JSON.parse(q.answer) as string[]
                                          studentChoiceList = typeof ans === "string" && ans.startsWith("[")
                                            ? JSON.parse(ans) as string[]
                                            : (ans ? [ans] : [])
                                          const cSorted = [...correctList].map(x => x.trim().toLowerCase()).sort()
                                          const sSorted = [...studentChoiceList].map(x => x.trim().toLowerCase()).sort()
                                          isCorrect = JSON.stringify(cSorted) === JSON.stringify(sSorted)
                                        } catch {
                                          isCorrect = ans?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                                        }
                                      } else {
                                        isCorrect = ans?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                                      }

                                      return (
                                        <div key={q.id} className="p-2 rounded bg-white border border-[#E4E1DA]/60 space-y-1 text-[10px]">
                                          <div className="font-semibold text-stone-900">{idx + 1}. {q.question}</div>
                                          <div className="text-[9px]">
                                            <span className="text-stone-500">Tipe: </span>
                                            <span className="font-bold uppercase text-[8px] bg-stone-100 px-1 py-0.5 rounded text-stone-600">
                                              {qType === "multiple_select" ? "Pilihan Ganda Kompleks" : qType === "short_answer" ? "Isian Singkat" : "Pilihan Ganda"}
                                            </span>
                                          </div>
                                          <div className="text-[10px] font-mono mt-1">
                                            <span className="text-stone-500">Jawaban Siswa: </span>
                                            {qType === "short_answer" ? (
                                              <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                {ans || <span className="italic text-red-500">Tidak menjawab</span>}
                                              </span>
                                            ) : ans ? (
                                              <span className={isCorrect ? "text-emerald-700 font-bold" : "text-[#B23A2E] font-bold"}>
                                                {qType === "multiple_select" ? studentChoiceList.join(", ") : ans}
                                              </span>
                                            ) : (
                                              <span className="text-red-500 italic font-bold">Tidak Menjawab</span>
                                            )}
                                          </div>
                                          <div className="text-[10px] font-mono">
                                            <span className="text-stone-500">Kunci Jawaban: </span>
                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                              {qType === "multiple_select" ? JSON.parse(q.answer).join(", ") : q.answer}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </details>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-[#B23A2E] font-semibold font-mono bg-red-50 border border-red-200/50 px-2 py-1 rounded block text-center">
                      ⚠️ Belum mengerjakan kuis (Otomatis 0)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#1C1B1A] font-medium">Input Nilai Kuis:</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={modalKuis}
                    disabled={attendanceMap[modalStudent.id] === "alpa"}
                    onChange={(e) => {
                      setModalKuis(e.target.value)
                      // Auto calculate average
                      const t = Number(modalTugas || 0)
                      const k = Number(e.target.value || 0)
                      setModalKumpulan(String(Math.round((t + k) / 2)))
                    }}
                    className="w-20 font-mono text-xs h-8 bg-white border-[#E4E1DA] rounded disabled:bg-red-50 disabled:text-red-700 disabled:border-red-100"
                  />
                </div>
              </div>

              {/* 3. KUMPULAN */}
              <div className="space-y-1.5 pb-3 border-b border-[#E4E1DA]/60">
                <div className="text-[11px] font-bold text-[#6B6862] uppercase tracking-wider">Nilai Kumpulan (Akumulasi / Minggu Ini)</div>
                <p className="text-[9px] text-[#6B6862]">Rata-rata otomatis dari tugas & kuis. Bisa Anda override di bawah ini.</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#1C1B1A] font-medium">Nilai Kumpulan:</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={modalKumpulan}
                    disabled={attendanceMap[modalStudent.id] === "alpa"}
                    onChange={(e) => setModalKumpulan(e.target.value)}
                    className="w-20 font-mono text-xs h-8 bg-white border-[#E4E1DA] rounded disabled:bg-red-50 disabled:text-red-700 disabled:border-red-100 font-bold"
                  />
                </div>
              </div>

              {/* 4. KETERANGAN */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#6B6862] uppercase tracking-wider">Keterangan / Catatan Evaluasi</div>
                <Input
                  placeholder="Contoh: Pemahaman partikel sangat baik, pengerjaan tugas tepat waktu..."
                  value={modalNote}
                  disabled={attendanceMap[modalStudent.id] === "alpa"}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full text-xs h-9 bg-white border-[#E4E1DA] rounded disabled:bg-stone-100 disabled:text-stone-400 font-semibold"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-[#E4E1DA] bg-white flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs h-9 rounded-lg border-[#E4E1DA] bg-[#FAF9F6] text-[#1C1B1A] font-semibold"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveModalGrade}
                className="text-xs h-9 rounded-lg bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 font-bold border-none"
              >
                Simpan Lembar Nilai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
