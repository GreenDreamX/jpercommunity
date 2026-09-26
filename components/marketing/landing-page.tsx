import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ExternalLink,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react"

import dynamic from "next/dynamic"
import Image from "next/image"

import { SiteHeader } from "@/components/marketing/site-header"

const StickyMobileCta = dynamic(
  () => import("@/components/marketing/sticky-mobile-cta").then((mod) => mod.StickyMobileCta)
)

const learnTopics = [
  "Hiragana & Katakana (Huruf Dasar Jepang)",
  "Kosakata & Pola Kalimat Sehari-hari",
  "Tata Bahasa Dasar (Bunpou / 文法)",
  "Percakapan Praktis (Kaiwa / 会話)",
  "Kebudayaan & Festival Jepang (Bunka)",
  "Persiapan Sertifikasi JLPT N5",
]

const aboutPoints = [
  {
    title: "Kelas Mingguan Terstruktur",
    japanese: "毎週の授業",
    body: "Pertemuan rutin setiap minggu membahas materi bahasa Jepang secara bertahap — dari huruf dasar, kosakata, hingga pola kalimat percakapan nyata.",
  },
  {
    title: "Praktik & Kebudayaan",
    body: "Bukan hanya teori. Anggota diajak mengenal kebudayaan Jepang lewat kegiatan interaktif seperti origami, kenal festival tradisional, dan kaligrafi.",
    japanese: "日本文化体験",
  },
  {
    title: "Jaringan Alumni & Komunitas",
    japanese: "卒業生ネットワーク",
    body: "Lulusan JPER yang sudah bekerja atau melanjutkan studi di Jepang tetap terhubung dan berbagi pengalaman dengan anggota aktif.",
  },
]

const curriculum = [
  {
    step: "01",
    title: "Pengenalan Huruf & Salam",
    label: "BULAN 1–2",
    japanese: "文字と挨拶",
    body: "Menguasai Hiragana, Katakana, salam dasar (aisatsu), dan partikel inti yang menjadi fondasi seluruh pelajaran berikutnya.",
  },
  {
    step: "02",
    title: "Kosakata & Pola Kalimat",
    label: "BULAN 3–4",
    japanese: "語彙と文法",
    body: "Memperluas kosakata sehari-hari, berlatih membuat kalimat pendek, dan mulai memahami struktur tata bahasa Jepang.",
  },
  {
    step: "03",
    title: "Percakapan & Latihan Kaiwa",
    label: "BULAN 5–6",
    japanese: "会話練習",
    body: "Dialog pendek berpasangan, kuis ringan berkala, dan latihan mendengarkan (listening) untuk membentuk ritme belajar yang stabil.",
  },
  {
    step: "04",
    title: "Evaluasi & Sertifikasi",
    label: "AKHIR SEMESTER",
    japanese: "評価と修了証",
    body: "Kuis akhir, presentasi singkat, dan sertifikat kelulusan bagi anggota yang menyelesaikan seluruh rangkaian materi.",
  },
]

const faqs = [
  {
    question: "Apakah ada syarat kemampuan Bahasa Jepang sebelum mendaftar?",
    answer: "Tidak ada! Seluruh pembelajaran dimulai dari nol — mulai dari huruf dasar Hiragana dan Katakana.",
  },
  {
    question: "Siapa saja yang boleh bergabung dengan JPER Community?",
    answer: "Terbuka untuk seluruh siswa SMKN 1 Majalaya dari semua jurusan dan angkatan (termasuk Alumni).",
  },
  {
    question: "Kapan dan di mana kelas mingguan dilaksanakan?",
    answer: "Kelas rutin dilaksanakan setiap minggu secara tatap muka di SMKN 1 Majalaya. Jadwal spesifik dan ruang kelas diinfokan di LMS.",
  },
  {
    question: "Bagaimana sistem absensi dan penilaian di JPER Community?",
    answer: "Absensi menggunakan QR Code realtime di LMS, dan rekap tugas/kuis tersimpan otomatis di portal member.",
  },
]

