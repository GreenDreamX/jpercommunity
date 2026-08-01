"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  QrCode, Plus, Clock, AlertCircle, RefreshCw, ChevronRight,
  ChevronLeft, UserCheck, CheckCircle2, XCircle, ClipboardList,
  ShieldCheck, Timer, Users, BookOpen, Loader2, Save
} from "lucide-react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

// ──── Types ────────────────────────────────────────────────────────────────
type Course = { id: string; title: string }
type CourseWeek = { id: string; course_id: string; week_number: number; title: string }
type AttendanceSession = {
  id: string
  course_week_id: string
  qr_token: string
  opened_at: string
  closed_at: string | null
  materi_diajarkan: string
  feedback: string
  dokumentasi_url: string
  course_weeks?: { title: string; week_number: number; course_id: string }
}
type Member = {
  id: string
  nama_lengkap: string
  email: string
  role: string
  angkatan: string | null
  avatar_url: string | null
}
type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa" | "dispen"
type ManualRecord = { profile_id: string; status: AttendanceStatus }

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  hadir: { label: "Hadir", color: "text-emerald-700", bg: "bg-emerald-500/10 border-emerald-500/20" },
  izin: { label: "Izin", color: "text-sky-700", bg: "bg-sky-500/10 border-sky-500/20" },
  sakit: { label: "Sakit", color: "text-amber-700", bg: "bg-amber-500/10 border-amber-500/20" },
  alpa: { label: "Alpa", color: "text-red-700", bg: "bg-red-500/10 border-red-500/20" },
  dispen: { label: "Dispen", color: "text-purple-700", bg: "bg-purple-500/10 border-purple-500/20" },
}

interface AttendanceManagementProps { token: string }

