"use client"

import { useEffect, useState } from "react"
import { Award, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type GradeRecord = {
  id: string
  score: string | number | null
  note: string | null
  nilai_tugas: string | number | null
  nilai_kuis: string | number | null
  nilai_kumpulan: string | number | null
  created_at: string
  course_weeks: {
    week_number: number
    title: string
    courses: {
      title: string
    }
  }
}

type GradesTabProps = {
  firebaseToken: string
}

export function GradesTab({ firebaseToken }: GradesTabProps) {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGrades() {
      try {
        setLoading(true)
        const res = await fetch("/api/lms/grades", {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.message ?? "Gagal mengambil data nilai.")
        }
        const data = await res.json()
        setGrades(data.grades ?? [])
        setError(null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
      } finally {
        setLoading(false)
      }
    }

    fetchGrades()
  }, [firebaseToken])

  const validScores = grades
    .map((g) => (g.nilai_kumpulan ? Number(g.nilai_kumpulan) : null))
    .filter((s): s is number => s !== null)

  const averageScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, val) => acc + val, 0) / validScores.length)
      : null

  const passedCount = validScores.filter((s) => s >= 70).length

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A]">Transkrip Nilai</h2>
        <p className="text-xs text-[#6B6862]">Rekapitulasi pencapaian tugas dan kuis Anda per pertemuan kelas.</p>
      </div>

      {error && (
        <Card className="border-[#B23A2E]/30 bg-[#B23A2E]/5 rounded-lg shadow-none">
          <CardContent className="p-4 flex items-center gap-2 text-xs text-[#B23A2E]">
            <AlertCircle className="size-4" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Mini Stats Bar */}
      {!loading && grades.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] p-4 flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6862]">Rata-rata Nilai</div>
            <div className="text-3xl font-bold font-mono text-[#2B3A55]">{averageScore ?? "-"}</div>
            <div className="text-[10px] text-[#6B6862] flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-green-600" />
              Dari {validScores.length} penilaian
            </div>
          </div>
          <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] p-4 flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6862]">Kelulusan Pertemuan</div>
            <div className="text-3xl font-bold font-mono text-[#B23A2E]">{passedCount} <span className="text-sm font-normal text-[#6B6862]">/ {grades.length}</span></div>
            <div className="text-[10px] text-[#6B6862] mt-1">Nilai kelulusan minimum: 70</div>
          </div>
          <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] p-4 flex flex-col gap-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6862]">Sertifikat & Badge</div>
            <div className="text-xl font-bold text-[#1C1B1A] flex items-center gap-1.5 h-full">
              {passedCount === grades.length && grades.length > 0 ? (
                <span className="text-xs text-green-700 font-semibold flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                  <Award className="size-4" /> Siswa Teladan
                </span>
              ) : (
                <span className="text-xs text-[#6B6862] font-medium bg-[#E4E1DA]/50 px-2 py-1 rounded">
                  Belum ada sertifikat
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-xs text-[#6B6862] py-4">Memuat riwayat nilai...</div>
      ) : grades.length === 0 ? (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6]/50 shadow-none rounded-lg">
          <CardContent className="p-8 text-center text-xs text-[#6B6862]">
            <Award className="size-8 mx-auto stroke-[1.2] mb-2 text-[#6B6862]/60" />
            Belum ada data nilai yang dipublikasikan.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden border border-[#E4E1DA] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E1DA] bg-[#FAF9F6] text-[#6B6862] font-mono tracking-wider">
                <th className="p-3.5 font-medium">MATERI & KELAS</th>
                <th className="p-3.5 font-medium text-center">NILAI TUGAS</th>
                <th className="p-3.5 font-medium text-center">NILAI KUIS</th>
                <th className="p-3.5 font-medium text-center">NILAI KUMPULAN</th>
                <th className="p-3.5 font-medium">CATATAN PEMBINA</th>
                <th className="p-3.5 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => {
                const week = grade.course_weeks
                const course = week?.courses
                const tugasNum = grade.nilai_tugas !== null && grade.nilai_tugas !== undefined ? Number(grade.nilai_tugas) : 0
                const kuisNum = grade.nilai_kuis !== null && grade.nilai_kuis !== undefined ? Number(grade.nilai_kuis) : 0
                const kumpulanNum = grade.nilai_kumpulan !== null && grade.nilai_kumpulan !== undefined ? Number(grade.nilai_kumpulan) : 0
                const isPassed = kumpulanNum >= 70

                return (
                  <tr key={grade.id} className="border-b border-[#E4E1DA] bg-[#FAF9F6]/20 last:border-none">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#1C1B1A]">
                        Pertemuan {week?.week_number ?? "-"}: {week?.title ?? "-"}
                      </div>
                      <div className="text-[10px] text-[#6B6862] mt-0.5">{course?.title}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono text-sm font-semibold text-stone-700">
                      {tugasNum}
                    </td>
                    <td className="p-3.5 text-center font-mono text-sm font-semibold text-stone-700">
                      {kuisNum}
                    </td>
                    <td className="p-3.5 text-center font-mono text-base font-bold text-[#2B3A55]">
                      {kumpulanNum}
                    </td>
                    <td className="p-3.5 text-[#6B6862] italic max-w-xs truncate" title={grade.note || ""}>
                      {grade.note ?? "Tidak ada catatan."}
                    </td>
                    <td className="p-3.5 text-right flex justify-end items-center h-16">
                      {isPassed ? (
                        <div className="relative flex items-center justify-center w-11 h-11 border border-dashed border-[#B23A2E]/25 rounded-full">
                          <div className="absolute transform rotate-[6deg] flex items-center justify-center w-9 h-9 border border-[#B23A2E] rounded-full text-[9px] font-bold text-[#B23A2E] tracking-tight bg-white/40">
                            合格
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium text-[#B23A2E] bg-[#B23A2E]/10 px-2 py-0.5 rounded border border-[#B23A2E]/25">
                          Mengulang
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
