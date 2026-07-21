"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, BadgeCheck, BookOpenText, CalendarDays, ShieldCheck, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type ShowcaseItem = {
  title: string
  body: string
  icon: React.ComponentType<{ className?: string }>
}

const showcaseItems: ShowcaseItem[] = [
  {
    title: "Kelola course",
    body: "Materi, silabus, dan tampilan minggu.",
    icon: BookOpenText,
  },
  {
    title: "Buka sesi absensi",
    body: "QR token dibuat untuk pertemuan aktif.",
    icon: CalendarDays,
  },
  {
    title: "Masukkan nilai",
    body: "Data per minggu ditulis dengan format yang presisi.",
    icon: BadgeCheck,
  },
]

export function ParallaxShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) {
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      return
    }

    let frame = 0

    const update = () => {
      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const raw = 1 - (rect.top - viewportHeight * 0.2) / (viewportHeight + rect.height * 0.4)
      setProgress(clamp(raw, 0, 1))
      frame = 0
    }

    const onScroll = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHoverIndex((current) => (current + 1) % 3)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-[780px]">
      <div className="sticky top-8 rounded-3xl border border-border bg-background/90 p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <Card className="overflow-hidden border-border bg-muted/20 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35" style={{ transform: `translate3d(0, ${progress * -22}px, 0)` }}>
            <CardHeader className="border-b border-border/70 pb-4">
              <CardDescription>Studio admin</CardDescription>
              <CardTitle className="text-2xl tracking-[-0.03em]">
                Panel yang terasa seperti ruang kerja, bukan dashboard generik.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {showcaseItems.map(({ title, body, icon: Icon }, index) => (
                <div
                  key={title}
                  onMouseEnter={() => setHoverIndex(index)}
                  className="group flex items-start justify-between gap-4 border-t border-border/70 pt-4 transition-all duration-200 first:border-0 first:pt-0 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium text-foreground transition-colors group-hover:text-primary">
                      <Icon className="size-4 text-destructive transition-transform duration-200 group-hover:scale-110" />
                      {title}
                    </div>
                    <div className="text-sm leading-6 text-stone">{body}</div>
                  </div>
                  <ArrowRight className="mt-0.5 size-4 text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card
              className="border-border bg-background"
              style={{ transform: `translate3d(0, ${progress * 18}px, 0)` }}
            >
              <CardHeader className="border-b border-border/70 pb-4">
                <CardDescription>Member experience</CardDescription>
                <CardTitle className="text-xl tracking-[-0.03em]">
                  Alur belajar yang sederhana untuk anggota.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Course mingguan</div>
                    <div className="text-sm text-stone">PDF, video, dan catatan dalam satu tempat.</div>
                  </div>
                  <ShieldCheck className="size-4 text-primary" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Tugas dan quiz</div>
                    <div className="text-sm text-stone">Masuk ke alur mingguan tanpa bertele-tele.</div>
                  </div>
                  <BadgeCheck className="size-4 text-primary" />
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-foreground transition-all duration-200 hover:-translate-y-0.5">
                  <span className="font-medium text-destructive">Aksen merah</span> hanya dipakai pada status penting dan elemen tanda resmi.
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border bg-background"
              style={{ transform: `translate3d(0, ${progress * -14}px, 0)` }}
            >
              <CardHeader className="border-b border-border/70 pb-4">
                <CardDescription>Basis data</CardDescription>
                <CardTitle className="text-xl tracking-[-0.03em]">
                  Data profil, akademik, dan relasi dipisah dengan jelas.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {[
                  ["Firebase Auth", "session"],
                  ["Supabase", "profiles"],
                  ["Studio", "role: admin"],
                ].map(([label, value], index) => (
                  <button
                    type="button"
                    key={label}
                    onMouseEnter={() => setHoverIndex(index)}
                    className="flex w-full items-center justify-between text-sm text-stone transition-colors duration-200 hover:text-foreground"
                  >
                    <span>{label}</span>
                    <span className="font-mono text-foreground">{value}</span>
                  </button>
                ))}
                <div className="pt-2 text-sm leading-6 text-foreground">
                  Struktur ini memudahkan audit, RLS, dan pengembangan fitur setelah landing page.
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border bg-muted/10"
              style={{ transform: `translate3d(0, ${progress * 26}px, 0)` }}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background">
                    <Users className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Siap untuk angkatan baru</div>
                    <div className="text-sm text-stone">Register dinamis berdasarkan tahun masuk.</div>
                  </div>
                </div>
                <div className="rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 font-mono text-xs text-destructive transition-all duration-200 hover:-translate-y-0.5">
                  2026 / 2025 / Alumni
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl border border-border bg-background p-4 text-sm text-stone">
              <div className="flex items-center justify-between">
                <span>Layer aktif</span>
                <span className="font-mono text-primary">0{hoverIndex + 1}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${35 + hoverIndex * 20}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}