// ──── Main Component ────────────────────────────────────────────────────────
export function AttendanceManagement({ token }: AttendanceManagementProps) {
  // Step states: 1=pilih kelas, 2=pilih minggu, 3=sesi aktif
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [activeSubTab, setActiveSubTab] = useState<"manual" | "qr" | "close">("manual")

  // Data
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [selectedWeek, setSelectedWeek] = useState<CourseWeek | null>(null)
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [manualRecords, setManualRecords] = useState<Record<string, AttendanceStatus>>({}) // profile_id → status
  const [savedRecords, setSavedRecords] = useState<Record<string, AttendanceStatus>>({}) // profile_id → saved status

  // Loading / Error
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingWeeks, setLoadingWeeks] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [openingSession, setOpeningSession] = useState(false)
  const [closingSession, setClosingSession] = useState(false)
  const [savingRow, setSavingRow] = useState<string | null>(null) // profile_id being saved
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Close session form
  const [materi, setMateri] = useState("")
  const [feedbackVal, setFeedbackVal] = useState("")
  const [dokumentasiUrl, setDokumentasiUrl] = useState("")

  // QR Code
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [secondsRemaining, setSecondsRemaining] = useState(30)
  const currentTokenRef = useRef("")

  // ─── Fetch courses & detect active session ───────────────────────────────
  const fetchInitial = useCallback(async () => {
    setLoadingCourses(true)
    setError(null)
    try {
      const [coursesRes, sessionsRes, membersRes] = await Promise.all([
        fetch("/api/studio/courses", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/studio/attendance-sessions", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/studio/members", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const coursesData = await coursesRes.json()
      const sessionsData = await sessionsRes.json()
      const membersData = await membersRes.json()

      const courseList: Course[] = coursesData.courses ?? []
      setCourses(courseList)

      const memberList: Member[] = membersData.members ?? []
      setAllMembers(memberList)

      // Check if any active (unclosed) session
      const sessions: AttendanceSession[] = sessionsData.sessions ?? []
      const active = sessions.find(s => s.closed_at === null)
      if (active) {
        setActiveSession(active)
        setMateri(active.materi_diajarkan || "")
        setFeedbackVal(active.feedback || "")
        setDokumentasiUrl(active.dokumentasi_url || "")
        // Load existing manual records for this session
        await fetchSessionRecords(active.id)
        // Jump to step 3 if there's an active session
        setStep(3)
      } else {
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data absensi.")
    } finally {
      setLoadingCourses(false)
    }
  }, [token])

  // ─── Fetch existing attendance records for a session ─────────────────────
  const fetchSessionRecords = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/studio/attendance/manual?session_id=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, AttendanceStatus> = {}
        ;(data.records as Array<{ profile_id: string; status: AttendanceStatus }>).forEach(r => {
          map[r.profile_id] = r.status
        })
        setManualRecords(map)
        setSavedRecords({ ...map })
      }
    } catch (e) { console.error(e) }
  }, [token])

  useEffect(() => { void fetchInitial() }, [fetchInitial])

  // ─── Fetch weeks when course is selected ─────────────────────────────────
  useEffect(() => {
    if (!selectedCourse) return
    setLoadingWeeks(true)
    fetch(`/api/studio/weeks?course_id=${selectedCourse.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const w: CourseWeek[] = d.weeks ?? []
        setWeeks(w)
        if (w.length > 0) setSelectedWeek(w[0])
      })
      .finally(() => setLoadingWeeks(false))
  }, [selectedCourse, token])

  // ─── QR code 30s rotating timer ──────────────────────────────────────────
  useEffect(() => {
    if (!activeSession) { setQrDataUrl(""); return }
    if (activeSubTab !== "qr") return

    const update = async () => {
      const nowMs = Date.now()
      const timeBlock = Math.floor(nowMs / 30000)
      const secsLeft = 30 - (Math.floor(nowMs / 1000) % 30)
      setSecondsRemaining(secsLeft)
      const tok = `jper-att-${activeSession.id}-${timeBlock}`
      if (tok !== currentTokenRef.current) {
        currentTokenRef.current = tok
        try {
          const url = await QRCode.toDataURL(tok, { margin: 1, width: 260, color: { dark: "#1C1B1A", light: "#FFFFFF" } })
          setQrDataUrl(url)
        } catch (e) { console.error(e) }
      }
    }
    void update()
    const iv = setInterval(() => void update(), 1000)
    return () => clearInterval(iv)
  }, [activeSession, activeSubTab])

  // ─── Open session ─────────────────────────────────────────────────────────
  const handleOpenSession = async () => {
    if (!selectedWeek) { setError("Pilih minggu pertemuan terlebih dahulu."); return }
    setOpeningSession(true)
    setError(null)
    try {
      const qrToken = `jper-${selectedWeek.id}-${Date.now()}`
      const res = await fetch("/api/studio/attendance-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_week_id: selectedWeek.id, qr_token: qrToken }),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => null)
        throw new Error(p?.message ?? "Gagal membuka sesi.")
      }
      const data = await res.json()
      setActiveSession(data.session)
      setManualRecords({})
      setSavedRecords({})
      setMateri("")
      setFeedbackVal("")
      setDokumentasiUrl("")
      setStep(3)
      setActiveSubTab("manual")
      setSuccessMsg(`Sesi absensi Minggu ${selectedWeek.week_number}: "${selectedWeek.title}" berhasil dibuka!`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuka sesi.")
    } finally {
      setOpeningSession(false)
    }
  }

  // ─── Save single manual attendance ───────────────────────────────────────
  const handleSaveManual = async (member: Member, status: AttendanceStatus) => {
    if (!activeSession) return
    setSavingRow(member.id)
    setError(null)
    try {
      const res = await fetch("/api/studio/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          session_id: activeSession.id,
          profile_id: member.id,
          member_name: member.nama_lengkap,
          status,
        }),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => null)
        throw new Error(p?.message ?? "Gagal simpan absensi.")
      }
      setManualRecords(prev => ({ ...prev, [member.id]: status }))
      setSavedRecords(prev => ({ ...prev, [member.id]: status }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan absensi.")
    } finally {
      setSavingRow(null)
    }
  }

  // ─── Close session ────────────────────────────────────────────────────────
  const handleCloseSession = async () => {
    if (!activeSession) return
    if (!materi.trim()) { setError("Materi yang diajarkan wajib diisi sebelum menutup sesi."); return }
    if (!feedbackVal.trim()) { setError("Feedback pembelajaran wajib diisi sebelum menutup sesi."); return }
    setClosingSession(true)
    setError(null)
    try {
      const res = await fetch(`/api/studio/attendance-sessions?id=${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ materi_diajarkan: materi, feedback: feedbackVal, dokumentasi_url: dokumentasiUrl, close_session: true }),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => null)
        throw new Error(p?.message ?? "Gagal menutup sesi.")
      }
      setActiveSession(null)
      setManualRecords({})
      setSavedRecords({})
      setStep(1)
      setSuccessMsg("Sesi absensi berhasil ditutup dan jurnal tersimpan!")
      setTimeout(() => setSuccessMsg(null), 4000)
      await fetchInitial()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menutup sesi.")
    } finally {
      setClosingSession(false)
    }
  }

  const hadirCount = Object.values(savedRecords).filter(s => s === "hadir").length
  const recordedCount = Object.keys(savedRecords).length

  // ─── Render helpers ───────────────────────────────────────────────────────
  const getInitials = (name: string) => {
    const p = name.trim().split(/\s+/)
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
  }

  if (loadingCourses) {
    return <div className="py-20 text-center text-xs font-mono text-[#6B6862]">Memuat modul absensi...</div>
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E4E1DA] pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="size-5 text-[#B23A2E]" />
            Sesi Absensi Kelas
          </h2>
          <p className="text-xs text-[#6B6862]">
            Kelola absensi manual & QR per pertemuan. Semua aksi tercatat di audit log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              SESI AKTIF
            </span>
          )}
          <Button size="sm" variant="outline" onClick={fetchInitial} className="h-8 border-[#E4E1DA] text-xs gap-1.5 rounded-lg">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3.5 text-xs text-[#B23A2E] flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />{error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />{successMsg}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 1 — PILIH KELAS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 1 && !activeSession && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
          <CardHeader className="pb-4 border-b border-[#E4E1DA]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="size-4 text-[#B23A2E]" />
              Langkah 1 — Pilih Kelas
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih kelas yang akan diadakan absensi hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {courses.length === 0 ? (
              <div className="text-xs text-[#6B6862] italic py-8 text-center">Belum ada kelas. Buat kelas terlebih dahulu di menu Kelas & Silabus.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedCourse?.id === c.id
                        ? "border-[#B23A2E] bg-[#B23A2E]/5 ring-1 ring-[#B23A2E]/20"
                        : "border-[#E4E1DA] bg-white hover:border-[#B23A2E]/30 hover:bg-[#B23A2E]/3"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#1C1B1A] line-clamp-2">{c.title}</div>
                    {selectedCourse?.id === c.id && (
                      <div className="text-[10px] font-mono text-[#B23A2E] mt-1.5">✓ Dipilih</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedCourse || courses.length === 0}
                onClick={() => setStep(2)}
                className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold h-9 px-5 rounded-lg border-none gap-2"
              >
                Lanjut: Pilih Minggu <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 2 — PILIH MINGGU & BUKA SESI */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {step === 2 && !activeSession && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
          <CardHeader className="pb-4 border-b border-[#E4E1DA]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="size-4 text-[#B23A2E]" />
                  Langkah 2 — Pilih Minggu Pertemuan
                </CardTitle>
                <CardDescription className="text-xs">
                  Kelas: <span className="font-semibold text-[#1C1B1A]">{selectedCourse?.title}</span>
                </CardDescription>
              </div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[11px] font-mono text-[#6B6862] hover:text-[#1C1B1A]">
                <ChevronLeft className="size-3.5" /> Ganti Kelas
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {loadingWeeks ? (
              <div className="text-xs text-[#6B6862] font-mono text-center py-8">Memuat silabus...</div>
            ) : weeks.length === 0 ? (
              <div className="text-xs text-[#6B6862] italic text-center py-8">Belum ada minggu / silabus untuk kelas ini.</div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {weeks.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWeek(w)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      selectedWeek?.id === w.id
                        ? "border-[#B23A2E] bg-[#B23A2E]/5 ring-1 ring-[#B23A2E]/20"
                        : "border-[#E4E1DA] bg-white hover:border-[#B23A2E]/30"
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[#6B6862] font-semibold">MINGGU {w.week_number}</div>
                    <div className="text-xs font-bold text-[#1C1B1A] mt-0.5 line-clamp-1">{w.title}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="border-[#E4E1DA] text-xs h-9 rounded-lg gap-1">
                <ChevronLeft className="size-4" /> Kembali
              </Button>
              <Button
                disabled={!selectedWeek || openingSession}
                onClick={handleOpenSession}
                className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold h-9 px-5 rounded-lg border-none gap-2"
              >
                {openingSession ? <><Loader2 className="size-4 animate-spin" /> Membuka...</> : <><Plus className="size-4" /> Mulai Sesi Absensi</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 3 — PANEL SESI AKTIF */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(step === 3 || activeSession) && activeSession && (
        <div className="space-y-4">
          {/* Session info bar */}
          <div className="rounded-xl bg-[#2B3A55] text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <div className="text-xs font-bold">Sesi Absensi Aktif</div>
                <div className="text-[10px] font-mono text-white/70 mt-0.5">
                  {activeSession.course_weeks
                    ? `Minggu ${activeSession.course_weeks.week_number}: ${activeSession.course_weeks.title}`
                    : `ID: ${activeSession.id.substring(0, 8)}...`}
                  {" · "}Dibuka: {new Date(activeSession.opened_at).toLocaleString("id-ID")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono">
                <span className="text-emerald-300 font-bold">{hadirCount}</span> hadir · {recordedCount}/{allMembers.length} dicatat
              </div>
            </div>
          </div>

          {/* Sub-tab nav */}
          <div className="border-b border-[#E4E1DA] flex gap-1 overflow-x-auto scrollbar-none">
            {[
              { key: "manual" as const, label: "Absen Manual", icon: <UserCheck className="size-3.5" /> },
              { key: "qr" as const, label: "Lihat QR", icon: <QrCode className="size-3.5" /> },
              { key: "close" as const, label: "Tutup Sesi", icon: <ShieldCheck className="size-3.5" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeSubTab === tab.key
                    ? "border-[#B23A2E] text-[#B23A2E] bg-[#B23A2E]/5"
                    : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Absen Manual ── */}
          {activeSubTab === "manual" && (
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="size-4 text-[#B23A2E]" />
                  Absensi Manual Seluruh Anggota
                </CardTitle>
                <CardDescription className="text-xs">
                  Klik status pada setiap baris — tersimpan otomatis. Hanya <span className="font-bold text-emerald-700">Hadir</span> yang dihitung ke persentase kehadiran LMS.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                        <th className="py-2.5 font-medium">Anggota</th>
                        <th className="py-2.5 font-medium">Role</th>
                        <th className="py-2.5 font-medium">Status Kehadiran</th>
                        <th className="py-2.5 font-medium text-right">Simpan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMembers.map((member) => {
                        const currentStatus = manualRecords[member.id] as AttendanceStatus | undefined
                        const savedStatus = savedRecords[member.id] as AttendanceStatus | undefined
                        const isDirty = currentStatus !== savedStatus
                        const isSaving = savingRow === member.id

                        return (
                          <tr key={member.id} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full overflow-hidden bg-[#2B3A55] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.nama_lengkap} className="size-full object-cover" />
                                  ) : getInitials(member.nama_lengkap)}
                                </div>
                                <div>
                                  <div className="font-semibold text-[#1C1B1A]">{member.nama_lengkap}</div>
                                  <div className="text-[10px] font-mono text-[#6B6862]">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E4E1DA] text-[#6B6862]">
                                {member.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                                  const cfg = STATUS_CONFIG[s]
                                  const isSelected = currentStatus === s
                                  return (
                                    <button
                                      key={s}
                                      disabled={isSaving}
                                      onClick={() => setManualRecords(prev => ({ ...prev, [member.id]: s }))}
                                      className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                                        isSelected
                                          ? `${cfg.bg} ${cfg.color} border-current`
                                          : "bg-transparent border-[#E4E1DA] text-[#6B6862] hover:border-current"
                                      }`}
                                    >
                                      {isSelected && <span className="size-1.5 rounded-full bg-current inline-block" />}
                                      {cfg.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              {isSaving ? (
                                <Loader2 className="size-4 animate-spin text-[#6B6862] ml-auto" />
                              ) : currentStatus && isDirty ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveManual(member, currentStatus)}
                                  className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-[10px] font-bold h-7 px-3 rounded-lg border-none gap-1"
                                >
                                  <Save className="size-3" /> Simpan
                                </Button>
                              ) : savedStatus ? (
                                <span className={`text-[10px] font-mono font-bold ${STATUS_CONFIG[savedStatus].color}`}>
                                  ✓ {STATUS_CONFIG[savedStatus].label}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#C5C2BB]">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-3 border-t border-[#E4E1DA] flex flex-wrap gap-3">
                  {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                    const count = Object.values(savedRecords).filter(v => v === s).length
                    if (count === 0) return null
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <span key={s} className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}: {count}
                      </span>
                    )
                  })}
                  <span className="text-[10px] font-mono text-[#6B6862]">
                    {allMembers.length - recordedCount} belum dicatat
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tab: QR ── */}
          {activeSubTab === "qr" && (
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <QrCode className="size-4 text-[#B23A2E]" />
                  QR Absensi — Rotating 30 Detik
                </CardTitle>
                <CardDescription className="text-xs">
                  Tampilkan QR ini ke layar, siswa scan lewat LMS. Token diperbarui otomatis setiap 30 detik untuk keamanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col items-center gap-5">
                {qrDataUrl ? (
                  <>
                    <div className="relative">
                      <div className="p-4 bg-white rounded-2xl shadow-lg border border-[#E4E1DA]">
                        <img src={qrDataUrl} alt="QR Absensi" className="size-60 sm:size-72 object-contain rounded-xl" />
                      </div>
                      {/* JPER watermark */}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#E4E1DA] rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
                        <img src="/image/J-PER.png" alt="JPER" className="size-4 object-contain" />
                        <span className="text-[10px] font-mono font-bold text-[#2B3A55]">JPER ATTENDANCE QR</span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-2 text-sm font-mono font-bold text-[#1C1B1A]">
                        <Timer className="size-4 text-[#B23A2E]" />
                        QR diperbarui dalam <span className="text-[#B23A2E]">{secondsRemaining}s</span>
                      </div>
                      <div className="w-60 sm:w-72 bg-[#E4E1DA] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#B23A2E] h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-[#6B6862]">
                        ID Sesi: {activeSession.id.substring(0, 12)}...
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-xs text-[#6B6862] font-mono">Generating QR code...</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Tutup Sesi ── */}
          {activeSubTab === "close" && (
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Tutup & Selesaikan Sesi Absensi
                </CardTitle>
                <CardDescription className="text-xs">
                  Wajib mengisi materi dan feedback sebelum menutup sesi. Data tidak dapat diubah setelah sesi ditutup.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {/* Recap sebelum tutup */}
                <div className="rounded-xl border border-[#E4E1DA] bg-white p-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[#6B6862] uppercase tracking-wider">Rekap Sesi</div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div>Total dicatat: <span className="font-bold">{recordedCount}/{allMembers.length}</span></div>
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                      const count = Object.values(savedRecords).filter(v => v === s).length
                      if (count === 0) return null
                      return (
                        <div key={s} className={`font-bold ${STATUS_CONFIG[s].color}`}>
                          {STATUS_CONFIG[s].label}: {count}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Field>
                  <FieldLabel className="text-xs font-semibold">Materi yang Diajarkan <span className="text-[#B23A2E]">*</span></FieldLabel>
                  <Input
                    placeholder="Contoh: Hiragana dan Katakana dasar, perkenalan diri (Jikoshoukai)..."
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs font-semibold">Feedback & Catatan Pembelajaran <span className="text-[#B23A2E]">*</span></FieldLabel>
                  <textarea
                    placeholder="Catatan pengajar: kendala, pencapaian, hal yang perlu ditingkatkan..."
                    value={feedbackVal}
                    onChange={(e) => setFeedbackVal(e.target.value)}
                    rows={3}
                    className="w-full border border-[#E4E1DA] bg-white text-xs px-3 py-2 rounded-lg resize-none focus:outline-none focus:border-[#B23A2E]/40"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs font-semibold">URL Foto Dokumentasi (Opsional)</FieldLabel>
                  <Input
                    placeholder="https://..."
                    value={dokumentasiUrl}
                    onChange={(e) => setDokumentasiUrl(e.target.value)}
                    className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
                  />
                </Field>

                <Button
                  disabled={closingSession}
                  onClick={handleCloseSession}
                  className="w-full bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold h-10 rounded-lg border-none gap-2"
                >
                  {closingSession ? (
                    <><Loader2 className="size-4 animate-spin" /> Menutup Sesi...</>
                  ) : (
                    <><XCircle className="size-4" /> Tutup & Selesaikan Sesi Absensi</>
                  )}
                </Button>

                <p className="text-[10px] font-mono text-[#6B6862] text-center">
                  ⚠ Penutupan sesi bersifat permanen dan dicatat di audit log.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
