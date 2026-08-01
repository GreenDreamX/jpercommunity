"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarClock, ClipboardList, GraduationCap, LayoutGrid, Mail, ShieldCheck, Copy, ExternalLink, Lock } from "lucide-react"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Import custom layout
import { LmsLayout } from "@/components/lms/lms-layout"

// Import tabs contents
import { AttendanceTab } from "@/components/lms/attendance-tab"
import { GradesTab } from "@/components/lms/grades-tab"
import { CourseCard } from "@/components/lms/course-card"
import { FlashcardsTab } from "@/components/lms/flashcards-tab"
import { GlossaryTab } from "@/components/lms/glossary-tab"
import { ProfileTab } from "@/components/lms/profile-tab"

type LmsOverview = {
  profile: {
    id: string
    nama_lengkap: string
    email: string
    role: string
    angkatan: string
    avatar_url?: string | null
  }
  reminders: string[]
  courses: Array<{ id: string; title: string; description: string | null; image_url: string | null; is_locked: boolean }>
  stats: {
    totalCourses: number
    totalAssignments: number
    attendanceCount: number
    averageScore: number | null
  }
}

type Course = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_locked: boolean
}

export default function LmsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebaseUser()
  const [token, setToken] = useState<string | null>(null)
  const [overview, setOverview] = useState<LmsOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text)
      setCopiedText(`${label} berhasil disalin!`)
      setTimeout(() => setCopiedText(null), 2500)
    }
  }

  // Full course list for the Course Tab
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // Fetch full course list when courses tab is selected (or initially)
  const fetchAllCourses = useCallback(async (firebaseToken: string) => {
    setTimeout(() => {
      setLoadingCourses(true)
    }, 0)
    try {
      const response = await fetch("/api/lms/courses", {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      })
      if (!response.ok) {
        throw new Error("Gagal mengambil daftar kelas.")
      }
      const data = await response.json()
      setAllCourses(data.courses ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => {
        setLoadingCourses(false)
      }, 0)
    }
  }, [])

  // Fetch overview data
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }

    async function initializeLms() {
      await Promise.resolve()
      try {
        setLoadingOverview(true)
        setErrorMessage(null)

        if (!user) return
        const firebaseToken = await user.getIdToken()
        setToken(firebaseToken)

        const response = await fetch("/api/lms/overview", {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message ?? "Gagal memuat data LMS.")
        }

        const payload = await response.json()
        setOverview(payload)
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Gagal memuat data LMS.")
      } finally {
        setLoadingOverview(false)
      }
    }

    initializeLms()
  }, [authLoading, router, user])

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        const updated = customEvent.detail
        setOverview((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            profile: {
              ...prev.profile,
              nama_lengkap: updated.nama_lengkap ?? prev.profile.nama_lengkap,
              email: updated.email ?? prev.profile.email,
              angkatan: updated.angkatan ?? prev.profile.angkatan,
              avatar_url: updated.avatar_url !== undefined ? updated.avatar_url : prev.profile.avatar_url,
            },
          }
        })
      }
    }

    window.addEventListener("jper-profile-updated", handleProfileUpdated)
    return () => {
      window.removeEventListener("jper-profile-updated", handleProfileUpdated)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "courses" && token) {
      const timer = setTimeout(() => {
        void fetchAllCourses(token)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [activeTab, token, fetchAllCourses])

  if (authLoading || loadingOverview) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-10 text-[#1C1B1A] md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-sm font-mono text-[#6B6862]">
          Memuat dashboard LMS...
        </div>
      </main>
    )
  }

  return (
    <LmsLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      studentName={overview?.profile.nama_lengkap}
      angkatan={overview?.profile.angkatan}
      studentEmail={overview?.profile.email}
      avatarUrl={overview?.profile?.avatar_url || undefined}
    >
      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C1B1A] text-[#FAF9F6] text-[11px] font-mono px-3.5 py-2 rounded-lg shadow-lg border border-white/10">
          {copiedText}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-4 text-xs text-[#B23A2E] mb-6">
          {errorMessage}
        </div>
      )}

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "dashboard" && (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-[#FAF9F6] border-[#E4E1DA] shadow-none rounded-lg">
            <CardHeader>
              <CardDescription className="flex items-center gap-2 text-[#6B6862]">
                <ClipboardList className="size-4 text-[#2B3A55]" />
                Ringkasan Aktivitas
              </CardDescription>
              <CardTitle className="text-2xl font-bold tracking-tight text-[#1C1B1A]">Selamat datang kembali.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-[#6B6862]">
              <p className="leading-relaxed">
                Di panel JPER Community LMS, Anda bisa memantau perkembangan belajar, mengunduh materi mingguan, 
                mengumpulkan tugas, serta melihat riwayat absensi kehadiran Anda.
              </p>

              <div className="rounded-lg border border-[#E4E1DA] bg-[#E4E1DA]/10 p-4">
                <div className="text-xs font-semibold text-[#1C1B1A]">Tugas & Pengingat Terdekat</div>
                <div className="mt-3 space-y-2">
                  {overview?.reminders && overview.reminders.length > 0 ? (
                    overview.reminders.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs">
                        <CalendarClock className="size-4 text-[#B23A2E]" />
                        <span className="text-[#1C1B1A] font-medium">{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs italic text-[#6B6862]">Belum ada reminder tugas aktif minggu ini.</div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#E4E1DA] p-3.5 bg-[#FAF9F6]/50">
                  <div className="font-mono text-2xl font-bold text-[#1C1B1A]">{overview?.stats.attendanceCount ?? 0}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider">Hadir Pertemuan</div>
                </div>
                <div className="rounded-lg border border-[#E4E1DA] p-3.5 bg-[#FAF9F6]/50">
                  <div className="font-mono text-2xl font-bold text-[#1C1B1A]">{overview?.stats.totalAssignments ?? 0}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider">Total Tugas</div>
                </div>
                <div className="rounded-lg border border-[#E4E1DA] p-3.5 bg-[#FAF9F6]/50">
                  <div className="font-mono text-2xl font-bold text-[#1C1B1A]">
                    {overview?.stats.averageScore ?? "-"}
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider">Rata-rata Nilai</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {/* SSO Premium Digital Card Widget (Part 3) */}
            {overview?.profile?.email?.endsWith("@shokunin.jper.my.id") ? (
              <div className="relative overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-br from-[#1C1B1A] via-[#121212] to-[#1C1B1A] text-white p-6 shadow-2xl space-y-6">
                {/* Glow decorative effect */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 size-32 rounded-full bg-green-500/10 blur-2xl animate-pulse" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 size-32 rounded-full bg-[#B23A2E]/10 blur-2xl animate-pulse" />

                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-green-400 uppercase">SECURE SSO CONNECTED</span>
                    </div>
                    <h3 className="text-lg font-bold font-mono tracking-tight">JPER DIGITAL IDENTIFICATION</h3>
                  </div>
                  <span className="text-[9px] bg-green-500/20 border border-green-500/30 text-green-400 font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                    PREMIUM
                  </span>
                </div>

                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-[9px] text-white/40 font-mono">MEMBER NAME</div>
                    <div className="text-sm font-bold tracking-wide uppercase text-white/90">{overview?.profile?.nama_lengkap}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg p-2.5">
                    <div>
                      <div className="text-[8px] text-white/40 font-mono">OFFICIAL SSO EMAIL</div>
                      <div className="text-[11px] font-mono text-green-300 break-all">{overview?.profile?.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(overview?.profile?.email || "", "Email SSO")}
                      className="text-[10px] font-mono font-bold text-white hover:text-green-300 underline shrink-0"
                    >
                      Copy Email
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[9px] font-mono text-white/40">
                  <div className="flex gap-4">
                    <div>
                      <div>CLOUD STORAGE</div>
                      <div className="font-bold text-white/80">15 GB SECURE</div>
                    </div>
                    <div>
                      <div>LMS ACCESS</div>
                      <div className="font-bold text-green-400">PRIORITY (FAST)</div>
                    </div>
                  </div>
                  <a
                    href="https://mail.jper.my.id"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#FAF9F6] bg-[#B23A2E] hover:bg-[#B23A2E]/90 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <Mail className="size-3" />
                    Buka Webmail
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#B23A2E]/10 rounded-lg text-[#B23A2E] shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#1C1B1A]">Tautkan Akun JPER SSO Anda</h4>
                    <p className="text-[11px] text-[#6B6862] leading-relaxed">
                      Gunakan email resmi JPER untuk mendapatkan prioritas koreksi tugas, kuota 15 GB, dan akses webmail cloud. 
                      Silakan daftarkan akun SSO baru melalui halaman registrasi.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    href="/register"
                    className="text-[10px] font-bold text-[#B23A2E] hover:underline flex items-center gap-1"
                  >
                    Daftar SSO Sekarang →
                  </Link>
                </div>
              </div>
            )}

            {/* REMINDER BOX */}
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg text-[#1C1B1A]">
              <CardHeader className="border-b border-[#E4E1DA] pb-3">
                <CardDescription className="flex items-center gap-2 text-xs font-mono text-[#6B6862]">
                  <CalendarClock className="size-4 text-[#B23A2E]" />
                  Schedule Reminder
                </CardDescription>
                <CardTitle className="text-xl font-bold tracking-tight text-[#1C1B1A]">Tugas Mendatang</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {overview?.reminders && overview.reminders.length > 0 ? (
                  overview.reminders.map((reminder) => (
                    <div 
                      key={reminder} 
                      className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-900"
                    >
                      <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-semibold">{reminder}</div>
                        <div className="text-[10px] text-amber-700/80 mt-0.5">Segera kumpulkan tugas Anda sebelum batas waktu berakhir.</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/50 p-6 text-center text-xs text-[#6B6862] italic">
                    Semua tugas telah dikumpulkan! Tidak ada tugas tersisa.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {copiedText && (
              <div className="fixed bottom-5 right-5 z-50 bg-[#1C1B1A] text-[#FAF9F6] text-[11px] font-mono px-3.5 py-2 rounded-lg shadow-lg border border-white/10">
                {copiedText}
              </div>
            )}

            <Card className="bg-[#FAF9F6] border-[#E4E1DA] shadow-none rounded-lg">
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-[#6B6862]">
                  <GraduationCap className="size-4 text-[#2B3A55]" />
                  Pembelajaran Berjalan
                </CardDescription>
                <CardTitle className="text-xl font-bold text-[#1C1B1A]">Kelas Anda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview?.courses && overview.courses.length > 0 ? (
                  overview.courses.map((course) => (
                    <div 
                      key={course.id} 
                      className="flex items-center justify-between rounded-lg border border-[#E4E1DA] bg-[#FAF9F6]/30 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-[#1C1B1A]">{course.title}</span>
                      <span className="font-mono text-[#2B3A55] font-semibold bg-[#2B3A55]/10 px-2 py-0.5 rounded">
                        {course.is_locked ? "terkunci" : "aktif"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#6B6862] italic py-2">Belum ada kelas yang didaftarkan.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* TAB 2: MY COURSES */}
      {activeTab === "courses" && (
        <>
          {loadingCourses ? (
            <div className="text-xs text-[#6B6862] font-mono">Memuat daftar kelas...</div>
          ) : allCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E4E1DA] p-12 text-center text-xs text-[#6B6862]">
              Tidak ada kelas yang tersedia untuk angkatan Anda saat ini.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  imageUrl={course.image_url}
                  isLocked={course.is_locked}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && token && (
        <AttendanceTab firebaseToken={token} />
      )}

      {/* TAB 4: GRADES */}
      {activeTab === "grades" && token && (
        <GradesTab firebaseToken={token} />
      )}

      {/* TAB 5: FLASHCARDS */}
      {activeTab === "flashcards" && (
        <FlashcardsTab />
      )}

      {/* TAB 6: GLOSSARY */}
      {activeTab === "glossary" && (
        <GlossaryTab />
      )}

      {/* TAB 7: PROFILE */}
      {activeTab === "profile" && token && (
        <ProfileTab firebaseToken={token} />
      )}
    </LmsLayout>
  )
}