"use client"

import React, { useEffect, useState, useCallback } from "react"
import { ClipboardList, Save, Search } from "lucide-react"
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
  score: number
  note: string
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
  
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  
  // Row-level save status indicators
  const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({})

  // Fetch initial course list
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/courses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setCourses(data.courses ?? [])
      if (data.courses?.length > 0) {
        setTimeout(() => {
          setSelectedCourseId(data.courses[0].id)
        }, 0)
      }
    } catch (err) {
      console.error("Gagal mengambil data kelas", err)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCourses()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchCourses])

  // Fetch weeks when course changes
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

  // Fetch students list (profiles with role='student') & existing grades for the selected week
  const fetchStudentsAndGrades = useCallback(async () => {
    if (!selectedWeekId) return
    setTimeout(() => {
      setLoading(true)
    }, 0)
    try {
      // 1. Fetch members list
      const membersRes = await fetch("/api/studio/members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const membersData = await membersRes.json()
      const studentsList = (membersData.members ?? []).filter((m: { role: string }) => m.role === "student")
      setStudents(studentsList)

      // 2. Fetch existing grades for this week
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
      setSaveStatus({})
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 0)
    }
  }, [selectedWeekId, token])

  useEffect(() => {
    if (selectedWeekId) {
      const timer = setTimeout(() => {
        void fetchStudentsAndGrades()
      }, 0)
      return () => clearTimeout(timer)
    } else {
      setTimeout(() => {
        setStudents([])
        setGrades({})
      }, 0)
    }
  }, [selectedWeekId, fetchStudentsAndGrades])

  // Handle score / note change in local state
  const handleGradeChange = (studentId: string, field: "score" | "note", value: string) => {
    setGrades(prev => {
      const current = prev[studentId] || {
        profile_id: studentId,
        course_week_id: selectedWeekId,
        score: 0,
        note: ""
      }
      
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: field === "score" ? (value === "" ? 0 : parseInt(value)) : value
        }
      }
    })
  }

  // Handle Save Grade per Row
  const handleSaveGrade = async (studentId: string) => {
    const record = grades[studentId] || {
      profile_id: studentId,
      course_week_id: selectedWeekId,
      score: 0,
      note: ""
    }

    setSaveStatus(prev => ({ ...prev, [studentId]: "saving" }))
    try {
      const res = await fetch("/api/studio/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(record),
      })

      if (!res.ok) {
        throw new Error()
      }

      setSaveStatus(prev => ({ ...prev, [studentId]: "saved" }))
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [studentId]: "idle" }))
      }, 1500)
    } catch {
      setSaveStatus(prev => ({ ...prev, [studentId]: "error" }))
    }
  }

  const filteredStudents = students.filter(s => 
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg text-[#1C1B1A]">
      <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <ClipboardList className="size-5 text-[#2B3A55]" />
            Input Nilai Pertemuan Siswa
          </CardTitle>
          <CardDescription className="text-[10px] text-[#6B6862]">
            Berikan penilaian untuk tugas/kuis siswa berdasarkan minggu pertemuan
          </CardDescription>
        </div>

        {/* Selection filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 px-2 rounded-lg text-[#1C1B1A] focus:outline-none"
          >
            <option value="" disabled>Pilih Kelas</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            disabled={weeks.length === 0}
            className="border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 px-2 rounded-lg text-[#1C1B1A] focus:outline-none"
          >
            <option value="" disabled>Pilih Pertemuan</option>
            {weeks.map(w => (
              <option key={w.id} value={w.id}>Minggu {w.week_number}: {w.title}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2 size-3.5 text-[#6B6862]" />
          <Input
            placeholder="Cari siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 rounded-lg"
          />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                  <th className="py-2 font-medium">Nama Siswa & Kontak</th>
                  <th className="py-2 font-medium">Angkatan</th>
                  <th className="py-2 font-medium w-24">Skor (0-100)</th>
                  <th className="py-2 font-medium">Catatan / Keterangan</th>
                  <th className="py-2 font-medium text-right w-24">Simpan</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const item = grades[student.id] || { score: "", note: "" }
                  const status = saveStatus[student.id] || "idle"
                  
                  return (
                    <tr key={student.id} className="border-b border-[#E4E1DA]/50 hover:bg-[#E4E1DA]/10 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-[#1C1B1A]">{student.nama_lengkap}</div>
                        <div className="text-[10px] text-[#6B6862] font-mono">{student.email}</div>
                      </td>
                      <td className="py-3 font-mono">
                        {student.angkatan}
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          value={item.score}
                          onChange={(e) => handleGradeChange(student.id, "score", e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg w-16 font-mono"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <Input
                          placeholder="Tugas lengkap / Perlu perbaikan huruf..."
                          value={item.note || ""}
                          onChange={(e) => handleGradeChange(student.id, "note", e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg w-full"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === "saving" && <span className="text-[10px] font-mono text-[#6B6862] animate-pulse">Saving...</span>}
                          {status === "saved" && <span className="text-[10px] font-mono text-emerald-600 font-semibold">Saved</span>}
                          {status === "error" && <span className="text-[10px] font-mono text-[#B23A2E]">Failed</span>}
                          
                          <Button
                            size="sm"
                            onClick={() => handleSaveGrade(student.id)}
                            className="h-8 w-8 p-0 bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 rounded-lg border-none flex items-center justify-center"
                            title="Simpan Nilai"
                          >
                            <Save className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
