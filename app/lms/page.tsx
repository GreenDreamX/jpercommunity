"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarClock, ClipboardList, GraduationCap, LayoutGrid, Mail, ShieldCheck, Copy, ExternalLink, Lock, Trophy, Flame, Star } from "lucide-react"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

// Import custom layout
import { LmsLayout } from "@/components/lms/lms-layout"

// Import tabs contents
import { AttendanceTab } from "@/components/lms/attendance-tab"
import { GradesTab } from "@/components/lms/grades-tab"
import { CourseCard } from "@/components/lms/course-card"
import { FlashcardsTab } from "@/components/lms/flashcards-tab"
import { DictionaryTab } from "@/components/lms/dictionary-tab"
import { GrammarTab } from "@/components/lms/grammar-tab"
import { ProfileTab } from "@/components/lms/profile-tab"
import { KasReminder } from "@/components/lms/kas-reminder"
import { LeaderboardTab } from "@/components/lms/leaderboard-tab"
import { DailyQuestWidget } from "@/components/lms/daily-quest-widget"
import { GamesTab } from "@/components/lms/games-tab"

type LmsOverview = {
  profile: Record<string, any> & {
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
  weekCount?: number
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
              ...updated,
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
      <main className="min-h-svh bg-white p5-subtle-grid flex items-center justify-center p-6 text-black">
        <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_#111] text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-3">
          <div className="size-3 bg-[#E60012] animate-ping" />
          <span>Memuat Dashboard LMS JPER Community...</span>
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
      studentRole={overview?.profile.role}
    >
      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#FFC700] text-black text-xs font-mono font-black uppercase px-4 py-2.5 shadow-[4px_4px_0px_#111]">
          {copiedText}
        </div>
      )}

      {errorMessage && (
        <div className="border-2 border-black bg-[#E60012] text-white p-4 text-xs font-black uppercase tracking-tight shadow-[4px_4px_0px_#111] mb-6">
          {errorMessage}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && token && (
            <>
            {/* KAS REMINDER BANNER */}
            <KasReminder token={token} />

            {/* DAILY QUEST & LOGIN STREAK WIDGET (FULL WIDTH) */}
            <DailyQuestWidget token={token} userProfile={overview?.profile} />

            <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] overflow-hidden rounded-none">
                <CardHeader className="border-b-2 border-black bg-[#FAF9F5] p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-[#E60012] text-white px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[2px_2px_0px_#FFC700]">
                      概要 • OVERVIEW DASHBOARD
                    </span>
                    <span className="font-mono text-xs font-black bg-black text-[#FFC700] px-2 py-0.5 border border-black">
                      ANGKATAN {overview?.profile.angkatan || "-"}
                    </span>
                  </div>
                  <CardTitle className="font-heading text-2xl font-black uppercase tracking-tight text-black">
                    Selamat datang kembali, {overview?.profile.nama_lengkap || "Siswa"}!
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6 text-sm text-black">
                  <p className="font-medium text-zinc-800 leading-relaxed text-xs md:text-sm">
                    Di portal LMS JPER Community, Anda dapat mengikuti materi kelas mingguan, mengumpulkan tugas, memantau absensi kehadiran, dan memainkan minigames bahasa Jepang.
                  </p>

                  <div className="border-2 border-black bg-zinc-50 p-4 shadow-[3px_3px_0px_#111]">
                    <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <CalendarClock className="size-4 text-[#E60012]" />
                      <span>Tugas &amp; Pengingat Terdekat</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {overview?.reminders && overview.reminders.length > 0 ? (
                        overview.reminders.map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs font-black uppercase text-black bg-white p-2 border border-black">
                            <span className="size-2 bg-[#E60012] border border-black shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs font-bold text-zinc-500 uppercase italic">Belum ada reminder tugas aktif minggu ini.</div>
                      )}
                    </div>
                  </div>

                  {/* QUICK STATS COUNTERS GRID */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="border-2 border-black bg-[#FFC700] p-3.5 text-black shadow-[3px_3px_0px_#111]">
                      <div className="font-mono text-2xl font-black text-black flex items-center gap-1.5">
                        <Star className="size-5 fill-black text-black" />
                        {overview?.profile?.xp ?? 0}
                      </div>
                      <div className="text-[10px] uppercase font-mono font-black tracking-widest text-black mt-1">Total Poin XP</div>
                    </div>

                    <div className="border-2 border-black bg-[#E60012] p-3.5 text-white shadow-[3px_3px_0px_#111]">
                      <div className="font-mono text-2xl font-black text-white flex items-center gap-1.5">
                        <Flame className="size-5 fill-[#FFC700] text-[#FFC700]" />
                        {overview?.profile?.streak_count ?? 0}d
                      </div>
                      <div className="text-[10px] uppercase font-mono font-black tracking-widest text-white mt-1">Streak Harian</div>
                    </div>

                    <div className="border-2 border-black bg-white p-3.5 text-black shadow-[3px_3px_0px_#111]">
                      <div className="font-mono text-2xl font-black text-black">{overview?.stats.attendanceCount ?? 0}</div>
                      <div className="text-[10px] uppercase font-mono font-black tracking-widest text-zinc-600 mt-1">Hadir Pertemuan</div>
                    </div>

                    <div className="border-2 border-black bg-black p-3.5 text-[#FFC700] shadow-[3px_3px_0px_#E60012]">
                      <div className="font-mono text-2xl font-black text-[#FFC700]">{overview?.stats.averageScore ?? "-"}</div>
                      <div className="text-[10px] uppercase font-mono font-black tracking-widest text-zinc-400 mt-1">Rata-rata Nilai</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                {/* Kartu Anggota Digital JPER */}
                {overview?.profile?.email?.endsWith("@shokunin.jper.my.id") ? (
                  <div className="border-2 border-black bg-black text-white p-6 shadow-[6px_6px_0px_#E60012] space-y-4 rounded-none">
                    <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-[#E60012] animate-pulse" />
                          <span className="text-[10px] font-mono tracking-widest text-[#FFC700] uppercase font-black">JPER COMMUNITY</span>
                        </div>
                        <h3 className="font-heading text-lg font-black uppercase text-white">Kartu Anggota Digital</h3>
                      </div>
                      <span className="text-[9px] bg-[#E60012] text-white font-mono font-black uppercase px-2.5 py-0.5 border border-white -skew-x-6">
                        TERVERIFIKASI
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="text-[9px] text-zinc-400 font-mono font-bold uppercase">Nama Anggota</div>
                        <div className="text-sm font-black tracking-wide text-white uppercase">{overview?.profile?.nama_lengkap}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-2 border-zinc-800 bg-zinc-900 p-3">
                        <div>
                          <div className="text-[9px] text-zinc-400 font-mono font-bold uppercase">Email SSO Resmi</div>
                          <div className="text-xs font-mono text-[#FFC700] font-bold break-all">{overview?.profile?.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(overview?.profile?.email || "", "Email SSO")}
                          className="border border-white bg-[#E60012] text-white px-2 py-1 text-[10px] font-mono font-black uppercase hover:bg-[#FFC700] hover:text-black shrink-0"
                        >
                          Salin
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">
                        Akses Webmail Cloud JPER
                      </div>
                      <a
                        href="https://mail.jper.my.id"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 border border-black text-xs font-black uppercase text-black bg-[#FFC700] hover:bg-white px-3 py-1.5 transition-colors shadow-[2px_2px_0px_#111]"
                      >
                        <Mail className="size-3.5" />
                        Webmail
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-black bg-white p-5 space-y-3 shadow-[4px_4px_0px_#111]">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#E60012] text-white border-2 border-black -skew-x-6 shrink-0 shadow-[2px_2px_0px_#FFC700]">
                        <ShieldCheck className="size-4 skew-x-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-black">Tautkan Akun JPER SSO Anda</h4>
                        <p className="text-xs font-medium text-zinc-700 leading-relaxed">
                          Gunakan email resmi JPER untuk mendapatkan prioritas koreksi tugas, kuota 15 GB, dan akses webmail cloud.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Link
                        href="/register"
                        className="text-xs font-black text-[#E60012] hover:underline uppercase tracking-wider flex items-center gap-1"
                      >
                        Daftar SSO Sekarang →
                      </Link>
                    </div>
                  </div>
                )}

                {/* REMINDER BOX */}
                <Card className="border-2 border-black bg-[#FFC700] text-black shadow-[6px_6px_0px_#111] rounded-none">
                  <CardHeader className="border-b-2 border-black pb-3">
                    <CardDescription className="flex items-center gap-2 text-xs font-mono font-black uppercase text-black">
                      <CalendarClock className="size-4 text-black" />
                      SCHEDULE REMINDER
                    </CardDescription>
                    <CardTitle className="font-heading text-xl font-black uppercase text-black">Tugas Mendatang</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2">
                    {overview?.reminders && overview.reminders.length > 0 ? (
                      overview.reminders.map((reminder) => (
                        <div 
                          key={reminder} 
                          className="flex items-start gap-2.5 border-2 border-black bg-white p-3 text-xs text-black shadow-[2px_2px_0px_#111]"
                        >
                          <div className="size-2 rounded-full bg-[#E60012] mt-1 shrink-0" />
                          <div>
                            <div className="font-black uppercase">{reminder}</div>
                            <div className="text-[10px] font-bold text-zinc-600 mt-0.5">Segera kumpulkan tugas Anda sebelum batas waktu berakhir.</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border-2 border-black bg-white p-5 text-center text-xs font-bold text-zinc-600 uppercase italic shadow-[2px_2px_0px_#111]">
                        Semua tugas telah dikumpulkan! Tidak ada tugas tersisa.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] rounded-none">
                  <CardHeader className="border-b-2 border-black pb-3 bg-[#FAF9F5]">
                    <CardDescription className="flex items-center gap-2 text-xs font-mono font-black uppercase text-black">
                      <GraduationCap className="size-4 text-[#E60012]" />
                      PEMBELAJARAN BERJALAN
                    </CardDescription>
                    <CardTitle className="font-heading text-xl font-black uppercase text-black">Kelas Anda</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {overview?.courses && overview.courses.length > 0 ? (
                      overview.courses.map((course) => (
                        <div 
                          key={course.id} 
                          className="flex items-center justify-between border-2 border-black bg-zinc-50 p-3 text-xs font-bold"
                        >
                          <span className="font-black uppercase text-black">{course.title}</span>
                          <span className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-black ${
                            course.is_locked ? "bg-zinc-200 text-zinc-700" : "bg-[#E60012] text-white"
                          }`}>
                            {course.is_locked ? "TERKUNCI" : "AKTIF"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-bold text-zinc-500 uppercase italic py-2">Belum ada kelas yang didaftarkan.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
            </>
          )}

          {/* TAB: ARCADE INTERACTIVE MINI GAMES */}
          {activeTab === "arcade" && (
            <GamesTab token={token || undefined} userXp={overview?.profile?.xp || 0} />
          )}

          {/* TAB 2: MY COURSES */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <div className="border-b-2 border-black pb-4 flex items-center justify-between">
                <div>
                  <span className="inline-block bg-[#E60012] text-white px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[2px_2px_0px_#FFC700]">
                    授業一覧 • MY COURSES
                  </span>
                  <h2 className="font-heading text-2xl font-black uppercase text-black mt-1">Daftar Kelas Ekskul</h2>
                </div>
                <span className="font-mono text-xs font-black bg-black text-[#FFC700] px-3 py-1 border-2 border-black">
                  {allCourses.length} KELAS
                </span>
              </div>

              {loadingCourses ? (
                <div className="border-2 border-black bg-white p-6 font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_#111]">
                  Memuat daftar kelas...
                </div>
              ) : allCourses.length === 0 ? (
                <div className="border-2 border-black bg-white p-12 text-center text-xs font-black uppercase text-zinc-600 shadow-[4px_4px_0px_#111]">
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
                      weekCount={course.weekCount}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEADERBOARD & PODIUM */}
          {activeTab === "leaderboard" && token && (
            <LeaderboardTab token={token} />
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === "attendance" && token && (
            <AttendanceTab firebaseToken={token} />
          )}

          {/* TAB 5: GRADES */}
          {activeTab === "grades" && token && (
            <GradesTab firebaseToken={token} />
          )}

          {/* TAB 6: FLASHCARDS */}
          {activeTab === "flashcards" && (
            <FlashcardsTab token={token || undefined} />
          )}

          {/* TAB 6: DICTIONARY & KOSAKATA */}
          {activeTab === "dictionary" && token && (
            <DictionaryTab firebaseToken={token} />
          )}

          {/* TAB 7: TATA BAHASA (GRAMMAR) */}
          {activeTab === "grammar" && token && (
            <GrammarTab firebaseToken={token} />
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === "profile" && token && (
            <ProfileTab firebaseToken={token} />
          )}
        </motion.div>
      </AnimatePresence>
    </LmsLayout>
  )
}