# AGENTS.md — JPER Community

Panduan ini untuk AI coding agent apa pun (Claude Code, Cursor, Copilot, dll) yang bekerja di repo ini. Baca file ini sebelum membuat perubahan besar. Untuk arahan visual/UI, lihat `DESIGN.md`. Untuk instruksi khusus Claude Code, lihat `CLAUDE.md`.

## 1. Ringkasan Proyek

**JPER Community** — website manajemen ekstrakurikuler Bahasa Jepang.
Domain: `jper.my.id`

Empat area utama:
1. **Landing page** — halaman publik (marketing/company profile)
2. **Auth pages** — sign up & login untuk siswa/member
3. **LMS** — dashboard belajar untuk member (absensi, nilai, course, tugas, quiz)
4. **Studio (Admin)** — panel manajemen untuk pengurus/pembina

## 2. Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js (App Router) |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Firebase Authentication |
| Hosting | Vercel |
| Storage file (PDF, dokumentasi, submission tugas) | Supabase Storage |

**Catatan penting soal Auth:** Firebase menangani identitas (email/password, session), tapi *semua data profil, role, dan relasi* (nilai, course, absensi, dst) hidup di Supabase. Setiap user Firebase harus punya baris pasangan di tabel `profiles` Supabase, dikaitkan lewat `firebase_uid`. Jangan menyimpan data sensitif siswa di Firebase custom claims lebih dari yang perlu (role saja cukup untuk claims; sisanya di Supabase).

## 3. Struktur Folder (disarankan)

```
/app
  /(marketing)/          -> landing page, kurikulum, alumni, selayang-pandang
  /(auth)/login
  /(auth)/register
  /(lms)/dashboard        -> absensi tab, nilai tab, schedule reminder, course cards
  /(lms)/course/[id]      -> tab per minggu/pertemuan: pdf, video, notes, submission, quiz
  /(studio)/login         -> login khusus admin
  /(studio)/courses
  /(studio)/silabus
  /(studio)/materials
  /(studio)/members
  /(studio)/grades
  /(studio)/attendance
  /api/...                -> route handlers (webhook, QR generation, dsb)
/components
  /ui                     -> shadcn primitives, jangan diedit manual, pakai `npx shadcn add`
  /lms
  /studio
  /marketing
/lib
  /supabase               -> client + server helpers
  /firebase                -> auth helpers
  /validators              -> zod schemas (termasuk validasi form register per angkatan)
/types
```

## 4. Model Data Inti (Supabase)

Tabel minimum yang perlu ada (sesuaikan nama sesuai konvensi tim):

- `profiles` — id, firebase_uid, nama_lengkap, email, nomor_telepon, role (`student` | `alumni` | `admin`), angkatan, alasan_ikut, created_at
- `student_academic_info` — profile_id, nisn, nis, asal_sekolah, kelas (field ini **berbeda tergantung angkatan**, lihat §5)
- `courses` — id, title, description, image_url, is_locked, is_hidden
- `course_weeks` (silabus/pertemuan) — id, course_id, week_number, title, pdf_url, youtube_url, notes_markdown, is_locked, is_hidden
- `assignments` — id, course_week_id, title, due_at
- `submissions` — id, assignment_id, profile_id, file_url, submitted_at
- `quizzes` / `quiz_questions` / `quiz_answers`
- `attendance_sessions` — id, course_week_id, qr_token, opened_at, closed_at, materi_diajarkan, feedback, dokumentasi_url
- `attendance_records` — id, attendance_session_id, profile_id, scanned_at
- `grades` — id, course_week_id, profile_id, score, note

QR absensi: generate `qr_token` unik per sesi (short-lived), bukan ID statis, untuk mencegah screenshot-sharing token lama.

## 5. Aturan Form Register (WAJIB diikuti persis)

Form register bersifat **dinamis berdasarkan angkatan**. Field wajib bersama untuk semua angkatan: nama lengkap, nomor telepon, email pribadi, angkatan, dan **alasan mengikuti ekskul (min. 25 karakter, validasi di client & server)**.

| Angkatan | Field tambahan |
|---|---|
| 2026 | NISN, NIS, asal sekolah (SMP) |
| 2025 & 2024 (siswa aktif) | NISN, NIS, kelas (tanpa asal sekolah) |
| Alumni 2019–2023 | tidak ada field tambahan (hanya field bersama di atas) |

Implementasikan sebagai satu schema Zod dengan `discriminatedUnion` pada field `angkatan`, bukan tiga form terpisah yang duplikat logic-nya. Validasi ulang di server (route handler / server action) — jangan percaya validasi client saja.

Akun yang dibuat saat sign up harus langsung bisa dipakai login di halaman login (bukan perlu approval admin dulu untuk bisa login — approval/role assignment terjadi di Studio, tapi akun tetap aktif untuk login).

## 6. Fitur LMS (member)

- **Tab Absensi**: menampilkan riwayat kehadiran; saat sesi aktif, member scan QR yang ditampilkan admin dari Studio.
- **Tab Nilai**: nilai per minggu, per course.
- **Schedule reminder**: daftar assignment yang *belum* dikumpulkan, tampil sampai due time, dengan tombol aksi langsung ke assignment terkait. Hilang otomatis setelah submission dibuat.
- **Course card**: gambar, judul, deskripsi singkat, tombol Enroll (belum ikut) / Buka Course (sudah ikut).
- **Dalam course**, tab per minggu/pertemuan berisi: PDF viewer materi, YouTube embed, notes markdown (editable, autosave), file submission tugas, dan quiz di bagian akhir minggu tersebut.

## 7. Fitur Studio (admin)

- Login terpisah dari login member (route `/studio/login`), role-gated — cek `role = admin` di Supabase, jangan hanya andalkan Firebase custom claim di client.
- **Course management**: CRUD course.
- **Silabus management**: hide/unhide, lock/unlock tiap item minggu/pertemuan.
- **Material management**: edit isi materi tiap minggu (PDF, link YouTube, markdown notes).
- **Member management**: edit role, assign ke course, kick member.
- **Input nilai**: per minggu, per siswa.
- **Absensi**: admin pilih pertemuan → sistem generate & tampilkan QR code untuk di-scan member. Admin **wajib** mengisi materi yang diajarkan + feedback pembelajaran + upload dokumentasi sebelum sesi absensi bisa di-submit/ditutup.

## 8. Konvensi Kode

- TypeScript strict mode.
- Server Components by default; `"use client"` hanya untuk komponen interaktif (QR scanner, markdown editor, form).
- Semua akses Supabase lewat helper di `/lib/supabase`, jangan panggil client langsung di tiap komponen.
- Nama file: kebab-case. Komponen: PascalCase.
- Commit message: `type: deskripsi singkat` (feat/fix/chore/refactor).

## 9. Yang Harus Dihindari

- Jangan hardcode role/permission check hanya di client — selalu enforce ulang di server/RLS Supabase.
- Jangan simpan data sensitif (NISN, NIS, nomor telepon) tanpa Row Level Security yang membatasi akses hanya untuk pemilik data + admin.
- Jangan membuat 3 halaman register terpisah untuk 3 kelompok angkatan — satu form dinamis dengan validasi conditional.
- Jangan pakai QR token statis/permanen untuk absensi.
