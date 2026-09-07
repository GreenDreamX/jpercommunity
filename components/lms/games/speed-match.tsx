"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Timer, Zap, Trophy, RotateCcw, CheckCircle2, XCircle, Flame, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type KanjiWord = {
  kanji: string
  kana: string
  romaji: string
  meaning: string
}

const SAMPLE_WORDS: KanjiWord[] = [
  { kanji: "日本語", kana: "にほんご", romaji: "nihongo", meaning: "Bahasa Jepang" },
  { kanji: "学校", kana: "がっこう", romaji: "gakkou", meaning: "Sekolah" },
  { kanji: "先生", kana: "せんせい", romaji: "sensei", meaning: "Guru" },
  { kanji: "友達", kana: "ともだち", romaji: "tomodachi", meaning: "Teman" },
  { kanji: "勉強", kana: "べんきょう", romaji: "benkyou", meaning: "Belajar" },
  { kanji: "桜", kana: "さくら", romaji: "sakura", meaning: "Bunga Sakura" },
  { kanji: "花火", kana: "はなび", romaji: "hanabi", meaning: "Kembang Api" },
  { kanji: "時間", kana: "じかん", romaji: "jikan", meaning: "Waktu" },
  { kanji: "家族", kana: "かぞく", romaji: "kazoku", meaning: "Keluarga" },
  { kanji: "寿司", kana: "すし", romaji: "sushi", meaning: "Sushi" },
  { kanji: "富士山", kana: "ふじさん", romaji: "fujisan", meaning: "Gunung Fuji" },
  { kanji: "未来", kana: "みらい", romaji: "mirai", meaning: "Masa Depan" },
  { kanji: "心", kana: "こころ", romaji: "kokoro", meaning: "Hati" },
  { kanji: "夢", kana: "ゆめ", romaji: "yume", meaning: "Mimpi" },
  { kanji: "情熱", kana: "じょうねつ", romaji: "jounetsu", meaning: "Semangat / Antusiasme" },
]

interface SpeedMatchProps {
  onBack: () => void
  onFinishGame: (score: number, exp: number) => void
}

export function SpeedMatchGame({ onBack, onFinishGame }: SpeedMatchProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle")
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)

  const [currentWord, setCurrentWord] = useState<KanjiWord>(SAMPLE_WORDS[0])
  const [options, setOptions] = useState<string[]>([])
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)

  const nextQuestion = useCallback(() => {
    const randomWord = SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)]
    setCurrentWord(randomWord)

    // Generate 4 options
    const wrongOptions = SAMPLE_WORDS.filter((w) => w.meaning !== randomWord.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((w) => w.meaning)

    const allOptions = [...wrongOptions, randomWord.meaning].sort(() => 0.5 - Math.random())
    setOptions(allOptions)
  }, [])

  function startGame() {
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTimeLeft(60)
    setGameState("playing")
    nextQuestion()
  }

  useEffect(() => {
    if (gameState !== "playing") return
    if (timeLeft <= 0) {
      endGame()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  function endGame() {
    setGameState("finished")
    // Calculate EXP reward
    const expEarned = Math.min(300, Math.floor(score * 1.5 + combo * 5))
    onFinishGame(score, expEarned)
  }

  function handleSelectOption(opt: string) {
    if (gameState !== "playing") return

    if (opt === currentWord.meaning) {
      setFeedback("correct")
      const nextCombo = combo + 1
      setCombo(nextCombo)
      if (nextCombo > maxCombo) setMaxCombo(nextCombo)
      setScore((prev) => prev + 10 + nextCombo * 2)
    } else {
      setFeedback("wrong")
      setCombo(0)
    }

    setTimeout(() => {
      setFeedback(null)
      nextQuestion()
    }, 250)
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

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 flex items-center gap-1">
          ⏱️ Game 1: Kanji Speed Match (60s)
        </span>
      </div>

      {gameState === "idle" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-8 text-center rounded-2xl space-y-4">
          <div className="size-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Timer className="size-8 text-amber-600 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#1C1B1A]">Kanji Speed Match</h3>
            <p className="text-xs text-[#6B6862] max-w-sm mx-auto">
              Jawab arti kata Bahasa Jepang sebanyak mungkin dalam waktu 60 detik. Raih Combo tertinggi untuk Push Rank EXP!
            </p>
          </div>

          <Button
            type="button"
            onClick={startGame}
            className="h-10 px-6 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold rounded-xl shadow-md"
          >
            Mulai Game (60s) →
          </Button>
        </Card>
      )}

      {gameState === "playing" && (
        <div className="space-y-4">
          {/* HEADER STATS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#E4E1DA] p-3 rounded-xl flex items-center gap-2">
              <Timer className="size-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] text-[#6B6862] block">Waktu Sisa</span>
                <span className="text-lg font-black text-[#1C1B1A]">{timeLeft}s</span>
              </div>
            </div>

            <div className="bg-white border border-[#E4E1DA] p-3 rounded-xl flex items-center gap-2">
              <Trophy className="size-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-[#6B6862] block">Skor</span>
                <span className="text-lg font-black text-[#1C1B1A]">{score}</span>
              </div>
            </div>

            <div className="bg-white border border-[#E4E1DA] p-3 rounded-xl flex items-center gap-2">
              <Flame className="size-5 text-orange-600 shrink-0" />
              <div>
                <span className="text-[10px] text-[#6B6862] block">Combo Streak</span>
                <span className="text-lg font-black text-[#1C1B1A]">{combo}x</span>
              </div>
            </div>
          </div>

          {/* MAIN KANJI CARD */}
          <Card className={`border transition-all duration-200 bg-white p-8 text-center rounded-2xl shadow-sm ${
            feedback === "correct" ? "border-emerald-500 bg-emerald-50/50" : feedback === "wrong" ? "border-rose-500 bg-rose-50/50" : "border-[#E4E1DA]"
          }`}>
            <div className="text-4xl font-extrabold tracking-widest text-[#1C1B1A] mb-1">
              {currentWord.kanji}
            </div>
            <div className="text-xs font-semibold text-[#6B6862]">
              {currentWord.kana} ({currentWord.romaji})
            </div>
          </Card>

          {/* OPTIONS GRID */}
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, idx) => (
              <Button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="h-14 bg-white border border-[#E4E1DA] text-[#1C1B1A] hover:bg-[#FAF9F6] hover:border-[#2B3A55] rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {gameState === "finished" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 text-center rounded-2xl space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="size-7 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1C1B1A]">Sesi Selesai!</h3>
            <p className="text-xs text-[#6B6862]">Hasil Performa Kanji Speed Match</p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-[#E4E1DA]">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Total Skor</span>
              <span className="text-lg font-black text-[#1C1B1A]">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Max Combo</span>
              <span className="text-lg font-black text-amber-600">{maxCombo}x</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Bonus EXP</span>
              <span className="text-lg font-black text-emerald-600">+{Math.min(300, Math.floor(score * 1.5 + combo * 5))} EXP</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={startGame}
              className="flex-1 h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl"
            >
              <RotateCcw className="size-4 mr-1.5" /> Main Lagi
            </Button>
            <Button
              type="button"
              onClick={onBack}
              className="flex-1 h-10 border border-[#E4E1DA] bg-white text-[#1C1B1A] hover:bg-[#FAF9F6] text-xs font-bold rounded-xl"
            >
              Kembali ke Menu
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
