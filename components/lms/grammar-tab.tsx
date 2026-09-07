"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Volume2, Bookmark, Star, Sparkles, RefreshCw, Layers, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type GrammarItem = {
  id: string
  title: string
  romaji: string | null
  meaning: string
  meaning_id: string | null
  explanation: string | null
  jlpt_level: string | null
  structure: string | null
  example_ja: string | null
  example_id: string | null
  pitch: string | null
  category: string | null
}

interface GrammarTabProps {
  firebaseToken: string
}

export function GrammarTab({ firebaseToken }: GrammarTabProps) {
  const [items, setItems] = useState<GrammarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)

  // Load saved bookmarks from local storage
  useEffect(() => {
    const saved = localStorage.getItem("jper_grammar_bookmarks")
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
    localStorage.setItem("jper_grammar_bookmarks", JSON.stringify(updated))
  }

  // Fetch grammar data from DB
  const fetchGrammar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/lms/grammar"
      const params = new URLSearchParams()
      if (activeLevel !== "all" && activeLevel !== "saved") {
        params.append("level", activeLevel)
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
        throw new Error("Gagal memuat data tata bahasa dari database.")
      }

      const data = await res.json()
      setItems(data.items ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.")
    } finally {
      setLoading(false)
    }
  }, [firebaseToken, activeLevel, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchGrammar()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchGrammar])

  // TTS Pronunciation using SpeechSynthesis API
  const playAudio = (text: string, id: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      window.dispatchEvent(new CustomEvent("jper-quest-action", { detail: { action: "grammar_learned", count: 1 } }))

      const cleanedText = text.replace(/～/g, "").replace(/\.\.\./g, "").trim()
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
  const displayedItems = activeLevel === "saved"
    ? items.filter((item) => bookmarks.includes(item.id))
    : items

  const levelTabs = [
    { id: "all", label: "Semua Tata Bahasa" },
    { id: "N5", label: "JLPT N5" },
    { id: "N4", label: "JLPT N4" },
    { id: "N3", label: "JLPT N3" },
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
            <Bookmark className="size-5 text-[#B23A2E]" />
            Tata Bahasa / Bunpou JPER
          </h2>
          <p className="text-xs text-[#6B6862]">Kumpulan pola kalimat & tata bahasa Jepang dasar-menengah dengan rumus, intonasi pitch, audio TTS, & contoh kalimat.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#B23A2E]/5 border border-[#B23A2E]/15 px-3 py-1.5 rounded-lg text-[#B23A2E] text-xs font-semibold shrink-0">
          <Sparkles className="size-3.5 animate-pulse text-amber-500" />
          <span>TTS Pola & Kalimat + Pitch</span>
        </div>
      </div>

      {/* Control Panel: JLPT Level Filters & Search */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E4E1DA] pb-3">
          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {levelTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLevel(tab.id)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeLevel === tab.id
                    ? "bg-[#B23A2E] text-white shadow-sm"
                    : "text-[#6B6862] hover:bg-[#E4E1DA]/40"
                }`}
              >
                {tab.id === "saved" && <Star className={`size-3.5 ${activeLevel === "saved" ? "fill-amber-400 text-amber-400" : ""}`} />}
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
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari pola tata bahasa / romaji / arti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg focus-visible:ring-[#B23A2E]"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs font-mono text-[#6B6862] gap-2">
            <RefreshCw className="size-4 animate-spin text-[#B23A2E]" />
            Memuat data tata bahasa...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-4 text-xs text-[#B23A2E]">
            {error}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#6B6862] italic space-y-1">
            <div>Tidak ada tata bahasa yang ditemukan.</div>
            <div className="text-[11px] text-[#6B6862]/80">Coba ubah filter level JLPT atau kata kunci pencarian Anda.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {displayedItems.map((item) => {
              const isBookmarked = bookmarks.includes(item.id)
              const pitchStyle = getPitchStyle(item.pitch)
              const isPlayingPattern = playingId === `pattern-${item.id}`
              const isPlayingSentence = playingId === `sent-${item.id}`

              return (
                <Card 
                  key={item.id} 
                  className="border border-[#E4E1DA] bg-[#FAF9F6]/60 shadow-none rounded-lg hover:border-[#B23A2E]/30 transition-all flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Header badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {/* JLPT Level pill */}
                    {item.jlpt_level && (
                      <span className="text-[9px] font-mono font-bold bg-[#B23A2E]/10 text-[#B23A2E] border border-[#B23A2E]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="size-2.5" />
                        {item.jlpt_level}
                      </span>
                    )}

                    {/* Bookmark button */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className="text-[#6B6862] hover:text-amber-500 transition-colors p-1"
                      title={isBookmarked ? "Hapus Bookmark" : "Simpan Pola"}
                    >
                      {isBookmarked ? (
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <Bookmark className="size-4" />
                      )}
                    </button>
                  </div>

                  <CardHeader className="pb-2 pr-28">
                    {/* Category */}
                    <CardDescription className="text-[9px] font-mono uppercase tracking-wider text-[#6B6862]">
                      {item.category || "Pola Kalimat Dasar"}
                    </CardDescription>

                    {/* Pattern Title & Romaji */}
                    <div className="mt-1 space-y-0.5">
                      <CardTitle className="text-xl font-bold text-[#1C1B1A] tracking-tight flex items-baseline gap-2">
                        <span className="font-sans text-[#B23A2E]">{item.title}</span>
                      </CardTitle>

                      {item.romaji && (
                        <div className="text-[11px] font-mono text-[#6B6862] font-normal">
                          ({item.romaji})
                        </div>
                      )}
                    </div>

                    {/* Structure / Formula Box */}
                    {item.structure && (
                      <div className="mt-2.5 rounded-md border border-[#E4E1DA] bg-[#E4E1DA]/20 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-[#1C1B1A]">
                        Rumus: <span className="text-[#2B3A55]">{item.structure}</span>
                      </div>
                    )}

                    {/* Pitch Accent & Pattern TTS Button */}
                    <div className="flex flex-wrap items-center gap-2 pt-2.5">
                      {/* Pitch Accent badge */}
                      <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded-md flex items-center gap-1 ${pitchStyle.bg}`}>
                        <Layers className="size-3" />
                        {pitchStyle.label}
                      </span>

                      {/* Pattern TTS button */}
                      <button
                        type="button"
                        onClick={() => playAudio(item.title, `pattern-${item.id}`)}
                        className={`h-6 px-2 text-[10px] font-semibold rounded-md border transition-colors flex items-center gap-1 ${
                          isPlayingPattern
                            ? "bg-[#B23A2E] text-white border-[#B23A2E] animate-pulse"
                            : "bg-[#FAF9F6] border-[#E4E1DA] hover:border-[#B23A2E]/40 text-[#B23A2E]"
                        }`}
                        title="Dengarkan pelafalan pola"
                      >
                        <Volume2 className="size-3" />
                        {isPlayingPattern ? "Memutar..." : "Audio Pola"}
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 pb-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Meaning & Detailed Explanation */}
                    <div className="space-y-1.5 border-t border-[#E4E1DA]/60 pt-2.5">
                      <div className="text-xs font-bold text-[#1C1B1A]">
                        {item.meaning}
                      </div>
                      {item.explanation && (
                        <p className="text-[11px] text-[#6B6862] leading-relaxed">
                          {item.explanation}
                        </p>
                      )}
                    </div>

                    {/* Example Sentence Block */}
                    {item.example_ja && (
                      <div className="rounded-lg border border-[#B23A2E]/15 bg-[#B23A2E]/5 p-3 space-y-2 mt-2">
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
                                : "bg-[#FAF9F6] border-[#E4E1DA] hover:bg-[#B23A2E]/10 text-[#B23A2E]"
                            }`}
                            title="Dengarkan pelafalan contoh kalimat"
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
