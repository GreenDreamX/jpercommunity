import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Auth guard proxy middleware untuk JPER Community (Next.js 16 convention).
 */

const PROTECTED_LMS = /^\/lms(\/|$)/
const PROTECTED_STUDIO = /^\/studio(\/|$)/
const PUBLIC_STUDIO_LOGIN = /^\/studio\/login(\/|$)/

export function proxy(request: NextRequest) {
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
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
