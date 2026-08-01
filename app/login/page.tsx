"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FAF9F6] p-6 md:p-10 text-[#1C1B1A]">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={<div className="text-center text-xs font-mono text-[#6B6862]">Memuat halaman login...</div>}>
          <LoginForm initialMode="lms" />
        </Suspense>
      </div>
    </div>
  )
}
