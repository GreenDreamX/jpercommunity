"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarClock, CheckCircle2, ClipboardList, FileText, GraduationCap } from "lucide-react"
import Link from "next/link"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type LmsOverview = {
  profile: {
    id: string
    nama_lengkap: string
    email: string
    role: string
    angkatan: string
  }
  reminders: string[]
  courses: Array<{ id: string; title: string; description: string | null }>
  stats: {
    totalCourses: number
    totalAssignments: number
    attendanceCount: number
    averageScore: number | null
  }
}

export default function LmsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebaseUser()
  const [overview, setOverview] = useState<LmsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.replace("/login")
      return
    }

    async function loadOverview() {
      setLoading(true)
      setErrorMessage(null)

      const token = await user.getIdToken()
      const response = await fetch("/api/lms/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setErrorMessage(payload?.message ?? "Gagal memuat data LMS.")
        setLoading(false)
        return
      }

      const payload = (await response.json()) as LmsOverview & { ok: boolean }
      setOverview(payload)
      setLoading(false)
    }

    void loadOverview()
  }, [authLoading, router, user])

  if (authLoading || loading) {
    return (
      <main className="min-h-svh bg-background px-6 py-10 text-foreground md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-sm text-stone">Memuat dashboard LMS...</div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background px-6 py-10 text-foreground md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit rounded-lg")}>
          <ArrowLeft />
          Kembali ke landing
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-background">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                LMS Member
              </CardDescription>
              <CardTitle className="text-3xl tracking-[-0.04em]">Dashboard belajar anggota.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-7 text-stone">
              <p>
                Halaman ini jadi pondasi LMS: ada reminder tugas, daftar course, status
                absensi, dan progres belajar mingguan.
              </p>

              {errorMessage && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  {errorMessage}
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-sm font-medium text-foreground">Pengingat terdekat</div>
                <div className="mt-3 space-y-2">
                  {(overview?.reminders.length
                    ? overview.reminders
                    : ["Belum ada reminder aktif."]
                  ).map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-destructive" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">{overview?.stats.attendanceCount ?? 0}</div>
                  <div className="text-sm">Riwayat absensi</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">{overview?.stats.totalAssignments ?? 0}</div>
                  <div className="text-sm">Tugas terdata</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">
                    {overview?.stats.averageScore ?? "-"}
                  </div>
                  <div className="text-sm">Rata-rata nilai</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  Course aktif
                </CardDescription>
                <CardTitle className="text-2xl tracking-[-0.03em]">Progress per course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-foreground">
                  {(overview?.courses.length ? overview.courses : []).map((course) => (
                    <div key={course.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <span>{course.title}</span>
                    <span className="font-mono text-primary">berjalan</span>
                  </div>
                ))}
                  {!overview?.courses.length && (
                    <div className="rounded-lg border border-border px-3 py-2 text-stone">
                      Belum ada course yang bisa ditampilkan.
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-destructive">
                  <FileText className="size-4" />
                  Fokus mingguan
                </CardDescription>
                <CardTitle className="text-2xl tracking-[-0.03em]">Absensi, tugas, dan catatan.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-destructive" />Riwayat absensi</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-destructive" />Materi mingguan</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-destructive" />Submission tugas</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}