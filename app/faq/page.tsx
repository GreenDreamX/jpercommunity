import Link from "next/link"
import { ArrowLeft, HelpCircle, ChevronRight, Sparkles, BookOpen } from "lucide-react"

export const metadata = {
  title: "FAQ & Panduan Anggota | JPER Community LMS",
  description: "Pertanyaan umum dan panduan lengkap pendaftaran ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.",
}

const FAQ_ITEMS = [
  {
    q: "Apakah pendaftaran ekskul JPER terbuka untuk seluruh angkatan?",
    a: "Ya! JPER Community terbuka untuk siswa aktif SMKN 1 Majalaya (Angkatan 2026, 2025, 2024) serta alumni lintas angkatan sejak 2019.",
  },
  {
    q: "Bagaimana cara melakukan absensi kehadiran harian di LMS?",
    a: "Saat sesi kelas mingguan berlangsung di sekolah, Admin akan menampilkan QR Code di layar. Buka menu 'Kehadiran Mandiri' di LMS dan pindai QR Code tersebut melalui kamera HP Anda.",
  },
  {
    q: "Apakah perlu memiliki pengalaman bahasa Jepang sebelumnya?",
    a: "Tidak perlu sama sekali! Pembelajaran di JPER dimulai dari nol (Dasar Hiragana, Katakana, dan salam sehari-hari/Aisatsu).",
  },
  {
    q: "Bagaimana cara mendapatkan Sertifikat Kelulusan resmi JPER?",
    a: "Anggota yang mengikuti minimal 80% sesi pertemuan dan memiliki rata-rata nilai kuis/tugas ≥ 70 berhak mendapatkan Sertifikat Kelulusan resmi berstempel Hanko digital yang dapat diunggah ke portofolio.",
  },
  {
    q: "Bagaimana jika saya lupa kata sandi akun LMS saya?",
    a: "Gunakan tombol 'Lupa password?' di halaman Login. Sistem kami mendukung verifikasi identitas (Tanggal Lahir & No. Telp) langsung tanpa perlu menunggu konfirmasi email.",
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#B23A2E] transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Halaman Utama
          </Link>
          <div className="flex items-center gap-2">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-6 object-contain" />
            <span className="font-mono text-xs font-bold tracking-wider">JPER Community</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[#1C1B1A]">
            Pertanyaan Umum (FAQ) &amp; Panduan Anggota
          </h1>
          <p className="text-xs font-mono text-[#6B6862]">
            Temukan jawaban lengkap seputar kegiatan dan pembelajaran di JPER Community.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={item.q}
              className="bg-white border border-[#E4E1DA] p-5 rounded-2xl space-y-2 shadow-xs transition-all hover:border-[#2B3A55]/40"
            >
              <div className="font-bold text-sm text-[#1C1B1A] flex items-start gap-2.5">
                <span className="font-mono text-xs text-[#B23A2E] bg-[#B23A2E]/10 px-2 py-0.5 rounded-md shrink-0">
                  Q0{idx + 1}
                </span>
                <span>{item.q}</span>
              </div>
              <p className="text-xs text-[#6B6862] leading-relaxed pl-9">{item.a}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-[#2B3A55] text-white p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-base font-bold flex">
              <div className="" /> Siap Memulai Perjalanan Belajar?
            </div>
            <p className="text-xs text-slate-300">
              Daftarkan diri Anda sekarang dan bergabunglah dengan anggota JPER Community lainnya.
            </p>
          </div>
          <Link
            href="/register"
            className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs shrink-0 inline-flex items-center gap-1.5"
          >
            Daftar Anggota Baru <ChevronRight className="size-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex items-center justify-between text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community</div>
        </div>
      </div>
    </main>
  )
}
