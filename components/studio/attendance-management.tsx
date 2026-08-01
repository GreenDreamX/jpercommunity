"use client"

import React, { useEffect, useState, useCallback } from "react"
import { QrCode, Plus, Clock, AlertCircle, Lock, Trash2, RefreshCw } from "lucide-react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

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

type AttendanceSession = {
  id: string
  course_week_id: string
  qr_token: string
  opened_at: string
  closed_at: string | null
  materi_diajarkan: string
  feedback: string
  dokumentasi_url: string
  course_weeks?: {
    title: string
    course_id: string
  }
}

interface AttendanceManagementProps {
  token: string
}

export function AttendanceManagement({ token }: AttendanceManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>("")
  
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null)
  
  // Dynamic 30s rotating QR code states
  const [currentDynamicToken, setCurrentDynamicToken] = useState<string>("")
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Closing Session Form States
  const [materi, setMateri] = useState("")
  const [feedback, setFeedback] = useState("")
  const [dokumentasiUrl, setDokumentasiUrl] = useState("")
  const [submittingClose, setSubmittingClose] = useState(false)

  // Fetch initial data (courses, sessions)
  const fetchData = useCallback(async () => {
    setTimeout(() => {
      setLoading(true)
    }, 0)
    try {
      
      // Fetch courses for selection
      const coursesRes = await fetch("/api/studio/courses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const coursesData = await coursesRes.json()
      setCourses(coursesData.courses ?? [])
      if (coursesData.courses?.length > 0) {
        setSelectedCourseId(coursesData.courses[0].id)
      }

      // Fetch sessions list
      const sessionsRes = await fetch("/api/studio/attendance-sessions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const sessionsData = await sessionsRes.json()
      const list: AttendanceSession[] = sessionsData.sessions ?? []
      setSessions(list)
      
      // Find if there is an active (unclosed) session
      const active = list.find(s => s.closed_at === null)
      if (active) {
        setActiveSession(active)
        setMateri(active.materi_diajarkan || "")
        setFeedback(active.feedback || "")
        setDokumentasiUrl(active.dokumentasi_url || "")
      } else {
        setActiveSession(null)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  // Fetch weeks when course is selected
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

  // Dynamic 30-second QR Code rotation timer
  useEffect(() => {
    if (!activeSession) {
      setCurrentDynamicToken("")
      setQrDataUrl("")
      return
    }

    const updateQr = async () => {
      const nowMs = Date.now()
      const timeBlock = Math.floor(nowMs / 30000)
      const secsLeft = 30 - (Math.floor(nowMs / 1000) % 30)
      setSecondsRemaining(secsLeft)

      const tokenStr = `jper-att-${activeSession.id}-${timeBlock}`
      if (tokenStr !== currentDynamicToken) {
        setCurrentDynamicToken(tokenStr)
        try {
          const url = await QRCode.toDataURL(tokenStr, {
            margin: 1,
            width: 240,
            color: {
              dark: "#1C1B1A",
              light: "#FFFFFF",
            },
          })
          setQrDataUrl(url)
        } catch (err) {
          console.error("Gagal men-generate QR Code URL", err)
        }
      }
    }

    void updateQr()
    const interval = setInterval(() => {
      void updateQr()
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession, currentDynamicToken])

  // Delete Attendance Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus sesi absensi ini? Seluruh data kehadiran siswa pada sesi ini juga akan dihapus.")) {
      return
    }

    setDeletingId(sessionId)
    try {
      const res = await fetch(`/api/studio/attendance-sessions?id=${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menghapus sesi absensi.")
      }

      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        setMateri("")
        setFeedback("")
        setDokumentasiUrl("")
      }

      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus sesi absensi.")
    } finally {
      setDeletingId(null)
    }
  }

  // Open Sesi Absensi Baru
  const handleOpenSession = async () => {
    if (!selectedWeekId) return

    // Generate short-lived qr token
    const randomSuffix = Math.floor(Math.random() * 1000000).toString()
    const qrToken = `qr-${selectedWeekId}-${randomSuffix}`

    try {
      const res = await fetch("/api/studio/attendance-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_week_id: selectedWeekId,
          qr_token: qrToken,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal membuka sesi absensi.")
      }

      const data = await res.json()
      setActiveSession(data.session)
      setMateri("")
      setFeedback("")
      setDokumentasiUrl("")
      
      // Refresh list
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal membuka sesi absensi.")
    }
  }

  // Close & Submit Sesi Absensi
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession) return
    if (!materi.trim() || !feedback.trim() || !dokumentasiUrl.trim()) {
      alert("Materi diajarkan, feedback, dan dokumentasi URL wajib diisi!")
      return
    }

    setSubmittingClose(true)
    try {
      const res = await fetch(`/api/studio/attendance-sessions?id=${activeSession.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materi_diajarkan: materi.trim(),
          feedback: feedback.trim(),
          dokumentasi_url: dokumentasiUrl.trim(),
          close_session: true,
        }),
      })

      if (!res.ok) {
        throw new Error("Gagal menutup sesi absensi.")
      }

      setActiveSession(null)
      setMateri("")
      setFeedback("")
      setDokumentasiUrl("")
      
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menutup sesi absensi.")
    } finally {
      setSubmittingClose(false)
    }
  }

  // Form check: is valid to close?
  const isValidToClose = materi.trim().length > 0 && 
                         feedback.trim().length > 0 && 
                         dokumentasiUrl.trim().length > 0

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        
        {/* LEFT COLUMN: ACTIVE SESSION OR QR GENERATOR */}
        <div className="space-y-6">
          {activeSession ? (
            /* SESSION ACTIVE SHOW PREVIEW */
            <Card className="border border-red-200 bg-[#FAF9F6] shadow-none rounded-lg">
              <CardHeader className="pb-3 border-b border-red-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#B23A2E] flex items-center gap-1.5">
                    <Clock className="size-4 animate-pulse" />
                    Sesi Absensi Sedang Berjalan
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#6B6862]">
                    Dibuka pada: {new Date(activeSession.opened_at).toLocaleTimeString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-mono font-bold uppercase animate-pulse">
                    AKTIF
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSession(activeSession.id)}
                    disabled={deletingId === activeSession.id}
                    className="h-7 text-[10px] text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    Hapus Sesi
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center gap-5">
                
                {/* Dynamic Scannable QR Code Canvas */}
                <div className="border border-[#E4E1DA] bg-white p-4 rounded-xl flex flex-col items-center gap-3 shadow-sm w-full max-w-xs">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code Absensi Dinamis" className="size-48 object-contain rounded-md" />
                  ) : (
                    <div className="size-48 bg-zinc-100 rounded flex items-center justify-center border border-zinc-200 animate-pulse">
                      <QrCode className="size-20 text-zinc-400" />
                    </div>
                  )}
                  
                  {/* Dynamic 30s Countdown Bar */}
                  <div className="w-full text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#B23A2E]">
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>QR berganti dalam {secondsRemaining}s</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#B23A2E] h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-[#6B6862] pt-1">
                      TOKEN AKTIF SEKARANG:
                    </div>
                    <div className="font-mono text-[10px] font-bold text-[#1C1B1A] bg-[#E4E1DA]/30 px-2 py-1 rounded-md max-w-full truncate mx-auto select-all">
                      {currentDynamicToken || activeSession.qr_token}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-center leading-relaxed text-[#6B6862] max-w-sm">
                  Siswa memindai kode QR di atas dari halaman Kehadiran LMS. Kode QR otomatis diperbarui setiap 30 detik untuk mencegah kecurangan.
                </div>
              </CardContent>
            </Card>
          ) : (
            /* NO ACTIVE SESSION: SHOW GENERATOR */
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                  Buka Sesi Absensi Baru
                </CardTitle>
                <CardDescription className="text-[10px] text-[#6B6862]">
                  Pilih kelas dan pertemuan untuk men-generate kode QR kehadiran berdurasi pendek (10 menit)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="course" className="text-xs font-semibold text-[#1C1B1A]">Pilih Kelas</FieldLabel>
                    <select
                      id="course"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-3 rounded-lg text-[#1C1B1A]"
                    >
                      <option value="" disabled>Pilih Kelas</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="week" className="text-xs font-semibold text-[#1C1B1A]">Pertemuan / Minggu</FieldLabel>
                    <select
                      id="week"
                      value={selectedWeekId}
                      onChange={(e) => setSelectedWeekId(e.target.value)}
                      disabled={weeks.length === 0}
                      className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-3 rounded-lg text-[#1C1B1A]"
                    >
                      <option value="" disabled>Pilih Pertemuan</option>
                      {weeks.map(w => (
                        <option key={w.id} value={w.id}>Minggu {w.week_number}: {w.title}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Button
                  onClick={handleOpenSession}
                  disabled={!selectedWeekId}
                  className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 w-full h-9 text-xs font-semibold rounded-lg shadow-none border-none flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-4" />
                  Buka Sesi QR Absensi
                </Button>
              </CardContent>
            </Card>
          )}

          {/* HISTORICAL SESSIONS */}
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
            <CardHeader className="pb-3 border-b border-[#E4E1DA]">
              <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A]">
                Riwayat Sesi Absensi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat riwayat...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#6B6862]">Belum ada sesi absensi sebelumnya.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                        <th className="py-2 font-medium">Tanggal Sesi</th>
                        <th className="py-2 font-medium">Materi Pelajaran</th>
                        <th className="py-2 font-medium">Dokumentasi</th>
                        <th className="py-2 font-medium text-right">Status & Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((sess) => (
                        <tr key={sess.id} className="border-b border-[#E4E1DA]/50 hover:bg-[#E4E1DA]/10 transition-colors">
                          <td className="py-2.5">
                            <div className="font-semibold text-[#1C1B1A]">
                              {sess.course_weeks?.title || "Materi Pelajaran"}
                            </div>
                            <div className="text-[10px] text-[#6B6862] font-mono">
                              {new Date(sess.opened_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-2.5 max-w-[200px] truncate font-mono text-[#6B6862]">
                            {sess.materi_diajarkan || "(Belum diisi)"}
                          </td>
                          <td className="py-2.5 font-mono text-[#6B6862]">
                            {sess.dokumentasi_url ? (
                              <a href={sess.dokumentasi_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                Lihat Foto
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {sess.closed_at ? (
                                <span className="px-1.5 py-0.5 rounded bg-[#E4E1DA] text-[#6B6862] text-[9px] font-mono font-bold uppercase">
                                  DITUTUP
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-mono font-bold uppercase animate-pulse">
                                  AKTIF
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(sess.id)}
                                disabled={deletingId === sess.id}
                                title="Hapus Sesi Absensi"
                                className="size-7 text-[#6B6862] hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
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

        {/* RIGHT COLUMN: CLOSE SESSION REQUIREMENT FORM */}
        <div className="space-y-6">
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg h-fit">
            <CardHeader className="pb-3 border-b border-[#E4E1DA]">
              <CardTitle className="text-sm font-bold tracking-tight text-[#1C1B1A] flex items-center gap-1.5">
                <Lock className="size-4 text-[#B23A2E]" />
                Penutupan Sesi Absensi
              </CardTitle>
              <CardDescription className="text-[10px] text-[#6B6862]">
                Admin wajib melengkapi jurnal kelas di bawah untuk menutup sesi absen
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {activeSession ? (
                <form onSubmit={handleCloseSession} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="materi" className="text-xs font-semibold text-[#1C1B1A]">
                      Materi yang Diajarkan <span className="text-[#B23A2E]">*</span>
                    </FieldLabel>
                    <textarea
                      id="materi"
                      required
                      rows={3}
                      placeholder="Contoh: Menulis huruf Hiragana dari A sampai KO, pelafalan vokal..."
                      value={materi}
                      onChange={(e) => setMateri(e.target.value)}
                      disabled={submittingClose}
                      className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-3 rounded-lg text-[#1C1B1A] focus:outline-none"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="feedback" className="text-xs font-semibold text-[#1C1B1A]">
                      Feedback Pembelajaran <span className="text-[#B23A2E]">*</span>
                    </FieldLabel>
                    <textarea
                      id="feedback"
                      required
                      rows={3}
                      placeholder="Contoh: Siswa cukup cepat menangkap pola tulisan, tapi pelafalan 'u' dan 'o' perlu diulang..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={submittingClose}
                      className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-3 rounded-lg text-[#1C1B1A] focus:outline-none"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="dok_url" className="text-xs font-semibold text-[#1C1B1A]">
                      Dokumentasi URL (Foto Kegiatan) <span className="text-[#B23A2E]">*</span>
                    </FieldLabel>
                    <Input
                      id="dok_url"
                      required
                      placeholder="Salin tautan gambar dari File Bank"
                      value={dokumentasiUrl}
                      onChange={(e) => setDokumentasiUrl(e.target.value)}
                      disabled={submittingClose}
                      className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                    />
                  </Field>

                  <Button
                    type="submit"
                    disabled={submittingClose || !isValidToClose}
                    className={`w-full h-9 text-xs font-semibold rounded-lg shadow-none border-none ${
                      isValidToClose 
                        ? "bg-[#B23A2E] text-[#FAF9F6] hover:bg-[#B23A2E]/90" 
                        : "bg-[#E4E1DA] text-[#6B6862] cursor-not-allowed"
                    }`}
                  >
                    {submittingClose ? "Menyimpan..." : "Tutup & Simpan Sesi Absensi"}
                  </Button>
                  
                  {!isValidToClose && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-start gap-1.5">
                      <AlertCircle className="size-4 shrink-0 text-amber-600" />
                      <span>Form wajib diisi lengkap untuk mengaktifkan tombol penutupan sesi absensi.</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-8 text-xs text-[#6B6862] font-mono">
                  Belum ada sesi absensi aktif yang perlu ditutup.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </section>
    </div>
  )
}
