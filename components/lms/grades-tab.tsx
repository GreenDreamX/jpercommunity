"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Award, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react"
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
    <div className="space-y-6 text-black">
      {/* HEADER */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111]">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block bg-black text-[#FFC700] px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider -skew-x-6 border border-black shadow-[2px_2px_0px_#E60012]">
            成績証明書 • ACADEMIC TRANSCRIPT
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
          Transkrip Nilai & Pencapaian
        </h2>
        <p className="text-xs font-semibold text-zinc-600 mt-1">
          Rekapitulasi pencapaian tugas, kuis, dan akumulasi nilai akhir per pertemuan.
        </p>
      </div>

      {error && (
        <Card className="border-2 border-black bg-[#E60012] text-white rounded-none shadow-[4px_4px_0px_#111]">
          <CardContent className="p-4 flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Mini Stats Bar */}
      {!loading && grades.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border-2 border-black bg-white p-4 flex flex-col justify-between shadow-[4px_4px_0px_#111]"
          >
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Rata-Rata Nilai</div>
            <div className="text-4xl font-black font-mono text-black mt-2">{averageScore ?? "-"}</div>
            <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-2">
              <TrendingUp className="size-3.5 text-emerald-600 stroke-[3]" />
              {validScores.length} Penilaian Terkumpul
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="border-2 border-black bg-white p-4 flex flex-col justify-between shadow-[4px_4px_0px_#111]"
          >
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Kelulusan Modul</div>
            <div className="text-4xl font-black font-mono text-[#E60012] mt-2">
              {passedCount} <span className="text-sm font-bold text-zinc-500">/ {grades.length}</span>
            </div>
            <div className="text-[10px] font-bold text-zinc-600 mt-2">Batas kelulusan minimum: 70 XP</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="border-2 border-black bg-white p-4 flex flex-col justify-between shadow-[4px_4px_0px_#111]"
          >
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-500">Status Sertifikat</div>
            <div className="mt-2">
              {passedCount === grades.length && grades.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase bg-[#FFC700] text-black px-2.5 py-1 border-2 border-black -skew-x-6 shadow-[2px_2px_0px_#111]">
                  <Award className="size-4" /> Siswa Teladan (合格)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 border border-zinc-300">
                  Dalam Proses Belajar
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold text-zinc-500 mt-2">Sertifikat terbit di akhir semester</div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="border-2 border-black bg-white p-8 text-center text-xs font-mono font-bold text-zinc-600 shadow-[4px_4px_0px_#111]">
          Memuat riwayat transkrip nilai Anda...
        </div>
      ) : grades.length === 0 ? (
        <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_#111] rounded-none">
          <CardContent className="p-10 text-center text-xs font-semibold text-zinc-600">
            <Award className="size-10 mx-auto stroke-[1.5] mb-3 text-black" />
            <p className="font-bold text-sm text-black uppercase">Belum Ada Data Nilai</p>
            <p className="text-xs text-zinc-500 mt-1">Nilai tugas & kuis akan dipublikasikan oleh pembina kelas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-black bg-[#FAF9F5] text-black font-mono font-black uppercase tracking-wider text-[11px]">
                <th className="p-4 border-r-2 border-black">MATERI & KELAS</th>
                <th className="p-4 border-r-2 border-black text-center">TUGAS</th>
                <th className="p-4 border-r-2 border-black text-center">KUIS</th>
                <th className="p-4 border-r-2 border-black text-center">AKHIR</th>
                <th className="p-4 border-r-2 border-black">CATATAN PEMBINA</th>
                <th className="p-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {grades.map((grade, index) => {
                const week = grade.course_weeks
                const course = week?.courses
                const tugasNum = grade.nilai_tugas !== null && grade.nilai_tugas !== undefined ? Number(grade.nilai_tugas) : 0
                const kuisNum = grade.nilai_kuis !== null && grade.nilai_kuis !== undefined ? Number(grade.nilai_kuis) : 0
                const kumpulanNum = grade.nilai_kumpulan !== null && grade.nilai_kumpulan !== undefined ? Number(grade.nilai_kumpulan) : 0
                const isPassed = kumpulanNum >= 70

                return (
                  <motion.tr
                    key={grade.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    className="hover:bg-amber-50/50 transition-colors"
                  >
                    <td className="p-4 border-r-2 border-black">
                      <div className="font-black text-black text-sm">
                        Pertemuan {week?.week_number ?? "-"}: {week?.title ?? "-"}
                      </div>
                      <div className="text-[11px] font-bold text-[#E60012] mt-0.5">{course?.title}</div>
                    </td>
                    <td className="p-4 border-r-2 border-black text-center font-mono text-sm font-black text-black">
                      {tugasNum}
                    </td>
                    <td className="p-4 border-r-2 border-black text-center font-mono text-sm font-black text-black">
                      {kuisNum}
                    </td>
                    <td className="p-4 border-r-2 border-black text-center font-mono text-base font-black text-[#E60012] bg-[#FAF9F5]">
                      {kumpulanNum}
                    </td>
                    <td className="p-4 border-r-2 border-black font-semibold text-zinc-700 italic max-w-xs truncate" title={grade.note || ""}>
                      {grade.note ?? "Tidak ada catatan khusus."}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end">
                        {isPassed ? (
                          <div className="relative flex items-center justify-center w-10 h-10 border-2 border-dashed border-black rounded-full shrink-0">
                            <div className="absolute transform rotate-6 flex items-center justify-center w-8 h-8 border-2 border-[#E60012] bg-red-50 rounded-full text-[10px] font-black text-[#E60012] shadow-[1px_1px_0px_#111]">
                              合格
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#E60012] text-white border border-black -skew-x-6">
                            Mengulang
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
