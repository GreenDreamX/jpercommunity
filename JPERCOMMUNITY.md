# JPERCOMMUNITY.md

Dokumen handover untuk agent berikutnya. Update setiap kali agent selesai mengerjakan fase besar.

---

## Status Implementasi (Update: 2026-07-24)

### ✅ Selesai

| Area | File/Lokasi | Catatan |
|---|---|---|
| Landing page | `components/marketing/landing-page.tsx` | Teks diubah bernuansa komunitas ekskul riil (bukan pamer teknologi), lengkap dengan visual parallax & kontak pembina |
| Site header | `components/marketing/site-header.tsx` | Toggle theme, logo placeholder, CTA login/register |
| Parallax showcase | `components/marketing/parallax-showcase.tsx` | Scroll motion section |
| Login page | `app/login/page.tsx` + `components/login-form.tsx` | Firebase email/password + Google sign in, redirect ke `/lms`. Ditambahkan tombol "Bypass Login (Siswa)" untuk dev. |
| Register page | `app/register/page.tsx` | Form dinamis per angkatan (2026/2025+2024/alumni) |
| Register schema | `lib/validators/register.ts` | Zod discriminatedUnion — satu schema, bukan 3 form terpisah |
| Firebase client | `lib/firebase/client.ts` | Firebase Auth SDK. Dilengkapi dummy fallback untuk prerender Next.js |
| Firebase token verify | `lib/server/firebase-auth.ts` | Server-side token verify, diintersepsi token mock-student and mock-admin untuk dev bypass |
| Supabase REST helper | `lib/server/supabase-rest.ts` | Thin wrapper untuk REST API Supabase |
| Auth guard hook | `hooks/use-firebase-user.ts` | Client-side Firebase auth state, mendukung pembacaan mock session secara sinkron |
| API: sync-profile | `app/api/auth/sync-profile/route.ts` | POST — verify Firebase token, upsert profiles + student_academic_info |
| API: health check | `app/api/health/route.ts` | GET — cek env Supabase |
| Supabase DB schema / migrations | `supabase/migrations/` | Migration files `001_initial_schema.sql`, `002_file_bank.sql`, dan `003_notulensi.sql` (schema lengkap core JPER + File Bank + Notulensi). |
| Next.js middleware auth guard | `middleware.ts` | Server-side auth checking dengan cookie `jper_session` dan `__session`. |
| Design system | `app/globals.css` | Token warna (ink/paper/ai-indigo/hanko-red/stone/line) sesuai DESIGN.md |
| shadcn components | `components/ui/` | Button, Card, Input, Label, Separator, Field |
| Firebase config | `.firebaserc`, `firebase.json` | Project: `jper-community` |
| MCP config | `.mcp.json` | Firebase MCP + Supabase MCP sudah terkonfigurasi |
| API: LMS Client | `/app/api/lms/...` | `/api/lms/overview`, `/api/lms/courses`, `/api/lms/courses/[id]`, `/api/lms/attendance`, `/api/lms/grades`, `/api/lms/assignments/[id]/submit`, `/api/lms/quiz/[id]/submit` |
| UI: LMS Client Modules | `/components/lms/...` | `lms-layout.tsx` (sidebar seragam siswa), `attendance-tab.tsx` (absensi stempel Hanko), `grades-tab.tsx` (grade sheet), `course/[id]/page.tsx` (PDF, Youtube, autosave notes, kuis, submission) |
| Studio Login Page | `app/studio/login/page.tsx` | Credentials form khusus admin dengan tombol "Bypass Login (Admin)". |
| Studio Layout | `components/studio/studio-layout.tsx` | Sidebar navigasi administrative panel (desain seragam dengan `LmsLayout`). |
| Studio Tab: Beranda Overview | `app/studio/page.tsx` | Statistik total siswa, kelas, sesi absen, dan daftar modul. |
| Studio Tab: Kelas & Silabus | `components/studio/course-management.tsx` | CRUD kelas dan materi silabus mingguan. |
| Studio Tab: Keanggotaan Siswa | `components/studio/member-management.tsx` | Manajemen profile siswa, angkatan, dan data akademik. |
| Studio Tab: Sesi QR Absensi | `components/studio/attendance-management.tsx` | Pembuat QR code absensi jangka pendek dan validasi input penutupan sesi. |
| Studio Tab: Penilaian Siswa | `components/studio/grades-management.tsx` | Input nilai siswa modular per minggu dengan auto-save per baris. |
| Studio Tab: Notulensi Markdown | `components/studio/notulensi-tab.tsx` | Editor markdown notion-like, formatting toolbar, split-screen live preview, autosave. |
| Studio Tab: File Bank Arsip | `components/studio/file-bank-tab.tsx` | Bank file arsip internal, copy link clipboard, simulasi drop zone. |
| API: Studio Dashboard | `/app/api/studio/...` | REST CRUD endpoints untuk members, courses, weeks, grades, attendance sessions, notulensi, dan file bank. |

