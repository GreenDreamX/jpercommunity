import Link from "next/link"
import { ArrowLeft, Home, BookOpen, HelpCircle } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Japanese Hanko / Error Stamp Visual */}
        <div className="relative inline-flex items-center justify-center">
          <div className="size-24 rounded-full border-2 border-dashed border-[#B23A2E]/30 bg-[#B23A2E]/5 flex items-center justify-center">
            <span className="font-heading text-4xl font-extrabold text-[#B23A2E] tracking-tighter">
              404
            </span>
          </div>
          <div className="absolute -bottom-2 bg-white border border-[#B23A2E] text-[#B23A2E] px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-xs">
            未発見 (Not Found)
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#1C1B1A]">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-[#6B6862] leading-relaxed">
            Maaf, halaman atau materi yang Anda cari tidak ada atau telah dipindahkan ke lokasi lain.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="https://lms.jper.my.id"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <BookOpen className="size-4" /> Masuk ke LMS Member
          </a>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#E4E1DA] bg-white text-[#1C1B1A] hover:bg-[#FAF9F6] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Home className="size-4 text-[#6B6862]" /> Landing Page
          </Link>
        </div>

        {/* Branding Footer */}
        <div className="pt-8 text-[11px] font-mono text-[#6B6862]">
          JPER Community &copy; 2026 — SMKN 1 Majalaya
        </div>
      </div>
    </main>
  )
}
