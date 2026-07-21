# DESIGN.md — JPER Community

Sistem desain untuk situs manajemen ekstrakurikuler Bahasa Jepang. Tujuannya: terasa seperti materi resmi sekolah/lembaga bahasa yang serius — bukan fan-page anime, dan bukan juga template SaaS generik/"AI slop" (bukan cream+terracotta, bukan dark-mode+neon-green, bukan broadsheet hairline generik).

## 1. Arah Desain

Referensi yang tepat: buku pelajaran Jepang resmi (Minna no Nihongo, JLPT prep book), kartu nama/dokumen resmi Jepang, dan stationery Jepang yang rapi (MUJI-adjacent, tapi bukan copy MUJI). Bukan referensi: kaos konvensi anime, gradient sakura pink, font brush-stroke "kanji tribal".

Prinsip: tenang, presisi, sedikit formal — seperti dokumen resmi lembaga pendidikan yang dipercaya orang tua siswa, bukan aplikasi konsumer yang berusaha terlihat playful.

## 2. Palet Warna

| Nama | Hex | Peran |
|---|---|---|
| `ink` | `#1C1B1A` | Teks utama, headline |
| `paper` | `#FAF9F6` | Background utama (bukan cream hangat khas AI-slop — lebih netral, sedikit ke abu) |
| `ai-indigo` | `#2B3A55` | Warna aksen utama — terinspirasi *ai-iro* (indigo tradisional Jepang), dipakai untuk elemen interaktif primer (tombol, link aktif, tab terpilih) |
| `hanko-red` | `#B23A2E` | Aksen langka — terinspirasi warna stempel *hanko*. Dipakai HANYA untuk 1 elemen signature (lihat §5), status "hadir"/berhasil, atau badge sertifikat. Jangan dipakai sebagai warna dekoratif berulang. |
| `stone` | `#6B6862` | Teks sekunder, caption, metadata |
| `line` | `#E4E1DA` | Border, divider |

Tidak ada gradient. Tidak ada shadow berat/glassmorphism. Flat color + border tipis.

## 3. Tipografi

- **Display/heading**: font sans-serif geometris dengan sedikit karakter editorial — contoh: `Söhne` / `General Sans` / `Inter Tight` (pilih satu, konsisten). Dipakai tebal (600-700) untuk H1-H2, medium untuk H3-H4. Tracking sedikit rapat untuk judul besar.
- **Body**: font sans yang sangat mudah dibaca lintas bahasa Latin & butuh render furigana/karakter Jepang dengan baik — `Inter` atau `IBM Plex Sans` untuk body, karena butuh support baik untuk teks campuran ID/EN. Untuk potongan teks Jepang (nama course, istilah), gunakan `Noto Sans JP` sebagai fallback stack, JANGAN pakai font "kanji-style" dekoratif.
- **Data/mono**: `IBM Plex Mono` untuk kode absensi, NISN/NIS, timestamp — supaya angka mudah dibaca dan terasa presisi seperti dokumen resmi.
- Skala tipe: gunakan skala jelas (12/14/16/20/24/32/48), jangan random sizing.

## 4. Layout

- Grid 12 kolom, max-width konten ±1200px, margin generous (jangan penuh sampai tepi layar — kesan formal butuh napas).
- Spacing berbasis 4px (4/8/12/16/24/32/48/64).
- Border radius kecil dan konsisten (6-8px) — bukan 0 (terlalu broadsheet-kaku) dan bukan besar/pill (terlalu playful/SaaS-generik).
- Card course: gambar 16:9 di atas, judul, deskripsi 2 baris (truncate), footer dengan tombol — tanpa shadow besar, cukup border 1px `line`.
- Hindari dekorasi yang tidak bawa informasi: jangan pakai numbering "01/02/03" kecuali memang urutan pertemuan/minggu asli (yang di LMS ini justru relevan dipakai, karena course memang berurutan per minggu).

## 5. Signature Element

Satu elemen ciri khas halaman: **badge/stempel kehadiran & sertifikat bergaya hanko** — kotak/lingkaran tipis dengan `hanko-red`, dipakai secara konsisten di 3 tempat saja: (1) status "Hadir" di tab absensi, (2) badge nilai "Lulus" quiz, (3) sertifikat/pencapaian di halaman alumni. Di luar 3 tempat itu, `hanko-red` tidak muncul. Ini memberi momen visual yang berarti (stempel = keabsahan/resmi, cocok secara tematik) tanpa jadi dekorasi berulang.

## 6. Komponen (shadcn)

- Pakai shadcn/ui apa adanya untuk primitif (Button, Input, Tabs, Dialog, Card) — kustomisasi lewat Tailwind theme tokens (warna di atas), bukan override CSS manual berulang per komponen.
- Tabs (Absensi/Nilai di LMS, sidebar Studio): style underline sederhana untuk tab aktif, pakai `ai-indigo`, bukan pill-background yang ramai.
- Table (nilai, member management, data akademik): garis horizontal tipis antar baris, header dengan label huruf kecil semua + letter-spacing, mono font untuk kolom angka/ID.

## 7. Motion

Minim. Transisi hover/tap singkat (150-200ms, ease-out) untuk tombol dan card. Tidak ada animasi scroll-reveal berlebihan atau parallax — situs ini dipakai untuk kerja (isi absensi, submit tugas), bukan halaman showcase; animasi berlebihan mengganggu task yang berulang setiap minggu. Reduced-motion preference wajib dihormati.

## 8. Imagery

- Foto dokumentasi kegiatan asli (bukan stock photo generik "students smiling at laptop"), ditampilkan dengan crop konsisten (16:9 atau 4:3), tanpa filter/duotone berat.
- Ikon: pakai satu set konsisten (Lucide, bawaan shadcn), outline style, jangan campur filled+outline.
- Hindari ilustrasi flat generic "SaaS people" — kalau butuh elemen dekoratif kosong-state, gunakan garis/pattern geometris sederhana terinspirasi motif *kumiko* (pola kayu tradisional Jepang), dipakai sangat subtle sebagai watermark, bukan warna-warni.

## 9. Voice & Copy (UI text)

- Bahasa Indonesia untuk UI utama, istilah Jepang/akademik ditulis apa adanya (Absensi, Silabus, Angkatan).
- Tombol aktif suara: "Simpan Perubahan" bukan "Submit", "Buka Course" bukan "Explore" — sebutkan aksi yang sebenarnya terjadi.
- Pesan error jelas dan actionable: "Alasan mengikuti ekskul minimal 25 karakter (saat ini X karakter)" — bukan "Input tidak valid".
- Empty state adalah ajakan bertindak: course kosong → "Belum ada course untuk angkatan ini. Hubungi pembina." bukan sekadar "No data".

## 10. Do / Don't Ringkas

**Do**: flat color, border tipis, whitespace lega, satu aksen merah yang berarti, tipografi presisi, data ditampilkan dengan mono font.
**Don't**: gradient sakura pink, dark mode neon, glassmorphism, shadow tebal, ikon anime/chibi, font dekoratif ala judul manga, badge warna-warni di semua tempat.
