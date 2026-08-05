"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { Search, Printer, FileText, CheckCircle, Award, Users, ListCollapse, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// =========================================================================
// KONFIGURASI KOP SURAT & TANDA TANGAN (Silakan edit bagian ini untuk mengubah)
// =========================================================================
const KOP_SURAT = {
  logoPath: "/image/J-PER.png",
  titleAtas: "EKSTRAKULIKULER",
  namaKomunitas: "JAPANESE AND PAPERART COMMUNITY",
  kontakDetail: "Email: info@jper.my.id • Web: jper.my.id",
  kotaSurat: "Bandung",
  penandatanganKiri: "Orang Tua / Wali Siswa",
  penandatanganKanan: "Ketua Kommunitas JPER Community",
  titleTtdKanan: "(Gin Gin Ginaldi)",
}

type Course = {
  id: string
  title: string
}

type Student = {
  id: string
  nama_lengkap: string
  email: string
  angkatan: string
}

type RaporData = {
  weeks: Array<{ id: string; week_number: number; title: string }>
  grades: Array<{
    course_week_id: string
    score: number
    nilai_tugas?: number | null
    nilai_kuis?: number | null
    nilai_kumpulan?: number | null
    note?: string | null
  }>
  attendance: Array<{
    week_id: string
    status: string
  }>
}

type StudentAcademicInfo = {
  nis?: string | null
  nisn?: string | null
  asal_sekolah?: string | null
  kelas?: string | null
}

type SummaryItem = {
  profile_id: string
  nama_lengkap: string
  angkatan: string
  role: string
  kelas_asal: string
  asal_sekolah: string
  attendance_present: number
  attendance_total: number
  avg_tugas: number
  avg_kuis: number
  avg_kumpulan: number
}

interface RaporTabProps {
  token: string
}