const contacts = [
  { label: "Email Resmi", value: "petugasromusha@gmail.com", href: "mailto:petugasromusha@gmail.com", icon: Mail },
  { label: "WhatsApp Chat", value: "+62 838-5096-7918", href: "https://wa.me/6283850967918", icon: MessageSquareText },
  { label: "Lokasi Sekolah", value: "SMKN 1 Majalaya", href: "https://maps.app.goo.gl/TBYeFDHF1ufQd9uf9", icon: MapPin },
  { label: "Website Utama", value: "jper.my.id", href: "https://jper.my.id", icon: Globe },
]

const socials = [
  { label: "Instagram", href: "https://instagram.com/jpercommunity" },
  { label: "TikTok", href: "https://tiktok.com/@jpercommunity" },
  { label: "YouTube", href: "https://youtube.com/@j-perchannel1297?si=lbaHo5FRj2S4bVYJ" },
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-black antialiased selection:bg-[#E60012] selection:text-white">
      {/* ───── SECTION 1: HERO (Subtle Minimalist Grid Pattern) ───── */}
      <section className="relative overflow-hidden border-b-2 border-black bg-white p5-subtle-grid">
        {/* Subtle Red Corner Accent */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-gradient-to-bl from-[#E60012]/05 via-transparent to-transparent pointer-events-none -rotate-12 transform origin-top-right" />

        <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 pb-16 pt-6 md:px-8 lg:px-10">
          <SiteHeader />

          <div
            id="top"
            className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-16"
          >
            {/* Left Column */}
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <div className="inline-block bg-black text-[#FFC700] px-3.5 py-1 font-mono text-xs font-black uppercase tracking-widest -skew-x-6 border-2 border-black shadow-[3px_3px_0px_#E60012]">
                  日本語を学ぼう ★ START FROM ZERO
                </div>
                <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] font-black uppercase tracking-tight text-black md:text-5xl lg:text-6xl">
                  BELAJAR BAHASA JEPANG BARENG,{" "}
                  <span className="inline-block bg-[#E60012] text-white px-3 py-1 -skew-x-3 shadow-[4px_4px_0px_#FFC700] transition-transform hover:scale-105 duration-200">
                    DARI NOL
                  </span>{" "}
                  SAMPAI BISA.
                </h1>
                <p className="max-w-2xl text-base font-medium leading-relaxed text-zinc-800 md:text-lg">
                  JPER Community adalah wadah belajar bahasa dan kebudayaan Jepang di SMKN 1 Majalaya. 
                  Kami belajar rutin setiap minggu dalam suasana yang terstruktur, penuh semangat, dan elegan.
                </p>
              </div>

              {/* Action Buttons with Explosive P5 Animations */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="https://forms.jper.my.id/register"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex items-center justify-center gap-2.5 border-2 border-black bg-[#E60012] px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[5px_5px_0px_#FFC700] transition-all duration-150 hover:-translate-y-1.5 hover:-rotate-1 hover:bg-[#FFC700] hover:text-black hover:shadow-[6px_6px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-95"
                >
                  <span>DAFTAR SEKARANG</span>
                  <ExternalLink className="size-4 text-[#FFC700] transition-transform group-hover:scale-125 group-hover:text-black" />
                </a>
                <a
                  href="#kurikulum"
                  className="group flex items-center justify-center gap-2.5 border-2 border-black bg-white px-8 py-4 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1 hover:rotate-1 hover:bg-black hover:text-white hover:shadow-[5px_5px_0px_#E60012] active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-95"
                >
                  <span>LIHAT KURIKULUM</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-3 gap-4 border-t-2 border-black pt-6">
                {[
                  { number: "7+", label: "ANGKATAN", sub: "Sejak 2019", bg: "bg-[#E60012] text-white" },
                  { number: "24", label: "PERTEMUAN", sub: "Per Tahun", bg: "bg-[#FFC700] text-black" },
                  { number: "100+", label: "ALUMNI", sub: "& Anggota Aktif", bg: "bg-black text-white" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="group border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1 hover:rotate-1 hover:shadow-[5px_5px_0px_#E60012]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black tracking-tighter text-black md:text-3xl">
                        {stat.number}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 -skew-x-6 border border-black ${stat.bg}`}>
                        ★
                      </span>
                    </div>
                    <div className="mt-1 font-black text-xs uppercase tracking-wider text-black">{stat.label}</div>
                    <div className="text-[10px] text-zinc-500 font-bold">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column — What You'll Learn Card */}
            <div className="relative">
              <div className="border-2 border-black bg-white shadow-[8px_8px_0px_#E60012] transition-transform duration-200 hover:-translate-y-1">
                <div className="border-b-2 border-black bg-black text-white p-4">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#FFC700]">
                    <span className="flex items-center gap-1.5">
                      <BookOpenText className="size-4" />
                      CURRICULUM HIGHLIGHTS
                    </span>
                    <span className="bg-[#E60012] text-white px-2 py-0.5 text-[10px] -skew-x-6 border border-white">
                      2026/2027
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-black uppercase tracking-tight text-white mt-1">
                    Apa yang Akan Dipelajari?
                  </h3>
                </div>

                <div className="p-5 space-y-2.5">
                  {learnTopics.map((topic, i) => (
                    <div
                      key={topic}
                      className="group flex items-center gap-3 border-2 border-black/10 bg-zinc-50 px-3.5 py-2.5 transition-all duration-150 hover:border-black hover:bg-white hover:shadow-[4px_4px_0px_#FFC700] hover:-translate-x-1"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center bg-[#E60012] text-xs font-black text-white -skew-x-6 border border-black group-hover:bg-[#FFC700] group-hover:text-black">
                        0{i + 1}
                      </span>
                      <span className="text-xs font-black uppercase text-black tracking-tight">{topic}</span>
                    </div>
                  ))}

                  <div className="border-2 border-black bg-[#FFC700] p-3 text-xs font-black uppercase tracking-tight text-black shadow-[3px_3px_0px_#111] flex items-center gap-2 mt-4 transition-transform hover:scale-102">
                    <Zap className="size-4 fill-black text-black shrink-0" />
                    <span>Mulai dari nol — tidak ada ujian masuk atau kriteria awal!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 2: MARQUEE TICKER RIBBON ───── */}
      <div className="border-b-2 border-black bg-[#E60012] text-white py-3 overflow-hidden select-none shadow-[0px_4px_0px_#111]">
        <div className="flex whitespace-nowrap animate-marquee font-mono text-xs font-black uppercase tracking-widest">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 shrink-0 mr-6">
              <span>JPER COMMUNITY</span>
              <span className="text-[#FFC700]">★</span>
              <span>日本語部</span>
              <span className="text-[#FFC700]">★</span>
              <span>LEARN JAPANESE FROM ZERO</span>
              <span className="text-[#FFC700]">★</span>
              <span>SMKN 1 MAJALAYA</span>
              <span className="text-[#FFC700]">★</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── SECTION 3: SELAYANG PANDANG (P5 Diagonal Stripe Pattern) ───── */}
      <section className="border-b-2 border-black bg-[#FAFAFC] p5-stripe-pattern py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="lg:sticky lg:top-8 lg:self-start space-y-3">
              <span className="inline-block bg-[#E60012] text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-widest -skew-x-6 border-2 border-black shadow-[2px_2px_0px_#FFC700]">
                ABOUT US • 私たちについて
              </span>
              <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
                Mengenal JPER Community.
              </h2>
              <p className="text-base font-medium leading-relaxed text-zinc-800">
                Didirikan tahun 2019 sebagai ruang belajar interaktif untuk siswa SMKN 1 Majalaya. 
                Kami memadukan teori tata bahasa, latihan percakapan langsung, dan pengenalan budaya.
              </p>
            </div>

            <div className="grid gap-4">
              {aboutPoints.map((item, idx) => (
                <div
                  key={item.title}
                  className="group border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1.5 hover:rotate-0.5 hover:shadow-[6px_6px_0px_#E60012] active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-black text-[#FFC700] px-2 py-0.5 border border-black">
                          0{idx + 1}
                        </span>
                        <h3 className="font-black text-base uppercase text-black tracking-tight group-hover:text-[#E60012] transition-colors">{item.title}</h3>
                      </div>
                      <p className="text-xs font-medium text-zinc-700 leading-relaxed pt-1">{item.body}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 border border-black/10 shrink-0">
                      {item.japanese}
                    </span>
                  </div>
                </div>
              ))}

              <div className="border-2 border-black bg-[#FFC700] p-5 shadow-[4px_4px_0px_#111] space-y-2 transition-transform hover:scale-101">
                <div className="flex items-center gap-2 font-black uppercase text-xs text-black">
                  <Star className="size-4 fill-black text-black" />
                  METODE PEMBELAJARAN INTERAKTIF
                </div>
                <p className="text-xs font-bold text-zinc-950 leading-relaxed">
                  Pembelajaran mengombinasikan modul cetak & digital, latihan mendengar percakapan asli (kaiwa), 
                  serta kuis interaktif mingguan melalui platform LMS untuk memantau perkembangan belajar anggota.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 4: KURIKULUM (P5 Kumiko Grid Pattern) ───── */}
      <section className="border-b-2 border-black bg-white p5-grid-pattern py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="lg:sticky lg:top-8 lg:self-start space-y-3">
              <span className="inline-block bg-black text-[#FFC700] px-3 py-1 font-mono text-xs font-black uppercase tracking-widest -skew-x-6 border-2 border-black shadow-[2px_2px_0px_#E60012]">
                SYLLABUS • カリキュラム
              </span>
              <h2 id="kurikulum" className="font-heading text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
                Jalur Belajar Bertahap & Terstruktur.
              </h2>
              <p className="text-base font-medium leading-relaxed text-zinc-800">
                Materi disusun sistematis per modul mingguan agar setiap anggota berkembang dengan kecepatan yang stabil.
              </p>
            </div>

            <div className="grid gap-4">
              {curriculum.map((item) => (
                <div
                  key={item.title}
                  className="group border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1.5 hover:border-[#E60012] hover:shadow-[6px_6px_0px_#FFC700] active:scale-[0.99]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span className="font-mono text-base font-black bg-[#E60012] text-white px-3 py-1 border-2 border-black -skew-x-6 shrink-0 group-hover:bg-black group-hover:text-[#FFC700] transition-colors">
                        {item.step}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base uppercase text-black tracking-tight group-hover:text-[#E60012] transition-colors">{item.title}</h3>
                          <span className="text-[10px] font-bold text-zinc-400">({item.japanese})</span>
                        </div>
                        <p className="text-xs font-medium text-zinc-700 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black uppercase tracking-wider bg-[#FFC700] text-black border-2 border-black px-3 py-1 shadow-[2px_2px_0px_#111] shrink-0 self-start">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 5: FAQ (P5 Ivory Warm Japanese Dots) ───── */}
      <section className="border-b-2 border-black bg-[#FFFDF4] p5-kanazawa-dots py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="lg:sticky lg:top-8 lg:self-start space-y-3">
              <span className="inline-block bg-[#E60012] text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-widest -skew-x-6 border-2 border-black shadow-[2px_2px_0px_#111]">
                FAQ • 質問と回答
              </span>
              <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
                Pertanyaan Umum.
              </h2>
              <p className="text-base font-medium leading-relaxed text-zinc-800">
                Jawaban cepat untuk hal-hal yang sering ditanyakan calon anggota baru JPER Community.
              </p>
            </div>

            <div className="grid gap-4">
              {faqs.map((faq, i) => (
                <div
                  key={faq.question}
                  className="group border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111] space-y-2 transition-all duration-150 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E60012] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 font-black text-sm uppercase text-black">
                    <span className="bg-[#E60012] text-white px-2 py-0.5 text-xs font-mono -skew-x-6 border border-black group-hover:bg-[#FFC700] group-hover:text-black">
                      Q{i + 1}
                    </span>
                    <h3 className="group-hover:text-[#E60012] transition-colors">{faq.question}</h3>
                  </div>
                  <p className="text-xs font-medium text-zinc-700 leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 6: KONTAK + CTA BERGABUNG (P5 Styled Pattern) ───── */}
      <section id="kontak" className="relative overflow-hidden border-b-2 border-black bg-[#FAF9F5] p5-subtle-grid py-16 md:py-24">
        {/* Soft Background Accents */}
        <div className="absolute top-0 left-0 h-80 w-80 bg-gradient-to-br from-[#FFC700]/10 via-transparent to-transparent pointer-events-none rotate-12 transform origin-top-left" />
        <div className="absolute bottom-0 right-0 h-80 w-80 bg-gradient-to-tl from-[#E60012]/10 via-transparent to-transparent pointer-events-none -rotate-12 transform origin-bottom-right" />

        <div className="relative mx-auto w-full max-w-6xl px-6 md:px-8 lg:px-10">
          <div className="mb-10 space-y-3">
            <span className="inline-block bg-[#E60012] text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-widest -skew-x-6 border-2 border-black shadow-[2px_2px_0px_#FFC700]">
              CONTACT & REGISTER • お問い合わせ
            </span>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
              Hubungi Kami & Bergabung.
            </h2>
            <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-700">
              Punya pertanyaan seputar kegiatan ekskul atau siap bergabung? Tim pengurus JPER Community siap membantu Anda.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Contact Info Card */}
            <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_#111] space-y-4 transition-transform hover:-translate-y-1">
              <div className="border-b-2 border-black pb-3">
                <span className="bg-black text-[#FFC700] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6 border border-black">
                  CONTACT OFFICIAL
                </span>
                <h3 className="font-heading text-xl font-black uppercase text-black mt-1">
                  Saluran Komunikasi Resmi
                </h3>
              </div>

              <div className="space-y-3">
                {contacts.map((contact) => {
                  const Icon = contact.icon
                  return (
                    <a
                      key={contact.label}
                      href={contact.href}
                      target={contact.href.startsWith("http") ? "_blank" : undefined}
                      rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-center justify-between border-2 border-black bg-zinc-50 p-3.5 transition-all duration-150 hover:bg-white hover:shadow-[4px_4px_0px_#E60012] hover:-translate-x-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center bg-[#E60012] text-white border-2 border-black -skew-x-6 group-hover:bg-[#FFC700] group-hover:text-black transition-colors">
                          <Icon className="size-4 skew-x-6" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{contact.label}</div>
                          <div className="text-xs font-black uppercase text-black">{contact.value}</div>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-black transition-transform group-hover:translate-x-1 group-hover:text-[#E60012]" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Join CTA Box */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 border-2 border-black bg-[#E60012] text-white p-6 md:p-8 shadow-[6px_6px_0px_#FFC700] space-y-4 transition-transform hover:-translate-y-1">
                <div className="inline-block bg-black text-[#FFC700] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest -skew-x-6 border border-black">
                  JOIN OUR COMMUNITY
                </div>
                <h3 className="font-heading text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  TERTARIK BELAJAR BAHASA JEPANG?
                </h3>
                <p className="text-xs font-medium leading-relaxed text-zinc-100">
                  Pendaftaran terbuka untuk seluruh siswa SMKN 1 Majalaya dari semua jurusan dan angkatan. 
                  Mari bergabung dan mulai perjalanan belajar Anda bersama kami.
                </p>
                <div className="flex flex-wrap gap-3.5 pt-2">
                  <a
                    href="https://forms.jper.my.id/register"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 border-2 border-black bg-[#FFC700] text-black px-7 py-3.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1 hover:bg-white hover:shadow-[5px_5px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-95"
                  >
                    <span>DAFTAR SEKARANG</span>
                    <ExternalLink className="size-4 text-black" />
                  </a>
                  <a
                    href="/login"
                    className="flex items-center justify-center gap-2 border-2 border-black bg-white text-black px-7 py-3.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#111] transition-all duration-150 hover:-translate-y-1 hover:bg-black hover:text-white hover:shadow-[5px_5px_0px_#FFC700] active:translate-x-1 active:translate-y-1 active:shadow-none active:scale-95"
                  >
                    LOGIN MEMBER
                  </a>
                </div>
              </div>

              <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#111] flex items-center gap-3">
                <CalendarDays className="size-5 text-[#E60012] shrink-0" />
                <p className="text-xs font-bold text-black uppercase tracking-tight">
                  Jadwal Pertemuan: Setiap minggu di SMKN 1 Majalaya. Detail diinfokan di LMS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── SECTION 7: FOOTER (Deep Jet Black) ───── */}
      <footer className="border-t-2 border-black bg-zinc-950 text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md space-y-3">
              <div className="flex items-center gap-2.5">
                <Image src="/image/J-PER.png" alt="JPER Logo" width={36} height={36} className="h-9 w-auto object-contain" />
                <span className="font-heading text-lg font-black uppercase tracking-tight text-white">
                  JPER COMMUNITY <span className="text-[#E60012]">★</span>
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-zinc-400">
                Ekstrakurikuler Bahasa dan Kebudayaan Jepang di SMKN 1 Majalaya. 
                Belajar terstruktur, berkembang bersama, dan membangun koneksi.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-[#FFC700]">NAVIGASI</div>
                <div className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider">
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="/login">Login Member</a>
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="https://forms.jper.my.id/register" target="_blank" rel="noreferrer">Daftar Ekskul</a>
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="/direktori">Direktori Anggota</a>
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="/faq">FAQ & Panduan</a>
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="https://docs.jper.my.id/privacy">Kebijakan Privasi</a>
                  <a className="text-zinc-300 transition-colors hover:text-[#E60012]" href="https://docs.jper.my.id/terms">Syarat & Ketentuan</a>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-[#FFC700]">SOSIAL MEDIA</div>
                <div className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider">
                  {socials.map((social) => (
                    <a key={social.label} className="text-zinc-300 transition-colors hover:text-[#E60012]" href={social.href} target="_blank" rel="noreferrer">
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-[#FFC700]">KONTAK RESMI</div>
                <div className="flex flex-col gap-1.5 text-xs text-zinc-300">
                  <a className="font-bold transition-colors hover:text-[#E60012]" href="mailto:petugasromusha@gmail.com">petugasromusha@gmail.com</a>
                  <a className="font-bold transition-colors hover:text-[#E60012]" href="https://wa.me/6283850967918" target="_blank" rel="noreferrer">+62 838-5096-7918 (WhatsApp)</a>
                  <span className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">SMKN 1 Majalaya, Kab. Bandung</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
            <div>© 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya</div>
            <div className="inline-flex items-center gap-2 font-bold uppercase text-[10px] text-[#FFC700]">
              <span className="size-2 rounded-full bg-[#E60012]" />
              PENDAFTARAN ANGGOTA TERBUKA UNTUK SELURUH ANGKATAN
            </div>
          </div>
        </div>
      </footer>
      <StickyMobileCta />
    </main>
  )
}