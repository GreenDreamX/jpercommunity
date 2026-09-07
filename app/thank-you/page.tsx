import Link from "next/link"
import { CheckCircle2, ArrowRight, BookOpen, HelpCircle, MessageSquareText } from "lucide-react"

export const metadata = {
  title: "Pendaftaran Berhasil! | JPER Community",
  description: "Selamat! Pendaftaran Anda di JPER Community SMKN 1 Majalaya telah berhasil.",
}

export default function ThankYouPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-lg space-y-6 bg-white border border-[#E4E1DA] p-8 md:p-10 rounded-3xl shadow-sm">
        {/* Animated Check Icon */}
        <div className="size-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
          <CheckCircle2 className="size-10 stroke-[2]" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
            Pendaftaran Berhasil 🎉
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-[#1C1B1A]">
            Selamat Bergabung di JPER!
          </h1>
          <p className="text-xs text-[#6B6862] leading-relaxed max-w-md mx-auto">
            Akun LMS Anda sudah aktif dan siap digunakan. Anda dapat langsung masuk ke portal LMS untuk memulai pembelajaran bahasa Jepang.
          </p>
        </div>

        {/* Next Steps Box */}
        <div className="rounded-2xl border border-[#E4E1DA] bg-[#FAF9F6] p-4 text-left space-y-3 text-xs text-[#6B6862]">
          <div className="font-bold text-[#1C1B1A] flex items-center gap-2">
            📌 Langkah Selanjutnya:
          </div>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Masuk ke portal LMS menggunakan email &amp; password yang baru dibuat.</li>
            <li>Buka tab <strong>"Kehadiran Mandiri"</strong> saat mengikuti latihan rutin mingguan di sekolah.</li>
            <li>Mainkan 5 game interaktif di <strong>"Arcade Push Rank"</strong> untuk mengumpulkan EXP pertama Anda.</li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            <BookOpen className="size-4" /> Login ke Portal LMS Sekarang <ArrowRight className="size-4" />
          </Link>
          <a
            href="https://wa.me/6283850967918"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#E4E1DA] bg-white text-[#1C1B1A] hover:bg-[#FAF9F6] text-xs font-semibold px-4 py-3 rounded-xl transition-all"
          >
            <MessageSquareText className="size-4 text-emerald-600" /> Hubungi Pembina (WA)
          </a>
        </div>

        {/* Footer Link */}
        <div className="pt-4 border-t border-[#E4E1DA]/60 flex items-center justify-between text-[11px] text-[#6B6862]">
          <span>Ada pertanyaan seputar ekskul?</span>
          <Link href="/faq" className="font-bold text-[#B23A2E] hover:underline flex items-center gap-1">
            <HelpCircle className="size-3.5" /> Baca FAQ Anggota →
          </Link>
        </div>
      </div>
    </main>
  )
}