export function RaporTab({ token }: RaporTabProps) {
  const [viewType, setViewType] = useState<"siswa" | "keseluruhan">("siswa")
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  
  // States for Individual Student View
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [rapor, setRapor] = useState<RaporData | null>(null)
  
  // States for Class Summary View
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  
  // General states
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

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

  // Fetch members list (for Individual student dropdown)
  useEffect(() => {
    if (selectedCourseId && viewType === "siswa") {
      fetch(`/api/studio/course-access?course_id=${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(accessData => {
          const allowedAngkatan = accessData.allowed_angkatan || []
          const unlockedProfileIds = (accessData.unlock_rows || []).map((r: any) => r.profile_id)

          fetch("/api/studio/members", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(membersData => {
              const list = (membersData.members ?? []).filter((m: any) => {
                if (unlockedProfileIds.includes(m.id)) return true
                if (allowedAngkatan.length === 0 && unlockedProfileIds.length === 0) return true
                const allowedCohortsStr = allowedAngkatan.map(String)
                const studentCohortStr = m.angkatan ? String(m.angkatan) : ""
                return allowedCohortsStr.includes(studentCohortStr)
              })
              setStudents(list)
              if (list.length > 0) {
                setSelectedStudentId(list[0].id)
              } else {
                setSelectedStudentId("")
                setRapor(null)
              }
            })
        })
    }
  }, [selectedCourseId, viewType, token])

  // Fetch Class summary data
  const fetchSummaryData = useCallback(async () => {
    if (!selectedCourseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/studio/rapor/summary?course_id=${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSummaries(data.summaries || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId, token])

  useEffect(() => {
    if (selectedCourseId && viewType === "keseluruhan") {
      void fetchSummaryData()
    }
  }, [selectedCourseId, viewType, fetchSummaryData])

  // Fetch academic info & compile grades for individual view
  const loadRaporData = useCallback(async () => {
    if (!selectedCourseId || !selectedStudentId || viewType !== "siswa") return
    setLoading(true)
    try {
      const res = await fetch(`/api/studio/rapor?course_id=${selectedCourseId}&profile_id=${selectedStudentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRapor(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId, selectedStudentId, viewType, token])

  useEffect(() => {
    if (selectedCourseId && selectedStudentId && viewType === "siswa") {
      void loadRaporData()
    } else {
      setRapor(null)
    }
  }, [selectedCourseId, selectedStudentId, viewType, loadRaporData])

  // Calculate report metrics for individual student
  const getMetrics = () => {
    if (!rapor) return { avgTugas: 0, avgKuis: 0, avgKumpulan: 0, nilaiAkhir: 0, presentPct: 0, totalWeeks: 0, totalPresent: 0 }
    
    let sumTugas = 0
    let countTugas = 0
    let sumKuis = 0
    let countKuis = 0
    let sumKumpulan = 0
    let countKumpulan = 0

    rapor.weeks.forEach(w => {
      const attendance = rapor.attendance.find(a => a.week_id === w.id)
      const isAlpa = attendance?.status === "alpa"

      const grade = rapor.grades.find(g => g.course_week_id === w.id)
      
      let t = isAlpa ? 0 : (grade?.nilai_tugas !== null && grade?.nilai_tugas !== undefined ? Number(grade.nilai_tugas) : null)
      let k = isAlpa ? 0 : (grade?.nilai_kuis !== null && grade?.nilai_kuis !== undefined ? Number(grade.nilai_kuis) : null)
      let kum = isAlpa ? 0 : (grade?.score !== null && grade?.score !== undefined ? Number(grade.score) : null)

      // Fallback week 1 scores to 100 if missing and not absent
      if (w.week_number === 1 && !isAlpa) {
        if (t === null) t = 100
        if (k === null) k = 100
        if (kum === null) kum = 100
      }

      if (t !== null) {
        sumTugas += t
        countTugas++
      }
      if (k !== null) {
        sumKuis += k
        countKuis++
      }
      if (kum !== null) {
        sumKumpulan += kum
        countKumpulan++
      }
    })

    const avgTugas = countTugas > 0 ? Math.round(sumTugas / countTugas) : 0
    const avgKuis = countKuis > 0 ? Math.round(sumKuis / countKuis) : 0
    const avgKumpulan = countKumpulan > 0 ? Math.round(sumKumpulan / countKumpulan) : 0
    const nilaiAkhir = Math.round((avgTugas + avgKuis + avgKumpulan) / 3)

    const presentWeeks = rapor.attendance.filter(a => a.status !== "alpa").length
    const totalAttendanceSess = rapor.attendance.length

    return {
      avgTugas,
      avgKuis,
      avgKumpulan,
      nilaiAkhir,
      presentPct: totalAttendanceSess > 0 ? Math.round((presentWeeks / totalAttendanceSess) * 100) : 0,
      totalWeeks: rapor.weeks.length,
      totalPresent: presentWeeks
    }
  }

  // Get Predicate (Predikat) helper
  const getPredicate = (score: number) => {
    if (score >= 90) return { code: "A", desc: "Sangat Baik (優)" }
    if (score >= 80) return { code: "B", desc: "Baik (良)" }
    if (score >= 70) return { code: "C", desc: "Cukup (可)" }
    return { code: "D", desc: "Kurang (不可)" }
  }

  const handlePrint = () => {
    window.print()
  }

  const metrics = getMetrics()
  const activeStudent = students.find(s => s.id === selectedStudentId) as any
  const activeCourse = courses.find(c => c.id === selectedCourseId)
  const academic = activeStudent?.student_academic_info?.[0] || null

  // Filter lists based on search query
  const filteredStudents = students.filter(s =>
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.angkatan.toString().includes(search)
  )

  const filteredSummaries = summaries.filter(s =>
    s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.kelas_asal.toLowerCase().includes(search.toLowerCase()) ||
    s.asal_sekolah.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Tab Header (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-[#1C1B1A]">Laporan & Cetak Rapor</h2>
          <p className="text-xs text-[#6B6862]">Kompilasi lembar rapor kelulusan siswa dan rekapitulasi nilai kelas JPER Community.</p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-[#FAF9F6] border border-[#E4E1DA] rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => { setViewType("siswa"); setSearch("") }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewType === "siswa"
                ? "bg-[#2B3A55] text-white shadow-sm font-bold"
                : "text-[#6B6862] hover:text-[#1C1B1A]"
            }`}
          >
            <User className="size-3.5" />
            Laporan Per Siswa
          </button>
          <button
            onClick={() => { setViewType("keseluruhan"); setSearch("") }}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewType === "keseluruhan"
                ? "bg-[#2B3A55] text-white shadow-sm font-bold"
                : "text-[#6B6862] hover:text-[#1C1B1A]"
            }`}
          >
            <ListCollapse className="size-3.5" />
            Laporan Keseluruhan Kelas
          </button>
        </div>
      </div>

      {/* Selectors and Control Bar (Hidden when printing) */}
      <Card className="border-[#E4E1DA] bg-white rounded-xl shadow-none print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Pilih Kelas Ekskul</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {viewType === "siswa" && (
              <>
                {/* Student Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Pilih Siswa</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 text-[#1C1B1A] font-semibold focus:outline-none"
                  >
                    {filteredStudents.length === 0 && <option value="">Tidak ada siswa ditemukan</option>}
                    {filteredStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.nama_lengkap} (Angk. {s.angkatan})</option>
                    ))}
                  </select>
                </div>

                {/* Filter Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Filter Siswa</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 text-xs h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-[#1C1B1A] placeholder:text-stone-400 font-semibold focus:outline-none w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {viewType === "keseluruhan" && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-[#6B6862] uppercase tracking-wider block">Cari Nama / Kelas / Sekolah</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
                  <input
                    type="text"
                    placeholder="Cari siswa, kelas asal, atau asal sekolah..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-xs h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-[#1C1B1A] placeholder:text-stone-400 font-semibold focus:outline-none w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {((viewType === "siswa" && rapor) || (viewType === "keseluruhan" && summaries.length > 0)) && (
            <Button
              onClick={handlePrint}
              className="h-9 px-4 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 border-none font-bold shadow-none rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Printer className="size-4" />
              {viewType === "siswa" ? "Cetak Rapor" : "Cetak Rekap Kelas"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-12 text-xs font-mono text-[#6B6862] animate-pulse print:hidden">
          Memuat data laporan...
        </div>
      )}

      {/* VIEW 1: LAPORAN PER SISWA (DETAILED RAPOR SHEET) */}
      {!loading && viewType === "siswa" && rapor && activeStudent && activeCourse && (
        <div className="flex justify-center p-0 md:p-4 bg-[#FAF9F6]">
          {/* Printable Report Card Area */}
          <div className="print-card w-full max-w-[21cm] min-h-[29.7cm] p-[1.5cm] bg-white border border-[#E4E1DA] rounded-xl shadow-sm text-black flex flex-col justify-between">
            {/* Header info */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b-2 border-black/80">
                <div className="flex items-center gap-3">
                  <img src={KOP_SURAT.logoPath} alt="JPER Logo" className="size-14 object-contain" />
                  <div>
                    <h1 className="text-base font-black tracking-wider uppercase leading-none font-serif">{KOP_SURAT.titleAtas}</h1>
                    <h2 className="text-lg font-black tracking-wide leading-none mt-1 text-[#2B3A55]">{KOP_SURAT.namaKomunitas}</h2>
                    <p className="text-[9px] text-[#6B6862] font-mono mt-1 font-semibold">{KOP_SURAT.kontakDetail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono font-bold tracking-widest bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md text-[#2B3A55]">
                    STUDIO OFFICIAL RAPOR
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-black tracking-widest uppercase underline font-serif">LAPORAN HASIL BELAJAR AKADEMIK</h3>
                <p className="text-[10px] text-[#6B6862] font-mono mt-1 uppercase font-semibold">Kelas: {activeCourse.title}</p>
              </div>

              {/* Student Biodata */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-2">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-0.5 text-stone-500 w-24">Nama Siswa</td>
                      <td className="py-0.5 text-stone-900">: {activeStudent.nama_lengkap}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-stone-500">Angkatan</td>
                      <td className="py-0.5 text-stone-900">: {activeStudent.angkatan}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-stone-500">Email</td>
                      <td className="py-0.5 text-stone-900 font-mono">: {activeStudent.email}</td>
                    </tr>
                  </tbody>
                </table>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-0.5 text-stone-500 w-24">NIS / NISN</td>
                      <td className="py-0.5 text-stone-900 font-mono">: {academic?.nis || "-"} / {academic?.nisn || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-stone-500">Kelas Sekolah</td>
                      <td className="py-0.5 text-stone-900">: {academic?.kelas || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-stone-500">Asal Sekolah</td>
                      <td className="py-0.5 text-stone-900">: {academic?.asal_sekolah || "SMAS/SMK/SMP Asal"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grades Table */}
              <table className="w-full text-left border-collapse text-xs border border-stone-300">
                <thead>
                  <tr className="border-b border-stone-300 bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-2.5 border-r border-stone-300 w-12 text-center">Week</th>
                    <th className="p-2.5 border-r border-stone-300">Materi Pertemuan</th>
                    <th className="p-2.5 border-r border-stone-300 text-center w-20">Nilai Tugas</th>
                    <th className="p-2.5 border-r border-stone-300 text-center w-20">Nilai Kuis</th>
                    <th className="p-2.5 border-r border-stone-300 text-center w-20">Kehadiran</th>
                    <th className="p-2.5 border-r border-stone-300 text-center w-20">Kumpulan</th>
                    <th className="p-2.5 text-center w-24">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300 font-medium">
                  {rapor.weeks.map(w => {
                    const grade = rapor.grades.find(g => g.course_week_id === w.id)
                    const att = rapor.attendance.find(a => a.week_id === w.id)
                    const isAlpa = att?.status === "alpa"

                    let tugasVal = isAlpa ? 0 : (grade?.nilai_tugas !== null && grade?.nilai_tugas !== undefined ? Number(grade.nilai_tugas) : null)
                    let kuisVal = isAlpa ? 0 : (grade?.nilai_kuis !== null && grade?.nilai_kuis !== undefined ? Number(grade.nilai_kuis) : null)
                    let kumpulanVal = isAlpa ? 0 : (grade?.score !== null && grade?.score !== undefined ? Number(grade.score) : null)

                    // Seed/fallback week 1 to 100 if null/empty
                    if (w.week_number === 1 && !isAlpa) {
                      if (tugasVal === null) tugasVal = 100
                      if (kuisVal === null) kuisVal = 100
                      if (kumpulanVal === null) kumpulanVal = 100
                    }

                    return (
                      <tr key={w.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-2.5 border-r border-stone-300 text-center font-mono font-bold text-stone-700 bg-stone-50/50">{w.week_number}</td>
                        <td className="p-2.5 border-r border-stone-300 text-stone-900 font-bold">{w.title}</td>
                        <td className="p-2.5 border-r border-stone-300 text-center font-mono font-bold">
                          {tugasVal !== null ? tugasVal : "-"}
                        </td>
                        <td className="p-2.5 border-r border-stone-300 text-center font-mono font-bold">
                          {kuisVal !== null ? kuisVal : "-"}
                        </td>
                        <td className="p-2.5 border-r border-stone-300 text-center uppercase text-[9px] font-bold">
                          {att ? (
                            <span className={isAlpa ? "text-red-600 font-extrabold" : "text-emerald-700"}>
                              {att.status === "hadir" ? "HADIR" : att.status === "sakit" ? "SAKIT" : att.status === "izin" ? "IZIN" : "ALPA"}
                            </span>
                          ) : (
                            <span className="text-red-600 font-extrabold">ALPA</span>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-stone-300 text-center font-mono font-bold text-[#2B3A55] bg-stone-50/30">
                          {kumpulanVal !== null ? kumpulanVal : "-"}
                        </td>
                        <td className="p-2.5 text-center text-[10px] text-stone-600 italic font-semibold max-w-[100px] truncate" title={grade?.note || ""}>
                          {grade?.note || "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Rapor Summary Grid */}
              <div className="grid grid-cols-2 gap-4 border border-stone-300 bg-stone-50 p-4 rounded-xl">
                <div className="space-y-1.5 font-bold text-xs text-stone-700">
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span>Rata-Rata Nilai Tugas:</span>
                    <span className="font-mono text-stone-900">{metrics.avgTugas} / 100</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span>Rata-Rata Nilai Kuis:</span>
                    <span className="font-mono text-stone-900">{metrics.avgKuis} / 100</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span>Rata-Rata Kumpulan:</span>
                    <span className="font-mono text-stone-900">{metrics.avgKumpulan} / 100</span>
                  </div>
                  <div className="flex justify-between text-[#2B3A55] text-xs font-black border-t border-stone-300 pt-1.5">
                    <span>NILAI AKHIR (T+K+Kum)/3:</span>
                    <span className="font-mono text-black font-black">{metrics.nilaiAkhir} / 100</span>
                  </div>
                </div>

                <div className="space-y-1.5 font-bold text-xs text-stone-700 border-l border-stone-300 pl-4">
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span>Total Sesi Pertemuan:</span>
                    <span className="font-mono text-stone-900">{metrics.totalWeeks} Pertemuan</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1">
                    <span>Kehadiran (Hadir/Dispen):</span>
                    <span className="font-mono text-stone-900">{metrics.totalPresent} Sesi ({metrics.presentPct}%)</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-200 pb-1 text-[10px]">
                    <span>PREDIKAT AKHIR:</span>
                    <span className="font-mono text-[#2B3A55] font-black">{getPredicate(metrics.nilaiAkhir).code} — {getPredicate(metrics.nilaiAkhir).desc}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-stone-200 pt-0.5">
                    <span>KEPUTUSAN KELULUSAN:</span>
                    <span className={metrics.nilaiAkhir >= 70 ? "text-emerald-700 font-extrabold" : "text-[#B23A2E] font-extrabold"}>
                      {metrics.nilaiAkhir >= 70 ? "LULUS (合格)" : "TIDAK LULUS (不合格)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature section */}
            <div className="flex justify-between items-end pt-12 text-xs font-semibold">
              <div className="text-center w-48">
                <p className="text-stone-500">Mengetahui,</p>
                <p className="text-stone-900 font-bold mt-1 uppercase">{KOP_SURAT.penandatanganKiri}</p>
                <div className="h-16"></div>
                <div className="border-t border-stone-400 w-full pt-1 text-stone-500">( ___________________ )</div>
              </div>

              {metrics.nilaiAkhir >= 70 && (
                <div className="flex items-center justify-center border-2 border-double border-emerald-600 rounded-full w-20 h-20 rotate-12 text-center text-emerald-600 p-1 bg-white opacity-85 shadow-sm">
                  <div className="border border-dashed border-emerald-400 rounded-full w-full h-full flex flex-col justify-center items-center">
                    <span className="text-[10px] font-black uppercase font-mono tracking-tighter">JPER</span>
                    <span className="text-[11px] font-black leading-none font-serif">合格</span>
                    <span className="text-[8px] font-mono font-bold tracking-tight">PASSED</span>
                  </div>
                </div>
              )}

              <div className="text-center w-48">
                <p className="text-stone-500">{KOP_SURAT.kotaSurat}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="text-[#2B3A55] font-bold mt-1 uppercase">{KOP_SURAT.penandatanganKanan}</p>
                <div className="h-16"></div>
                <div className="border-t border-stone-400 w-full pt-1 text-[#2B3A55] font-bold">{KOP_SURAT.titleTtdKanan}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LAPORAN KESELURUHAN KELAS (SUMMARY CLASS LEDGER) */}
      {!loading && viewType === "keseluruhan" && activeCourse && (
        <div className="flex justify-center p-0 md:p-4 bg-[#FAF9F6]">
          {/* Printable Summary Ledger Sheet */}
          <div className="print-card w-full max-w-[29.7cm] min-h-[21cm] p-[1.2cm] bg-white border border-[#E4E1DA] rounded-xl shadow-sm text-black flex flex-col justify-between">
            <div className="space-y-6">
              {/* Kop Surat */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black/80">
                <div className="flex items-center gap-3">
                  <img src={KOP_SURAT.logoPath} alt="JPER Logo" className="size-12 object-contain" />
                  <div>
                    <h1 className="text-sm font-black tracking-wider uppercase leading-none font-serif">{KOP_SURAT.titleAtas}</h1>
                    <h2 className="text-base font-black tracking-wide leading-none mt-1 text-[#2B3A55]">{KOP_SURAT.namaKomunitas}</h2>
                    <p className="text-[8px] text-[#6B6862] font-mono mt-0.5 font-semibold">{KOP_SURAT.kontakDetail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono font-bold tracking-widest bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[#2B3A55]">
                    REKAPITULASI NILAI AKHIR
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center">
                <h3 className="text-sm font-black tracking-widest uppercase underline font-serif">REKAPITULASI HASIL BELAJAR AKADEMIK KELAS</h3>
                <p className="text-[10px] text-[#6B6862] font-mono mt-1 font-semibold">Kelas: {activeCourse.title} • Semester: Genap / Gasal</p>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-stone-300">
                  <thead>
                    <tr className="border-b border-stone-300 bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[8px]">
                      <th className="p-2 border-r border-stone-300 text-center w-8">No</th>
                      <th className="p-2 border-r border-stone-300">Nama Lengkap</th>
                      <th className="p-2 border-r border-stone-300 text-center w-16">Angkatan</th>
                      <th className="p-2 border-r border-stone-300 w-20">Kelas Asal</th>
                      <th className="p-2 border-r border-stone-300 w-28">Asal Sekolah</th>
                      <th className="p-2 border-r border-stone-300 text-center w-24">Kehadiran</th>
                      <th className="p-2 border-r border-stone-300 text-center w-16">Rata Tugas</th>
                      <th className="p-2 border-r border-stone-300 text-center w-16">Rata Kuis</th>
                      <th className="p-2 border-r border-stone-300 text-center w-16">Rata Kumpulan</th>
                      <th className="p-2 border-r border-stone-300 text-center w-16">Nilai Akhir</th>
                      <th className="p-2 text-center w-28">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-300 font-medium text-stone-900">
                    {filteredSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-[#6B6862] font-mono">
                          Tidak ada data siswa ditemukan untuk kelas ini.
                        </td>
                      </tr>
                    ) : (
                      filteredSummaries.map((item, idx) => {
                        const nilaiAkhir = Math.round((item.avg_tugas + item.avg_kuis + item.avg_kumpulan) / 3)
                        const pred = getPredicate(nilaiAkhir)
                        const attendancePct = item.attendance_total > 0 
                          ? Math.round((item.attendance_present / item.attendance_total) * 100)
                          : 0
                        return (
                          <tr key={item.profile_id} className="hover:bg-stone-50 transition-colors">
                            <td className="p-2 border-r border-stone-300 text-center font-mono text-stone-500">{idx + 1}</td>
                            <td className="p-2 border-r border-stone-300 font-bold">{item.nama_lengkap}</td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono text-stone-600">{item.angkatan}</td>
                            <td className="p-2 border-r border-stone-300 font-semibold">{item.kelas_asal}</td>
                            <td className="p-2 border-r border-stone-300 text-stone-600 truncate max-w-[120px]" title={item.asal_sekolah}>
                              {item.asal_sekolah}
                            </td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono">
                              {item.attendance_present} / {item.attendance_total} ({attendancePct}%)
                            </td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono font-semibold">{item.avg_tugas}</td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono font-semibold">{item.avg_kuis}</td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono font-semibold">{item.avg_kumpulan}</td>
                            <td className="p-2 border-r border-stone-300 text-center font-mono font-black text-[#2B3A55] bg-stone-50/50">
                              {nilaiAkhir}
                            </td>
                            <td className="p-2 text-center font-bold text-[10px]">
                              <span className={nilaiAkhir >= 70 ? "text-emerald-700" : "text-[#B23A2E]"}>
                                {pred.code} — {pred.desc}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Signature Section */}
            <div className="flex justify-between items-end pt-12 text-xs font-semibold">
              <div className="w-48"></div>
              <div className="text-center w-48">
                <p className="text-stone-500">{KOP_SURAT.kotaSurat}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="text-[#2B3A55] font-bold mt-1 uppercase">{KOP_SURAT.penandatanganKanan}</p>
                <div className="h-16"></div>
                <div className="border-t border-stone-400 w-full pt-1 text-[#2B3A55] font-bold">{KOP_SURAT.titleTtdKanan}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print layouts */}
      <style jsx global>{`
        @media print {
          body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header, button, .print-hidden, [role="navigation"], .hidden-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0.8cm !important;
            margin: 0 !important;
            min-height: auto !important;
            height: auto !important;
            font-size: 11px !important;
            page-break-inside: avoid !important;
          }
          .print-card table th, .print-card table td {
            padding: 1.5px 4px !important;
          }
          .print-card .pt-12 {
            padding-top: 1rem !important;
          }
          .print-card .space-y-6 > * + * {
            margin-top: 0.8rem !important;
          }
          .print-card .h-16 {
            height: 1cm !important;
          }
          .print-card .h-20 {
            height: 1.5cm !important;
            width: 1.5cm !important;
          }
        }
      `}</style>
    </div>
  )
}
