"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-white p5-subtle-grid text-black overflow-hidden">
      {/* Subtle Red and Gold Corner Accents */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-gradient-to-bl from-[#E60012]/08 via-transparent to-transparent pointer-events-none -rotate-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-[#FFC700]/10 via-transparent to-transparent pointer-events-none rotate-12 transform origin-bottom-left" />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_#111] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E60012] hover:text-white hover:shadow-[4px_4px_0px_#FFC700]"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Landing Page</span>
        </Link>

        <Suspense fallback={<div className="text-center font-mono text-xs font-black uppercase text-zinc-600 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#111]">Memuat halaman login...</div>}>
          <LoginForm initialMode="lms" />
        </Suspense>
      </div>
    </div>
  )
}

