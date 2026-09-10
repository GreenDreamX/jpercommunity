import Link from "next/link"
import {
  ArrowLeft,
  Scale,
  BookOpen,
  Users,
  ShieldAlert,
  Coins,
  Gavel,
  Vote,
  FileCode,
  CalendarDays,
} from "lucide-react"

export const metadata = {
  title: "AD/ART 2026 | JPER Docs",
  description:
    "Anggaran Dasar dan Anggaran Rumah Tangga resmi JPER Community (Japanese and Paperart Community).",
}

export default function AdArtDocsPage() {
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
            <img
              src="/image/J-PER.png"
              alt="JPER Logo"
              className="size-6 object-contain"
            />
            <span className="font-mono text-xs font-bold tracking-wider">
              docs.jper.my.id
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-3">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[#1C1B1A]">
            Anggaran Dasar &amp; Anggaran Rumah Tangga (AD/ART)
          </h1>
          <p className="text-xs font-mono text-[#6B6862] flex items-center gap-1">
            <CalendarDays className="size-3.5" /> Berlaku Efektif setelah disahkan, menunggu jadwal Musyawarah besar
          </p>
        </div>

        {/* Content Section: ANGGARAN DASAR */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider font-bold text-[#B23A2E]">
            <BookOpen className="size-4" /> Bagian I — Anggaran Dasar (AD)
          </div>

          <div className="space-y-6 text-sm text-[#1C1B1A] leading-relaxed bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs">
            {/* BAB I */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB I: Ketentuan Umum &amp; Identitas Organisasi
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Pasal 1 (Nama &amp; Pendirian):</strong> Bernama JPER Community (Japanese and Paperart Community) yang didirikan pada 12 Desember 2020 untuk jangka waktu tidak terbatas.</li>
                <li><strong>Pasal 2 (Kedudukan):</strong> Berkedudukan pusat di Majalaya, Kabupaten Bandung, Jawa Barat. Dapat membentuk regional/chapter jika memenuhi minimal 10 Anggota Aktif.</li>
                <li><strong>Pasal 3 (Ketentuan Istilah):</strong> Menetapkan definisi baku untuk Musyawarah Besar (Mubes), Mubeslub, Badan Pengurus Harian (BPH), Petugas Inti Romusha, Riung Jepang, Calon Anggota, Anggota Aktif, dan Ketua Angkatan.</li>
              </ul>
            </section>

            {/* BAB II */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB II: Azas, Tujuan, Sifat, dan Usaha
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Pasal 4 (Azas &amp; 5 Pilar):</strong> Berazaskan Pancasila &amp; UUD 1945 dengan pilar: Adab, Kekeluargaan, Profesionalisme, Transparansi, dan Independensi.</li>
                <li><strong>Pasal 5 &amp; 6 (Tujuan &amp; Sifat):</strong> Wadah inkubasi minat bakat berkarakter. Bersifat Independen, Inklusif &amp; Terbuka, Non-Politik, serta Non-Profit.</li>
                <li><strong>Pasal 7 (Bentuk Kegiatan):</strong> Pelatihan edukasi rutin, pameran karya seni terpadu/papercraft, gathering, dan usaha mandiri komunitas.</li>
              </ul>
            </section>

            {/* BAB III */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB III: Status, Fungsi, dan Peran
              </h2>
              <p className="text-xs text-[#6B6862]">
                JPER berstatus sebagai komunitas mandiri nirlaba berbasis kesamaan minat (Pasal 8). Berfungsi sebagai wadah edukasi, sarana inkubasi karya, fasilitator sosialisasi, dan pembina karakter anggota yang santun, beradab, serta akuntabel (Pasal 9-11).
              </p>
            </section>

            {/* BAB IV */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB IV: Atribut, Lambang, dan HKI
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Pasal 12 &amp; 15 (Lambang &amp; Atribut):</strong> Logo, PDH, kaos, bendera pataka, pin, dan KTA merupakan atribut resmi terdaftar. Penyalahgunaan atribut dikenakan sanksi Drop Out langsung.</li>
                <li><strong>Pasal 13 (Kerahasiaan LMS &amp; HKI):</strong> Seluruh silabus, modul, dan materi LMS bersifat rahasia tingkat tinggi (Confidential) dan dilindungi HKI. Dilarang diperjualbelikan atau dibocorkan.</li>
                <li><strong>Pasal 14 (Orisinalitas &amp; AI):</strong> Integritas karya dijunjung penuh. Pemanfaatan AI hanya diperbolehkan sebatas alat bantu belajar dan dilarang menggantikan proses orisinalitas karya.</li>
              </ul>
            </section>

            {/* BAB V */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB V: Hak &amp; Kewajiban Keanggotaan
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Klasifikasi (Pasal 17):</strong> Terdiri atas Anggota Muda (Calon Anggota), Anggota Aktif (lulus Riung Jepang), dan Anggota Kehormatan / Alumni.</li>
                <li><strong>Hak Anggota (Pasal 18):</strong> Memiliki hak bicara, hak suara, hak memilih &amp; dipilih, hak fasilitas/pembinaan, serta hak pembelaan diri secara adil dalam rapat pleno etik.</li>
                <li><strong>Kewajiban Anggota (Pasal 19):</strong> Menjunjung tinggi adab &amp; etika, menaati AD/ART, berpartisipasi aktif, membayar iuran wajib rutin, dan menjaga keutuhan fasilitas komunitas.</li>
              </ul>
            </section>

            {/* BAB VI */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB VI: Kepengurusan &amp; Struktur Organisasi
              </h2>
              <p className="text-xs text-[#6B6862]">
                Struktur terdiri dari Dewan Penasehat, Badan Pengurus Harian (Ketua, Wakil, Sekretaris, Bendahara), Koordinator Divisi, Petugas Inti Romusha, serta Tim Kreatif &amp; Media. Masa jabatan pengurus adalah 1 tahun per periode, dengan batas maksimal Ketua menjabat 2 periode berurutan (Pasal 20-22).
              </p>
            </section>

            {/* BAB VII */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB VII: Tata Kelola Keuangan &amp; Audit
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li>Prinsip satu kas transparan dan anti rekening bayangan pribadi. Dilarang keras meminjamkan kas untuk keperluan pribadi (Pasal 23).</li>
                <li>Sumber dana mencakup: Iuran rutin wajib, iuran insidental kegiatan, laba usaha/merchandise halal, kemitraan sponsorship, dan donasi sah (Pasal 24).</li>
                <li>Laporan triwulan wajib dipublikasikan berkala. Ketidakcocokan kas &gt; Rp100.000 wajib diklarifikasi maksimal 3x24 jam. Penggelapan berakibat skorsing, ganti rugi 14 hari, atau drop out (Pasal 25).</li>
              </ul>
            </section>

            {/* BAB VIII */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB VIII: Tata Tertib, Kode Etik, dan Sanksi
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Larangan Keras (Pasal 26):</strong> Pencemaran nama baik, pelecehan verbal/fisik/digital, perundungan (bullying), konsumsi miras/narkoba/senjata, dan isu SARA/radikalisme.</li>
                <li><strong>Tingkatan Sanksi (Pasal 27):</strong> Teguran Lisan (Ringan), SP-1 &amp; SP-2 masa aktif 30 hari (Sedang), serta Skorsing 1-3 bulan, Demosi, hingga Pemberhentian Tetap/Drop Out (Berat).</li>
                <li><strong>Mekanisme Pembelaan Diri (Pasal 28):</strong> Terduga pelanggar berhak membela diri di Sidang Pleno Etik dengan surat panggilan minimal 3x24 jam sebelumnya.</li>
              </ul>
            </section>

            {/* BAB IX - XI */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] border-b border-[#E4E1DA] pb-2">
                BAB IX – XI: Pergantian Pengurus, Mubes, dan Amandemen
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Mekanisme Pemilihan (Pasal 29-34):</strong> Pemilihan demokratis via voting 50%+1 atau aklamasi 2/3. Pengusulan pemakzulan hanya sah melalui 2/3 suara gabungan Petugas Romusha &amp; Ketua Angkatan atau 50%+1 Anggota Aktif.</li>
                <li><strong>Mubes &amp; Mubeslub (Pasal 35-37):</strong> Forum tertinggi musyawarah mufakat atau voting suara sah. Kuorum sah 50%+1 dari database aktif.</li>
                <li><strong>Perubahan AD/ART &amp; Pembubaran (Pasal 38-40):</strong> Perubahan pasal butuh 2/3 kuorum &amp; 2/3 persetujuan forum (Pasal Azas &amp; Sifat kekal). Pembubaran memerlukan persetujuan 3/4 forum Mubeslub.</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Content Section: ANGGARAN RUMAH TANGGA */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider font-bold text-[#2B3A55]">
            <Gavel className="size-4" /> Bagian II — Anggaran Rumah Tangga (ART)
          </div>

          <div className="space-y-6 text-sm text-[#1C1B1A] leading-relaxed bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs">
            {/* BAB I ART */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
                <Users className="size-4 text-[#B23A2E]" /> BAB I: Registrasi &amp; Mekanisme Keanggotaan
              </h2>
              <p className="text-xs text-[#6B6862]">
                Calon anggota wajib melengkapi berkas administrasi (identitas &amp; pasfoto), menempuh masa orientasi minimal 1 bulan, serta lulus pengukuhan <strong>Riung Jepang</strong> dengan syarat absensi minimal 75% guna mendapatkan NIK resmi (Pasal 1-3).
              </p>
            </section>

            {/* BAB II ART */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
                <ShieldAlert className="size-4 text-[#B23A2E]" /> BAB II: Tata Tertib Presensi, LMS, dan Kejujuran
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Presensi (Pasal 4):</strong> Batas toleransi terlambat 15 menit. Izin sakit/tugas wajib disampaikan H-1 (24 jam). Mangkir 3 kali dikenakan teguran; 5 kali akumulatif diterbitkan SP-1.</li>
                <li><strong>Perlindungan Akun &amp; LMS (Pasal 5):</strong> Akun tidak dapat dipindahtangankan. Dilarang keras merekam, membocorkan, atau mengomersialisasi modul LMS. Pelanggaran diganjar penutupan akses dan Drop Out seketika.</li>
                <li><strong>Kecurangan &amp; Plagiarisme (Pasal 6-7):</strong> Plagiat karya diganjar nilai nol (0), kewajiban perbaikan 7x24 jam, serta penerbitan SP-1. Pengunduran diri wajib mengajukan surat resmi dan melunasi segala tanggungan kas/inventaris.</li>
              </ul>
            </section>

            {/* BAB III ART */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
                <Vote className="size-4 text-[#B23A2E]" /> BAB III: Rincian Operasional Kepengurusan
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Tugas BPH (Pasal 8):</strong> Ketua Komunitas (eksekutif tertinggi), Wakil Ketua (evaluasi internal), Sekretaris (administrasi &amp; database), dan Bendahara (pembukuan kas &amp; kuitansi transparan).</li>
                <li><strong>Petugas Inti Romusha (Pasal 9):</strong> Penanggung jawab logistik teknis lapangan, satuan penegak ketertiban acara/presensi, dan inisiator pelaporan sanksi awal.</li>
                <li><strong>Koordinator Divisi (Pasal 10):</strong> Bertanggung jawab atas silabus berkala divisi (Bahasa, Papercraft, Dance, Manga, Musik) serta menyerahkan modul latihan bulanan kepada BPH.</li>
              </ul>
            </section>

            {/* BAB IV ART */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
                <Coins className="size-4 text-[#B23A2E]" /> BAB IV: Teknis Keuangan, Iuran &amp; Profit Sharing
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Iuran Rutin (Pasal 11):</strong> Sebesar Rp3.000,- per anggota pada setiap kegiatan rutin mingguan. Tunggakan &gt; 4 kali pertemuan berakibat larangan peminjaman aset inventaris.</li>
                <li><strong>Bagi Hasil Karya &amp; Merchandise (Pasal 12):</strong> Seluruh profit masuk kas utama, dialokasikan minimal 30% untuk Kas Operasional JPER dan maksimal 70% untuk tim pengisi acara/kreator karya.</li>
                <li>Pengeluaran &gt; Rp500.000 wajib mengajukan proposal RAB resmi bertanda tangan Ketua Komunitas dan Bendahara.</li>
              </ul>
            </section>

            {/* BAB V & VI ART */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#2B3A55] flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
                <FileCode className="size-4 text-[#B23A2E]" /> BAB V &amp; VI: Sidang Pleno Etik, Pemecatan &amp; Pengesahan
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6B6862]">
                <li><strong>Tahapan Sanksi (Pasal 13):</strong> SP-1 (berlaku 30 hari), SP-2 (berlaku 30 hari), dan Skorsing (1-3 bulan kehilangan hak atribut serta hak suara).</li>
                <li><strong>Majelis Etik Sidang Pleno (Pasal 14):</strong> Dihadiri Ketua Komunitas, Ketua Dewan Penasehat, perwakilan BPH, dan 2 Petugas Romusha. Terduga berhak membela diri maksimal 45 menit. Putusan pemecatan sah dengan minimal 4 dari 5 suara majelis etik.</li>
                <li><strong>Penutup (Pasal 15):</strong> ART merupakan satu kesatuan integral dengan Anggaran Dasar (AD) yang disahkan mengikat pada Musyawarah Besar (Mubes).</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>
            &copy; 2026 JPER Community — Dokumen Resmi Konstitusi AD/ART.
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="font-semibold text-[#B23A2E] hover:underline">
              Ketentuan Layanan (TOS)
            </Link>
            <Link href="/privacy" className="font-semibold text-[#B23A2E] hover:underline">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}