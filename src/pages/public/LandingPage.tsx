import { useState, useEffect } from 'react'
import {
  BookOpen,
  Users,
  Mail,
  ChevronRight,
  Github,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react'

// ─────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────

interface Feature {
  id: number
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  detail: string
}

interface TimelineStep {
  id: number
  period: string
  label: string
  description: string
  isMilestone?: boolean
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const features: Feature[] = [
  {
    id: 1,
    icon: <BookOpen className="w-5 h-5" />,
    badge: '自律',
    title: 'Otonomi Penuh',
    description: 'Milestone-locked, bukan time-locked.',
    detail:
      'Tidak ada tenggat waktu yang memaksamu. Kamu naik level ketika kamu benar-benar siap — bukan karena kalender berkata demikian. Progress-mu ditentukan oleh kompetensi, bukan kehadiran.',
  },
  {
    id: 2,
    icon: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
    badge: '教材',
    title: 'Modul Komprehensif',
    description: 'Flashcard statis + Bank Kanji N5/N4.',
    detail:
      'Hiragana, Katakana, dan 300+ Kanji N5–N4 tersedia dalam format flashcard statis yang ringan, offline-capable, dan terstruktur mengikuti alur JLPT resmi.',
  },
  {
    id: 3,
    icon: <Mail className="w-5 h-5" strokeWidth={1.5} />,
    badge: '職人',
    title: 'Email @shokunin',
    description: 'Identitas digital komunitas resmi.',
    detail:
      'Lulus milestone akhir dan klaim alias email komunitas resmimu — <nama>@shokunin.id. Sistem autentikasi hybrid memverifikasi kompetensimu sebelum akses diberikan.',
  },
]

const timelineSteps: TimelineStep[] = [
  {
    id: 1,
    period: 'Minggu 1',
    label: 'Jikoshoukai',
    description:
      'Pengenalan komunitas, orientasi platform LMS, dan penilaian awal kemampuan membaca Hiragana/Katakana.',
    isMilestone: true,
  },
  {
    id: 2,
    period: 'Minggu 2–4',
    label: 'Speedrun N5 Gates',
    description:
      'Intensif Hiragana & Katakana penuh, kosakata N5 dasar, dan pola kalimat sederhana. Unlock akses Kanji Bank N5.',
  },
  {
    id: 3,
    period: 'Minggu 5–15',
    label: 'N4 Focus & Tryouts',
    description:
      'Pendalaman Kanji N4, tata bahasa menengah, latihan soal tryout berkala, dan sesi review mandiri terjadwal.',
  },
  {
    id: 4,
    period: 'Minggu 16',
    label: 'Pengukuhan & Verified Badge',
    description:
      'Ujian kompetensi akhir. Lulus = Verified Badge komunitas + klaim email alias @shokunin.id resmimu.',
    isMilestone: true,
  },
]

// ─────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="text-zinc-50 font-semibold text-sm tracking-wide group-hover:text-white transition-colors duration-200">
            JPER COMMUNITY
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-red-400 border border-red-900/50 bg-red-950/30 rounded-sm">
            職人
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <a
            href="#kurikulum"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
          >
            Kurikulum
          </a>
          <a
            href="#alumni"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
          >
            Direktori Alumni
          </a>
          <div className="w-px h-4 bg-zinc-800 mx-2" />
          <a
            href="/lms/login"
            className="px-3.5 py-1.5 text-sm font-medium text-zinc-50 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-md transition-all duration-200"
          >
            Masuk LMS
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            <a
              href="#kurikulum"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all duration-200"
            >
              Kurikulum
            </a>
            <a
              href="#alumni"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all duration-200"
            >
              Direktori Alumni
            </a>
            <div className="h-px bg-zinc-800 my-1" />
            <a
              href="/lms/login"
              className="px-3 py-2 text-sm font-medium text-zinc-50 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-center transition-all duration-200"
            >
              Masuk LMS
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #a1a1aa 1px, transparent 1px),
            linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow — very subtle crimson */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #7f1d1d 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center pt-24 pb-16">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-zinc-800 bg-zinc-900/60 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-zinc-500 tracking-wide font-medium">
            Ekskul Bahasa Jepang SMK — Self-paced, No Bureaucracy
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-zinc-50 leading-[1.1] tracking-tight mb-6">
          Identitas Digital &amp; Kompetensi
          <br className="hidden sm:block" />
          <span className="text-zinc-400"> Bahasa Jepang</span>
          <br className="hidden sm:block" />
          dalam Satu Ekosistem.
        </h1>

        {/* Sub-headline */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed mb-10">
          Komunitas belajar mandiri{' '}
          <span className="text-zinc-300 font-medium">(self-paced)</span> untuk
          menguasai Hiragana, Katakana, hingga standardisasi JLPT N4 — tanpa
          paksaan birokrasi.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/lms/register"
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-md transition-all duration-200 hover:shadow-lg hover:shadow-zinc-950/20"
          >
            Mulai Belajar Mandiri
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </a>
          <a
            href="#alumni"
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-50 border border-zinc-800 hover:border-zinc-600 bg-transparent hover:bg-zinc-900/50 rounded-md transition-all duration-200"
          >
            <Users className="w-4 h-4" />
            Lihat Direktori Anggota
          </a>
        </div>

        {/* Divider hint */}
        <div className="mt-20 flex items-center justify-center gap-4 text-zinc-700 text-xs font-medium tracking-widest uppercase">
          <div className="h-px w-12 bg-zinc-800" />
          scroll untuk eksplorasi
          <div className="h-px w-12 bg-zinc-800" />
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section id="kurikulum" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="mb-14">
          <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase mb-3">
            Sistem Komunitas
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Dirancang untuk otonomi penuh.
          </h2>
          <p className="mt-3 text-zinc-500 text-sm max-w-lg leading-relaxed">
            Tiga pilar yang membedakan ekosistem JPER Community dari kelas
            bahasa Jepang konvensional.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="group relative bg-zinc-950 hover:bg-zinc-900/70 p-7 flex flex-col gap-5 transition-all duration-200">
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-all duration-200">
          {feature.icon}
        </div>
        <span className="text-xs font-medium text-red-400/70 border border-red-900/30 bg-red-950/20 px-2 py-0.5 rounded-sm tracking-wider">
          {feature.badge}
        </span>
      </div>

      {/* Text */}
      <div>
        <h3 className="text-base font-semibold text-zinc-100 mb-1">
          {feature.title}
        </h3>
        <p className="text-xs text-zinc-500 font-medium mb-3 tracking-wide">
          {feature.description}
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">{feature.detail}</p>
      </div>

      {/* Hover indicator line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-red-900/0 group-hover:bg-red-900/30 transition-colors duration-200" />
    </div>
  )
}

function Timeline() {
  return (
    <section className="py-24 px-4 sm:px-6 border-t border-zinc-800/60">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="mb-16">
          <p className="text-xs text-zinc-600 font-medium tracking-widest uppercase mb-3">
            Jalur Pembelajaran
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Perjalanan 16 Minggu.
          </h2>
          <p className="mt-3 text-zinc-500 text-sm max-w-lg leading-relaxed">
            Empat milestone utama yang membentuk perjalanan belajarmu dari nol
            hingga terverifikasi secara komunitas.
          </p>
        </div>

        {/* Desktop: horizontal stepper */}
        <div className="hidden md:block">
          {/* Connector line */}
          <div className="relative">
            <div className="absolute top-5 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-px bg-zinc-800" />
            <div className="grid grid-cols-4 gap-4">
              {timelineSteps.map((step, index) => (
                <TimelineNode key={step.id} step={step} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical stepper */}
        <div className="md:hidden flex flex-col">
          {timelineSteps.map((step, index) => (
            <MobileTimelineNode
              key={step.id}
              step={step}
              index={index}
              isLast={index === timelineSteps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineNode({ step, index }: { step: TimelineStep; index: number }) {
  return (
    <div className="flex flex-col items-center text-center group">
      {/* Node */}
      <div
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-5 border transition-all duration-200 ${
          step.isMilestone
            ? 'bg-zinc-900 border-red-900/60 text-red-400 shadow-[0_0_0_4px_rgba(127,29,29,0.08)]'
            : 'bg-zinc-900 border-zinc-700 text-zinc-500'
        }`}
      >
        <span className="text-xs font-bold">{String(index + 1).padStart(2, '0')}</span>
      </div>

      {/* Text */}
      <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-1.5">
        {step.period}
      </p>
      <h3
        className={`text-sm font-semibold mb-2 ${
          step.isMilestone ? 'text-zinc-100' : 'text-zinc-300'
        }`}
      >
        {step.label}
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>

      {/* Milestone indicator */}
      {step.isMilestone && (
        <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-red-950/30 border border-red-900/30 rounded-full">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          <span className="text-[10px] text-red-400 font-medium">Milestone</span>
        </div>
      )}
    </div>
  )
}

function MobileTimelineNode({
  step,
  index,
  isLast,
}: {
  step: TimelineStep
  index: number
  isLast: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Left: node + connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 transition-all duration-200 ${
            step.isMilestone
              ? 'bg-zinc-900 border-red-900/60 text-red-400'
              : 'bg-zinc-900 border-zinc-700 text-zinc-500'
          }`}
        >
          <span className="text-[10px] font-bold">{String(index + 1).padStart(2, '0')}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-zinc-800 mt-2 mb-2" />}
      </div>

      {/* Right: content */}
      <div className="pb-10 flex-1 min-w-0">
        <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-1">
          {step.period}
        </p>
        <h3
          className={`text-sm font-semibold mb-2 ${
            step.isMilestone ? 'text-zinc-100' : 'text-zinc-300'
          }`}
        >
          {step.label}
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>
        {step.isMilestone && (
          <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 bg-red-950/30 border border-red-900/30 rounded-full">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-400 font-medium">Milestone</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800/60 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-zinc-200">JPER COMMUNITY</span>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-red-400 border border-red-900/50 bg-red-950/30 rounded-sm">
                職人
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
              Ekskul Bahasa Jepang SMK — Platform komunitas belajar mandiri menuju
              kompetensi JLPT N4.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/jpercommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            >
              <Github className="w-3.5 h-3.5" />
              Repository
            </a>
            <a
              href="#kurikulum"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            >
              Kurikulum
            </a>
            <a
              href="#alumni"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            >
              Direktori Alumni
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/60" />

        {/* Bottom row */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            &copy; {currentYear} JPER Community. Seluruh hak dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-700">
            <span>Bagian dari</span>
            <span className="text-zinc-600 font-medium">
              Ekskul Bahasa Jepang SMK
            </span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-600">Komunitas Shokunin</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <Timeline />
      </main>
      <Footer />
    </div>
  )
}
