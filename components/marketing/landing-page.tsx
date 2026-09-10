import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Globe,
  Mail,
  MapPin,
  MessageSquareText,
  Users,
} from "lucide-react"

import { ParallaxShowcase } from "@/components/marketing/parallax-showcase"
import { SiteHeader } from "@/components/marketing/site-header"
import { StickyMobileCta } from "@/components/marketing/sticky-mobile-cta"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const learnTopics = [
  "Hiragana & Katakana (huruf dasar Jepang)",
  "Kosakata & pola kalimat sehari-hari",
  "Tata bahasa dasar (Bunpou)",
  "Percakapan praktis (Kaiwa)",
  "Kebudayaan & festival Jepang",
  "Persiapan sertifikasi JLPT N5",
]

const aboutPoints = [
  {
    title: "Kelas Mingguan",
    body: "Pertemuan rutin setiap minggu membahas materi bahasa Jepang secara bertahap — dari huruf dasar, kosakata, hingga pola kalimat yang dipakai dalam percakapan nyata.",
  },
  {
    title: "Praktik Budaya",
    body: "Bukan hanya teori bahasa. Anggota juga mengenal kebudayaan Jepang lewat kegiatan seperti origami, mengenal festival tradisional, dan latihan kaligrafi sederhana.",
  },
  {
    title: "Jaringan Alumni",
    body: "Lulusan JPER yang sudah bekerja atau melanjutkan studi di Jepang tetap terhubung dan berbagi pengalaman dengan anggota aktif lintas angkatan.",
  },
]

const curriculum = [
  {
    title: "Pengenalan Huruf & Salam",
    label: "Bulan 1–2",
    body: "Menguasai Hiragana, Katakana, salam dasar (aisatsu), dan partikel inti yang menjadi fondasi seluruh pelajaran berikutnya.",
  },
  {
    title: "Kosakata & Pola Kalimat",
    label: "Bulan 3–4",
    body: "Memperluas kosakata sehari-hari, berlatih membuat kalimat pendek, dan mulai memahami struktur tata bahasa Jepang.",
  },
  {
    title: "Percakapan & Latihan",
    label: "Bulan 5–6",
    body: "Dialog pendek berpasangan, kuis ringan berkala, dan latihan mendengarkan (listening) untuk membentuk ritme belajar yang stabil.",
  },
  {
    title: "Evaluasi & Sertifikat",
    label: "Akhir Semester",
    body: "Kuis akhir, presentasi singkat, dan sertifikat kelulusan bagi anggota yang menyelesaikan seluruh rangkaian materi.",
  },
]

const contacts = [
  { label: "Email", value: "petugasromusha@gmail.com", href: "mailto:petugasromusha@gmail.com", icon: Mail },
  { label: "WhatsApp", value: "Hubungi Kami", href: "https://wa.me/6283850967918", icon: MessageSquareText },
  { label: "Lokasi", value: "SMKN 1 Majalaya", href: "https://maps.app.goo.gl/TBYeFDHF1ufQd9uf9", icon: MapPin },
  { label: "Website", value: "jper.my.id", href: "https://jper.my.id", icon: Globe },
]

const socials = [
  { label: "Instagram", href: "https://instagram.com/jpercommunity" },
  { label: "TikTok", href: "https://tiktok.com/@jpercommunity" },
  { label: "YouTube", href: "https://youtube.com/@j-perchannel1297?si=lbaHo5FRj2S4bVYJ" },
]

