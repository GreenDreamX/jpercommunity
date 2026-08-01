"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Volume2, Bookmark, BookOpen, Star, Sparkles, RefreshCw, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type DictionaryItem = {
  id: string
  term: string
  reading: string | null
  romaji: string | null
  pos: string | null
  meaning: string
  meaning_id: string | null
  pitch: string | null
  pitch_position: number | null
  example_ja: string | null
  example_id: string | null
  category: string | null
  frequency: number | null
}

interface DictionaryTabProps {
  firebaseToken: string
}

export function DictionaryTab({ firebaseToken }: DictionaryTabProps) {
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Load bookmarks from local storage
  useEffect(() => {
    const saved = localStorage.getItem("jper_dictionary_bookmarks")
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
    localStorage.setItem("jper_dictionary_bookmarks", JSON.stringify(updated))
  }

  // Fetch dictionary data from DB
  const fetchDictionary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/lms/dictionary"
      const params = new URLSearchParams()
      if (activeCategory !== "all" && activeCategory !== "saved") {
        params.append("category", activeCategory)
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim())
      }
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
      })

      if (!res.ok) {
        throw new Error("Gagal memuat data kamus dari database.")
      }

      const data = await res.json()
      setItems(data.items ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.")
    } finally {
      setLoading(false)
    }
  }, [firebaseToken, activeCategory, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDictionary()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchDictionary])

  // TTS Pronunciation using SpeechSynthesis API
  const playAudio = (text: string, id: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      const cleanedText = text.replace(/～/g, "").trim()
      const utterance = new SpeechSynthesisUtterance(cleanedText)
      utterance.lang = "ja-JP"
      utterance.rate = 0.85

      const voices = window.speechSynthesis.getVoices()
      const jaVoice = voices.find((v) => v.lang.toLowerCase().includes("ja"))
      if (jaVoice) {
        utterance.voice = jaVoice
      }

      setPlayingId(id)
      utterance.onend = () => setPlayingId(null)
      utterance.onerror = () => setPlayingId(null)

      window.speechSynthesis.speak(utterance)
    } else {
      alert("Fitur suara (TTS) tidak didukung oleh browser Anda.")
    }
  }

  // Filter items for saved tab
  const displayedItems = activeCategory === "saved"
    ? items.filter((item) => bookmarks.includes(item.id))
    : items

  const categories = [
    { id: "all", label: "Semua Kata" },
    { id: "N5", label: "JLPT N5" },
    { id: "N4", label: "JLPT N4" },
    { id: "N3", label: "JLPT N3" },
    { id: "N2", label: "JLPT N2" },
    { id: "N1", label: "JLPT N1" },
    { id: "saved", label: "Disimpan" }
  ]

  // Pitch Accent badge helper
  const getPitchStyle = (pitchStr: string | null) => {
    if (!pitchStr) return { bg: "bg-stone-100 text-stone-700 border-stone-200", label: "Pitch N/A" }
    if (pitchStr.includes("［0］")) return { bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", label: pitchStr }
    if (pitchStr.includes("［1］")) return { bg: "bg-amber-500/10 text-amber-800 border-amber-500/20", label: pitchStr }
    if (pitchStr.includes("［2］") || pitchStr.includes("［3］")) return { bg: "bg-sky-500/10 text-sky-700 border-sky-500/20", label: pitchStr }
    return { bg: "bg-[#2B3A55]/10 text-[#2B3A55] border-[#2B3A55]/20", label: pitchStr }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <BookOpen className="size-5 text-[#B23A2E]" />
            Kamus & Kosakata (DB Supabase)
          </h2>
          <p className="text-xs text-[#6B6862]">Kamus kosakata Jepang lengkap dengan notasi Pitch Accent (NHK), suara TTS kata, & contoh kalimat berikut arti.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#2B3A55]/5 border border-[#2B3A55]/10 px-3 py-1.5 rounded-lg text-[#2B3A55] text-xs font-semibold shrink-0">
          <Sparkles className="size-3.5 animate-pulse text-amber-500" />
          <span>TTS Kata & Sentences + Pitch</span>
        </div>
      </div>

      {/* Control Panel: Categories & Search */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E4E1DA] pb-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-[#2B3A55] text-white shadow-sm"
                    : "text-[#6B6862] hover:bg-[#E4E1DA]/40"
                }`}
              >
                {cat.id === "saved" && <Star className={`size-3.5 ${activeCategory === "saved" ? "fill-amber-400 text-amber-400" : ""}`} />}
                {cat.label}
                {cat.id === "saved" && bookmarks.length > 0 && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-900 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    {bookmarks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari kata (Kanji, Hiragana, Romaji, Arti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg focus-visible:ring-[#2B3A55]"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs font-mono text-[#6B6862] gap-2">
            <RefreshCw className="size-4 animate-spin text-[#B23A2E]" />
            Memuat data kamus dari Supabase...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-4 text-xs text-[#B23A2E]">
            {error}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#6B6862] italic space-y-1">
            <div>Tidak ada kosakata yang ditemukan.</div>
            <div className="text-[11px] text-[#6B6862]/80">Coba ubah filter atau kata kunci pencarian Anda.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => {
              const isBookmarked = bookmarks.includes(item.id)
              const pitchStyle = getPitchStyle(item.pitch)
              const isPlayingWord = playingId === `word-${item.id}`
              const isPlayingSentence = playingId === `sent-${item.id}`

              return (
                <Card 
                  key={item.id} 
                  className="border border-[#E4E1DA] bg-[#FAF9F6]/60 shadow-none rounded-lg hover:border-[#2B3A55]/30 transition-all flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Header badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {/* Category pill */}
                    {item.category && (
                      <span className="text-[9px] font-mono font-bold bg-[#2B3A55]/10 text-[#2B3A55] border border-[#2B3A55]/20 px-2 py-0.5 rounded-full capitalize">
                        {item.category}
                      </span>
                    )}

                    {/* Bookmark button */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className="text-[#6B6862] hover:text-amber-500 transition-colors p-1"
                      title={isBookmarked ? "Hapus Bookmark" : "Simpan Kata"}
                    >
                      {isBookmarked ? (
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <Bookmark className="size-4" />
                      )}
                    </button>
                  </div>

                  <CardHeader className="pb-2 pr-24">
                    {/* Part of Speech */}
                    <CardDescription className="text-[9px] font-mono uppercase tracking-wider text-[#6B6862]">
                      {item.pos || "Kata Benda"}
                    </CardDescription>

                    {/* Kanji Term & Reading */}
                    <div className="mt-1 space-y-0.5">
                      <CardTitle className="text-2xl font-bold text-[#1C1B1A] tracking-tight flex items-baseline gap-2">
                        <span className="font-sans">{item.term}</span>
                        {item.reading && item.reading !== item.term && (
                          <span className="text-xs font-mono font-normal text-[#6B6862]">
                            ({item.reading})
                          </span>
                        )}
                      </CardTitle>

                      {/* Romaji */}
                      {item.romaji && (
                        <div className="text-[11px] font-mono text-[#2B3A55]/80 font-medium">
                          {item.romaji}
                        </div>
                      )}
                    </div>

                    {/* Pitch Accent Badge & Word TTS Button */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {/* Pitch Accent visual badge */}
                      <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded-md flex items-center gap-1 ${pitchStyle.bg}`}>
                        <Layers className="size-3" />
                        {pitchStyle.label}
                      </span>

                      {/* Word TTS button */}
                      <button
                        type="button"
                        onClick={() => playAudio(item.term, `word-${item.id}`)}
                        className={`h-6 px-2 text-[10px] font-semibold rounded-md border transition-colors flex items-center gap-1 ${
                          isPlayingWord
                            ? "bg-[#B23A2E] text-white border-[#B23A2E] animate-pulse"
                            : "bg-[#FAF9F6] border-[#E4E1DA] hover:border-[#2B3A55]/40 text-[#2B3A55]"
                        }`}
                        title="Dengarkan pengucapan kata"
                      >
                        <Volume2 className="size-3" />
                        {isPlayingWord ? "Memutar..." : "Audio Kata"}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Meaning / Indonesian Definition */}
                    <div className="space-y-1.5 border-t border-[#E4E1DA]/60 pt-2.5">
                      <div className="text-xs font-bold text-[#1C1B1A]">
                        {item.meaning}
                      </div>
                      {item.meaning_id && item.meaning_id !== item.meaning && (
                        <p className="text-[11px] text-[#6B6862] leading-relaxed">
                          {item.meaning_id}
                        </p>
                      )}
                    </div>

                    {/* Example Sentence Block */}
                    {item.example_ja && (
                      <div className="rounded-lg border border-[#2B3A55]/15 bg-[#2B3A55]/5 p-3 space-y-2 mt-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            {/* Japanese example sentence */}
                            <div className="text-xs font-medium text-[#1C1B1A] font-sans leading-relaxed">
                              例: {item.example_ja}
                            </div>

                            {/* Indonesian translation */}
                            {item.example_id && (
                              <div className="text-[10px] text-[#6B6862] italic font-sans leading-normal">
                                Arti: {item.example_id}
                              </div>
                            )}
                          </div>

                          {/* Sentence TTS button */}
                          <button
                            type="button"
                            onClick={() => playAudio(item.example_ja!, `sent-${item.id}`)}
                            className={`p-1.5 rounded-md border shrink-0 transition-colors ${
                              isPlayingSentence
                                ? "bg-[#B23A2E] text-white border-[#B23A2E] animate-pulse"
                                : "bg-[#FAF9F6] border-[#E4E1DA] hover:bg-[#2B3A55]/10 text-[#2B3A55]"
                            }`}
                            title="Dengarkan pengucapan kalimat"
                          >
                            <Volume2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
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
