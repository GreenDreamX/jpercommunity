import Link from "next/link"
import { ArrowLeft, BookOpen, CheckCircle2, Award, Clock } from "lucide-react"

export const metadata = {
  title: "Kurikulum & Silabus Pembelajaran | JPER Docs",
  description: "Dokumentasi kurikulum dan silabus modul pembelajaran Bahasa Jepang di SMKN 1 Majalaya.",
}

const MODULES = [
  {
    phase: "Bulan 1–2",
    title: "Fondasi Kana & Salam Sehari-hari (基礎)",
    desc: "Menguasai Hiragana, Katakana, salam dasar (Aisatsu), perkenalan diri (Jikoshoukai), dan partikel dasar (は, の, です).",
    items: ["Penulisan & Urutan Coretan Hiragana (あ-ん)", "Penulisan Katakana & Kata Serapan (カタカナ)", "Kosakata Aisatsu & Angka 1-1000", "Partikel Dasar は, の, です, か"],
  },
  {
    phase: "Bulan 3–4",
    title: "Kosakata & Tata Bahasa Dasar (文法 & 語彙)",
    desc: "Memperluas kosakata benda, kata kerja bentuk ~masu, partikel arah/tempat (を, に, へ, で), serta kata sifat ~i dan ~na.",
    items: ["Kata Kerja Bentuk ます / ません / ました", "Partikel Kalimat を, に, へ, で, と", "Kata Sifat ~い & ~な", "Kanji Dasar N5 (日月木水火土金)"],
  },
  {
    phase: "Bulan 5–6",
    title: "Percakapan Praktis & Persiapan JLPT N5 (会話 & 聴解)",
    desc: "Latihan Kaiwa berpasangan, menyusun kalimat majemuk, mendengar audio Choukai, dan simulasi Ujian JLPT N5.",
    items: ["Bentuk Bentuk ~て (Perintah & Kemajuan)", "Percakapan Praktis di Restoran & Belanja", "Latihan Choukai Listening Rush", "Simulasi Kuis & Evaluation Test JLPT N5"],
  },
]

export default function KurikulumDocsPage() {
  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#B23A2E] transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Pusat Dokumentasi (docs.jper.my.id)
          </Link>
          <div className="flex items-center gap-2">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-6 object-contain" />
            <span className="font-mono text-xs font-bold tracking-wider">docs.jper.my.id</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[#1C1B1A]">
            Kurikulum Pembelajaran Bahasa Jepang
          </h1>
          <p className="text-xs font-mono text-[#6B6862]">
            Program Pembelajaran 6 Bulan — Ekstrakurikuler SMKN 1 Majalaya
          </p>
        </div>

        {/* Curriculum Timeline */}
        <div className="space-y-6">
          {MODULES.map((mod, idx) => (
            <div key={idx} className="bg-white border border-[#E4E1DA] p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#B23A2E] bg-[#B23A2E]/10 border border-[#B23A2E]/20 px-3 py-1 rounded-full">
                  {mod.phase}
                </span>
                <span className="text-xs font-mono text-[#6B6862] flex items-center gap-1">
                  <Clock className="size-3.5" /> Modul {idx + 1}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#1C1B1A]">{mod.title}</h2>
                <p className="text-xs text-[#6B6862] mt-1 leading-relaxed">{mod.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#E4E1DA]/60">
                <div className="text-xs font-bold text-[#2B3A55] mb-2">Materi Pokok Bahasan:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mod.items.map((item, i) => (
                    <div key={i} className="text-xs text-[#1C1B1A] flex items-start gap-2 bg-[#FAF9F6] p-2 rounded-lg border border-[#E4E1DA]/50">
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community</div>
          <a href="https://lms.jper.my.id" className="font-semibold text-[#B23A2E] hover:underline">
            Akses LMS Pembelajaran →
          </a>
        </div>
      </div>
    </main>
  )
}
