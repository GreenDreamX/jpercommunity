"use client"

import React, { useState } from "react"
import { ArrowLeft, Volume2, Trophy, RotateCcw, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type ListeningWord = {
  text: string
  romaji: string
  meaning: string
  options: string[]
}

const LISTENING_VOCAB: ListeningWord[] = [
  { text: "おはようございます", romaji: "Ohayou gozaimasu", meaning: "Selamat pagi", options: ["Selamat pagi", "Selamat malam", "Terima kasih", "Sampai jumpa"] },
  { text: "ありがとうございます", romaji: "Arigatou gozaimasu", meaning: "Terima kasih banyak", options: ["Terima kasih banyak", "Sama-sama", "Maafkan saya", "Selamat datang"] },
  { text: "いただきます", romaji: "Itadakimasu", meaning: "Selamat makan", options: ["Selamat makan", "Selamat tidur", "Sampai jumpa besok", "Permisi"] },
  { text: "さようなら", romaji: "Sayounara", meaning: "Selamat tinggal / Dibatasi", options: ["Selamat tinggal", "Selamat datang", "Hati-hati", "Semoga sukses"] },
  { text: "すみません", romaji: "Sumimasen", meaning: "Permisi / Maaf", options: ["Permisi / Maaf", "Silakan", "Baiklah", "Tentu saja"] },
]

interface ListeningRushProps {
  onBack: () => void
  onFinishGame: (score: number, exp: number) => void
}

export function ListeningRushGame({ onBack, onFinishGame }: ListeningRushProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const currentQuestion = LISTENING_VOCAB[currentIdx]

  function playSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Fitur audio tidak didukung di browser ini. Menampilkan teks pelafalan.")
      return
    }

    setIsPlayingAudio(true)
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(currentQuestion.text)
    utterance.lang = "ja-JP"
    utterance.rate = 0.9
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)
    window.speechSynthesis.speak(utterance)
  }

  function handleSelectOption(opt: string) {
    if (opt === currentQuestion.meaning) {
      setFeedback("Benar! Pendengaran Anda sangat tepat 🎧")
      setScore((prev) => prev + 40)
    } else {
      setFeedback(`Kurang tepat. Jawaban benar: ${currentQuestion.meaning}`)
    }

    setTimeout(() => {
      setFeedback(null)
      if (currentIdx + 1 < LISTENING_VOCAB.length) {
        setCurrentIdx((prev) => prev + 1)
      } else {
        endGame()
      }
    }, 1200)
  }

  function endGame() {
    setIsDone(true)
    const expEarned = Math.min(250, Math.floor(score * 2.2))
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

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 flex items-center gap-1">
          🎧 Game 4: Listening Rush (聴解)
        </span>
      </div>

      {!isDone ? (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 rounded-2xl space-y-4 text-center">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2B3A55]">Soal {currentIdx + 1} / {LISTENING_VOCAB.length}</span>
            <span className="text-xs font-bold text-emerald-600">Skor: {score}</span>
          </div>

          <div className="bg-white border border-[#E4E1DA] p-8 rounded-2xl space-y-4 shadow-xs">
            <Button
              type="button"
              onClick={playSpeech}
              className="size-20 mx-auto rounded-2xl bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <Volume2 className={`size-10 ${isPlayingAudio ? "animate-ping" : ""}`} />
            </Button>
            <p className="text-xs font-semibold text-[#6B6862]">
              Klik tombol di atas untuk mendengarkan pengucapan audio Bahasa Jepang
            </p>
            <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full w-fit mx-auto border border-amber-200 font-mono">
              [Romaji Hint: {currentQuestion.romaji}]
            </div>
          </div>

          {feedback && (
            <div className="text-xs font-semibold p-3 rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {currentQuestion.options.map((opt, idx) => (
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
        </Card>
      ) : (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] p-6 text-center rounded-2xl space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="size-7 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1C1B1A]">Sesi Pendengaran Selesai!</h3>
            <p className="text-xs text-[#6B6862]">Hasil Performa Listening Rush</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#E4E1DA]">
            <div>
              <span className="text-[10px] text-[#6B6862] block">Total Skor</span>
              <span className="text-lg font-black text-[#1C1B1A]">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B6862] block">Bonus EXP</span>
              <span className="text-lg font-black text-emerald-600">+{Math.min(250, Math.floor(score * 2.2))} EXP</span>
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
