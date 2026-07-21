"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, BookOpenText, LayoutGrid, QrCode, Users } from "lucide-react"
import Link from "next/link"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StudioOverview = {
  profile: {
    id: string
    nama_lengkap: string
    role: string
  }
  stats: {
    memberCount: number
    courseCount: number
    sessionCount: number
  }
  agenda: string[]
  modules: string[]
}

export default function StudioPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebaseUser()
  const [overview, setOverview] = useState<StudioOverview | null>(null)
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
      const response = await fetch("/api/studio/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setErrorMessage(payload?.message ?? "Gagal memuat data Studio.")
        setLoading(false)
        return
      }

      const payload = (await response.json()) as StudioOverview & { ok: boolean }
      setOverview(payload)
      setLoading(false)
    }

    void loadOverview()
  }, [authLoading, router, user])

  if (authLoading || loading) {
    return (
      <main className="min-h-svh bg-background px-6 py-10 text-foreground md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-sm text-stone">Memuat dashboard Studio...</div>
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
                <LayoutGrid className="size-4 text-primary" />
                Studio Admin
              </CardDescription>
              <CardTitle className="text-3xl tracking-[-0.04em]">Panel kerja pengurus dan pembina.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-7 text-stone">
              <p>
                Halaman ini menjadi titik awal Studio: pengelolaan course, absensi, nilai, dan
                review member baru dalam satu tempat.
              </p>

              {errorMessage && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
                  {errorMessage}
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="text-sm font-medium text-foreground">Agenda hari ini</div>
                <div className="mt-3 space-y-2">
                  {(overview?.agenda.length ? overview.agenda : ["Belum ada agenda."]).map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <BadgeCheck className="size-4 text-destructive" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">{overview?.stats.memberCount ?? 0}</div>
                  <div className="text-sm">Member aktif</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">{overview?.stats.courseCount ?? 0}</div>
                  <div className="text-sm">Course berjalan</div>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="font-mono text-2xl text-foreground">{overview?.stats.sessionCount ?? 0}</div>
                  <div className="text-sm">Sesi absensi aktif</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <BookOpenText className="size-4 text-primary" />
                  Modul studio
                </CardDescription>
                <CardTitle className="text-2xl tracking-[-0.03em]">Proses admin yang siap dikembangkan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-foreground">
                  {(overview?.modules.length ? overview.modules : []).map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span>{item}</span>
                    <span className="font-mono text-primary">aktif</span>
                  </div>
                ))}
                  {!overview?.modules.length && (
                    <div className="rounded-lg border border-border px-3 py-2 text-stone">
                      Modul studio belum tersedia.
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-destructive">
                  <QrCode className="size-4" />
                  Fokus absensi
                </CardDescription>
                <CardTitle className="text-2xl tracking-[-0.03em]">Kelola sesi dan validasi kehadiran.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-foreground">
                <div className="flex items-center gap-2"><Users className="size-4 text-destructive" />Generate QR token per sesi</div>
                <div className="flex items-center gap-2"><Users className="size-4 text-destructive" />Isi materi + feedback sebelum tutup sesi</div>
                <div className="flex items-center gap-2"><Users className="size-4 text-destructive" />Rekap kehadiran per member</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}