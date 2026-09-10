# ⛩️ JPER Community — Platform Ekstrakurikuler Bahasa Jepang

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Firebase Auth](https://img.shields.io/badge/Auth-Firebase%20Authentication-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Vercel Deployment](https://img.shields.io/badge/Hosting-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**JPER Community** adalah platform digital terpadu untuk manajemen kegiatan ekstrakurikuler, portal belajar (*LMS*), pusat formulir dinamis, generator shortlink resmi, serta panel admin pengurus (*Studio Management*) **Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya**.

> **Domain Utama:** [`jper.my.id`](https://jper.my.id)

---

## 🌐 Arsitektur Subdomain & Ekosistem App

Aplikasi ini menggunakan sistem **Single Codebase Multi-Subdomain Rewrites** berbasis Next.js 16 Proxy Middleware ([`proxy.ts`](file:///c:/Project/jpercommunity/proxy.ts)) yang membagi area platform sesuai perannya:

| Subdomain | URL | Fungsi & Fitur Utama |
|---|---|---|
| **Landing Page** | [`jper.my.id`](https://jper.my.id) | Halaman publik, profil ekstrakurikuler, selayang pandang, kurikulum, dan galeri alumni. |
| **LMS Portal** | [`lms.jper.my.id`](https://lms.jper.my.id) | Portal belajar member: Modul materi 10 tipe, Kuis Gamifikasi, Absensi QR, EXP & Streak Harian, Minigame, dan Papan Peringkat (Leaderboard). |
| **Studio Admin** | [`studio.jper.my.id`](https://studio.jper.my.id) | Panel pengurus & pembina: CRUD Kelas & Silabus, Form Builder GForm, Manajemen Anggota & Role, Sesi QR Absensi, Pembukuan Uang Kas, Jurnal Notulensi, dan Rapor. |
| **Form Engine** | [`forms.jper.my.id`](https://forms.jper.my.id) | Portal formulir dinamis: Form Pendaftaran per angkatan, Form Evaluasi Presensi & Umpan Balik, serta Form Kustom yang dibuat dari Studio. |
| **Dokumentasi** | [`docs.jper.my.id`](https://docs.jper.my.id) | Pusat dokumentasi, regulasi ekskul, silabus kurikulum, Kebijakan Privasi (UU PDP), dan Syarat & Ketentuan Layanan. |
| **Shortlink Service**| [`s.jper.my.id`](https://s.jper.my.id) | Layanan pemendek tautan resmi terintegrasi Supabase dengan perlindungan auto-redirect ke homepage utama jika slug tidak ditemukan. |

---

## 🛠️ Tech Stack & Modul Utama

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **UI & Styling**: Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Framer Motion
- **Design System**: *Paper & Ink Aesthetic Palette* (`#FAF9F6`, `#1C1B1A`, `#B23A2E`, `#2B3A55`)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL dengan Row Level Security / RLS)
- **Authentication**: Firebase Authentication (Session & Identity) + Supabase Sync (`firebase_uid` foreign key di tabel `profiles`)
- **File Storage**: Supabase Storage & Vercel Blob
- **Validation**: Zod (Discriminated Union untuk registrasi dinamis per angkatan)

---

## 🎮 Fitur-Fitur Unggulan

### 1. LMS (Learning Management System)
- **10 Tipe Modul Pembelajaran Mingguan**: PDF File, YouTube Video Embed, Markdown Notes, Quiz, Assignment Submission, Kanji Flashcards, Audio Listening Practice, Grammar Pattern, External Link, dan Live Session.
- **Sistem Gamifikasi**: Akumulasi Poin EXP, Daily Login Streak dengan bonus pengganda, Daily Quests, Minigame (Speed Match, Kanji Puzzle, Listening Rush, Shiritori Battle), dan Papan Peringkat (Leaderboard Shokunin Rank).
- **Absensi QR Code**: Scan QR Token singkat (short-lived dynamic token) untuk kehadiran sesi latihan.

### 2. Studio Management (Admin & Pengurus)
- **Form Builder Dinamis (GForm-style)**: Modul pembuat form dari Studio tanpa hardcoding (mendukung input Isian Singkat, Paragraf, Dropdown, Pilihan Ganda, Rating Bintang, dan Unggah Berkas).
- **Manajemen Anggota**: Edit role (Admin, Pembina, Ketua, Bendahara, Student, Alumni), assign kelas, dan filter per angkatan.
- **Keuangan & Uang Kas**: Pembukuan saldo kas, pemasukan, pengeluaran, dan rekap transaksi.
- **Notulensi & Cetak Rapor**: Jurnal rapat pengurus dan pencetakan rapor perkembangan belajar siswa.

### 3. Pemendek Tautan (`s.jper.my.id`)
- Pembuatan shortlink kustom dari web UI dengan pencatatan jumlah klik (*click counter*).
- Tersimpan langsung di Supabase `public.shortlinks`.
- Auto fallback redirect ke `https://jper.my.id` apabila slug tidak terdaftar.

---

## 🗄️ Skema Database Supabase

Seluruh data tersimpan secara aman di Supabase dengan aturan **Row Level Security (RLS)**:

```
public
 ├── profiles                 -> Profile siswa (firebase_uid, role, xp, streak_count, daily_quests_data)
 ├── student_academic_info    -> Info akademik dinamis per angkatan (NISN, NIS, asal sekolah, kelas)
 ├── courses                  -> Kursus / Kelas ekskul
 ├── course_weeks             -> Pertemuan silabus mingguan
 ├── week_modules             -> Modul fleksibel per minggu (10 jenis konten)
 ├── module_submissions       -> Unggah berkas tugas per modul
 ├── quizzes                  -> Kuis & bank soal
 ├── attendance_sessions      -> Sesi absensi QR (materi, feedback, dokumentasi)
 ├── attendance_records       -> Catatan kehadiran siswa
 ├── game_scores              -> Riwayat permainan & skor minigame
 ├── forms                    -> Metadata formulir dinamis GForm
 ├── form_questions           -> Pertanyaan modul form dinamis
 ├── form_responses           -> Jawaban & respon umpan balik siswa
 └── shortlinks               -> Tautan ringkas s.jper.my.id
```

File migrasi SQL lengkap tersedia di folder **[`supabase/migrations/`](file:///c:/Project/jpercommunity/supabase/migrations/)**.

---

## 🚀 Panduan Memulai (Local Development)

### 1. Prasyarat
- Node.js (v18 atau lebih baru)
- npm / pnpm / yarn

### 2. Kloning Repository & Install Dependensi
```bash
git clone https://github.com/GreenDreamX/jpercommunity.git
cd jpercommunity
npm install
```

### 3. Pengaturan Environment Variables (`.env.local`)
Buat file `.env.local` di root proyek dan isi kredensial berikut:

```env
# Supabase Configuration
SUPABASE_URL=https://ufehqkmxqcqcmwkftqqf.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_service_role_key
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_JWKS_URL=https://ufehqkmxqcqcmwkftqqf.supabase.co/auth/v1/keys

NEXT_PUBLIC_SUPABASE_URL=https://ufehqkmxqcqcmwkftqqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key

# Firebase Authentication Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Jalankan Development Server
```bash
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

---

## ☁️ Deployment Guide (Vercel & Subdomains)

1. Connect repository GitHub ini ke **Vercel**.
2. Masukkan seluruh environment variables di atas pada menu **Project Settings -> Environment Variables**.
3. Tambahkan subdomain berikut pada menu **Settings -> Domains** di Vercel:
   - `jper.my.id`
   - `lms.jper.my.id`
   - `studio.jper.my.id`
   - `forms.jper.my.id`
   - `docs.jper.my.id`
   - `s.jper.my.id`
4. Arahkan **CNAME Record** pada DNS provider (Cloudflare / Namecheap) ke `cname.vercel-dns.com`.

---

## 📜 Lisensi & Atribusi

Diprakarsai dan dikembangkan untuk **JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya**.  
Hak Cipta &copy; 2026 JPER Community. All rights reserved.
