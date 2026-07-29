import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Auth guard middleware untuk JPER Community.
 *
 * Strategi:
 * - /lms/* dan /studio/* wajib ada Firebase session cookie (atau query param __session).
 * - Firebase tidak pakai cookie session by default pada mode client-only.
 *   Middleware ini cek keberadaan cookie `__session` yang di-set saat login.
 *
 * PENTING: Middleware ini hanya pengecekan keberadaan cookie sebagai first layer.
 * Role check (admin untuk Studio) tetap dilakukan di API route / server component
 * dengan verifikasi ID token ke Firebase dan query role ke Supabase.
 *
 * Untuk implementasi cookie session yang proper, gunakan firebase-admin
 * dan set session cookie saat login dengan signInWithEmailAndPassword.
 * Saat ini (MVP), cookie __firebase_auth_token disimpan oleh Firebase Auth SDK
 * di localStorage — sehingga middleware tidak bisa baca state tersebut di edge.
 *
 * Solusi MVP: tandai "sudah login" dengan cookie `jper_session` yang di-set
 * client-side setelah login berhasil, dihapus saat logout.
 */

const PROTECTED_LMS = /^\/lms(\/|$)/
const PROTECTED_STUDIO = /^\/studio(\/|$)/
const PUBLIC_STUDIO_LOGIN = /^\/studio\/login(\/|$)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Studio login page selalu public
  if (PUBLIC_STUDIO_LOGIN.test(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie =
    request.cookies.get("jper_session")?.value ??
    request.cookies.get("__session")?.value

  // Proteksi /lms/*
  if (PROTECTED_LMS.test(pathname) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Proteksi /studio/* (role check tetap di server/API)
  if (PROTECTED_STUDIO.test(pathname) && !sessionCookie) {
    const loginUrl = new URL("/studio/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     * - api routes (api routes punya auth check sendiri)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
