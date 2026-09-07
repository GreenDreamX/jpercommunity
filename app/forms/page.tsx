import Link from "next/link"
import { ArrowLeft, UserPlus, UploadCloud, MessageSquareHeart, CheckCircle2, ExternalLink, Sparkles } from "lucide-react"

export default function FormsIndexPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E4E1DA] pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-8 object-contain" />
            <div>
              <div className="font-mono text-sm font-bold tracking-wider text-[#1C1B1A]">form.jper.my.id</div>
              <div className="text-xs text-[#6B6862]">Portal Formulir Layanan JPER Community</div>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <Sparkles className="size-3.5 text-amber-600" />
            Formulir Layanan Anggota
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-[#1C1B1A]">
            Portal Formulir Layanan Anggota
          </h1>
          <p className="text-sm md:text-base text-[#6B6862] max-w-2xl leading-relaxed">
            Pusat pengisian formulir pendaftaran anggota ekskul, pengumpulan tugas modul mandiri, dan penyampaian umpan balik presensi mingguan.
          </p>
        </div>

        {/* FORMS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form 1: Registration Form */}
          <Link href="/register" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-[#B23A2E]/10 border border-[#B23A2E]/20 flex items-center justify-center text-[#B23A2E]">
                  <UserPlus className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#B23A2E] uppercase tracking-wider">
                    Form Pendaftaran
                  </div>
                  <h2 className="text-lg font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Pendaftaran Siswa &amp; Alumni
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Form dinamis pendaftaran anggota baru berdasarkan angkatan (2026, 2025, 2024, Alumni 2019-2023).
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-[#B23A2E] flex items-center gap-1">
                Buka Form Register →
              </div>
            </div>
          </Link>

          {/* Form 2: Submission Form */}
          <Link href="/submission" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-[#2B3A55]/10 border border-[#2B3A55]/20 flex items-center justify-center text-[#2B3A55]">
                  <UploadCloud className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#2B3A55] uppercase tracking-wider">
                    Form Pengumpulan
                  </div>
                  <h2 className="text-lg font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Pengumpulan Berkas &amp; Tugas
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Form unggah file tugas PDF, catatan tangan Bunpou, dan submission modul mingguan.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-[#2B3A55] flex items-center gap-1">
                Buka Form Submission →
              </div>
            </div>
          </Link>

          {/* Form 3: Feedback Form */}
          <Link href="/feedback" className="group block">
            <div className="h-full bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs group-hover:border-[#B23A2E] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                  <MessageSquareHeart className="size-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                    Form Evaluasi
                  </div>
                  <h2 className="text-lg font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors mt-0.5">
                    Evaluasi &amp; Ulasan Kelas
                  </h2>
                </div>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  Form umpan balik materi diajarkan, masukan untuk pengurus, dan usulan kegiatan ekskul.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E4E1DA]/60 text-xs font-bold text-emerald-700 flex items-center gap-1">
                Buka Form Evaluasi →
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.</div>
          <div className="font-mono">form.jper.my.id</div>
        </div>
      </div>
    </main>
  )
}
