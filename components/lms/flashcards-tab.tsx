"use client"

import React, { useState, useEffect } from "react"
import { Check, X, RotateCcw, Volume2, HelpCircle, BookOpen, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type KanaItem = {
  kana: string
  romaji: string
  word: string
  type: string
}

const HIRAGANA_DATA: KanaItem[] = [
  { kana: "あ", romaji: "a", word: "朝 (asa - pagi)", type: "vokal" },
  { kana: "い", romaji: "i", word: "犬 (inu - anjing)", type: "vokal" },
  { kana: "う", romaji: "u", word: "海 (umi - laut)", type: "vokal" },
  { kana: "え", romaji: "e", word: "駅 (eki - stasiun)", type: "vokal" },
  { kana: "お", romaji: "o", word: "お茶 (ocha - teh)", type: "vokal" },
  { kana: "か", romaji: "ka", word: "傘 (kasa - payung)", type: "k-group" },
  { kana: "き", romaji: "ki", word: "木 (ki - pohon)", type: "k-group" },
  { kana: "く", romaji: "ku", word: "車 (kuruma - mobil)", type: "k-group" },
  { kana: "け", romaji: "ke", word: "携帯 (keitai - HP)", type: "k-group" },
  { kana: "こ", romaji: "ko", word: "声 (koe - suara)", type: "k-group" },
  { kana: "さ", romaji: "sa", word: "魚 (sakana - ikan)", type: "s-group" },
  { kana: "し", romaji: "shi", word: "塩 (shio - garam)", type: "s-group" },
  { kana: "す", romaji: "su", word: "寿司 (sushi - sushi)", type: "s-group" },
  { kana: "せ", romaji: "se", word: "先生 (sensei - guru)", type: "s-group" },
  { kana: "そ", romaji: "so", word: "空 (sora - langit)", type: "s-group" },
  { kana: "た", romaji: "ta", word: "卵 (tamago - telur)", type: "t-group" },
  { kana: "ち", romaji: "chi", word: "地図 (chizu - peta)", type: "t-group" },
  { kana: "つ", romaji: "tsu", word: "机 (tsukue - meja)", type: "t-group" },
  { kana: "て", romaji: "te", word: "手 (te - tangan)", type: "t-group" },
  { kana: "と", romaji: "to", word: "友達 (tomodachi - teman)", type: "t-group" },
  { kana: "な", romaji: "na", word: "夏 (natsu - musim panas)", type: "n-group" },
  { kana: "に", romaji: "ni", word: "肉 (niku - daging)", type: "n-group" },
  { kana: "ぬ", romaji: "nu", word: "ぬいぐるみ (nuigurumi - boneka)", type: "n-group" },
  { kana: "ね", romaji: "ne", word: "猫 (neko - kucing)", type: "n-group" },
  { kana: "の", romaji: "no", word: "飲み物 (nomimono - minuman)", type: "n-group" },
  { kana: "は", romaji: "ha", word: "花 (hana - bunga)", type: "h-group" },
  { kana: "ひ", romaji: "hi", word: "光 (hikari - cahaya)", type: "h-group" },
  { kana: "ふ", romaji: "fu", word: "船 (fune - kapal)", type: "h-group" },
  { kana: "へ", romaji: "he", word: "部屋 (heya - kamar)", type: "h-group" },
  { kana: "ほ", romaji: "ho", word: "星 (hoshi - bintang)", type: "h-group" },
  { kana: "ま", romaji: "ma", word: "窓 (mado - jendela)", type: "m-group" },
  { kana: "み", romaji: "mi", word: "水 (mizu - air)", type: "m-group" },
  { kana: "む", romaji: "mu", word: "虫 (mushi - serangga)", type: "m-group" },
  { kana: "め", romaji: "me", word: "眼鏡 (megane - kacamata)", type: "m-group" },
  { kana: "も", romaji: "mo", word: "森 (mori - hutan)", type: "m-group" },
  { kana: "や", romaji: "ya", word: "山 (yama - gunung)", type: "y-group" },
  { kana: "ゆ", romaji: "yu", word: "雪 (yuki - salju)", type: "y-group" },
  { kana: "よ", romaji: "yo", word: "夜 (yoru - malam)", type: "y-group" },
  { kana: "ら", romaji: "ra", word: "桜 (sakura - ceri)", type: "r-group" },
  { kana: "り", romaji: "ri", word: "林檎 (ringo - apel)", type: "r-group" },
  { kana: "る", romaji: "ru", word: "留守 (rusu - tidak di rumah)", type: "r-group" },
  { kana: "れ", romaji: "re", word: "冷蔵庫 (reizouko - kulkas)", type: "r-group" },
  { kana: "ろ", romaji: "ro", word: "蝋燭 (rousoku - lilin)", type: "r-group" },
  { kana: "わ", romaji: "wa", word: "私 (watashi - saya)", type: "w-group" },
  { kana: "を", romaji: "wo", word: "本を飲む (hon wo yomu - membaca buku)", type: "w-group" },
  { kana: "ん", romaji: "n", word: "新聞 (shinbun - koran)", type: "n" },
]

const KATAKANA_DATA: KanaItem[] = [
  { kana: "ア", romaji: "a", word: "アメリカ (Amerika)", type: "vokal" },
  { kana: "イ", romaji: "i", word: "イギリス (Inggris)", type: "vokal" },
  { kana: "ウ", romaji: "u", word: "ウクライナ (Ukraina)", type: "vokal" },
  { kana: "エ", romaji: "e", word: "エアコン (AC)", type: "vokal" },
  { kana: "オ", romaji: "o", word: "オレンジ (Jeruk)", type: "vokal" },
  { kana: "カ", romaji: "ka", word: "カメラ (Kamera)", type: "k-group" },
  { kana: "キ", romaji: "ki", word: "ギター (Gitar)", type: "k-group" },
  { kana: "ク", romaji: "ku", word: "クラス (Kelas)", type: "k-group" },
  { kana: "ケ", romaji: "ke", word: "ケーキ (Kue)", type: "k-group" },
  { kana: "コ", romaji: "ko", word: "コーヒー (Kopi)", type: "k-group" },
  { kana: "サ", romaji: "sa", word: "サラダ (Salad)", type: "s-group" },
  { kana: "シ", romaji: "shi", word: "シャツ (Kemeja)", type: "s-group" },
  { kana: "ス", romaji: "su", word: "スポーツ (Olahraga)", type: "s-group" },
  { kana: "セ", romaji: "se", word: "セーター (Sweater)", type: "s-group" },
  { kana: "ソ", romaji: "so", word: "ソファ (Sofa)", type: "s-group" },
  { kana: "タ", romaji: "ta", word: "タクシー (Taksi)", type: "t-group" },
  { kana: "チ", romaji: "chi", word: "チーム (Tim)", type: "t-group" },
  { kana: "ツ", romaji: "tsu", word: "ツアー (Tur)", type: "t-group" },
  { kana: "テ", romaji: "te", word: "テスト (Ujian)", type: "t-group" },
  { kana: "ト", romaji: "to", word: "トイレ (Toilet)", type: "t-group" },
  { kana: "ナ", romaji: "na", word: "ナイフ (Pisau)", type: "n-group" },
  { kana: "ニ", romaji: "ni", word: "ニュース (Berita)", type: "n-group" },
  { kana: "ヌ", romaji: "nu", word: "ヌードル (Mie)", type: "n-group" },
  { kana: "ネ", romaji: "ne", word: "ネクタイ (Dasi)", type: "n-group" },
  { kana: "ノ", romaji: "no", word: "ノート (Buku Catatan)", type: "n-group" },
  { kana: "ハ", romaji: "ha", word: "ハンバーグ (Hamburg)", type: "h-group" },
  { kana: "ヒ", romaji: "hi", word: "ヒーター (Pemanas)", type: "h-group" },
  { kana: "フ", romaji: "fu", word: "フィルム (Film)", type: "h-group" },
  { kana: "ヘ", romaji: "he", word: "ヘリコプター (Helikopter)", type: "h-group" },
  { kana: "ホ", romaji: "ho", word: "ホテル (Hotel)", type: "h-group" },
  { kana: "マ", romaji: "ma", word: "マフラー (Syal)", type: "m-group" },
  { kana: "ミ", romaji: "mi", word: "ミルク (Susu)", type: "m-group" },
  { kana: "ム", romaji: "mu", word: "ムービー (Film)", type: "m-group" },
  { kana: "メ", romaji: "me", word: "メール (Email)", type: "m-group" },
  { kana: "モ", romaji: "mo", word: "モニター (Monitor)", type: "m-group" },
  { kana: "ヤ", romaji: "ya", word: "ヤッケ (Jaket)", type: "y-group" },
  { kana: "ユ", romaji: "yu", word: "ユニフォーム (Seragam)", type: "y-group" },
  { kana: "ヨ", romaji: "yo", word: "ヨーグルト (Yogurt)", type: "y-group" },
  { kana: "ラ", romaji: "ra", word: "ラジオ (Radio)", type: "r-group" },
  { kana: "リ", romaji: "ri", word: "リボン (Pita)", type: "r-group" },
  { kana: "ル", romaji: "ru", word: "ルール (Aturan)", type: "r-group" },
  { kana: "レ", romaji: "re", word: "レポート (Laporan)", type: "r-group" },
  { kana: "ロ", romaji: "ro", word: "ロボット (Robot)", type: "r-group" },
  { kana: "ワ", romaji: "wa", word: "ワイン (Anggur)", type: "w-group" },
  { kana: "ヲ", romaji: "wo", word: "ヲタ芸 (Wotagei)", type: "w-group" },
  { kana: "ン", romaji: "n", word: "パン (Roti)", type: "n" },
]

import { awardStudentXp } from "@/lib/lms/award-xp"

interface FlashcardsTabProps {
  token?: string
}

export function FlashcardsTab({ token }: FlashcardsTabProps) {
  const [kanaType, setKanaType] = useState<"hiragana" | "katakana">("hiragana")
  const [mode, setMode] = useState<"study" | "quiz">("study")
  const [xpToast, setXpToast] = useState<string | null>(null)
  
  // Study Mode States
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const activeList = kanaType === "hiragana" ? HIRAGANA_DATA : KATAKANA_DATA

  // Quiz Mode States
  const [quizQuestions, setQuizQuestions] = useState<Array<{ questionItem: KanaItem; options: string[] }>>([])
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [isQuizFinished, setIsQuizFinished] = useState(false)

  // Web Speech API for pronunciation
  const speakKana = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "ja-JP"
      utterance.rate = 0.6 // Slower rate for clear pronunciation
      utterance.pitch = 1.0
      const voices = window.speechSynthesis.getVoices()
      const jaVoice = voices.find((v) => v.lang.toLowerCase().includes("ja") || v.lang.toLowerCase().includes("jp"))
      if (jaVoice) {
        utterance.voice = jaVoice
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  // Shuffle Helper
  const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  // Generate Quiz Questions
  const generateQuiz = () => {
    const list = kanaType === "hiragana" ? HIRAGANA_DATA : KATAKANA_DATA
    const selectedList = shuffleArray(list).slice(0, 10) // 10 questions
    
    const questions = selectedList.map((item) => {
      // Find 3 incorrect random romaji
      const otherRomaji = list
        .filter((k) => k.romaji !== item.romaji)
        .map((k) => k.romaji)
      const uniqueOthers = Array.from(new Set(otherRomaji))
      const wrongOptions = shuffleArray(uniqueOthers).slice(0, 3)
      const options = shuffleArray([item.romaji, ...wrongOptions])

      return {
        questionItem: item,
        options,
      }
    })

    setQuizQuestions(questions)
    setQuizCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswerChecked(false)
    setQuizScore(0)
    setIsQuizFinished(false)
  }

  useEffect(() => {
    if (mode === "quiz") {
      generateQuiz()
    } else {
      setIsFlipped(false)
      setCurrentIndex(0)
    }
  }, [mode, kanaType])

  const handleNextStudy = () => {
    setIsFlipped(false)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jper-quest-action", { detail: { action: "flashcard_studied", count: 1 } }))
    }
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeList.length)
    }, 150)
  }

  const handlePrevStudy = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length)
    }, 150)
  }

  const handleShuffleStudy = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex(Math.floor(Math.random() * activeList.length))
    }, 150)
  }

  // Quiz submission
  const handleCheckAnswer = () => {
    if (!selectedAnswer) return
    const currentQ = quizQuestions[quizCurrentIndex]
    const isCorrect = selectedAnswer === currentQ.questionItem.romaji
    if (isCorrect) {
      setQuizScore((prev) => prev + 1)
    }
    setIsAnswerChecked(true)
  }

  const handleNextQuestion = async () => {
    if (quizCurrentIndex + 1 < quizQuestions.length) {
      setQuizCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsAnswerChecked(false)
    } else {
      setIsQuizFinished(true)
      if (token) {
        const res = await awardStudentXp(token, "flashcard", 15)
        if (res?.ok) {
          setXpToast(`🎉 Selamat! Anda mendapatkan +${res.addedXp} XP dari latihan Flashcard!`)
          setTimeout(() => setXpToast(null), 4000)
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {xpToast && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
          <Sparkles className="size-4 text-amber-600 shrink-0" />
          <span>{xpToast}</span>
        </div>
      )}

      {/* MODE & TYPE TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E4E1DA] pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={kanaType === "hiragana" ? "default" : "outline"}
            onClick={() => setKanaType("hiragana")}
            className="rounded-lg h-9 text-xs font-semibold"
          >
            Hiragana (ひらがな)
          </Button>
          <Button
            variant={kanaType === "katakana" ? "default" : "outline"}
            onClick={() => setKanaType("katakana")}
            className="rounded-lg h-9 text-xs font-semibold"
          >
            Katakana (カタカナ)
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-[#E4E1DA]/30 p-1 rounded-lg">
          <button
            onClick={() => setMode("study")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === "study" ? "bg-[#FAF9F6] text-[#B23A2E] shadow-sm" : "text-[#6B6862]"
            }`}
          >
            <BookOpen className="size-3.5" />
            Belajar
          </button>
          <button
            onClick={() => setMode("quiz")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === "quiz" ? "bg-[#FAF9F6] text-[#B23A2E] shadow-sm" : "text-[#6B6862]"
            }`}
          >
            <HelpCircle className="size-3.5" />
            Kuis
          </button>
        </div>
      </div>

      {/* STUDY MODE */}
      {mode === "study" && (
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="text-center">
            <span className="text-[10px] bg-[#B23A2E]/10 text-[#B23A2E] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider">
              {activeList[currentIndex].type}
            </span>
            <div className="text-xs text-[#6B6862] font-mono mt-2">
              Karakter {currentIndex + 1} dari {activeList.length}
            </div>
          </div>

          {/* FLASHCARD STYLED FLIP BOX */}
          <div
            className="relative w-72 h-96 cursor-pointer perspective-1000 group"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* CARD FRONT */}
              <div className="absolute inset-0 w-full h-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-2xl shadow-md p-6 flex flex-col items-center justify-between backface-hidden">
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakKana(activeList[currentIndex].kana)
                    }}
                    className="p-2 bg-[#E4E1DA]/30 hover:bg-[#E4E1DA]/50 rounded-lg text-[#6B6862] transition-colors"
                  >
                    <Volume2 className="size-4" />
                  </button>
                </div>
                <div className="text-8xl font-bold font-serif text-[#1C1B1A] animate-pulse">
                  {activeList[currentIndex].kana}
                </div>
                <div className="text-[10px] text-[#6B6862] font-mono select-none">
                  Klik kartu untuk membalik
                </div>
              </div>

              {/* CARD BACK */}
              <div className="absolute inset-0 w-full h-full bg-[#1C1B1A] text-[#FAF9F6] border border-white/10 rounded-2xl shadow-md p-6 flex flex-col items-center justify-between rotate-y-180 backface-hidden">
                <div className="w-full flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">ROMAJI &amp; CONTOH</span>
                  <button
                    type="button"
                    title="Dengarkan Karakter"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakKana(activeList[currentIndex].kana)
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-[#FAF9F6] transition-colors flex items-center gap-1 text-[10px]"
                  >
                    <Volume2 className="size-3.5 text-emerald-400" />
                    <span>Suara</span>
                  </button>
                </div>
                
                <div className="flex flex-col items-center gap-2 my-auto text-center">
                  <div className="text-3xl font-bold font-serif text-white/70">
                    {activeList[currentIndex].kana}
                  </div>
                  <div className="text-5xl font-mono font-bold text-emerald-400 tracking-wider">
                    {activeList[currentIndex].romaji}
                  </div>
                  <div className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest">
                    ROMAJI: {activeList[currentIndex].romaji}
                  </div>
                </div>

                {/* CONTOH PENGGUNAAN */}
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-center space-y-1 relative group/example">
                  <div className="text-[9px] text-white/50 font-mono uppercase tracking-wider font-semibold">
                    Contoh Penggunaan
                  </div>
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <span>{activeList[currentIndex].word}</span>
                    <button
                      type="button"
                      title="Dengarkan Contoh Kata"
                      onClick={(e) => {
                        e.stopPropagation()
                        const japanesePartOfWord = activeList[currentIndex].word.split(" ")[0]
                        speakKana(japanesePartOfWord || activeList[currentIndex].word)
                      }}
                      className="p-1 bg-white/10 hover:bg-white/20 rounded text-amber-300 transition-colors"
                    >
                      <Volume2 className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => setIsFlipped(!isFlipped)}
              className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 rounded-lg h-9 text-xs font-semibold px-5 flex items-center gap-2 shadow-sm border-none"
            >
              <RotateCcw className="size-3.5" />
              <span>{isFlipped ? "Tampilkan Depan (Karakter)" : "Balik Kartu (Lihat Romaji & Contoh)"}</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevStudy}
                className="rounded-lg h-9 text-xs border-[#E4E1DA] bg-[#FAF9F6]"
              >
                ← Mundur
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffleStudy}
                className="rounded-lg h-9 text-xs border-[#E4E1DA] bg-[#FAF9F6] flex items-center gap-1"
              >
                <RotateCcw className="size-3" />
                Acak
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextStudy}
                className="rounded-lg h-9 text-xs border-[#E4E1DA] bg-[#FAF9F6]"
              >
                Lanjut →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MODE */}
      {mode === "quiz" && quizQuestions.length > 0 && (
        <div className="max-w-xl mx-auto py-4 space-y-6">
          {!isQuizFinished ? (
            <>
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-[#6B6862]">
                  <span>Pertanyaan {quizCurrentIndex + 1} dari {quizQuestions.length}</span>
                  <span>Skor: {quizScore * 10}</span>
                </div>
                <div className="w-full h-2 bg-[#E4E1DA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Quiz Card */}
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
                <CardContent className="pt-6 flex flex-col items-center gap-6">
                  <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider">
                    Pilih Romaji yang Benar
                  </div>

                  <div className="text-7xl font-bold font-serif text-[#1C1B1A]">
                    {quizQuestions[quizCurrentIndex].questionItem.kana}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {quizQuestions[quizCurrentIndex].options.map((opt) => {
                      const isSelected = selectedAnswer === opt
                      return (
                        <button
                          key={opt}
                          disabled={isAnswerChecked}
                          onClick={() => setSelectedAnswer(opt)}
                          className={`py-3 rounded-lg border text-xs font-bold font-mono transition-all ${
                            isSelected
                              ? "border-[#B23A2E] bg-[#B23A2E]/5 text-[#B23A2E]"
                              : "border-[#E4E1DA] hover:bg-[#E4E1DA]/20 text-[#6B6862]"
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* DUOLINGO STYLE FEEDBACK BAR */}
              <div className="space-y-3">
                {!isAnswerChecked ? (
                  <Button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer}
                    className="w-full bg-[#B23A2E] hover:bg-[#B23A2E]/95 text-white h-10 text-xs font-semibold rounded-lg shadow-none"
                  >
                    Periksa Jawaban
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {/* Correct / Incorrect alert banner */}
                    {selectedAnswer === quizQuestions[quizCurrentIndex].questionItem.romaji ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-2.5 text-emerald-800">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold">Luar Biasa, Jawaban Benar!</div>
                          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                            Karakter {quizQuestions[quizCurrentIndex].questionItem.kana} dilafalkan "{quizQuestions[quizCurrentIndex].questionItem.romaji}".
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-2.5 text-red-800">
                        <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold">Jawaban Kurang Tepat</div>
                          <div className="text-[10px] text-red-600 font-mono mt-0.5">
                            Jawaban benar adalah "{quizQuestions[quizCurrentIndex].questionItem.romaji}".
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleNextQuestion}
                      className="w-full bg-[#2B3A55] hover:bg-[#2B3A55]/95 text-white h-10 text-xs font-semibold rounded-lg shadow-none"
                    >
                      {quizCurrentIndex + 1 === quizQuestions.length ? "Lihat Hasil Kuis" : "Lanjutkan"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* QUIZ FINISHED RESULTS SCREEN */
            <div className="text-center py-6 space-y-6">
              <div className="relative flex items-center justify-center w-20 h-20 border-2 border-dashed border-[#B23A2E]/25 rounded-full mx-auto animate-bounce">
                <div className="flex items-center justify-center w-16 h-16 border border-[#B23A2E] rounded-full text-sm font-bold text-[#B23A2E] bg-[#FAF9F6] transform rotate-[6deg]">
                  {quizScore >= 7 ? "合格" : "不合格"}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1C1B1A]">Kuis Kana Selesai!</h3>
                <p className="text-xs text-[#6B6862]">
                  {quizScore >= 7
                    ? "Hebat! Anda lulus kuis kana ini dengan baik."
                    : "Belum memenuhi skor kelulusan minimal (70%). Terus berlatih!"}
                </p>
              </div>

              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl max-w-xs mx-auto">
                <CardContent className="pt-4">
                  <div className="text-xs text-[#6B6862] font-semibold">Skor Akhir</div>
                  <div className="text-4xl font-mono font-bold text-[#2B3A55] mt-1">
                    {quizScore * 10} <span className="text-xs font-normal text-[#6B6862]">/ 100</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <Button
                  onClick={generateQuiz}
                  className="bg-[#B23A2E] hover:bg-[#B23A2E]/95 text-white text-xs h-9 rounded-lg flex-1 font-semibold"
                >
                  Kuis Lagi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMode("study")}
                  className="border-[#E4E1DA] text-xs h-9 rounded-lg flex-1 font-semibold"
                >
                  Belajar Kartu
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
