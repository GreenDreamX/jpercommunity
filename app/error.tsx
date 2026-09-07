"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw, AlertTriangle, Home } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[JPER LMS Error Boundary]:", error)
  }, [error])

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-6 bg-white border border-[#E4E1DA] p-8 rounded-2xl shadow-sm">
        {/* Warning Icon */}
        <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-8 text-[#B23A2E]" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-bold tracking-tight text-[#1C1B1A]">
            Terjadi Kendala Sistem
          </h1>
          <p className="text-xs text-[#6B6862] leading-relaxed">
            Sistem mendeteksi adanya gangguan saat memuat komponen ini. Data Anda tetap aman.
          </p>
          {error.message && (
            <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] font-mono text-[#B23A2E] text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        {/* Recovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className="size-4" /> Coba Muat Ulang
          </button>
          <Link
            href="/lms"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#E4E1DA] bg-white text-[#1C1B1A] hover:bg-[#FAF9F6] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Home className="size-4 text-[#6B6862]" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  )
}
