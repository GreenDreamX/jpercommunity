"use client"

import React, { useState, useEffect } from "react"
import { Search, Volume2, Bookmark, BookOpen, Star, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type GlossaryItem = {
  id: string
  japanese: string
  romaji: string
  type: "vocab" | "grammar" | "character"
  category: string
  indonesian: string
  pos: string // Part of speech (e.g. Verba, Nomina, Partikel)
  exampleJapanese?: string
  exampleIndonesian?: string
}

const GLOSSARY_DATA: GlossaryItem[] = [
  // Character
  { id: "c1", japanese: "あ / ア", romaji: "a", type: "character", category: "Vokal", indonesian: "Karakter vokal 'a'", pos: "Huruf Dasar" },
  { id: "c2", japanese: "い / イ", romaji: "i", type: "character", category: "Vokal", indonesian: "Karakter vokal 'i'", pos: "Huruf Dasar" },
  { id: "c3", japanese: "う / ウ", romaji: "u", type: "character", category: "Vokal", indonesian: "Karakter vokal 'u'", pos: "Huruf Dasar" },
  { id: "c4", japanese: "え / エ", romaji: "e", type: "character", category: "Vokal", indonesian: "Karakter vokal 'e'", pos: "Huruf Dasar" },
  { id: "c5", japanese: "お / オ", romaji: "o", type: "character", category: "Vokal", indonesian: "Karakter vokal 'o'", pos: "Huruf Dasar" },
  
  // Vocabulary
  {
    id: "v1",
    japanese: "先生",
    romaji: "sensei",
    type: "vocab",
    category: "Sekolah",
    indonesian: "Guru / Pengajar",
    pos: "Nomina (Kata Benda)",
    exampleJapanese: "日本語の先生が好きです。",
    exampleIndonesian: "Saya suka guru bahasa Jepang."
  },
  {
    id: "v2",
    japanese: "学生",
    romaji: "gakusei",
    type: "vocab",
    category: "Sekolah",
    indonesian: "Siswa / Mahasiswa",
    pos: "Nomina (Kata Benda)",
    exampleJapanese: "私はSMKN 1 Majalayaの学生です。",
    exampleIndonesian: "Saya adalah siswa SMKN 1 Majalaya."
  },
  {
    id: "v3",
    japanese: "日本語",
    romaji: "nihongo",
    type: "vocab",
    category: "Bahasa",
    indonesian: "Bahasa Jepang",
    pos: "Nomina (Kata Benda)",
    exampleJapanese: "日本語 को 勉強しています。",
    exampleIndonesian: "Saya sedang belajar bahasa Jepang."
  },
  {
    id: "v4",
    japanese: "食べる",
    romaji: "taberu",
    type: "vocab",
    category: "Aktivitas",
    indonesian: "Makan",
    pos: "Verba (Kata Kerja - Gol. 2)",
    exampleJapanese: "朝ご飯を食べましたか？",
    exampleIndonesian: "Apakah kamu sudah makan sarapan?"
  },
  {
    id: "v5",
    japanese: "美味しい",
    romaji: "oishii",
    type: "vocab",
    category: "Kondisi",
    indonesian: "Enak / Lezat",
    pos: "Adjektiva-I (Kata Sifat)",
    exampleJapanese: "このラーメンはとても美味しいです。",
    exampleIndonesian: "Ramen ini sangat lezat."
  },
  {
    id: "v6",
    japanese: "本",
    romaji: "hon",
    type: "vocab",
    category: "Sekolah",
    indonesian: "Buku",
    pos: "Nomina (Kata Benda)",
    exampleJapanese: "図書館で本を読みます。",
    exampleIndonesian: "Membaca buku di perpustakaan."
  },
  {
    id: "v7",
    japanese: "行く",
    romaji: "iku",
    type: "vocab",
    category: "Aktivitas",
    indonesian: "Pergi",
    pos: "Verba (Kata Kerja - Gol. 1)",
    exampleJapanese: "明日学校に行きます。",
    exampleIndonesian: "Besok saya pergi to sekolah."
  },

  // Grammar
  {
    id: "g1",
    japanese: "～は～です",
    romaji: "... wa ... desu",
    type: "grammar",
    category: "Struktur Dasar",
    indonesian: "[A] adalah [B] (Menyatakan identitas/subjek)",
    pos: "Pola Kalimat Dasar",
    exampleJapanese: "私は学生です。",
    exampleIndonesian: "Saya adalah seorang siswa."
  },
  {
    id: "g2",
    japanese: "～の",
    romaji: "... no ...",
    type: "grammar",
    category: "Partikel",
    indonesian: "Partikel kepemilikan / penghubung kata benda",
    pos: "Partikel",
    exampleJapanese: "これは私の本です。",
    exampleIndonesian: "Ini adalah buku saya."
  },
  {
    id: "g3",
    japanese: "～てください",
    romaji: "... te kudasai",
    type: "grammar",
    category: "Permintaan",
    indonesian: "Tolong... / Silakan... (Meminta dengan sopan)",
    pos: "Konjugasi Kata Kerja -te",
    exampleJapanese: "日本語で話してください。",
    exampleIndonesian: "Tolong bicaralah menggunakan bahasa Jepang."
  },
  {
    id: "g4",
    japanese: "～たいです",
    romaji: "... tai desu",
    type: "grammar",
    category: "Keinginan",
    indonesian: "Ingin melakukan... (Menyatakan keinginan)",
    pos: "Konjugasi Bentuk Keinginan",
    exampleJapanese: "日本に行きたいです。",
    exampleIndonesian: "Saya ingin pergi ke Jepang."
  },
  {
    id: "g5",
    japanese: "～から",
    romaji: "... kara",
    type: "grammar",
    category: "Partikel",
    indonesian: "Karena... / Mulai dari...",
    pos: "Partikel Konjungsi",
    exampleJapanese: "時間がありませんから、急ぎます。",
    exampleIndonesian: "Karena tidak ada waktu, saya bergegas."
  }
]

export function GlossaryTab() {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "character" | "vocab" | "grammar" | "saved">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarks, setBookmarks] = useState<string[]>([])

  // Load bookmarks
  useEffect(() => {
    const saved = localStorage.getItem("jper_glossary_bookmarks")
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Toggle bookmark
  const toggleBookmark = (id: string) => {
    let updated: string[] = []
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter((bId) => bId !== id)
    } else {
      updated = [...bookmarks, id]
    }
    setBookmarks(updated)
    localStorage.setItem("jper_glossary_bookmarks", JSON.stringify(updated))
  }

  // TTS Pronunciation using Speech Synthesis
  const playAudio = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel previous speakings
      window.speechSynthesis.cancel()

      // Clean characters like ~ (tilde) for cleaner pronunciation
      const cleanedText = text.replace(/～/g, "")
      const utterance = new SpeechSynthesisUtterance(cleanedText)
      utterance.lang = "ja-JP"
      utterance.rate = 0.85
      const voices = window.speechSynthesis.getVoices()
      const jaVoice = voices.find((v) => v.lang.toLowerCase().includes("ja"))
      if (jaVoice) {
        utterance.voice = jaVoice
      }
      window.speechSynthesis.speak(utterance)
    } else {
      alert("TTS Pronunciation tidak didukung di browser ini.")
    }
  }

  // Filter items
  const filteredItems = GLOSSARY_DATA.filter((item) => {
    const matchesSearch =
      item.japanese.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.romaji.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.indonesian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (activeSubTab === "all") return true
    if (activeSubTab === "saved") return bookmarks.includes(item.id)
    return item.type === activeSubTab
  })

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <BookOpen className="size-5 text-[#B23A2E]" />
            Glosarium & Kamus JPER
          </h2>
          <p className="text-xs text-[#6B6862]">Kumpulan kosakata, huruf kana, dan pola tata bahasa Jepang dasar.</p>
        </div>
        <div className="flex items-center gap-1 bg-[#2B3A55]/5 border border-[#2B3A55]/10 px-3 py-1.5 rounded-lg text-[#2B3A55] text-xs font-semibold">
          <Sparkles className="size-3.5 animate-pulse text-amber-500" />
          Mendukung Suara (TTS)
        </div>
      </div>

      {/* Tabs and Search */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-[#E4E1DA] pb-2">
          {/* Subtabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Semua" },
              { id: "character", label: "Huruf Dasar" },
              { id: "vocab", label: "Kosakata" },
              { id: "grammar", label: "Tata Bahasa" },
              { id: "saved", label: "Disimpan" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? "bg-[#2B3A55] text-white"
                    : "text-[#6B6862] hover:bg-[#E4E1DA]/40"
                }`}
              >
                {tab.id === "saved" && <Star className={`size-3.5 ${activeSubTab === "saved" ? "fill-amber-400 text-amber-400" : ""}`} />}
                {tab.label}
                {tab.id === "saved" && bookmarks.length > 0 && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-900 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    {bookmarks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari kata/romaji/arti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
            />
          </div>
        </div>

        {/* Content list */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#6B6862] italic">
            Tidak ada data glosarium yang cocok dengan pencarian atau filter Anda.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isBookmarked = bookmarks.includes(item.id)
              return (
                <Card key={item.id} className="border border-[#E4E1DA] bg-[#FAF9F6]/50 shadow-none rounded-lg hover:border-[#2B3A55]/30 transition-colors flex flex-col justify-between overflow-hidden relative">
                  {/* Category Pill Tag */}
                  <div className="absolute top-3 right-10">
                    <span className="text-[9px] font-mono font-bold bg-[#2B3A55]/10 text-[#2B3A55] border border-[#2B3A55]/20 px-2 py-0.5 rounded-full capitalize">
                      {item.category}
                    </span>
                  </div>

                  <CardHeader className="pb-2">
                    <CardDescription className="text-[9px] font-mono uppercase tracking-wider text-[#6B6862] flex justify-between items-center">
                      <span>{item.pos}</span>
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold text-[#1C1B1A] tracking-tight mt-1.5 flex items-baseline gap-2">
                      <span className="font-sans">{item.japanese}</span>
                      <span className="text-xs font-mono font-normal text-[#6B6862]">({item.romaji})</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Translation */}
                    <div className="space-y-1">
                      <div className="text-xs text-[#1C1B1A] font-semibold">{item.indonesian}</div>
                      
                      {/* Example sentence if exists */}
                      {item.exampleJapanese && (
                        <div className="mt-2.5 pt-2 border-t border-[#E4E1DA]/60 space-y-1">
                          <div className="text-[10px] font-medium text-[#2B3A55] leading-relaxed font-sans">
                            例: {item.exampleJapanese}
                          </div>
                          <div className="text-[9px] text-[#6B6862] italic">
                            {item.exampleIndonesian}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Audio & Bookmark Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#E4E1DA]/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(item.japanese)}
                        className="h-7 px-2.5 border-[#E4E1DA] hover:border-[#2B3A55]/30 bg-[#FAF9F6] text-[10px] font-semibold rounded-lg text-[#2B3A55] flex items-center gap-1 shrink-0"
                      >
                        <Volume2 className="size-3.5" />
                        Lafalkan
                      </Button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(item.id)}
                        className="text-[#6B6862] hover:text-amber-500 transition-colors p-1"
                        title={isBookmarked ? "Hapus Bookmark" : "Simpan Kata"}
                      >
                        {isBookmarked ? (
                          <Star className="size-4.5 fill-amber-400 text-amber-400" />
                        ) : (
                          <Bookmark className="size-4.5" />
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