export function LandingPage() {
  return (
    <main className="bg-background text-foreground">
      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(43,58,85,0.08),_transparent_42%),radial-gradient(circle_at_78%_24%,_rgba(178,58,46,0.08),_transparent_22%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-border/80" />
        <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 pb-16 pt-6 md:px-8 lg:px-10">
          <SiteHeader />

          <div
            id="top"
            className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16"
          >
            {/* Left column */}
            <div className="flex flex-col gap-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-stone">
                <span className="size-2 rounded-full bg-destructive" />
                Ekstrakurikuler Bahasa Jepang — SMKN 1 Majalaya
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-heading text-5xl leading-[0.92] font-semibold tracking-[-0.055em] text-foreground md:text-6xl lg:text-7xl">
                  Belajar Bahasa Jepang Bareng, dari Nol sampai Bisa.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-stone md:text-lg">
                  JPER Community adalah ekstrakurikuler bahasa Jepang di SMKN 1 Majalaya.
                  Kami belajar bareng setiap minggu — mulai dari huruf dasar sampai percakapan,
                  dengan suasana yang serius tapi tetap menyenangkan.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://forms.jper.my.id/register"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-lg px-5")}
                >
                  Daftar Sekarang
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
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8 border-t border-border pt-6">
                {[
                  { number: "7+", label: "angkatan sejak 2019" },
                  { number: "24", label: "pertemuan per tahun" },
                  { number: "100+", label: "total alumni & anggota" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      {stat.number}
                    </div>
                    <div className="text-sm text-stone">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — What you'll learn */}
            <div className="relative">
              <div className="absolute inset-x-10 top-12 h-44 rounded-full bg-primary/5 blur-3xl" />
              <Card className="relative overflow-hidden border-border bg-background/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                <CardHeader className="border-b border-border/70 pb-4">
                  <CardDescription className="flex items-center gap-2">
                    <BookOpenText className="size-3.5 text-primary" />
                    Apa yang akan dipelajari
                  </CardDescription>
                  <CardTitle className="text-2xl tracking-[-0.03em]">
                    Materi yang Kami Ajarkan Setiap Semester.
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-5">
                  {learnTopics.map((topic) => (
                    <div
                      key={topic}
                      className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5">
                        <Check className="size-3 text-primary" />
                      </div>
                      <span className="text-sm leading-6 text-foreground">{topic}</span>
                    </div>
                  ))}

                  <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-foreground">
                    Tidak perlu pengalaman bahasa Jepang sebelumnya — semua materi dimulai dari nol.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ───── SELAYANG PANDANG ───── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs uppercase tracking-[0.24em] text-stone">Tentang Kami</p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
              Mengenal JPER Community.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone">
              Didirikan pada tahun 2019 sebagai wadah bagi siswa SMKN 1 Majalaya yang tertarik
              dengan bahasa dan kebudayaan Jepang. Kami menggabungkan pembelajaran terstruktur
              dengan kegiatan budaya yang membuat proses belajar terasa hidup.
            </p>
          </div>

          <div className="grid gap-4">
            {aboutPoints.map((item) => (
              <Card key={item.title} className="transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-background">
                <CardContent className="flex flex-col gap-2 p-5 md:flex-row md:items-start md:justify-between md:gap-8">
                  <div>
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-stone">{item.body}</div>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-destructive" />
                </CardContent>
              </Card>
            ))}

            <div className="rounded-3xl border border-border bg-muted/20 p-5 text-sm leading-7 text-stone md:p-6">
              <div className="flex items-center gap-2 text-foreground">
                <CircleHelp className="size-4 text-primary" />
                Metode Pembelajaran
              </div>
              <p className="mt-2">
                Pembelajaran menggabungkan teori tertulis (tata bahasa & kanji), latihan audio (listening),
                serta pemutaran video penjelasan budaya untuk melatih kepekaan aksen dan pemahaman konteks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── KURIKULUM ───── */}
      <section className="border-y border-border/80 bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-xs uppercase tracking-[0.24em] text-stone">Kurikulum</p>
              <h2 id="kurikulum" className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
                Jalur Belajar yang Bertahap dan Terukur.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-stone">
                Materi disusun ke dalam modul berkala agar setiap anggota dapat menguasai
                pelajaran secara bertahap tanpa terburu-buru.
              </p>
            </div>

            <div className="grid gap-4">
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
            </div>
          </div>
        </div>
      </section>

      {/* ───── GALERI / DOKUMENTASI ───── */}
      <section id="parallax" className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs uppercase tracking-[0.24em] text-stone">Dokumentasi Kegiatan</p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
              Suasana Belajar dan Kebersamaan di JPER.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone">
              Dari kelas mingguan, latihan percakapan, sampai perayaan festival kebudayaan —
              semua momen terdokumentasi sebagai bagian dari perjalanan belajar bersama.
            </p>
          </div>

          <ParallaxShowcase />
        </div>
      </section>

      {/* ───── KONTAK + CTA ───── */}
      <section id="kontak" className="border-t border-border/80 bg-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-8 lg:px-10 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Contact card */}
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

            {/* CTA join */}
            <div className="flex flex-col gap-4">
              <Card className="flex flex-1 flex-col justify-center border-primary/20 bg-primary/5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-2 text-sm text-stone">
                    <Users className="size-4 text-primary" />
                    Bergabung
                  </div>
                  <h3 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground md:text-3xl">
                    Tertarik belajar bahasa Jepang bersama kami?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-stone">
                    Pendaftaran terbuka untuk siswa SMKN 1 Majalaya dari semua jurusan dan angkatan.
                    Tidak perlu pengalaman bahasa Jepang sebelumnya.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="https://forms.jper.my.id/register"
                      className={cn(buttonVariants({ size: "lg" }), "rounded-lg px-6")}
                    >
                      Daftar Sekarang
                      <ArrowRight />
                    </a>
                    <a
                      href="/login"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "rounded-lg px-6 hover:-translate-y-0.5",
                      )}
                    >
                      Sudah punya akun? Login
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-3xl border border-border bg-background p-5">
                <div className="flex items-center gap-2 text-sm text-stone">
                  <CalendarDays className="size-4 text-primary" />
                  Jadwal kegiatan
                </div>
                <p className="mt-2 text-sm leading-7 text-foreground">
                  Kelas diadakan setiap minggu di lingkungan sekolah. Jadwal detail dan materi
                  per pertemuan dapat diakses melalui LMS setelah mendaftar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-border/80 bg-muted/15">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-2.5">
                <img src="/image/J-PER.png" alt="JPER Logo" className="size-7 object-contain" />
                <div className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
                  JPER Community
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-stone">
                Ekstrakurikuler Bahasa Jepang di SMKN 1 Majalaya.
                Belajar bahasa, mengenal budaya, membangun koneksi.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Navigasi</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <a className="text-foreground transition-colors hover:text-primary" href="/login">Login Member</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="https://forms.jper.my.id/register">Daftar Ekskul</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="/direktori">Direktori Anggota</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="/faq">FAQ & Panduan</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="https://docs.jper.my.id/privacy">Kebijakan Privasi</a>
                  <a className="text-foreground transition-colors hover:text-primary" href="https://docs.jper.my.id/terms">Syarat & Ketentuan</a>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Sosial & Komunitas</div>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {socials.map((social) => (
                    <a key={social.label} className="text-foreground transition-colors hover:text-primary" href={social.href} target="_blank" rel="noreferrer">
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-stone">Kontak Resmi</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
                  <a className="transition-colors hover:text-primary" href="mailto:petugasromusha@gmail.com">petugasromusha@gmail.com</a>
                  <a className="transition-colors hover:text-primary" href="https://wa.me/6283850967918" target="_blank" rel="noreferrer">+62 838-5096-7918 (WhatsApp)</a>
                  <span className="text-xs text-stone mt-1">SMKN 1 Majalaya, Kab. Bandung</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-sm text-stone md:flex-row md:items-center md:justify-between">
            <div>© 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya</div>
            <div className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-destructive" />
              Penerimaan anggota baru terbuka setiap tahun ajaran.
            </div>
          </div>
        </div>
      </footer>
      <StickyMobileCta />
    </main>
  )
}