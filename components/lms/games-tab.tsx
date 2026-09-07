"use client"

import React, { useState, useEffect } from "react"
import { Gamepad2, Timer, Layers, Puzzle, Volume2, Swords, Trophy, Sparkles, Flame, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

import { SpeedMatchGame } from "@/components/lms/games/speed-match"
import { KotobaTowerGame } from "@/components/lms/games/kotoba-tower"
import { KanjiPuzzleGame } from "@/components/lms/games/kanji-puzzle"
import { ListeningRushGame } from "@/components/lms/games/listening-rush"
import { ShiritoriBattleGame } from "@/components/lms/games/shiritori-battle"

interface GamesTabProps {
  onAddXp?: (xp: number) => void
  userXp?: number
  token?: string
}

function getShokuninRank(xp: number) {
  if (xp >= 1000) return { level: 5, title: "名人 Meijin", tier: "Master Legenda", badgeColor: "bg-amber-500/10 text-amber-800 border-amber-500/30" }
  if (xp >= 600) return { level: 4, title: "達人 Tatsujin", tier: "Pakar Bahasa", badgeColor: "bg-purple-500/10 text-purple-800 border-purple-500/30" }
  if (xp >= 300) return { level: 3, title: "職人 Shokunin", tier: "Pengrajin Bahasa", badgeColor: "bg-[#2B3A55]/10 text-[#2B3A55] border-[#2B3A55]/30" }
  if (xp >= 100) return { level: 2, title: "弟子 Deshi", tier: "Murid Pembelajar", badgeColor: "bg-blue-500/10 text-blue-800 border-blue-500/30" }
  return { level: 1, title: "初心者 Shoshinsha", tier: "Pemula", badgeColor: "bg-slate-500/10 text-slate-800 border-slate-500/30" }
}

export function GamesTab({ onAddXp, userXp = 0, token }: GamesTabProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [totalXp, setTotalXp] = useState(userXp)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [xpToast, setXpToast] = useState<string | null>(null)

  useEffect(() => {
    if (userXp > 0) {
      setTotalXp(userXp)
    } else {
      const savedXp = localStorage.getItem("jper_user_xp")
      if (savedXp) setTotalXp(parseInt(savedXp, 10) || 0)
    }
    const savedPlayed = localStorage.getItem("jper_games_played")
    if (savedPlayed) setGamesPlayed(parseInt(savedPlayed, 10) || 0)
  }, [userXp])

  async function handleAddExp(earnedXp: number, gameActivity = "game") {
    const nextXp = totalXp + earnedXp
    const nextPlayed = gamesPlayed + 1
    setTotalXp(nextXp)
    setGamesPlayed(nextPlayed)
    localStorage.setItem("jper_user_xp", nextXp.toString())
    localStorage.setItem("jper_games_played", nextPlayed.toString())

    setXpToast(`+${earnedXp} EXP berhasil diraih! Rank Push diperbarui. 🎉`)
    setTimeout(() => setXpToast(null), 4000)

    if (onAddXp) onAddXp(earnedXp)

    // Dispatch Quest action event (real-time quest progress tracker)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("jper-quest-action", { detail: { action: "game_played", count: 1 } }))
      window.dispatchEvent(new CustomEvent("jper-profile-updated", { detail: { xp: nextXp } }))
    }

    // Sync to Supabase via API if token is available
    if (token && earnedXp > 0) {
      try {
        const res = await fetch("/api/lms/xp", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activity: gameActivity,
            amount: earnedXp,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.newXp) {
            setTotalXp(data.newXp)
            window.dispatchEvent(new CustomEvent("jper-profile-updated", { detail: { xp: data.newXp } }))
          }
        }
      } catch (err) {
        console.error("Gagal menyinkronkan Game EXP ke Supabase:", err)
      }
    }
  }

  const rankInfo = getShokuninRank(totalXp)

  return (
    <div className="space-y-6">
      {xpToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 font-bold flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600 shrink-0 animate-pulse" />
            <span>{xpToast}</span>
          </div>
          <span className="text-[10px] font-mono text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
            Tersimpan di Profil
          </span>
        </motion.div>
      )}

      {/* ARCADE HEADER BANNER */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-[#2B3A55] text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <Gamepad2 className="size-3.5" /> Arcade Game
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/40 text-[10px] font-mono font-bold tracking-wide">
                BETA VERSION 🚀
              </span>
              <span className="text-xs text-slate-300">| 5 Mini-Game Interaktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Belajar Bahasa Jepang Sambil Push Rank EXP! 🎮
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mainkan 5 game interaktif melatih Kanji, Kosakata, Pendengaran, dan Shiritori. Kumpulkan EXP untuk menaikkan Gelar Shokunin Anda!
            </p>
          </div>

          {/* USER PUSH RANK STATS */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 w-full md:w-auto space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xl shadow-md">
                Lv.{rankInfo.level}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {rankInfo.title}
                </div>
                <div className="text-[11px] text-amber-300 font-medium">{rankInfo.tier}</div>
              </div>
            </div>

            <div className="border-t border-white/15 pt-2 flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-300 block">Total EXP</span>
                <span className="font-bold text-amber-400">{totalXp} EXP</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block">Game Dimainkan</span>
                <span className="font-bold text-emerald-400">{gamesPlayed}x Sesi</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* GAME SWITCHER OR GAME PLAYING AREA */}
      {activeGame === "speed_match" && (
        <SpeedMatchGame
          onBack={() => setActiveGame(null)}
          onFinishGame={(_score, exp) => handleAddExp(exp, "speed_match")}
        />
      )}

      {activeGame === "kotoba_tower" && (
        <KotobaTowerGame
          onBack={() => setActiveGame(null)}
          onFinishGame={(_score, exp) => handleAddExp(exp, "kotoba_tower")}
        />
      )}

      {activeGame === "kanji_puzzle" && (
        <KanjiPuzzleGame
          onBack={() => setActiveGame(null)}
          onFinishGame={(_score, exp) => handleAddExp(exp, "kanji_puzzle")}
        />
      )}

      {activeGame === "listening_rush" && (
        <ListeningRushGame
          onBack={() => setActiveGame(null)}
          onFinishGame={(_score, exp) => handleAddExp(exp, "listening_rush")}
        />
      )}

      {activeGame === "shiritori_battle" && (
        <ShiritoriBattleGame
          onBack={() => setActiveGame(null)}
          onFinishGame={(_score, exp) => handleAddExp(exp, "shiritori_battle")}
        />
      )}

      {!activeGame && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* GAME 1 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            whileHover={{ y: -3 }}
            className="flex flex-col h-full"
          >
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl hover:border-[#2B3A55] transition-all flex flex-col justify-between h-full">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Timer className="size-5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    +300 EXP Max
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#1C1B1A]">1. Kanji Speed Match</CardTitle>
                <CardDescription className="text-xs text-[#6B6862]">
                  60 detik mencocokkan Kanji vs Arti Bahasa Indonesia dengan combo streak.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => setActiveGame("speed_match")}
                    className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 rounded-xl text-xs font-bold shadow-xs"
                  >
                    Mainkan Speed Match →
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GAME 2 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            whileHover={{ y: -3 }}
            className="flex flex-col h-full"
          >
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl hover:border-[#2B3A55] transition-all flex flex-col justify-between h-full">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Layers className="size-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    +300 EXP Max
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#1C1B1A]">2. Kotoba Tower Fall</CardTitle>
                <CardDescription className="text-xs text-[#6B6862]">
                  Hancurkan balok kata yang jatuh dari atas sebelum meruntuhkan tower pertahanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => setActiveGame("kotoba_tower")}
                    className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 rounded-xl text-xs font-bold shadow-xs"
                  >
                    Mainkan Kotoba Tower →
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GAME 3 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            whileHover={{ y: -3 }}
            className="flex flex-col h-full"
          >
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl hover:border-[#2B3A55] transition-all flex flex-col justify-between h-full">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Puzzle className="size-5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    +250 EXP Max
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#1C1B1A]">3. Kanji Radical Puzzle</CardTitle>
                <CardDescription className="text-xs text-[#6B6862]">
                  Pecahkan teka-teki gabungan radikal (contoh: 日 + 月 = 明) menjadi Kanji utuh.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => setActiveGame("kanji_puzzle")}
                    className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 rounded-xl text-xs font-bold shadow-xs"
                  >
                    Mainkan Radical Puzzle →
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GAME 4 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            whileHover={{ y: -3 }}
            className="flex flex-col h-full"
          >
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl hover:border-[#2B3A55] transition-all flex flex-col justify-between h-full">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Volume2 className="size-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    +250 EXP Max
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#1C1B1A]">4. Listening Rush 聴解</CardTitle>
                <CardDescription className="text-xs text-[#6B6862]">
                  Dengarkan pelafalan audio kata Bahasa Jepang dan tebak artinya dengan presisi.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => setActiveGame("listening_rush")}
                    className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 rounded-xl text-xs font-bold shadow-xs"
                  >
                    Mainkan Listening Rush →
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GAME 5 */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
            whileHover={{ y: -3 }}
            className="flex flex-col h-full"
          >
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl hover:border-[#2B3A55] transition-all flex flex-col justify-between h-full">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <Swords className="size-5 text-rose-600" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    +300 EXP Max
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#1C1B1A]">5. Shiritori Word Battle</CardTitle>
                <CardDescription className="text-xs text-[#6B6862]">
                  Sambung kata tradisional Jepang berdasarkan Kana/suku kata terakhir.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={() => setActiveGame("shiritori_battle")}
                    className="w-full h-10 bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 rounded-xl text-xs font-bold shadow-xs"
                  >
                    Mainkan Shiritori Battle →
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