### 🟡 Partial / Placeholder

| Area | File/Lokasi | Apa yang kurang |
|---|---|---|
| Alumni page | `app/alumni/page.tsx` | Halaman publik daftar alumni (prioritas rendah) |

### ❌ Belum Ada

| Area | Target lokasi | Prioritas |
|---|---|---|
| Error telemetry / rate limiting | API routes | Sebelum production |

---

## File Konfigurasi Penting

- `.mcp.json`
  - `firebase`: `npx -y firebase-tools@latest experimental:mcp --dir /workspaces/jpercommunity`
  - `supabase`: `https://mcp.supabase.com/mcp?project_ref=ufehqkmxqcqcmwkftqqf`
- `.firebaserc`
  - default project: `jper-community`
- `firebase.json`
  - hosting root: `public`
- `.env.local`
  - `SUPABASE_URL` — harus diisi (non-public server env)
  - `SUPABASE_SECRET_KEY` — harus diisi (service role key)
  - `NEXT_PUBLIC_FIREBASE_*` — sudah diisi untuk client SDK

---

## Dependency yang Sudah Dipasang

| Paket | Fungsi |
|---|---|
| `firebase` | Firebase Auth client SDK |
| `@supabase/server` | Supabase server helpers |
| `zod` | Schema validation |
| `next` 16.2.6 | Framework |
| `react` 19.2.4 | UI |
| `shadcn` | CLI untuk add komponen UI |
| `@base-ui/react` | Primitif aksesibel (dipakai untuk `Field` components) |
| `lucide-react` | Icon set (outline style, sesuai DESIGN.md) |
| `tailwindcss` v4 | Styling |

---

## Alur Auth Saat Ini

```
Register & Login Standar:
  Email/Password (Firebase) -> setSessionCookie -> redirect /lms atau /studio

Bypass Login (Siswa):
  Click "Bypass Login (Siswa)" -> set localStorage key -> setSessionCookie -> redirect /lms

Bypass Login (Admin):
  Click "Bypass Login (Admin)" -> set localStorage key -> setSessionCookie -> redirect /studio

Auth guard:
  middleware.ts -> mengecek cookie jper_session/__session di edge/server. Jika tidak ada, redirect ke /login atau /studio/login.
  useFirebaseUser hook -> client-side Firebase auth state sync dengan deteksi mock session storage instan.
```

---

## Helper Server dan Client

| File | Fungsi |
|---|---|
| `lib/firebase/client.ts` | Firebase client instance (firebaseAuth, firebaseApp) |
| `lib/server/firebase-auth.ts` | `verifyFirebaseIdToken()` — server-side token verify + mock intercept |
| `lib/server/supabase-rest.ts` | `supabaseRestRequest()` + `getSupabaseServerEnv()` |
| `lib/session-cookie.ts` | `setSessionCookie()`, `clearSessionCookie()` |
| `hooks/use-firebase-user.ts` | React hook — Firebase auth state client-side |
| `lib/validators/register.ts` | Zod `registerSchema` + `RegisterFormData` type |
| `lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |

---

## Konvensi Kode yang Sudah Dipakai

- Server Components by default; `"use client"` hanya di form/interactive
- Akses Supabase lewat `lib/server/supabase-rest.ts`, bukan langsung di komponen (untuk REST API)
- Nama file: kebab-case. Komponen: PascalCase
- Commit format: `type: deskripsi singkat`
- Tailwind v4 — pakai `@theme inline` di `globals.css`
- shadcn components: tambah via `npx shadcn@latest add <component>`, jangan manual