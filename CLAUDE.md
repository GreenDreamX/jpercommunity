# CLAUDE.md — JPER Community

Instruksi khusus untuk Claude Code di repo ini. Baca `AGENTS.md` dulu untuk konteks proyek lengkap (tech stack, struktur folder, model data, aturan register form) — file ini isinya tambahan yang spesifik untuk cara Claude bekerja di repo ini, bukan pengulangan.

## Prioritas saat mengerjakan task

1. Cek dulu apakah ada komponen shadcn yang relevan sebelum menulis UI dari nol — jalankan `npx shadcn@latest add <component>`, jangan copy-paste kode komponen shadcn secara manual dari memori.
2. Sebelum menyentuh apa pun yang berhubungan dengan tampilan/UI, baca `DESIGN.md` dan ikuti token warna, tipografi, dan prinsip di sana. Ini termasuk halaman baru, komponen baru, atau redesign halaman lama.
3. Untuk fitur yang menyentuh data siswa (register, member management, grades, attendance) — selalu cek apakah perubahan butuh update RLS policy di Supabase, bukan hanya kode aplikasi.
4. Jangan asumsikan skema database — kalau belum ada migration/schema file yang terlihat di repo, tanyakan atau baca dulu sebelum menulis query.

## Testing & verifikasi sebelum selesai

- Jalankan `npm run lint` dan `npm run build` sebelum menganggap task selesai, kalau kedua command itu ada di `package.json`.
- Untuk perubahan di form register dinamis (§5 di AGENTS.md), test ketiga cabang angkatan (2026, 2024-2025, alumni 2019-2023) — jangan cuma test satu cabang lalu asumsikan yang lain ikut benar.
- Untuk fitur QR absensi, perhatikan bahwa token QR harus expire/berubah per sesi — jangan generate ulang kode yang sama.

## Hal-hal sensitif — hati-hati

Data siswa di sini termasuk data pribadi anak/remaja (NISN, NIS, nomor telepon, asal sekolah). Saat mengerjakan fitur apa pun yang menyentuh data ini:
- Jangan log data ini ke console dalam kode yang akan di-commit.
- Jangan expose field ini ke response API publik (misalnya endpoint course/leaderboard publik tidak boleh ikut mengembalikan NISN/nomor telepon).
- Kalau membuat seed data / dummy data untuk development, gunakan data fiktif yang jelas-jelas palsu (misal nama seperti "Siswa Contoh 1"), jangan data yang terlihat seperti data asli.

## Gaya kerja yang disukai

- Kalau task besar (misalnya "buat seluruh halaman Studio"), pecah jadi langkah kecil dan konfirmasi struktur/pendekatan dulu sebelum generate banyak file sekaligus — terutama untuk skema database dan RLS policy karena itu mahal untuk diubah belakangan.
- Untuk perubahan kecil (fix bug, tweak styling, tambah 1 field form), langsung kerjakan tanpa perlu banyak konfirmasi.
- Kalau ragu antara dua pendekatan arsitektur (misalnya cara sinkronisasi Firebase ↔ Supabase), jelaskan trade-off singkat lalu ambil satu pendekatan yang masuk akal, jangan berhenti total menunggu keputusan untuk hal yang bisa diperbaiki nanti.

## Referensi cepat

- Auth: Firebase menangani login/session, Supabase `profiles` menyimpan role dan data akademik.
- Storage file besar (PDF materi, dokumentasi absensi, file submission): Supabase Storage, bukan disimpan sebagai base64 di DB.
- Deploy: Vercel, jadi hindari API routes yang butuh long-running process (>10-60s tergantung plan) — untuk proses berat pertimbangkan background job/queue terpisah.
