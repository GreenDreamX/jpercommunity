/**
 * Helpers untuk session cookie yang dibaca oleh middleware.ts.
 *
 * Firebase Auth client SDK menyimpan state di localStorage, bukan cookie,
 * sehingga Next.js middleware (yang berjalan di edge/server) tidak bisa
 * membaca auth state secara langsung.
 *
 * Solusi MVP: set cookie tipis `jper_session=1` setelah login berhasil,
 * hapus saat logout. Middleware cek keberadaan cookie ini.
 *
 * Cookie ini TIDAK mengandung token/data sensitif — hanya penanda "sudah login".
 * Verifikasi identitas asli tetap dilakukan di server lewat Firebase ID token.
 */

const SESSION_COOKIE = "jper_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 hari

export function setSessionCookie() {
  if (typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}
