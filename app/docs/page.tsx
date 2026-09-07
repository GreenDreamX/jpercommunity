import Link from "next/link"
import { ArrowLeft, ShieldCheck, Scale, BookOpen, FileText, Search, ExternalLink, Sparkles } from "lucide-react"

export default function DocsIndexPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E4E1DA] pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-8 object-contain" />
            <div>
              <div className="font-mono text-sm font-bold tracking-wider text-[#1C1B1A]">docs.jper.my.id</div>
              <div className="text-xs text-[#6B6862]">Pusat Dokumentasi Resmi JPER Community</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <a
              href="https://jper.my.id"
              className="inline-flex items-center gap-1.5 text-[#6B6862] hover:text-[#B23A2E] transition-colors"
            >
              <ArrowLeft className="size-4" /> Beranda Utama
            </a>
            <span className="text-[#E4E1DA]">|</span>
            <a
              href="https://lms.jper.my.id"
              className="inline-flex items-center gap-1 text-[#2B3A55] hover:text-[#B23A2E] transition-colors"
            >
              LMS Portal <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B23A2E]/30 bg-[#B23A2E]/5 px-3 py-1 text-xs font-bold text-[#B23A2E]">
            <Sparkles className="size-3.5" />
            Dokumentasi &amp; Regulasi Ekskul
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-[#1C1B1A]">
            Pusat Dokumentasi &amp; Legalitas Resmi
          </h1>
          <p className="text-sm md:text-base text-[#6B6862] max-w-2xl leading-relaxed">
            Seluruh berkas kebijakan privasi, syarat dan ketentuan penggunaan, panduan keanggotaan, dan silabus kurikulum bahasa Jepang SMKN 1 Majalaya terstruktur di sini.
          </p>
        </div>

        {/* DOCUMENTATION CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Privacy Policy */}
          <Link href="/privacy" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                    UU PDP Compliant
                  </div>
                  <h2 className="text-xl font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Kebijakan Privasi (Privacy Policy)
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Penjelasan lengkap mengenai transparansi pengumpulan data NISN, NIS, presensi, dan hak perlindungan data siswa SMKN 1 Majalaya.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-[#B23A2E] flex items-center gap-1">
                Baca Kebijakan Privasi →
              </div>
            </div>
          </Link>

          {/* Card 2: Terms of Service */}
          <Link href="/terms" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
                  <Scale className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                    Aturan Komunitas
                  </div>
                  <h2 className="text-xl font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Syarat &amp; Ketentuan (Terms of Service)
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Aturan penggunaan LMS, integritas presensi QR Code, etika akademis, dan hak cipta materi pembelajaran ekskul.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-[#B23A2E] flex items-center gap-1">
                Baca Syarat &amp; Ketentuan →
              </div>
            </div>
          </Link>

          {/* Card 3: Kurikulum */}
          <Link href="/kurikulum" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700">
                  <BookOpen className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-blue-800 uppercase tracking-wider">
                    Silabus LMS
                  </div>
                  <h2 className="text-xl font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Kurikulum &amp; Silabus Bahasa Jepang
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Struktur pembelajaran 6 bulan: Hiragana &amp; Katakana dasar, Bunpou, Kaiwa praktis, hingga persiapan JLPT N5.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-[#B23A2E] flex items-center gap-1">
                Buka Silabus Kurikulum →
              </div>
            </div>
          </Link>

          {/* Card 4: Subdomain Navigation Portal */}
          <div className="bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-700">
                <FileText className="size-6 stroke-[2]" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-purple-800 uppercase tracking-wider">
                  Ekosistem Subdomain
                </div>
                <h2 className="text-xl font-bold text-[#1C1B1A]">
                  Layanan Subdomain JPER
                </h2>
              </div>
              <ul className="text-xs text-[#6B6862] space-y-2">
                <li>• <strong>lms.jper.my.id</strong> — Portal Belajar &amp; Arcade Push Rank</li>
                <li>• <strong>studio.jper.my.id</strong> — Studio Pengurus &amp; Editor Dokumen</li>
                <li>• <strong>form.jper.my.id</strong> — Form Pendaftaran &amp; Submission</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-semibold text-[#2B3A55]">
              Dikelola terpadu dari Studio Admin
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.</div>
          <div className="font-mono">docs.jper.my.id</div>
        </div>
      </div>
    </main>
  )
}
