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

      // Optimistic update client state
      setQuests((prevQuests) =>
        prevQuests.map((q) => {
          let shouldIncrement = false
          if (mappedCategory === "game" && (q.category === "game" || q.id === "quest_game")) shouldIncrement = true
          if (mappedCategory === q.category) shouldIncrement = true

          if (shouldIncrement && !q.isClaimed) {
            const nextProg = Math.min(q.target, q.progress + count)
            return {
              ...q,
              progress: nextProg,
              isCompleted: nextProg >= q.target,
            }
          }
          return q
        }),
      )

      // Persist to Supabase if token exists
      if (token) {
        try {
          await fetch("/api/lms/quests", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "update_progress",
              category: mappedCategory,
              count,
            }),
          })
        } catch (err) {
          console.error("Gagal memperbarui progres quest ke Supabase:", err)
        }
      }
    }

    window.addEventListener("jper-quest-action", handleQuestAction)
    return () => window.removeEventListener("jper-quest-action", handleQuestAction)
  }, [token])

  async function handleClaimLoginReward() {
    if (loginClaimed) return
    const rewardXpEstimate = Math.min(100, streakCount * 15 + 20)

    if (!token) {
      setLoginClaimed(true)
      setClaimToast(`🔥 Login Streak Harian! +${rewardXpEstimate} EXP berhasil diklaim!`)
      setTimeout(() => setClaimToast(null), 4500)
      if (onAddXp) onAddXp(rewardXpEstimate)
      return
    }

    try {
      const res = await fetch("/api/lms/quests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "claim_login" }),
      })

      if (res.ok) {
        const data = await res.json()
        setLoginClaimed(true)
        if (data.quests) setQuests(data.quests)
        if (data.newStreak) setStreakCount(data.newStreak)

        setClaimToast(data.message || `🔥 Bonus Login +${data.addedXp} EXP tersimpan di Supabase!`)
        setTimeout(() => setClaimToast(null), 4500)

        if (onAddXp && data.addedXp) onAddXp(data.addedXp)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("jper-profile-updated", { detail: { xp: data.newXp, streak_count: data.newStreak } }))
        }
      } else {
        const errData = await res.json()
        setClaimToast(errData.message || "Gagal mengklaim bonus login.")
        setTimeout(() => setClaimToast(null), 4000)
      }
    } catch (err) {
      console.error("Error claim daily login:", err)
    }
  }

  async function handleClaimQuest(questId: string, rewardXp: number, title: string) {
    if (!token) {
      setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, isClaimed: true } : q)))
      setClaimToast(`🎉 Misi "${title}" Selesai! +${rewardXp} EXP diklaim!`)
      setTimeout(() => setClaimToast(null), 4500)
      if (onAddXp) onAddXp(rewardXp)
      return
    }

    try {
      const res = await fetch("/api/lms/quests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "claim_quest", questId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.quests) setQuests(data.quests)

        setClaimToast(data.message || `🎉 Misi "${title}" Selesai! +${rewardXp} EXP tersimpan di Supabase!`)
        setTimeout(() => setClaimToast(null), 4500)

        if (onAddXp && data.addedXp) onAddXp(data.addedXp)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("jper-profile-updated", { detail: { xp: data.newXp } }))
        }
      } else {
        const errData = await res.json()
        setClaimToast(errData.message || "Gagal mengklaim misi.")
        setTimeout(() => setClaimToast(null), 4000)
      }
    } catch (err) {
      console.error("Error claim quest:", err)
    }
  }

  // Calculate Streak Milestone Badge
  let streakBadge = { label: "1d Beginner", color: "bg-slate-100 text-slate-800 border-slate-300", bonus: "Standard EXP" }
  if (streakCount >= 30) streakBadge = { label: "30d Shokunin Legend", color: "bg-amber-400 text-slate-900 border-amber-500 font-extrabold", bonus: "+50% Game EXP" }
  else if (streakCount >= 14) streakBadge = { label: "14d Master Flame", color: "bg-purple-100 text-purple-900 border-purple-300 font-bold", bonus: "+35% Game EXP" }
  else if (streakCount >= 7) streakBadge = { label: "7d Streak Master", color: "bg-orange-100 text-orange-900 border-orange-300 font-bold", bonus: "+25% Game EXP" }
  else if (streakCount >= 3) streakBadge = { label: "3d Fire Learner", color: "bg-amber-100 text-amber-900 border-amber-300 font-semibold", bonus: "+10% Game EXP" }

  return (
    <div className="space-y-4 mb-6 w-full">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {claimToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900 font-bold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600 shrink-0 animate-bounce" />
              <span>{claimToast}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
              Berhasil
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* DAILY LOGIN STREAK WIDGET */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl lg:col-span-1 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between border-b border-[#E4E1DA]/40">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="size-5 text-orange-600 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#1C1B1A]">Daily Login Streak</CardTitle>
                <p className="text-[11px] text-[#6B6862]">Presensi Harian Beruntun</p>
              </div>
            </div>

            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${streakBadge.color}`}>
              {streakBadge.label}
            </span>
          </CardHeader>

          <CardContent className="px-5 pb-4 pt-3 space-y-3 flex-1 flex flex-col justify-between">
            <div className="bg-white border border-[#E4E1DA] p-4 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-[#1C1B1A] flex items-center gap-2">
                    🔥 {streakCount} <span className="text-xs font-normal text-[#6B6862]">Hari Beruntun</span>
                  </div>
                  <p className="text-[11px] text-[#6B6862] mt-0.5">
                    Bonus Klaim Hari Ini: <span className="font-bold text-amber-600">+{Math.min(100, streakCount * 15 + 20)} EXP</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E4E1DA]/50 flex items-center justify-between text-[10px] text-[#6B6862]">
                <span className="flex items-center gap-1 font-medium">
                  <Gift className="size-3 text-orange-500" /> Milestone Bonus: {streakBadge.bonus}
                </span>
              </div>
            </div>

            <Button
              type="button"
              disabled={loginClaimed || isLoading}
              onClick={handleClaimLoginReward}
              className={`w-full text-xs font-bold rounded-xl h-10 transition-all ${
                loginClaimed
                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 cursor-default"
                  : "bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 shadow-sm"
              }`}
            >
              {loginClaimed ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Presensi Hari Ini Terklaim
                </span>
              ) : (
                `Klaim Bonus Login (+${Math.min(100, streakCount * 15 + 20)} EXP) ✨`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AUTO-GENERATED DAILY QUESTS */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-sm rounded-2xl lg:col-span-2 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between border-b border-[#E4E1DA]/40">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-[#2B3A55]/10 border border-[#2B3A55]/20 flex items-center justify-center shrink-0">
                <Zap className="size-5 text-[#2B3A55]" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#1C1B1A]">Misi Harian JPER (Daily Quests)</CardTitle>
                <p className="text-[11px] text-[#6B6862]">Selesaikan aktivitas LMS harian untuk mengklaim bonus EXP</p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#6B6862] bg-[#E4E1DA]/50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="size-3 text-amber-600" /> Reset: {timeLeftStr}
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-4 pt-3 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quests.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-white border border-[#E4E1DA] p-3.5 rounded-xl flex flex-col justify-between gap-3 shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#1C1B1A] line-clamp-1">{q.title}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                        +{q.rewardXp} EXP
                      </span>
                    </div>
                    <p className="text-[10px] text-[#6B6862] mt-1 line-clamp-2 leading-tight">{q.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E4E1DA]/40">
                    <div className="w-full bg-[#E4E1DA]/50 h-2 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-[#2B3A55] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#6B6862] font-mono">
                        {q.progress} / {q.target}
                      </span>

                      {q.isClaimed ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Terklaim
                        </span>
                      ) : q.isCompleted ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleClaimQuest(q.id, q.rewardXp, q.title)}
                          className="text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold shadow-xs transition-colors animate-pulse cursor-pointer"
                        >
                          Klaim EXP!
                        </motion.button>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#6B6862] bg-[#E4E1DA]/40 px-2 py-0.5 rounded">
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
