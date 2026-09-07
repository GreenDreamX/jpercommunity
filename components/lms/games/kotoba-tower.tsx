"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ArrowLeft, ShieldAlert, Trophy, RotateCcw, Zap, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type FallingBlock = {
  id: number
  word: string
  reading: string
  answer: string
  options: string[]
}

const TOWER_VOCAB = [
  { word: "水", reading: "みず (mizu)", answer: "Air" },
  { word: "火", reading: "ひ (hi)", answer: "Api" },
  { word: "木", reading: "き (ki)", answer: "Pohon" },
  { word: "山", reading: "やま (yama)", answer: "Gunung" },
  { word: "川", reading: "かわ (kawa)", answer: "Sungai" },
  { word: "空", reading: "そら (sora)", answer: "Langit" },
  { word: "海", reading: "うみ (umi)", answer: "Laut" },
  { word: "雨", reading: "あめ (ame)", answer: "Hujan" },
  { word: "月", reading: "つき (tsuki)", answer: "Bulan" },
  { word: "日", reading: "ひ (hi)", answer: "Matahari / Hari" },
]

interface KotobaTowerProps {
  onBack: () => void
  onFinishGame: (score: number, exp: number) => void
}

export function KotobaTowerGame({ onBack, onFinishGame }: KotobaTowerProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle")
  const [wave, setWave] = useState(1)
  const [score, setScore] = useState(0)
  const [blockPos, setBlockPos] = useState(0) // 0 to 100%
  const [currentBlock, setCurrentBlock] = useState<FallingBlock | null>(null)

  const generateNextBlock = useCallback((currentWave: number) => {
    const target = TOWER_VOCAB[Math.floor(Math.random() * TOWER_VOCAB.length)]
    const wrongAnswers = TOWER_VOCAB.filter((v) => v.answer !== target.answer)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((v) => v.answer)

    const options = [...wrongAnswers, target.answer].sort(() => 0.5 - Math.random())

    setCurrentBlock({
      id: Date.now(),
      word: target.word,
      reading: target.reading,
      answer: target.answer,
      options,
    })
    setBlockPos(0)
  }, [])

  function startGame() {
    setScore(0)
    setWave(1)
    setGameState("playing")
    generateNextBlock(1)
  }

  useEffect(() => {
    if (gameState !== "playing" || !currentBlock) return

    const speed = Math.max(150, 400 - wave * 25) // Gets faster per wave
    const interval = setInterval(() => {
      setBlockPos((prev) => {
        if (prev >= 90) {
          // Block reached bottom -> Game Over
          endGame()
          return 90
        }
        return prev + 5
      })
    }, speed)

    return () => clearInterval(interval)
  }, [gameState, currentBlock, wave])

  function endGame() {
    setGameState("finished")
    const expEarned = Math.min(300, Math.floor(score * 1.8 + wave * 10))
    onFinishGame(score, expEarned)
  }

  function handleSelectOption(opt: string) {
    if (gameState !== "playing" || !currentBlock) return

    if (opt === currentBlock.answer) {
      setScore((prev) => prev + 15 + wave * 5)
      const nextWave = wave + 1
      setWave(nextWave)
      generateNextBlock(nextWave)
    } else {
      // Wrong answer speeds up block drop
      setBlockPos((prev) => Math.min(90, prev + 25))
    }
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

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-800 border border-blue-500/20 flex items-center gap-1">
          🧱 Game 2: Kotoba Tower Fall
        </span>
      </div>

      {gameState === "idle" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-8 text-center rounded-2xl space-y-4">
          <div className="size-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Layers className="size-8 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#1C1B1A]">Kotoba Tower Fall</h3>
            <p className="text-xs text-[#6B6862] max-w-sm mx-auto">
              Balok kata jatuh dari atas! Hancurkan balok dengan memilih arti Bahasa Indonesia yang benar sebelum menyentuh dasar tower.
            </p>
          </div>

          <Button
            type="button"
            onClick={startGame}
            className="h-10 px-6 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl shadow-md"
          >
            Mulai Pertahanan Tower →
          </Button>
        </Card>
      )}

      {gameState === "playing" && currentBlock && (
        <div className="space-y-4">
          {/* HUD HEADER */}
          <div className="flex items-center justify-between bg-white border border-[#E4E1DA] p-3 rounded-xl">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Gelombang Wave</span>
              <span className="text-base font-black text-[#1C1B1A]">Wave #{wave}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Total Skor</span>
              <span className="text-base font-black text-emerald-600">{score}</span>
            </div>
          </div>

          {/* FALLING TOWER ARENA */}
          <div className="relative h-64 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between p-4">
            {/* FALLING BLOCK */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-[#B23A2E] text-white font-extrabold px-6 py-3 rounded-xl shadow-lg border border-rose-400 transition-all duration-150 flex flex-col items-center"
              style={{ top: `${blockPos}%` }}
            >
              <span className="text-2xl">{currentBlock.word}</span>
              <span className="text-[10px] font-normal text-rose-200">{currentBlock.reading}</span>
            </div>

            {/* DANGER BOTTOM BORDER */}
            <div className="absolute bottom-0 inset-x-0 h-2 bg-rose-500/80 animate-pulse" />
          </div>

          {/* OPTIONS BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5">
            {currentBlock.options.map((opt, idx) => (
              <Button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="h-12 bg-white border border-[#E4E1DA] text-[#1C1B1A] hover:bg-[#FAF9F6] hover:border-[#2B3A55] rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {gameState === "finished" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 text-center rounded-2xl space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Trophy className="size-7 text-blue-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1C1B1A]">Tower Runtuh!</h3>
            <p className="text-xs text-[#6B6862]">Hasil Performa Kotoba Tower Fall</p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-[#E4E1DA]">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Wave Berhasil</span>
              <span className="text-lg font-black text-[#1C1B1A]">#{wave}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Skor Final</span>
              <span className="text-lg font-black text-blue-600">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Bonus EXP</span>
              <span className="text-lg font-black text-emerald-600">+{Math.min(300, Math.floor(score * 1.8 + wave * 10))} EXP</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={startGame}
              className="flex-1 h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl"
            >
              <RotateCcw className="size-4 mr-1.5" /> Bertahan Lagi
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
