"use client"

import React, { useState } from "react"
import { ArrowLeft, Swords, Trophy, RotateCcw, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type WordChainItem = {
  speaker: "player" | "bot"
  word: string
  reading: string
  meaning: string
}

const SHIRITORI_BOT_WORDS = [
  { word: "ラクダ", reading: "rakuda", meaning: "Unta", startChar: "ら" },
  { word: "大学", reading: "daigaku", meaning: "Universitas", startChar: "だ" },
  { word: "空港", reading: "kuukou", meaning: "Bandara", startChar: "く" },
  { word: "うどん", reading: "udon", meaning: "Udon (Mie)", startChar: "う" },
  { word: "新聞", reading: "shinbun", meaning: "Koran", startChar: "し" },
]

interface ShiritoriProps {
  onBack: () => void
  onFinishGame: (score: number, exp: number) => void
}

export function ShiritoriBattleGame({ onBack, onFinishGame }: ShiritoriProps) {
  const [chain, setChain] = useState<WordChainItem[]>([
    { speaker: "bot", word: "さくら", reading: "sakura", meaning: "Bunga Sakura" },
  ])
  const [inputWord, setInputWord] = useState("")
  const [inputMeaning, setInputMeaning] = useState("")
  const [score, setScore] = useState(10)
  const [turnCount, setTurnCount] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  const lastItem = chain[chain.length - 1]
  const lastChar = lastItem.reading.slice(-1).toLowerCase()

  function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const cleanInput = inputWord.trim()
    const cleanMeaning = inputMeaning.trim()

    if (!cleanInput) {
      setErrorMessage("Masukkan kata sambungan Bahasa Jepang / Romaji.")
      return
    }

    const firstChar = cleanInput.slice(0, 1).toLowerCase()
    if (firstChar !== lastChar && lastChar !== "a" && lastChar !== "u" && lastChar !== "i") {
      // Basic check
      // For friendly gameplay, allow matching first letter
    }

    // Add player word
    const playerItem: WordChainItem = {
      speaker: "player",
      word: cleanInput,
      reading: cleanInput.toLowerCase(),
      meaning: cleanMeaning || "Kata pilihan pemain",
    }

    const nextChain = [...chain, playerItem]
    const nextScore = score + 20
    const nextTurn = turnCount + 1

    setScore(nextScore)
    setTurnCount(nextTurn)
    setInputWord("")
    setInputMeaning("")

    if (nextTurn >= 6) {
      setChain(nextChain)
      endGame(nextScore)
      return
    }

    // Bot response after 600ms
    const botWord = SHIRITORI_BOT_WORDS[(nextTurn - 1) % SHIRITORI_BOT_WORDS.length]
    setTimeout(() => {
      setChain([...nextChain, { speaker: "bot", word: botWord.word, reading: botWord.reading, meaning: botWord.meaning }])
    }, 600)
  }

  function endGame(finalScore: number) {
    setIsDone(true)
    const expEarned = Math.min(300, Math.floor(finalScore * 2.5))
    onFinishGame(finalScore, expEarned)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[#6B6862] hover:text-[#1C1B1A] transition-colors"
        >
          <ArrowLeft className="size-4" /> Kembali ke Arcade
        </button>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-800 border border-rose-500/20 flex items-center gap-1">
          ⚔️ Game 5: Shiritori Word Battle (しりとり)
        </span>
      </div>

      {!isDone ? (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2B3A55]">Ronde {turnCount} / 5</span>
            <span className="text-xs font-bold text-emerald-600">Skor: {score}</span>
          </div>

          {/* CHAIN HISTORY CHAT */}
          <div className="bg-white border border-[#E4E1DA] p-4 rounded-xl space-y-2.5 max-h-64 overflow-y-auto no-scrollbar">
            {chain.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${item.speaker === "player" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[80%] text-xs space-y-0.5 ${
                    item.speaker === "player"
                      ? "bg-[#2B3A55] text-white rounded-br-none"
                      : "bg-[#FAF9F6] border border-[#E4E1DA] text-[#1C1B1A] rounded-bl-none"
                  }`}
                >
                  <div className="font-extrabold text-sm">{item.word}</div>
                  <div className="text-[10px] opacity-80">{item.reading} — {item.meaning}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 font-medium">
            💡 Sambung kata berikutnya berawalan huruf: <strong className="uppercase font-extrabold text-amber-900">{lastChar}</strong>
          </div>

          {errorMessage && (
            <div className="text-xs font-semibold text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePlayerSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="text"
                placeholder={`Kata berawalan '${lastChar}' (mis. Ringo)`}
                required
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                className="border-[#E4E1DA] bg-white text-xs h-10 rounded-xl"
              />
              <Input
                type="text"
                placeholder="Arti Kata (mis. Apel)"
                value={inputMeaning}
                onChange={(e) => setInputMeaning(e.target.value)}
                className="border-[#E4E1DA] bg-white text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="size-3.5" /> Kirim Kata &amp; Sambung Shiritori
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 text-center rounded-2xl space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Trophy className="size-7 text-rose-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1C1B1A]">Shiritori Battle Selesai!</h3>
            <p className="text-xs text-[#6B6862]">Hasil Performa Shiritori Word Battle</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#E4E1DA]">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Total Skor</span>
              <span className="text-lg font-black text-[#1C1B1A]">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Bonus EXP</span>
              <span className="text-lg font-black text-emerald-600">+{Math.min(300, Math.floor(score * 2.5))} EXP</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={onBack}
            className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl"
          >
            Kembali ke Arcade Menu
          </Button>
        </Card>
      )}
    </div>
  )
}
