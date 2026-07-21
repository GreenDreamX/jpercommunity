import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Globe,
  Mail,
  MapPin,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react"

import { ParallaxShowcase } from "@/components/marketing/parallax-showcase"
import { SiteHeader } from "@/components/marketing/site-header"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const quickLinks = [
  {
    title: "LMS Member",
    description: "Absensi, nilai, course, dan tugas di satu alur yang jelas.",
    href: "/lms",
    icon: ClipboardList,
  },
  {
    title: "Studio Admin",
    description: "Kelola course, silabus, absensi, dan member.",
    href: "/studio",
    icon: BadgeCheck,
  },
  {
    title: "Alumni",
    description: "Jejak angkatan, pencapaian, dan koneksi lintas tahun.",
    href: "/alumni",
    icon: Users,
  },
  {
    title: "Login",
    description: "Masuk untuk member, alumni, dan admin sesuai role.",
    href: "/login",
    icon: ArrowRight,
  },
]

const curriculum = [
  {
    title: "Dasar Bahasa",
    label: "Minggu 1-4",
    body: "Kosakata, salam, partikel inti, dan pola kalimat yang dipakai berulang.",
  },
  {
    title: "Latihan Terarah",
    label: "Minggu 5-8",
    body: "Dialog pendek, kuis ringan, dan tugas yang memberi ritme belajar stabil.",
  },
  {
    title: "Praktik & Presentasi",
    label: "Minggu 9+",
    body: "Percakapan, review, dan presentasi singkat untuk mengikat semua materi.",
  },
]

const contacts = [
  { label: "Email", value: "jper.community@gmail.com", href: "mailto:jper.community@gmail.com", icon: Mail },
  { label: "WhatsApp", value: "+62 8xx-xxxx-xxxx", href: "https://wa.me/6280000000000", icon: MessageSquareText },
  { label: "Lokasi", value: "SMA / komunitas mitra", href: "#", icon: MapPin },
  { label: "Website", value: "jper.my.id", href: "https://jper.my.id", icon: Globe },
]

const socials = [
  { label: "Instagram", href: "https://instagram.com/jpercommunity" },
  { label: "TikTok", href: "https://tiktok.com/@jpercommunity" },
  { label: "YouTube", href: "https://youtube.com/@jpercommunity" },
]

const signals = [
  {
    title: "Tata kelola",
    description: "Firebase untuk identitas, Supabase untuk profil, role, dan relasi data.",
  },
  {
    title: "Absensi",
    description: "QR token berubah per sesi, bukan token statis yang mudah dibagikan ulang.",
  },
  {
    title: "Register",
    description: "Satu form dinamis sesuai angkatan, validasi penuh di client dan server.",
  },
]

