"use client"

import React, { useState } from "react"
import { ArrowLeft, Puzzle, Trophy, CheckCircle2, RotateCcw, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type PuzzleStage = {
  id: number
  parts: string[]
  solution: string
  reading: string
  meaning: string
  hint: string
}

const PUZZLE_STAGES: PuzzleStage[] = [
  { id: 1, parts: ["日", "月"], solution: "明", reading: "あかるい (akarui)", meaning: "Terang / Jelas", hint: "Matahari + Bulan" },
  { id: 2, parts: ["木", "木"], solution: "林", reading: "はやし (hayashi)", meaning: "Hutan Kecil", hint: "Dua Pohon Bersama" },
  { id: 3, parts: ["女", "子"], solution: "好", reading: "すき (suki)", meaning: "Suka / Favorit", hint: "Wanita + Anak" },
  { id: 4, parts: ["言", "成"], solution: "誠", reading: "まこと (makoto)", meaning: "Ketulusan / Kejujuran", hint: "Kata-kata + Mewujudkan" },
  { id: 5, parts: ["田", "力"], solution: "男", reading: "おとこ (otoko)", meaning: "Laki-laki", hint: "Kekuatan di Sawah" },
]

interface KanjiPuzzleProps {
  onBack: () => void
  onFinishGame: (score: number, exp: number) => void
}

export function KanjiPuzzleGame({ onBack, onFinishGame }: KanjiPuzzleProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const currentStage = PUZZLE_STAGES[currentIdx]

  function handleSelectPart(part: string) {
    if (selectedParts.includes(part)) {
      setSelectedParts((prev) => prev.filter((p) => p !== part))
    } else {
      setSelectedParts((prev) => [...prev, part])
    }
  }

  function handleCheckSolution() {
    // Sort parts to compare
    const currentSorted = [...selectedParts].sort().join("")
    const solutionSorted = [...currentStage.parts].sort().join("")

    if (currentSorted === solutionSorted) {
      setFeedback("Benar! Kanji terbentuk sempurna ✨")
      setScore((prev) => prev + 50)

      setTimeout(() => {
        setFeedback(null)
        setSelectedParts([])
        if (currentIdx + 1 < PUZZLE_STAGES.length) {
          setCurrentIdx((prev) => prev + 1)
        } else {
          endGame()
        }
      }, 1000)
    } else {
      setFeedback("Belum tepat. Coba perhatikan kombinasi radikal kembali!")
    }
  }

  function endGame() {
    setIsDone(true)
    const expEarned = Math.min(250, Math.floor(score * 2.5))
    onFinishGame(score, expEarned)
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

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-800 border border-purple-500/20 flex items-center gap-1">
          🧩 Game 3: Kanji Radical Puzzle
        </span>
      </div>

      {!isDone ? (
        <div className="space-y-4">
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B3A55]">Puzzle Stage {currentIdx + 1} / {PUZZLE_STAGES.length}</span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><Star className="size-3.5 fill-amber-400" /> {score} Poin</span>
            </div>

            <div className="bg-white border border-[#E4E1DA] p-6 rounded-xl text-center space-y-2">
              <div className="text-xs font-semibold text-[#6B6862]">Target Arti Kanji</div>
              <div className="text-xl font-bold text-[#1C1B1A]">{currentStage.meaning}</div>
              <div className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-full w-fit mx-auto border border-purple-200 font-medium">
                Petunjuk: {currentStage.hint}
              </div>
            </div>

            {/* SELECTION AREA */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1C1B1A]">Pilih Radikal Penyusun:</div>
              <div className="flex flex-wrap gap-3 justify-center bg-white p-4 rounded-xl border border-[#E4E1DA]">
                {currentStage.parts.concat(["水", "火", "土", "心"]).sort().map((part, idx) => {
                  const isSelected = selectedParts.includes(part)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPart(part)}
                      className={`size-14 rounded-xl border text-xl font-black transition-all flex items-center justify-center ${
                        isSelected
                          ? "bg-[#2B3A55] text-white border-[#2B3A55] shadow-md scale-105"
                          : "bg-[#FAF9F6] border-[#E4E1DA] text-[#1C1B1A] hover:bg-[#E4E1DA]/40"
                      }`}
                    >
                      {part}
                    </button>
                  )
                })}
              </div>
            </div>

            {feedback && (
              <div className={`text-xs font-semibold p-3 rounded-xl text-center ${
                feedback.includes("Benar") ? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20" : "bg-rose-500/10 text-rose-800 border border-rose-500/20"
              }`}>
                {feedback}
              </div>
            )}

            <Button
              type="button"
              disabled={selectedParts.length === 0}
              onClick={handleCheckSolution}
              className="w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold rounded-xl shadow-sm"
            >
              Gabungkan &amp; Cek Kanji →
            </Button>
          </Card>
        </div>
      ) : (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 text-center rounded-2xl space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Trophy className="size-7 text-purple-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1C1B1A]">Teka-teki Selesai!</h3>
            <p className="text-xs text-[#6B6862]">Hasil Performa Kanji Radical Puzzle</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#E4E1DA]">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Total Skor</span>
              <span className="text-lg font-black text-[#1C1B1A]">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Bonus EXP</span>
              <span className="text-lg font-black text-emerald-600">+{Math.min(250, Math.floor(score * 2.5))} EXP</span>
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
