import Link from "next/link"
import { ArrowLeft, ShieldCheck, Lock, Database, Eye } from "lucide-react"

export const metadata = {
  title: "Kebijakan Privasi (Privacy Policy) | JPER Docs",
  description: "Kebijakan privasi perlindungan data pribadi siswa SMKN 1 Majalaya di platform JPER LMS.",
}

export default function PrivacyDocsPage() {
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
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[#1C1B1A]">
            Kebijakan Privasi &amp; Data Anggota (Privacy Policy)
          </h1>
          <p className="text-xs font-mono text-[#6B6862]">
            Terakhir Diperbarui: 1 September 2026
          </p>
        </div>

        {/* Policy Contents */}
        <div className="space-y-6 text-sm text-[#1C1B1A] leading-relaxed bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              <Database className="size-4 text-[#B23A2E]" /> 1. Data yang Kami Kumpulkan
            </h2>
            <p className="text-xs text-[#6B6862]">
              Saat Anda mendaftar sebagai anggota ekstrakurikuler JPER Community, kami mengumpulkan informasi terbatas yang diperlukan untuk keperluan akademik dan administrasi sekolah:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#6B6862]">
              <li><strong>Data Bersama</strong>: Nama Lengkap, Nomor Telepon/WhatsApp, Alamat Email, Angkatan, dan Alasan Mengikuti Ekskul.</li>
              <li><strong>Data Akademik Siswa (Angkatan 2024, 2025, 2026)</strong>: NISN, NIS, Asal Sekolah (SMP) / Kelas.</li>
              <li><strong>Data Log Aktivitas</strong>: Waktu absensi presensi, skor kuis, dan transkrip nilai mingguan.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              <Eye className="size-4 text-[#B23A2E]" /> 2. Penggunaan Data Pribadi
            </h2>
            <p className="text-xs text-[#6B6862]">
              Seluruh data pribadi digunakan strictly untuk keperluan internal ekstrakurikuler SMKN 1 Majalaya:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#6B6862]">
              <li>Verifikasi identitas anggota saat login &amp; pembuatan kartu anggota digital.</li>
              <li>Pencatatan absensi mingguan dan penyusunan transkrip rapor ekskul.</li>
              <li>Penyampaian pengumuman latihan rutin dan verifikasi sertifikat kelulusan.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              <Lock className="size-4 text-[#B23A2E]" /> 3. Keamanan Data &amp; Row Level Security (RLS)
            </h2>
            <p className="text-xs text-[#6B6862]">
              Kami menerapkan keamanan tingkat tinggi pada basis data Supabase kami dengan aturan *Row Level Security* (RLS). Data pribadi sensitif seperti NISN, NIS, dan Nomor Telepon hanya dapat diakses oleh pemilik akun dan Pengurus/Pembina resmi yang berwenang. Kami <strong>tidak pernah menjual atau membagikan</strong> data siswa kepada pihak ketiga untuk kepentingan komersial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
              🔑 4. Hak Pembaruan &amp; Penghapusan Data
            </h2>
            <p className="text-xs text-[#6B6862]">
              Setiap anggota berhak memperbarui informasi kontak atau mengajukan permintaan penghapusan akun melalui tab Profil LMS atau dengan menghubungi sekretariat pembina ekstrakurikuler di SMKN 1 Majalaya.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.</div>
          <Link href="/terms" className="font-semibold text-[#B23A2E] hover:underline">
            Lihat Syarat &amp; Ketentuan (Terms of Service) →
          </Link>
        </div>
      </div>
    </main>
  )
}
