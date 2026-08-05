"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Search, Download, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

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

type Submission = {
  id: string
  module_id: string
  profile_id: string
  file_url: string
  file_name: string
  submitted_at: string
  student_name: string
  student_angkatan: string
  week_title: string
  assignment_title: string
}

interface SubmissionsTabProps {
  token: string
}

export function SubmissionsTab({ token }: SubmissionsTabProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>("all")
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

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
          setSelectedWeekId("all")
        })
    }
  }, [selectedCourseId, token])

  // Fetch all submissions for course & optional week
  const fetchSubmissions = useCallback(async () => {
    if (!selectedCourseId) return
    setLoading(true)
    try {
      // 1. Fetch weeks details to map week names
      const weeksRes = await fetch(`/api/studio/weeks?course_id=${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const weeksData = await weeksRes.json()
      const wList: CourseWeek[] = weeksData.weeks || []
      const wMap = wList.reduce((acc, w) => {
        acc[w.id] = `Pertemuan ${w.week_number}: ${w.title}`
        return acc
      }, {} as Record<string, string>)

      // 2. Fetch assignment modules for this course
      const wIdsQuery = wList.map(w => w.id)
      if (wIdsQuery.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // Fetch grades data for each week to get all submissions
      const allSubsPromises = wList
        .filter(w => selectedWeekId === "all" || w.id === selectedWeekId)
        .map(async (w) => {
          const res = await fetch(`/api/studio/grades?course_week_id=${w.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!res.ok) return []
          const data = await res.json()
          
          const weekSubs: Submission[] = (data.submissions || []).map((s: any) => {
            const assignmentItem = data.assignments?.find((a: any) => a.id === s.module_id)
            
            return {
              id: s.id,
              module_id: s.module_id,
              profile_id: s.profile_id,
              file_url: s.file_url,
              file_name: s.file_name,
              submitted_at: s.submitted_at,
              student_name: s.student_name || "Siswa JPER",
              student_angkatan: s.student_angkatan || "-",
              week_title: wMap[w.id] || "Materi Week",
              assignment_title: assignmentItem?.title || "Tugas Mandiri",
            }
          })
          return weekSubs
        })

      const resolvedSubs = await Promise.all(allSubsPromises)
      const mergedSubs = resolvedSubs.flat().sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      
      // Fetch student details to override student names and angkatan
      const membersRes = await fetch("/api/studio/members", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (membersRes.ok) {
        const membersData = await membersRes.json()
        const membersMap = (membersData.members || []).reduce((acc: any, m: any) => {
          acc[m.id] = { name: m.nama_lengkap, angkatan: m.angkatan }
          return acc
        }, {} as Record<string, { name: string; angkatan: string }>)
        
        mergedSubs.forEach(s => {
          if (membersMap[s.profile_id]) {
            s.student_name = membersMap[s.profile_id].name
            s.student_angkatan = membersMap[s.profile_id].angkatan
          }
        })
      }

      setSubmissions(mergedSubs)
      setCurrentPage(1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId, selectedWeekId, token])

  useEffect(() => {
    if (selectedCourseId) {
      void fetchSubmissions()
    }
  }, [selectedCourseId, selectedWeekId, fetchSubmissions])

  // Filter submissions by search query
  const filteredSubmissions = submissions.filter(s => {
    const q = search.toLowerCase()
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.student_angkatan.toString().includes(q) ||
      s.assignment_title.toLowerCase().includes(q) ||
      s.file_name.toLowerCase().includes(q)
    )
  })

  // Pagination calculations
  const totalItems = filteredSubmissions.length
  const totalPages = Math.ceil(totalItems / limit)
  const startIndex = (currentPage - 1) * limit
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-black tracking-tight text-[#1C1B1A]">Daftar Tugas & Submission Siswa</h2>
        <p className="text-xs text-[#6B6862]">Unduh dan periksa berkas tugas yang diunggah oleh siswa kelas ekskul.</p>
      </div>

      {/* Selectors card */}
      <Card className="border-[#E4E1DA] bg-white rounded-xl shadow-none">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider">Pilih Kelas Ekskul</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider">Pertemuan/Week</label>
            <select
              value={selectedWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none max-w-xs"
            >
              <option value="all">Semua Pertemuan</option>
              {weeks.map(w => (
                <option key={w.id} value={w.id}>Week {w.week_number}: {w.title}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider">Cari Nama / Tugas / Berkas</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
              <Input
                placeholder="Cari siswa atau nama tugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 border-[#E4E1DA] bg-[#FAF9F6] text-[#1C1B1A] placeholder:text-stone-400 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider">Tampilkan</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2 text-[#1C1B1A] font-semibold focus:outline-none"
            >
              <option value={30}>30 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List Card */}
      <Card className="border-[#E4E1DA] bg-white rounded-xl shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-xs font-mono text-[#6B6862] animate-pulse">
              Memuat berkas submission...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-16 text-[#6B6862] space-y-3">
              <Inbox className="size-10 mx-auto text-[#E4E1DA]" />
              <div className="text-xs font-semibold">Tidak ada berkas tugas ditemukan.</div>
              <p className="text-[10px] text-stone-400">Belum ada siswa yang mengunggah tugas pada pertemuan ini.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-[#1C1B1A]">
                  <thead>
                    <tr className="border-b border-[#E4E1DA] bg-[#FAF9F6] text-[#6B6862] font-semibold text-[10px] uppercase tracking-wider">
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Angkatan</th>
                      <th className="p-3">Pertemuan</th>
                      <th className="p-3">Judul Tugas</th>
                      <th className="p-3">Nama Berkas</th>
                      <th className="p-3">Dikirim</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E1DA]/50">
                    {paginatedSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-3 font-bold">{sub.student_name}</td>
                        <td className="p-3 font-mono">{sub.student_angkatan}</td>
                        <td className="p-3 text-[#6B6862] font-medium">{sub.week_title}</td>
                        <td className="p-3 font-semibold text-[#2B3A55]">{sub.assignment_title}</td>
                        <td className="p-3 font-mono text-[#6B6862] truncate max-w-xs" title={sub.file_name}>
                          {sub.file_name}
                        </td>
                        <td className="p-3 text-stone-500 font-mono">
                          {new Date(sub.submitted_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-[#E4E1DA]/20 text-[#1C1B1A] px-2.5 py-1.5 rounded-lg shadow-none"
                          >
                            <Download className="size-3" />
                            Unduh
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between p-4 border-t border-[#E4E1DA] text-[11px]">
                <div className="text-[#6B6862]">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + limit, totalItems)} dari {totalItems} berkas
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
    </div>
  )
}
