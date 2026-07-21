# JPERCOMMUNITY.md

Dokumen handover untuk agent berikutnya.

## Status Implementasi Saat Ini

- Landing page sudah dibuat ulang dengan struktur marketing, shortcut, dan parallax ringan.
- Header sudah punya toggle theme, placeholder logo, CTA login/register, dan mock avatar state.
- Firebase MCP dan Supabase MCP sudah dikonfigurasi di `.mcp.json`.
- Firebase project config dasar sudah ada di `.firebaserc` dan `firebase.json`.
- Firebase client SDK sudah terpasang dan dipakai untuk login/register.
- Register flow sudah aktif dan dinamis per angkatan.
- Sync profile dari Firebase ke Supabase sudah aktif lewat endpoint backend.
- LMS dan Studio page sudah dinaikkan dari placeholder ke dashboard starter.

## File Konfigurasi Penting

- `.mcp.json`
  - `firebase`: `npx -y firebase-tools@latest experimental:mcp --dir /workspaces/jpercommunity`
  - `supabase`: `https://mcp.supabase.com/mcp?project_ref=ufehqkmxqcqcmwkftqqf`
- `.firebaserc`
  - default project: `jper-community`
- `firebase.json`
  - hosting root: `public`
- `.env.local`
  - Supabase dan Firebase web env sudah diisi

## Dependency yang Sudah Dipasang

- `firebase`
- `@supabase/server`
- `zod`

## Alur Auth Saat Ini

- Login: `components/login-form.tsx`
  - Email/password + Google sign in (Firebase Auth)
  - Success redirect ke `/lms`
- Register: `app/register/page.tsx`
  - Validasi schema dinamis (`lib/validators/register.ts`)
  - Buat akun Firebase
  - Ambil ID token Firebase
  - Call `POST /api/auth/sync-profile` dengan `Authorization: Bearer <id_token>`

## Endpoint Backend Saat Ini

- `GET /api/health`
  - Cek env Supabase
- `POST /api/auth/sync-profile`
  - Verifikasi ID token Firebase
  - Upsert `profiles`
  - Upsert `student_academic_info` (jika field akademik ada)
- `GET /api/lms/overview`
  - Verifikasi ID token Firebase
  - Ambil profile + data ringkas LMS dari Supabase
- `GET /api/studio/overview`
  - Verifikasi ID token Firebase
  - Role gate admin dari tabel `profiles`
  - Ambil ringkasan statistik Studio

## Helper Server dan Client

- Firebase client: `lib/firebase/client.ts`
- Firebase token verify (server): `lib/server/firebase-auth.ts`
- Supabase REST helper (server): `lib/server/supabase-rest.ts`
- Hook auth guard client: `hooks/use-firebase-user.ts`

## Catatan Keamanan dan Next Step

- Endpoint saat ini bergantung pada REST API Supabase dengan `SUPABASE_SECRET_KEY`.
- Pastikan tabel `profiles`, `student_academic_info`, `courses`, `assignments`, `grades`, `attendance_records`, `attendance_sessions` sudah ada di Supabase.
- RLS policy perlu di-hardening sebelum production.
- Next step yang direkomendasikan:
  - Tambah middleware session/role gate yang lebih ketat untuk area Studio.
  - Tambah error telemetry di endpoint backend.
  - Ganti fetch REST manual dengan helper typed yang konsisten lintas endpoint.

## Perintah Verifikasi

- Lint: `npm run lint`
- Build: `npm run build`

## Catatan Tentang `npm install-scripts`

Contoh perintah yang benar:

- Lihat daftar: `npm install-scripts ls`
- Approve paket tertentu: `npm install-scripts approve sharp`

Jangan pakai placeholder mentah seperti `npm install-scripts approve <pkg>` karena akan dibaca shell sebagai sintaks invalid.