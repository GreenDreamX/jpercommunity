"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Users, BookOpen, Calendar, Award, AlertTriangle, RefreshCw, BarChart2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type AnalyticsData = {
  stats: {
    totalStudents: number
    totalCourses: number
    averageQuizScore: number
    attendanceRate: number
  }
  cohorts: {
    alumni: number
    "2024": number
    "2025": number
    "2026": number
    "2027_2028": number
  }
  weeklyAverages: Array<{ week: number; avg: number }>
  atRiskStudents: Array<{
    id: string
    nama_lengkap: string
    email: string
    angkatan: string
    attendanceCount: number
    avgScore: number | null
  }>
}

interface AnalyticsDashboardProps {
  token: string
}

export function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/studio/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Gagal memuat analisis statistik.")
      }
      const payload = await res.json()
      setData(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-[#6B6862] font-mono">
        <RefreshCw className="size-4 animate-spin mr-2" />
        Memproses statistik analisis data...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-6 text-center text-xs text-[#B23A2E]">
        <AlertTriangle className="size-8 mx-auto mb-2 text-[#B23A2E]" />
        {error || "Gagal memuat data statistik."}
        <Button onClick={fetchAnalytics} variant="outline" className="mt-4 border-[#B23A2E]/30 text-[#B23A2E] hover:bg-[#B23A2E]/5 mx-auto block h-8 text-xs">
          Coba Lagi
        </Button>
      </div>
    )
  }

  // Calculate SVG helper values
  const { stats, cohorts, weeklyAverages, atRiskStudents } = data

  // Circular gauge calculations for Attendance Rate
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (stats.attendanceRate / 100) * circumference

  // Bar chart cohort max value
  const cohortValues = Object.values(cohorts)
  const maxCohortVal = Math.max(...cohortValues, 1)

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <BarChart2 className="size-5 text-[#B23A2E]" />
            Dasbor Statistik & Analitik Keaktifan
          </h2>
          <p className="text-xs text-[#6B6862]">Visualisasi data keaktifan siswa ekskul JPER Community SMKN 1 Majalaya.</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" className="h-8 border-[#E4E1DA] bg-[#FAF9F6] text-xs gap-1">
          <RefreshCw className="size-3" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Students */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-[#B23A2E]/10 rounded-lg text-[#B23A2E]">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider">Total Siswa</div>
            <div className="text-2xl font-bold font-mono text-[#1C1B1A]">{stats.totalStudents}</div>
          </div>
        </Card>

        {/* Card 2: Total Courses */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-[#2B3A55]/10 rounded-lg text-[#2B3A55]">
            <BookOpen className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider">Kelas Aktif</div>
            <div className="text-2xl font-bold font-mono text-[#1C1B1A]">{stats.totalCourses}</div>
          </div>
        </Card>

        {/* Card 3: Attendance Rate Gauge */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-700">
              <Calendar className="size-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider">Rasio Absensi</div>
              <div className="text-2xl font-bold font-mono text-emerald-700">{stats.attendanceRate}%</div>
            </div>
          </div>
          {/* SVG Circular Progress Gauge */}
          <div className="relative size-14 shrink-0">
            <svg className="size-full -rotate-90">
              <circle cx="28" cy="28" r={radius} className="stroke-emerald-100 fill-none" strokeWidth="4" />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-emerald-600 fill-none transition-all duration-500"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Card>

        {/* Card 4: Average Quiz Score */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-700">
            <Award className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider">Rata Kuis</div>
            <div className="text-2xl font-bold font-mono text-amber-700">{stats.averageQuizScore} <span className="text-xs font-normal text-[#6B6862]">/ 100</span></div>
          </div>
          {/* Stamp indicator */}
          {stats.averageQuizScore >= 70 && (
            <div className="size-11 border border-dashed border-[#B23A2E]/30 rounded-full flex items-center justify-center shrink-0">
              <div className="size-9 rounded-full border border-[#B23A2E] text-[9px] font-bold text-[#B23A2E] flex items-center justify-center rotate-6 bg-white/40">
                合格
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Cohort Breakdown (SVG Bar Chart) */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
          <CardHeader className="pb-3 border-b border-[#E4E1DA]">
            <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">Komposisi Angkatan Siswa</CardTitle>
            <CardDescription className="text-[10px]">Distribusi total anggota terdaftar per cohort angkatan.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5">
            {[
              { label: "Alumni (2019-2023)", val: cohorts.alumni },
              { label: "Siswa Aktif (2024)", val: cohorts["2024"] },
              { label: "Siswa Aktif (2025)", val: cohorts["2025"] },
              { label: "Siswa Aktif (2026)", val: cohorts["2026"] },
              { label: "Calon Siswa (2027-2028)", val: cohorts["2027_2028"] }
            ].map((c) => {
              const pct = maxCohortVal > 0 ? (c.val / maxCohortVal) * 100 : 0
              return (
                <div key={c.label} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-[#1C1B1A]">{c.label}</span>
                    <span className="font-mono text-[#6B6862] font-semibold">{c.val} Siswa</span>
                  </div>
                  {/* SVG Bar representation */}
                  <div className="w-full h-3 rounded-full bg-[#E4E1DA]/40 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-[#2B3A55] to-[#2B3A55]/85 transition-all duration-700"
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Chart 2: Quiz Averages Progression (SVG Line Chart) */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
          <CardHeader className="pb-3 border-b border-[#E4E1DA]">
            <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">Perkembangan Nilai Kuis Mingguan</CardTitle>
            <CardDescription className="text-[10px]">Trend grafik rata-rata pencapaian kuis kelas per minggu.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {weeklyAverages.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B6862] italic">Belum ada data kuis tersimpan.</div>
            ) : (
              <div className="space-y-4">
                {/* SVG Line Graph */}
                <div className="w-full h-36">
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="30" x2="300" y2="30" className="stroke-[#E4E1DA]/50" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="0" y1="60" x2="300" y2="60" className="stroke-[#E4E1DA]/50" strokeWidth="0.5" strokeDasharray="3" />
                    
                    {/* Graph Path Generator */}
                    {(() => {
                      const points = weeklyAverages.map((item, idx) => {
                        const x = (idx / Math.max(weeklyAverages.length - 1, 1)) * 300
                        const y = 100 - item.avg // map 0-100 to y-coords
                        return `${x},${y}`
                      }).join(" ")
                      
                      return (
                        <>
                          {/* Gradient fill area */}
                          <path
                            d={`M 0 100 L ${points} L 300 100 Z`}
                            className="fill-[#2B3A55]/5"
                          />
                          {/* Main Line */}
                          <polyline
                            fill="none"
                            stroke="#2B3A55"
                            strokeWidth="2"
                            points={points}
                          />
                          {/* Data points markers */}
                          {weeklyAverages.map((item, idx) => {
                            const x = (idx / Math.max(weeklyAverages.length - 1, 1)) * 300
                            const y = 100 - item.avg
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={y} r="3" className="fill-[#FAF9F6] stroke-[#2B3A55]" strokeWidth="1.5" />
                                <text x={x} y={y - 6} textAnchor="middle" className="text-[7px] font-mono font-bold fill-[#2B3A55]">
                                  {item.avg}
                                </text>
                              </g>
                            )
                          })}
                        </>
                      )
                    })()}
                  </svg>
                </div>
                {/* Legend Labels */}
                <div className="flex justify-between text-[9px] font-mono text-[#6B6862] border-t border-[#E4E1DA] pt-2">
                  {weeklyAverages.map((item, idx) => (
                    <span key={idx}>Mgu {item.week}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk / Inactive Students List Panel */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
        <CardHeader className="pb-3 border-b border-[#E4E1DA]">
          <div className="flex items-center gap-2 text-[#B23A2E]">
            <AlertTriangle className="size-4" />
            <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">Siswa Pasif / Butuh Perhatian Khusus</CardTitle>
          </div>
          <CardDescription className="text-[10px]">
            Daftar siswa yang terdeteksi tidak memiliki riwayat absensi (0 kali hadir) atau nilai kuis rata-rata di bawah standar kelulusan (70).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {atRiskStudents.length === 0 ? (
            <div className="text-center py-6 text-xs text-emerald-700 bg-emerald-500/5 border border-emerald-500/20 rounded-lg font-mono">
              Hebat! Tidak ada siswa dengan keaktifan di bawah rata-rata saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                    <th className="py-2 font-medium">Nama Siswa</th>
                    <th className="py-2 font-medium">Email SSO</th>
                    <th className="py-2 font-medium">Cohort</th>
                    <th className="py-2 font-medium">Kehadiran</th>
                    <th className="py-2 font-medium">Rata Kuis</th>
                    <th className="py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((student) => (
                    <tr key={student.id} className="border-b border-[#E4E1DA]/50 last:border-none">
                      <td className="py-3 font-semibold text-[#1C1B1A]">
                        {student.nama_lengkap}
                      </td>
                      <td className="py-3 font-mono text-[#6B6862] text-[10px]">
                        {student.email}
                      </td>
                      <td className="py-3 font-mono text-[#6B6862]">
                        {student.angkatan}
                      </td>
                      <td className="py-3 font-mono">
                        {student.attendanceCount} Sesi
                      </td>
                      <td className="py-3 font-mono">
                        {student.avgScore !== null ? `${student.avgScore}` : "-"}
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-[9px] font-mono font-bold bg-[#B23A2E]/10 text-[#B23A2E] border border-[#B23A2E]/20 px-2 py-0.5 rounded">
                          Perlu Bimbingan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
