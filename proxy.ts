import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Next.js 16 Proxy Middleware for JPER Community:
 * - Subdomain Routing:
 *   - lms.jper.my.id (LMS Member Portal)
 *   - studio.jper.my.id (Admin & Pengurus Management Studio)
 *   - docs.jper.my.id (Documentation Portal Paper & Ink)
 *   - forms.jper.my.id / form.jper.my.id (Dynamic Form Engine)
 *   - s.jper.my.id (URL Shortener Engine)
 * - Production Legacy Path Redirects
 * - Auth Guards for /lms & /studio
 */

const PROTECTED_LMS = /^\/lms(\/|$)/
const PROTECTED_STUDIO = /^\/studio(\/|$)/
const PUBLIC_STUDIO_LOGIN = /^\/studio\/login(\/|$)/

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get("host") || ""
  const path = url.pathname

  // Skip static assets, Next internal files, and API endpoints (except shortlink API resolution)
  if (
    path.startsWith("/_next") ||
    (path.startsWith("/api") && !path.startsWith("/api/s/")) ||
    path.startsWith("/image") ||
    path.includes(".")
  ) {
    return NextResponse.next()
  }

  // 1. DETERMINE SUBDOMAIN & ENVIRONMENT
  let subdomain = ""
  if (hostname.startsWith("lms.")) subdomain = "lms"
  else if (hostname.startsWith("studio.")) subdomain = "studio"
  else if (hostname.startsWith("forms.") || hostname.startsWith("form.")) subdomain = "forms"
  else if (hostname.startsWith("docs.")) subdomain = "docs"
  else if (hostname.startsWith("s.")) subdomain = "s"

  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // 2. CROSS-SUBDOMAIN PATH REDIRECTS (Handles cross-subdomain links & client router navigation)
  if (!isLocalhost) {
    // If requesting /lms on any subdomain other than lms.jper.my.id
    if (subdomain !== "lms" && (path === "/lms" || path.startsWith("/lms/"))) {
      const targetPath = path.replace(/^\/lms/, "") || ""
      return NextResponse.redirect(`https://lms.jper.my.id${targetPath}`, 307)
    }

    // If requesting /studio on any subdomain other than studio.jper.my.id
    if (subdomain !== "studio" && (path === "/studio" || path.startsWith("/studio/"))) {
      const targetPath = path.replace(/^\/studio/, "") || ""
      return NextResponse.redirect(`https://studio.jper.my.id${targetPath}`, 307)
    }

    // If requesting /login from subdomains (e.g. studio.jper.my.id/login)
    if (subdomain !== "" && subdomain !== "studio" && path === "/login") {
      return NextResponse.redirect(`https://jper.my.id/login`, 307)
    }

    // If requesting /register or /forms on any subdomain other than forms.jper.my.id
    if (subdomain !== "forms" && (path === "/register" || path.startsWith("/forms"))) {
      const targetPath = path === "/register" ? "/register" : path.replace(/^\/forms/, "") || ""
      return NextResponse.redirect(`https://forms.jper.my.id${targetPath}`, 307)
    }

    // If requesting /docs, /privacy, or /terms on any subdomain other than docs.jper.my.id
    if (subdomain !== "docs" && (path === "/privacy" || path === "/terms" || path.startsWith("/docs"))) {
      const targetPath = path.startsWith("/docs") ? path.replace(/^\/docs/, "") : path
      return NextResponse.redirect(`https://docs.jper.my.id${targetPath}`, 307)
    }
  }

  // 3. AUTH GUARD CHECK
  const sessionCookie =
    request.cookies.get("jper_session")?.value ??
    request.cookies.get("__session")?.value

  const isAccessingLms = subdomain === "lms" || PROTECTED_LMS.test(path)
  const isAccessingStudio = subdomain === "studio" || PROTECTED_STUDIO.test(path)
  const isStudioLogin = PUBLIC_STUDIO_LOGIN.test(path)

  if (isAccessingLms && !sessionCookie) {
    const loginUrl = isLocalhost ? new URL("/login", request.url) : new URL("https://jper.my.id/login")
    loginUrl.searchParams.set("from", path)
    return NextResponse.redirect(loginUrl)
  }

  if (isAccessingStudio && !isStudioLogin && !sessionCookie) {
    const loginUrl = isLocalhost ? new URL("/studio/login", request.url) : new URL("https://studio.jper.my.id/login")
    loginUrl.searchParams.set("from", path)
    return NextResponse.redirect(loginUrl)
  }

  // 4. SUBDOMAIN REWRITES (For internal routing within the matching subdomain)
  if (subdomain === "lms") {
    if (!path.startsWith("/lms")) {
      const targetUrl = new URL(`/lms${path === "/" ? "" : path}`, request.url)
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  if (subdomain === "studio") {
    if (path === "/login") {
      return NextResponse.rewrite(new URL("/studio/login", request.url))
    }
    if (!path.startsWith("/studio")) {
      const targetUrl = new URL(`/studio${path === "/" ? "" : path}`, request.url)
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  if (subdomain === "forms") {
    if (path === "/" || path === "/register") {
      return NextResponse.rewrite(new URL("/forms/register", request.url))
    }
    if (!path.startsWith("/forms")) {
      const targetUrl = new URL(`/forms${path}`, request.url)
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  if (subdomain === "docs") {
    if (path === "/privacy") {
      return NextResponse.rewrite(new URL("/docs/privacy", request.url))
    }
    if (path === "/terms") {
      return NextResponse.rewrite(new URL("/docs/terms", request.url))
    }
    if (!path.startsWith("/docs")) {
      const targetUrl = new URL(`/docs${path === "/" ? "" : path}`, request.url)
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  if (subdomain === "s") {
    if (path === "/") {
      return NextResponse.rewrite(new URL("/s", request.url))
    }
    if (!path.startsWith("/s") && !path.startsWith("/api/s")) {
      const targetUrl = new URL(`/api/s${path}`, request.url)
      return NextResponse.rewrite(targetUrl)
    }
    return NextResponse.next()
  }

  // 5. PRODUCTION MAIN DOMAIN LEGACY PATH REDIRECTS (Only on production jper.my.id)
  if (!subdomain && !isLocalhost) {
    if (path.startsWith("/lms")) {
      const targetPath = path.replace(/^\/lms/, "") || ""
      return NextResponse.redirect(`https://lms.jper.my.id${targetPath}`, 307)
    }

    if (path.startsWith("/studio") && !isStudioLogin) {
      const targetPath = path.replace(/^\/studio/, "") || ""
      return NextResponse.redirect(`https://studio.jper.my.id${targetPath}`, 307)
    }

    if (path === "/register" || path.startsWith("/forms")) {
      const targetPath = path === "/register" ? "/register" : path.replace(/^\/forms/, "")
      return NextResponse.redirect(`https://forms.jper.my.id${targetPath}`, 307)
    }

    if (path === "/privacy" || path === "/terms" || path.startsWith("/docs")) {
      const targetPath = path.startsWith("/docs") ? path.replace(/^\/docs/, "") : path
      return NextResponse.redirect(`https://docs.jper.my.id${targetPath}`, 307)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
