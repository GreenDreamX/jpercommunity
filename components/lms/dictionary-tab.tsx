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

import { awardStudentXp } from "@/lib/lms/award-xp"

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
  const [xpToast, setXpToast] = useState<string | null>(null)

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

  // Toggle bookmark & award XP
  const toggleBookmark = async (id: string) => {
    let updated: string[] = []
    const isAdding = !bookmarks.includes(id)
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter((bId) => bId !== id)
    } else {
      updated = [...bookmarks, id]
    }
    setBookmarks(updated)
    localStorage.setItem("jper_dictionary_bookmarks", JSON.stringify(updated))

    if (isAdding && firebaseToken) {
      const res = await awardStudentXp(firebaseToken, "dictionary", 10)
      if (res?.ok) {
        setXpToast(`🎉 Selamat! Anda mendapatkan +${res.addedXp} XP dari belajar kosakata kamus!`)
        setTimeout(() => setXpToast(null), 3500)
      }
    }
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
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }, [firebaseToken, activeCategory, searchQuery])

  useEffect(() => {
    const handler = setTimeout(() => {
      void fetchDictionary()
    }, 300)
    return () => clearTimeout(handler)
  }, [fetchDictionary])

  // Browser Web Speech API Audio TTS
  const playAudio = (text: string, id: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Browser Anda tidak mendukung fitur Text-to-Speech.")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "ja-JP"
    utterance.rate = 0.9

    setPlayingId(id)

    utterance.onend = () => setPlayingId(null)
    utterance.onerror = () => setPlayingId(null)

    window.speechSynthesis.speak(utterance)
  }

  // Filter local for bookmarks tab
  const displayedItems = activeCategory === "saved"
    ? items.filter((item) => bookmarks.includes(item.id))
    : items

  // Pitch Accent badge label helper
  const getPitchStyle = (pitch: string | null) => {
    switch (pitch?.toLowerCase()) {
      case "heiban":
      case "0":
        return { label: "Heiban (平板 - 0)", bg: "bg-blue-600 text-white border-black" }
      case "atamadaka":
      case "1":
        return { label: "Atamadaka (頭高 - 1)", bg: "bg-[#E60012] text-white border-black" }
      case "nakadaka":
        return { label: "Nakadaka (中高)", bg: "bg-[#FFC700] text-black border-black" }
      case "odaka":
        return { label: "Odaka (尾高)", bg: "bg-purple-600 text-white border-black" }
      default:
        return { label: pitch || "Standard Pitch", bg: "bg-zinc-800 text-white border-black" }
    }
  }

  const categories = [
    { id: "all", label: "Semua Kata" },
    { id: "saved", label: "Kosakata Tersimpan" },
    { id: "n5", label: "JLPT N5" },
    { id: "n4", label: "JLPT N4" },
    { id: "n3", label: "JLPT N3" },
    { id: "ekskul", label: "Kosakata Ekskul" },
  ]

  return (
    <div className="space-y-6 text-black">
      {/* Toast Notification */}
      {xpToast && (
        <div className="border-2 border-black bg-[#FFC700] p-4 text-xs font-black text-black flex items-center justify-between shadow-[4px_4px_0px_#111] animate-bounce">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#E60012] shrink-0" />
            <span>{xpToast}</span>
          </div>
          <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5 -skew-x-6 border border-black">
            XP ADDED
          </span>
        </div>
      )}

      {/* Main Container Card */}
      <Card className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] rounded-none p-5 space-y-6">
        {/* Header Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block bg-[#E60012] text-white px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider -skew-x-6 border border-black shadow-[2px_2px_0px_#FFC700]">
              辞書 • JAPANESE DICTIONARY
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            Kamus Bahasa Jepang & Pitch Accent
          </h2>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Kamus kosakata interaktif lengkap dengan contoh kalimat, visual pitch accent, dan audio pengucapan asli.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-y-2 border-black py-4 bg-[#FAF9F5] -mx-5 px-5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider -skew-x-6 border-2 border-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-[#E60012] text-white shadow-[2px_2px_0px_#111]"
                    : "bg-white text-black hover:bg-[#FFC700]"
                }`}
              >
                {cat.id === "saved" && <Star className={`size-3.5 ${activeCategory === "saved" ? "fill-[#FFC700] text-black" : ""}`} />}
                {cat.label}
                {cat.id === "saved" && bookmarks.length > 0 && (
                  <span className="text-[9px] font-mono font-black bg-black text-[#FFC700] px-1.5 py-0.2 border border-black">
                    {bookmarks.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-black" />
            <Input
              placeholder="Cari Kanji, Hiragana, Romaji, Arti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-2 border-black bg-white text-xs h-10 font-bold text-black shadow-[2px_2px_0px_#111] focus:ring-0 focus:border-[#E60012]"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs font-mono font-black text-zinc-600 gap-2">
            <RefreshCw className="size-5 animate-spin text-[#E60012]" />
            Memuat data kamus...
          </div>
        ) : error ? (
          <div className="border-2 border-black bg-[#E60012] p-4 text-xs font-black text-white shadow-[4px_4px_0px_#111]">
            {error}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-16 text-xs font-bold text-zinc-500 italic space-y-1 border-2 border-black border-dashed p-6">
            <p className="font-black text-black text-sm uppercase">Kosakata Tidak Ditemukan</p>
            <p className="text-xs text-zinc-600">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => {
              const isBookmarked = bookmarks.includes(item.id)
              const pitchStyle = getPitchStyle(item.pitch)
              const isPlayingWord = playingId === `word-${item.id}`
              const isPlayingSentence = playingId === `sent-${item.id}`

              return (
                <Card 
                  key={item.id} 
                  className="border-2 border-black bg-white shadow-[4px_4px_0px_#111] rounded-none flex flex-col justify-between overflow-hidden relative group hover:shadow-[6px_6px_0px_#E60012] transition-all"
                >
                  {/* Header badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {item.category && (
                      <span className="text-[9px] font-mono font-black uppercase bg-black text-[#FFC700] border border-black px-2 py-0.5 -skew-x-6">
                        {item.category}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className="p-1 border border-black bg-white hover:bg-[#FFC700] transition-colors shadow-[1px_1px_0px_#111]"
                      title={isBookmarked ? "Hapus Bookmark" : "Simpan Kata"}
                    >
                      {isBookmarked ? (
                        <Star className="size-4 fill-[#FFC700] text-black" />
                      ) : (
                        <Bookmark className="size-4 text-black" />
                      )}
                    </button>
                  </div>

                  <CardHeader className="pb-3 pr-24 border-b-2 border-black/10">
                    {/* Part of Speech */}
                    <CardDescription className="text-[10px] font-mono font-black uppercase tracking-wider text-[#E60012]">
                      {item.pos || "Kata Benda"}
                    </CardDescription>

                    {/* Kanji Term & Reading */}
                    <div className="mt-1 space-y-0.5">
                      <CardTitle className="text-2xl font-black text-black tracking-tight flex items-baseline gap-2">
                        <span>{item.term}</span>
                        {item.reading && item.reading !== item.term && (
                          <span className="text-xs font-mono font-bold text-zinc-600">
                            ({item.reading})
                          </span>
                        )}
                      </CardTitle>

                      {item.romaji && (
                        <div className="text-xs font-mono font-bold text-zinc-700">
                          {item.romaji}
                        </div>
                      )}
                    </div>

                    {/* Pitch Accent Badge & Word TTS Button */}
                    <div className="flex flex-wrap items-center gap-2 pt-3">
                      <span className={`text-[10px] font-mono font-black border border-black px-2 py-0.5 -skew-x-6 flex items-center gap-1 shadow-[1px_1px_0px_#111] ${pitchStyle.bg}`}>
                        <Layers className="size-3" />
                        {pitchStyle.label}
                      </span>

                      <button
                        type="button"
                        onClick={() => playAudio(item.term, `word-${item.id}`)}
                        className={`h-7 px-2.5 text-[10px] font-mono font-black uppercase border border-black transition-colors flex items-center gap-1.5 shadow-[1px_1px_0px_#111] ${
                          isPlayingWord
                            ? "bg-[#E60012] text-white animate-pulse"
                            : "bg-[#FFC700] text-black hover:bg-black hover:text-[#FFC700]"
                        }`}
                        title="Dengarkan audio kata"
                      >
                        <Volume2 className="size-3.5" />
                        {isPlayingWord ? "Playing..." : "Audio"}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Meaning / Indonesian Definition */}
                    <div className="space-y-1">
                      <div className="text-xs font-black text-black">
                        {item.meaning}
                      </div>
                      {item.meaning_id && item.meaning_id !== item.meaning && (
                        <p className="text-[11px] font-semibold text-zinc-600 leading-relaxed">
                          {item.meaning_id}
                        </p>
                      )}
                    </div>

                    {/* Example Sentence Block */}
                    {item.example_ja && (
                      <div className="border-2 border-black bg-[#FAF9F5] p-3 space-y-2 mt-2 shadow-[2px_2px_0px_#111]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="text-xs font-bold text-black font-sans leading-relaxed">
                              例: {item.example_ja}
                            </div>
                            {item.example_id && (
                              <div className="text-[10px] text-zinc-700 italic font-semibold leading-normal">
                                Arti: {item.example_id}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => playAudio(item.example_ja!, `sent-${item.id}`)}
                            className={`p-1.5 border border-black shrink-0 transition-colors shadow-[1px_1px_0px_#111] ${
                              isPlayingSentence
                                ? "bg-[#E60012] text-white animate-pulse"
                                : "bg-white text-black hover:bg-[#FFC700]"
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