export function LandingPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(43,58,85,0.08),_transparent_42%),radial-gradient(circle_at_78%_24%,_rgba(178,58,46,0.08),_transparent_22%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-border/80" />
        <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 pb-16 pt-6 md:px-8 lg:px-10">
          <SiteHeader />

          <div
            id="top"
            className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16"
          >
            <div className="flex flex-col gap-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-stone">
                <span className="size-2 rounded-full bg-destructive" />
                Penerimaan anggota baru, materi mingguan, dan administrasi yang rapi
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-heading text-5xl leading-[0.92] font-semibold tracking-[-0.055em] text-foreground md:text-6xl lg:text-7xl">
                  Sistem ekstrakurikuler yang tenang, presisi, dan mudah dipakai.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-stone md:text-lg">
                  JPER Community dibuat untuk ritme kerja nyata: absensi yang jelas, silabus
                  yang terstruktur, data yang aman, dan jalur cepat menuju LMS, Studio, serta
                  halaman alumni. Tidak ramai, tidak “AI slop”, hanya rapi dan informatif.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/lms"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-lg px-5")}
                >
                  Buka LMS
                  <ArrowRight />
                </a>
                <a
                  href="#kurikulum"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-lg px-5 hover:-translate-y-0.5",
                  )}
                >
                  Lihat Kurikulum
                </a>
                <a
                  href="#kontak"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "rounded-lg px-5")}
                >
                  Kontak Pembina
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {signals.map((signal) => (
                  <Card key={signal.title} className="bg-background/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(43,58,85,0.08)]">
                    <CardContent className="p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-stone">Signal</div>
                      <div className="mt-2 font-medium text-foreground">{signal.title}</div>
                      <div className="mt-2 text-sm leading-6 text-stone">{signal.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-12 h-44 rounded-full bg-primary/5 blur-3xl" />
              <Card className="relative overflow-hidden border-border bg-background/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                <CardHeader className="border-b border-border/70 pb-4">
                  <CardDescription className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary" />
                    Ringkasan platform
                  </CardDescription>
                  <CardTitle className="text-2xl tracking-[-0.03em]">
                    Satu layar yang menata alur belajar dan administrasi.
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between text-sm text-stone">
                      <span>Aktivitas utama</span>
                      <span className="font-mono text-xs text-primary">2026</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Register dinamis", "Angkatan 2026, 2024-2025, dan alumni 2019-2023."],
                        ["Absensi sesi", "QR token berganti per pertemuan dan dicatat di server."],
                        ["Nilai mingguan", "Format ringkas agar pembina mudah membaca dan mengecek."],
                      ].map(([title, body]) => (
                        <div
                          key={title}
                          className="group flex items-start justify-between gap-4 border-t border-border/70 pt-3 first:border-0 first:pt-0"
                        >
                          <div>
                            <div className="font-medium text-foreground transition-colors group-hover:text-primary">
                              {title}
                            </div>
                            <div className="text-sm leading-6 text-stone">{body}</div>
                          </div>
                          <ChevronRight className="mt-0.5 size-4 text-destructive transition-transform duration-200 group-hover:translate-x-0.5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
                      <div className="flex items-center gap-2 text-sm text-stone">
                        <BookOpenText className="size-4 text-primary" />
                        Silabus
                      </div>
                      <div className="mt-2 text-sm leading-6 text-foreground">
                        Materi mingguan, notes, dan tugas disusun seperti dokumen belajar resmi.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
                      <div className="flex items-center gap-2 text-sm text-stone">
                        <CalendarDays className="size-4 text-primary" />
                        Absensi
                      </div>
                      <div className="mt-2 text-sm leading-6 text-foreground">
                        Ada stamp kehadiran bergaya hanko untuk momen yang benar-benar resmi.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-foreground">
                    Aksen merah dipakai hemat sebagai penanda status penting, bukan dekorasi acak.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs uppercase tracking-[0.24em] text-stone">Kurikulum</p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
              Kurikulum dibaca seperti jalur belajar, bukan brosur.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone">
              Fokusnya ada pada ritme mingguan, keterbacaan data, dan jalur belajar yang
              bisa dipakai ulang setiap angkatan.
            </p>
          </div>

          <div id="kurikulum" className="grid gap-4">
            {curriculum.map((item) => (
              <Card key={item.title} className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-background">
                <CardContent className="flex flex-col gap-2 p-5 md:flex-row md:items-start md:justify-between md:gap-8">
                  <div>
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-stone">{item.body}</div>
                  </div>
                  <div className="font-mono text-xs uppercase tracking-[0.24em] text-destructive md:pt-1">
                    {item.label}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="rounded-3xl border border-border bg-muted/20 p-5 text-sm leading-7 text-stone md:p-6">
              <div className="flex items-center gap-2 text-foreground">
                <CircleHelp className="size-4 text-primary" />
                Catatan struktur
              </div>
              <p className="mt-2">
                Kurikulum, absensi, dan nilai akan berkembang ke halaman detail mingguan,
                tetapi halaman depan tetap fokus sebagai pintu masuk yang bersih.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/80 bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone">Shortcut cepat</p>
              <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
                Jalur ke area penting tanpa harus mencari menu.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-stone">
                Semua halaman inti bisa diakses langsung dari landing ini. Kartu dibuat dengan
                hover halus supaya terasa hidup, tapi tetap tenang.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link) => {
                const Icon = link.icon

                return (
                  <a
                    key={link.title}
                    href={link.href}
                    className="group rounded-2xl border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_0_0_1px_rgba(43,58,85,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-stone">
                          <Icon className="size-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                          Shortcut
                        </div>
                        <div className="mt-2 font-medium text-foreground transition-colors group-hover:text-primary">
                          {link.title}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-stone">{link.description}</div>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-destructive transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="parallax" className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs uppercase tracking-[0.24em] text-stone">Scroll motion</p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
              Gerakan pelan untuk menandai hierarki, bukan untuk pamer efek.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone">
              Area ini memakai parallax halus saat halaman digulir, jadi konten terasa hidup
              tanpa kehilangan fokus baca.
            </p>
          </div>

          <ParallaxShowcase />
        </div>
      </section>

      <section id="kontak" className="border-t border-border/80 bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-20">
          <Card className="bg-background/95 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary" />
                Kontak
              </CardDescription>
              <CardTitle className="text-2xl tracking-[-0.03em]">
                Hubungi pembina atau cek tautan resmi.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.map((contact) => {
                const Icon = contact.icon

                return (
                  <a
                    key={contact.label}
                    href={contact.href}
                    className="group flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-stone">{contact.label}</div>
                        <div className="font-medium text-foreground">{contact.value}</div>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-destructive transition-transform duration-200 group-hover:translate-x-0.5" />
                  </a>
                )
              })}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border-border bg-muted/20 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-stone">Alumni</div>
                  <div className="mt-2 text-lg font-medium text-foreground">
                    Laman alumni untuk jejak angkatan dan cerita pencapaian.
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone">
                    Shortcut ini akan membawa pengunjung ke halaman alumni yang lebih lengkap.
                  </p>
                </div>
                <a href="/alumni" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg hover:-translate-y-0.5")}>
                  Buka Alumni
                </a>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/20 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-stone">Studio & LMS</div>
                  <div className="mt-2 text-lg font-medium text-foreground">
                    Shortcut ke halaman kerja utama.
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone">
                    Masuk ke LMS member untuk aktivitas belajar, atau Studio untuk panel admin.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href="/lms" className={cn(buttonVariants({ variant: "default", size: "sm" }), "rounded-lg hover:-translate-y-0.5")}>
                    LMS
                  </a>
                  <a href="/studio" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "rounded-lg hover:-translate-y-0.5")}>
                    Studio
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl border border-border bg-background p-5">
              <div className="flex items-center gap-2 text-sm text-stone">
                <MapPin className="size-4 text-destructive" />
                Alamat singkat
              </div>
              <p className="mt-2 text-sm leading-7 text-foreground">
                JPER Community beroperasi sebagai sistem digital untuk kegiatan ekstrakurikuler
                Bahasa Jepang dan dapat dihubungi melalui halaman kontak di atas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/80 bg-muted/15">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
                JPER Community
              </div>
              <p className="mt-2 text-sm leading-7 text-stone">
                Landing page untuk sistem ekstrakurikuler Bahasa Jepang yang formal, bersih,
                dan siap tumbuh menjadi LMS dan Studio penuh.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Akses cepat</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <a className="text-foreground transition-colors hover:text-primary" href="/lms">LMS</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="/studio">Studio</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="/alumni">Alumni</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="/login">Login</a>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Sosial</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {socials.map((social) => (
                    <a key={social.label} className="text-foreground transition-colors hover:text-primary" href={social.href} target="_blank" rel="noreferrer">
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Kontak</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
                  <a className="transition-colors hover:text-primary" href="mailto:jper.community@gmail.com">jper.community@gmail.com</a>
                  <a className="transition-colors hover:text-primary" href="https://wa.me/6280000000000">WhatsApp pembina</a>
                  <a className="transition-colors hover:text-primary" href="#kontak">Lihat detail kontak</a>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Ruang kerja</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
                  <a className="transition-colors hover:text-primary" href="#kurikulum">Kurikulum</a>
                  <a className="transition-colors hover:text-primary" href="#parallax">Scroll motion</a>
                  <a className="transition-colors hover:text-primary" href="#top">Kembali ke atas</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-sm text-stone md:flex-row md:items-center md:justify-between">
            <div>© JPER Community</div>
            <div className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-destructive" />
              Siap untuk angkatan baru, alumni, dan panel administrasi.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}