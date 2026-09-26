"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Flame, CheckCircle2, Zap, Sparkles, Clock, Gift } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export type DailyQuest = {
  id: string
  title: string
  description: string
  rewardXp: number
  target: number
  progress: number
  isCompleted: boolean
  isClaimed: boolean
  category: "game" | "flashcard" | "listening" | "dictionary" | "grammar" | "login"
}

interface DailyQuestWidgetProps {
  onAddXp?: (xp: number) => void
  token?: string
  userProfile?: {
    id?: string
    streak_count?: number
    xp?: number
    nama_lengkap?: string
  }
}

export function DailyQuestWidget({ onAddXp, token, userProfile }: DailyQuestWidgetProps) {
  const [streakCount, setStreakCount] = useState(userProfile?.streak_count || 1)
  const [loginClaimed, setLoginClaimed] = useState(false)
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [claimToast, setClaimToast] = useState<string | null>(null)
  const [timeLeftStr, setTimeLeftStr] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Countdown timer to midnight
  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diffMs = midnight.getTime() - now.getTime()

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000)

      setTimeLeftStr(`${hours}h ${mins}m ${secs}s`)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch real-time Daily Quests from Supabase API
  const fetchQuestsFromSupabase = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/lms/quests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.quests) setQuests(data.quests)
        if (typeof data.streakCount === "number") setStreakCount(data.streakCount)
        if (typeof data.hasClaimedLoginToday === "boolean") setLoginClaimed(data.hasClaimedLoginToday)
      }
    } catch (err) {
      console.error("Gagal memuat Misi Harian dari Supabase:", err)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchQuestsFromSupabase()
  }, [fetchQuestsFromSupabase])

  // Real-time Event Listener for user actions across LMS tabs
  useEffect(() => {
    const handleQuestAction = async (event: Event) => {
      const customEv = event as CustomEvent<{ action: string; category?: string; count?: number }>
      if (!customEv.detail) return
      const { action, category, count = 1 } = customEv.detail

      let mappedCategory = category
      if (!mappedCategory) {
        if (action === "game_played") mappedCategory = "game"
        if (action === "flashcard_studied") mappedCategory = "flashcard"
        if (action === "listening_completed") mappedCategory = "listening"
        if (action === "dictionary_searched") mappedCategory = "dictionary"
        if (action === "grammar_learned") mappedCategory = "grammar"
      }

      if (!mappedCategory) return

      // Optimistic state update
      setQuests((prev) =>
        prev.map((q) => {
          if (q.category === mappedCategory && !q.isClaimed) {
            const nextProg = Math.min(q.target, q.progress + count)
            return {
              ...q,
              progress: nextProg,
              isCompleted: nextProg >= q.target,
            }
          }
          return q
        })
      )

      // Sync with Supabase API
      if (token) {
        try {
          await fetch("/api/lms/quests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ category: mappedCategory, count }),
          })
        } catch {
          // Silent fallback
        }
      }
    }

    window.addEventListener("jper_quest_progress", handleQuestAction)
    return () => window.removeEventListener("jper_quest_progress", handleQuestAction)
  }, [token])

  // Claim Daily Login Reward
  const handleClaimLoginReward = async () => {
    if (loginClaimed || isLoading) return
    const earnedXp = Math.min(100, streakCount * 15 + 20)

    try {
      if (token) {
        const res = await fetch("/api/lms/quests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "claim_login" }),
        })
        if (res.ok) {
          const data = await res.json()
          if (typeof data.newStreak === "number") setStreakCount(data.newStreak)
        }
      }

      setLoginClaimed(true)
      if (onAddXp) onAddXp(earnedXp)

      setClaimToast(`+${earnedXp} EXP berhasil diklaim! 🔥 Streak Harian bertambah!`)
      setTimeout(() => setClaimToast(null), 4000)
    } catch {
      // Fallback local claim
      setLoginClaimed(true)
      if (onAddXp) onAddXp(earnedXp)
    }
  }

  // Claim Specific Quest Reward
  const handleClaimQuest = async (questId: string, rewardXp: number, questTitle: string) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, isClaimed: true } : q))
    )

    if (onAddXp) onAddXp(rewardXp)

    if (token) {
      try {
        await fetch("/api/lms/quests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "claim_quest", questId }),
        })
      } catch {
        // Silent fallback
      }
    }

    setClaimToast(`Selamat! Misi "${questTitle}" selesai (+${rewardXp} EXP)! ✨`)
    setTimeout(() => setClaimToast(null), 4000)
  }

  const getStreakBadge = () => {
    if (streakCount >= 14) return { label: "連勝王 • Streak God", bonus: "+50% EXP" }
    if (streakCount >= 7) return { label: "達人 • Master Streak", bonus: "+30% EXP" }
    if (streakCount >= 3) return { label: "継続 • On Fire", bonus: "+15% EXP" }
    return { label: "初心者 • Rookie", bonus: "Standard EXP" }
  }

  const streakBadge = getStreakBadge()

  return (
    <div className="space-y-4 mb-6 w-full text-black">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {claimToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-2 border-black bg-[#FFC700] p-4 text-xs font-black text-black flex items-center justify-between shadow-[4px_4px_0px_#111]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#E60012] shrink-0 animate-bounce" />
              <span>{claimToast}</span>
            </div>
            <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5 -skew-x-6 border border-black">
              KLAIM BERHASIL
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DAILY LOGIN STREAK WIDGET */}
        <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_#111] rounded-none lg:col-span-1 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between border-b-2 border-black bg-[#FAF9F5]">
            <div className="flex items-center gap-2.5">
              <div className="size-9 border-2 border-black bg-[#E60012] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111]">
                <Flame className="size-5 text-white animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-black">Daily Login Streak</CardTitle>
                <p className="text-[10px] font-mono font-bold text-zinc-600">連続ログイン</p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-black text-[#FFC700] border border-black -skew-x-6">
              {streakBadge.label}
            </span>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-4 space-y-4 flex-1 flex flex-col justify-between">
            <div className="border-2 border-black bg-amber-50/50 p-4 space-y-2 shadow-[3px_3px_0px_#111]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-black flex items-center gap-2 font-mono">
                    🔥 {streakCount} <span className="text-xs font-bold text-zinc-600">HARI BERUNTUN</span>
                  </div>
                  <p className="text-[11px] font-bold text-zinc-700 mt-1">
                    Bonus Presensi: <span className="font-black text-[#E60012]">+{Math.min(100, streakCount * 15 + 20)} EXP</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-black/10 flex items-center justify-between text-[10px] font-mono font-bold text-zinc-700">
                <span className="flex items-center gap-1">
                  <Gift className="size-3.5 text-[#E60012]" /> Milestone: {streakBadge.bonus}
                </span>
              </div>
            </div>

            <Button
              type="button"
              disabled={loginClaimed || isLoading}
              onClick={handleClaimLoginReward}
              className={`w-full text-xs font-black uppercase rounded-none h-11 transition-all border-2 border-black shadow-[3px_3px_0px_#111] ${
                loginClaimed
                  ? "bg-emerald-400 text-black cursor-default"
                  : "bg-[#E60012] text-white hover:bg-black hover:text-[#FFC700] hover:shadow-[4px_4px_0px_#E60012]"
              }`}
            >
              {loginClaimed ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-4 stroke-[3]" /> PRESENSI HARI INI TERKLAIM
                </span>
              ) : (
                `Klaim Bonus Login (+${Math.min(100, streakCount * 15 + 20)} EXP) ✨`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AUTO-GENERATED DAILY QUESTS */}
        <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_#111] rounded-none lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between border-b-2 border-black bg-[#FAF9F5]">
            <div className="flex items-center gap-2.5">
              <div className="size-9 border-2 border-black bg-[#FFC700] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111]">
                <Zap className="size-5 text-black" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-black">Misi Harian JPER (Daily Quests)</CardTitle>
                <p className="text-[10px] font-mono font-bold text-zinc-600">デイリークエスト</p>
              </div>
            </div>

            <div className="text-[10px] font-mono font-black text-black bg-white border border-black px-2.5 py-1 -skew-x-6 flex items-center gap-1 shadow-[2px_2px_0px_#111]">
              <Clock className="size-3 text-[#E60012]" /> Reset: {timeLeftStr}
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quests.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="border-2 border-black bg-[#FAF9F5] p-3.5 flex flex-col justify-between gap-3 shadow-[3px_3px_0px_#111]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-black uppercase line-clamp-1">{q.title}</span>
                      <span className="text-[10px] font-mono font-black text-black bg-[#FFC700] border border-black px-1.5 py-0.5 shrink-0 -skew-x-6">
                        +{q.rewardXp} EXP
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-zinc-600 mt-1 line-clamp-2 leading-tight">{q.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-black/10">
                    <div className="w-full bg-white border border-black h-2.5 overflow-hidden">
                      <motion.div
                        className="bg-[#E60012] h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-zinc-700">
                        {q.progress} / {q.target}
                      </span>

                      {q.isClaimed ? (
                        <span className="text-black font-black uppercase flex items-center gap-1 bg-emerald-400 px-2 py-0.5 border border-black -skew-x-6">
                          <CheckCircle2 className="size-3 stroke-[3]" /> Terklaim
                        </span>
                      ) : q.isCompleted ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClaimQuest(q.id, q.rewardXp, q.title)}
                          className="text-white bg-[#E60012] border border-black hover:bg-black hover:text-[#FFC700] px-2.5 py-1 text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_#111] transition-colors cursor-pointer"
                        >
                          Klaim EXP!
                        </motion.button>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-200 border border-black px-2 py-0.5">
                          Berlangsung
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
