"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, BadgeCheck, BookOpenText, CalendarDays, ShieldCheck, Users, Star } from "lucide-react"

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
    title: "Kelola course & Silabus",
    body: "Materi mingguan, file PDF, dan video terstruktur.",
    icon: BookOpenText,
  },
  {
    title: "Buka sesi absensi Realtime",
    body: "Generate QR token unik per pertemuan aktif.",
    icon: CalendarDays,
  },
  {
    title: "Input & Rekap Nilai",
    body: "Format data presisi per siswa & per angkatan.",
    icon: BadgeCheck,
  },
]

export function ParallaxShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    let frame = 0

    const update = () => {
      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const raw = 1 - (rect.top - viewportHeight * 0.2) / (viewportHeight + rect.height * 0.4)
      setProgress(clamp(raw, 0, 1))
      frame = 0
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHoverIndex((current) => (current + 1) % 3)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-[720px]">
      <div className="sticky top-8 border-2 border-black bg-white p-5 md:p-6 shadow-[8px_8px_0px_#111]">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          {/* Main Card */}
          <Card
            className="overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_#E60012] transition-transform duration-300"
            style={{ transform: `translate3d(0, ${progress * -16}px, 0)` }}
          >
            <CardHeader className="border-b-2 border-black bg-zinc-900 text-white pb-4">
              <div className="flex items-center justify-between">
                <span className="bg-[#E60012] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 -skew-x-6">
                  STUDIO ADMIN
                </span>
                <span className="font-mono text-xs font-bold text-[#FFC700]">★ CORE PANEL</span>
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight text-white mt-2">
                Ruang Kerja Pengurus & Pembina.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {showcaseItems.map(({ title, body, icon: Icon }, index) => (
                <div
                  key={title}
                  onMouseEnter={() => setHoverIndex(index)}
                  className={`group flex items-start justify-between gap-4 border-l-4 p-3 transition-all duration-200 cursor-pointer ${
                    hoverIndex === index
                      ? "border-[#E60012] bg-[#E60012]/5 translate-x-1"
                      : "border-black/20 hover:border-[#E60012] hover:bg-zinc-50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-black uppercase text-sm text-black">
                      <Icon className="size-4 text-[#E60012]" />
                      {title}
                    </div>
                    <div className="text-xs text-zinc-600 font-medium">{body}</div>
                  </div>
                  <ArrowRight className="mt-0.5 size-4 text-black transition-transform group-hover:translate-x-1 group-hover:text-[#E60012]" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Secondary Stack */}
          <div className="grid gap-5">
            <Card
              className="border-2 border-black bg-white shadow-[4px_4px_0px_#FFC700]"
              style={{ transform: `translate3d(0, ${progress * 14}px, 0)` }}
            >
              <CardHeader className="border-b-2 border-black bg-white pb-3">
                <div className="flex items-center justify-between">
                  <span className="bg-black text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 -skew-x-6">
                    LMS MEMBER
                  </span>
                  <span className="text-[10px] font-bold text-[#E60012] uppercase tracking-widest">★ SWIFT PORTAL</span>
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight text-black mt-1">
                  Pengalaman Belajar Anggota.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 p-4">
                <div className="flex items-center justify-between border-2 border-black bg-zinc-50 px-3.5 py-2.5 shadow-[2px_2px_0px_#111]">
                  <div>
                    <div className="text-xs font-black uppercase text-black">Course & Materi Mingguan</div>
                    <div className="text-[11px] text-zinc-600 font-medium">PDF, Video Embed, Catatan Markdown</div>
                  </div>
                  <ShieldCheck className="size-4 text-[#E60012] shrink-0" />
                </div>
                <div className="flex items-center justify-between border-2 border-black bg-zinc-50 px-3.5 py-2.5 shadow-[2px_2px_0px_#111]">
                  <div>
                    <div className="text-xs font-black uppercase text-black">Tugas & Quiz Interaktif</div>
                    <div className="text-[11px] text-zinc-600 font-medium">Penilaian Otomatis & Sertifikat</div>
                  </div>
                  <BadgeCheck className="size-4 text-[#FFC700] shrink-0" />
                </div>
                <div className="border-2 border-black bg-[#E60012] text-white p-3 font-bold text-xs shadow-[2px_2px_0px_#FFC700]">
                  <span className="text-[#FFC700] uppercase font-black mr-1.5">★ PRESENSI QR REALTIME:</span>
                  Token absensi unik per sesi untuk mencegah manipulasi data.
                </div>
              </CardContent>
            </Card>

            <div className="border-2 border-black bg-zinc-900 text-white p-4 shadow-[4px_4px_0px_#111] space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                <span className="text-[#FFC700]">AKTIF STATUS LAYER</span>
                <span className="font-mono bg-[#E60012] px-2 py-0.5 text-white -skew-x-6">0{hoverIndex + 1} / 03</span>
              </div>
              <div className="h-2 w-full border border-white bg-black p-0.5">
                <div
                  className="h-full bg-[#E60012] transition-all duration-300"
                  style={{ width: `${(hoverIndex + 1) * 33.3}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}