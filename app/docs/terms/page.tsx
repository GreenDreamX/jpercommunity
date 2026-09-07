import Link from "next/link"
import { ArrowLeft, ShieldCheck, FileText, Scale } from "lucide-react"

export const metadata = {
  title: "Ketentuan Layanan (TOS) | JPER Docs",
  description: "Syarat dan ketentuan penggunaan platform LMS Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.",
}

export default function TermsDocsPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#B23A2E] transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Pusat Dokumentasi (docs.jper.my.id)
          </Link>
          <div className="flex items-center gap-2">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-6 object-contain" />
            <span className="font-mono text-xs font-bold tracking-wider">docs.jper.my.id</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <Scale className="size-3.5 text-amber-600" />
            Dokumen Resmi Organisasi
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[#1C1B1A]">
            Syarat &amp; Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="text-xs font-mono text-[#6B6862]">
            Berlaku Efektif sejak 1 September 2026 — SMKN 1 Majalaya
          </p>
        </div>

        {/* Policy Contents */}
        <div className="space-y-6 text-sm text-[#1C1B1A] leading-relaxed bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              <FileText className="size-4 text-[#B23A2E]" /> 1. Ketentuan Umum Pembelajaran
            </h2>
            <p className="text-xs text-[#6B6862]">
              LMS JPER Community (`jper.my.id`) adalah platform manajemen pembelajaran terpadu untuk siswa SMKN 1 Majalaya dan alumni yang terdaftar secara resmi dalam ekstrakurikuler Bahasa Jepang. Seluruh materi, kuis, dan fasilitas disediakan untuk kepentingan edukasi non-komersial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              <ShieldCheck className="size-4 text-[#B23A2E]" /> 2. Integritas Akademik &amp; Presensi
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
              <li>Anggota wajib melakukan pencatatan presensi kehadiran menggunakan pemindaian QR Code resmi di lokasi/sesi kelas aktif.</li>
              <li>Dilarang keras menyebarkan atau mentransfer token QR absensi kepada anggota lain yang tidak hadir di lokasi kelas.</li>
              <li>Pengerjaan kuis dan pengumpulan tugas dilakukan secara mandiri untuk menjaga kejujuran akademis ekstrakurikuler.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              🔒 3. Keamanan Akun &amp; Akses
            </h2>
            <p className="text-xs text-[#6B6862]">
              Setiap anggota bertanggung jawab penuh atas kerahasiaan kata sandi akunnya. Pengurus JPER tidak pernah meminta kata sandi Anda. Apabila terdeteksi aktivitas mencurigakan, segera gunakan fitur Reset Password atau laporkan ke pengurus.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              📚 4. Hak Cipta &amp; Kepemilikan Materi
            </h2>
            <p className="text-xs text-[#6B6862]">
              Seluruh modul PDF, catatan Bunpou, audio Choukai, dan soal kuis yang ada di portal ini merupakan hak cipta milik JPER Community SMKN 1 Majalaya. Anggota dilarang memperjualbelikan atau mendistribusikan ulang materi tanpa izin tertulis dari Pembina.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              ⚖️ 5. Penonaktifan Akun &amp; Sanksi
            </h2>
            <p className="text-xs text-[#6B6862]">
              Pengurus dan Pembina berhak menonaktifkan atau membatasi akses anggota yang terbukti melakukan manipulasi data absensi, penyalahgunaan sistem, atau pelanggaran etika komunitas.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.</div>
          <Link href="/privacy" className="font-semibold text-[#B23A2E] hover:underline">
            Lihat Kebijakan Privasi (Privacy Policy) →
          </Link>
        </div>
      </div>
    </main>
  )
}
