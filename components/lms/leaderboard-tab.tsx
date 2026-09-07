"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Trophy, Award, Flame, Star, Crown, Medal, User, Loader2, Sparkles, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type LeaderboardMember = {
  id: string
  nama_lengkap: string
  email: string
  role: string
  angkatan: string | null
  avatar_url: string | null
  xp: number
  streak_count: number
  rank: number
}

interface LeaderboardTabProps {
  token: string
}

function getLevelTitle(xp: number) {
  if (xp >= 1000) return { title: "師範 (Shihan)", label: "Grandmaster Scholar", badgeColor: "bg-purple-100 text-purple-800 border-purple-200" }
  if (xp >= 500) return { title: "達人 (Tatsujin)", label: "Master Scholar", badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200" }
  if (xp >= 200) return { title: "学徒 (Gakuto)", label: "Dedicated Apprentice", badgeColor: "bg-blue-100 text-blue-800 border-blue-200" }
  return { title: "初心者 (Shoshinsha)", label: "Novice Learner", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" }
}

export function LeaderboardTab({ token }: LeaderboardTabProps) {
  const [podium, setPodium] = useState<LeaderboardMember[]>([])
  const [rankings, setRankings] = useState<LeaderboardMember[]>([])
  const [myMember, setMyMember] = useState<LeaderboardMember | null>(null)
  const [totalMembers, setTotalMembers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [angkatanFilter, setAngkatanFilter] = useState("all")

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/lms/leaderboard?angkatan=${angkatanFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as {
          podium: LeaderboardMember[]
          rankings: LeaderboardMember[]
          myMember: LeaderboardMember | null
          totalMembers: number
        }
        setPodium(data.podium || [])
        setRankings(data.rankings || [])
        setMyMember(data.myMember || null)
        setTotalMembers(data.totalMembers || 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [token, angkatanFilter])

  useEffect(() => {
    void fetchLeaderboard()
  }, [fetchLeaderboard])

  const rank1 = podium[0]
  const rank2 = podium[1]
  const rank3 = podium[2]

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <Trophy className="size-6 text-[#2B3A55]" /> Papan Peringkat & Podium Juara (順位表)
          </h2>
          <p className="text-xs text-[#6B6862] mt-0.5">
            Kompetisi positif anggota JPER Community berdasarkan akumulasi Poin XP & Streak Belajar Harian.
          </p>
        </div>

        {/* Filter Angkatan */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E4E1DA] shadow-xs">
          <Filter className="size-3.5 text-[#6B6862]" />
          <span className="text-xs font-semibold text-[#6B6862]">Angkatan:</span>
          <select
            value={angkatanFilter}
            onChange={(e) => setAngkatanFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#2B3A55] focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Angkatan</option>
            <option value="2026">Angkatan 2026</option>
            <option value="2025">Angkatan 2025</option>
            <option value="2024">Angkatan 2024</option>
            <option value="2023">Alumni (2019-2023)</option>
          </select>
        </div>
      </div>

      {/* My Rank Summary Card */}
      {myMember && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#2B3A55] to-[#1C1B1A] text-white flex items-center justify-between flex-wrap gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center font-mono font-extrabold text-lg text-white">
              #{myMember.rank}
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/60 uppercase">Peringkat Anda Saat Ini</div>
              <div className="text-sm font-bold text-white">{myMember.nama_lengkap}</div>
              <div className="text-[10px] font-mono text-amber-300 font-semibold mt-0.5">
                {getLevelTitle(myMember.xp).title} • {getLevelTitle(myMember.xp).label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-[10px] font-mono text-white/60 uppercase">Total XP</div>
              <div className="text-base font-mono font-bold text-amber-300 flex items-center justify-end gap-1">
                <Star className="size-4 fill-amber-300 text-amber-300" /> {myMember.xp} XP
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/60 uppercase">Streak Harian</div>
              <div className="text-base font-mono font-bold text-orange-400 flex items-center justify-end gap-1">
                <Flame className="size-4 fill-orange-400 text-orange-400" /> {myMember.streak_count} Hari
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs font-mono text-[#6B6862]">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#2B3A55]" />
          Memuat papan peringkat...
        </div>
      ) : (
        <>
          {/* PODIUM 1, 2, 3 VISUAL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            {/* RANK 2 (PERAK) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className="order-2 md:order-1">
              {rank2 ? (
                <div className="border-2 border-slate-300 rounded-xl bg-white p-5 text-center space-y-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded-bl-lg">
                    RANK 2
                  </div>
                  <div className="relative inline-block">
                    <div className="size-16 rounded-full overflow-hidden border-2 border-slate-300 mx-auto bg-slate-100 flex items-center justify-center">
                      {rank2.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank2.avatar_url} alt={rank2.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-8 text-slate-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 right-0 size-7 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center font-bold text-slate-800 text-xs shadow-xs">
                      🥈
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1C1B1A] truncate">{rank2.nama_lengkap}</h3>
                    <p className="text-[10px] font-mono text-[#6B6862] mt-0.5">Angkatan {rank2.angkatan || "-"}</p>
                  </div>
                  <div className="pt-2 border-t border-[#E4E1DA] flex justify-center gap-3 text-xs font-mono">
                    <span className="font-bold text-[#2B3A55] flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {rank2.xp} XP
                    </span>
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Flame className="size-3.5 fill-orange-500 text-orange-500" /> {rank2.streak_count}d
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#E4E1DA] rounded-xl p-8 text-center text-xs text-[#6B6862]">
                  Belum Ada Juara 2
                </div>
              )}
            </motion.div>

            {/* RANK 1 (EMAS - MAIN PODIUM) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="order-1 md:order-2">
              {rank1 ? (
                <div className="border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 to-white rounded-xl p-6 text-center space-y-3 shadow-lg transform md:-translate-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-mono font-extrabold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Crown className="size-3" /> JUARA 1
                  </div>
                  <div className="relative inline-block mt-2">
                    <div className="size-20 rounded-full overflow-hidden border-4 border-amber-400 mx-auto bg-amber-100 flex items-center justify-center shadow-md">
                      {rank1.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank1.avatar_url} alt={rank1.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-10 text-amber-600" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 right-0 size-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center font-bold text-amber-950 text-sm shadow-md">
                      🥇
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1C1B1A] truncate">{rank1.nama_lengkap}</h3>
                    <p className="text-[11px] font-mono text-amber-800 font-semibold mt-0.5">Angkatan {rank1.angkatan || "-"}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {getLevelTitle(rank1.xp).title}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-amber-200/80 flex justify-center gap-4 text-xs font-mono">
                    <span className="font-extrabold text-[#2B3A55] flex items-center gap-1">
                      <Star className="size-4 fill-amber-400 text-amber-400" /> {rank1.xp} XP
                    </span>
                    <span className="font-extrabold text-orange-600 flex items-center gap-1">
                      <Flame className="size-4 fill-orange-500 text-orange-500" /> {rank1.streak_count} Hari
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#E4E1DA] rounded-xl p-8 text-center text-xs text-[#6B6862]">
                  Belum Ada Juara 1
                </div>
              )}
            </motion.div>

            {/* RANK 3 (PERUNGGU) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }} className="order-3">
              {rank3 ? (
                <div className="border-2 border-amber-700/30 rounded-xl bg-white p-5 text-center space-y-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-800/10 text-amber-900 text-[10px] font-mono font-bold px-2 py-1 rounded-bl-lg">
                    RANK 3
                  </div>
                  <div className="relative inline-block">
                    <div className="size-16 rounded-full overflow-hidden border-2 border-amber-700/30 mx-auto bg-amber-50 flex items-center justify-center">
                      {rank3.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank3.avatar_url} alt={rank3.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-8 text-amber-800" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 right-0 size-7 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center font-bold text-amber-900 text-xs shadow-xs">
                      🥉
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1C1B1A] truncate">{rank3.nama_lengkap}</h3>
                    <p className="text-[10px] font-mono text-[#6B6862] mt-0.5">Angkatan {rank3.angkatan || "-"}</p>
                  </div>
                  <div className="pt-2 border-t border-[#E4E1DA] flex justify-center gap-3 text-xs font-mono">
                    <span className="font-bold text-[#2B3A55] flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {rank3.xp} XP
                    </span>
                    <span className="font-bold text-orange-600 flex items-center gap-1">
                      <Flame className="size-3.5 fill-orange-500 text-orange-500" /> {rank3.streak_count}d
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[#E4E1DA] rounded-xl p-8 text-center text-xs text-[#6B6862]">
                  Belum Ada Juara 3
                </div>
              )}
            </motion.div>
          </div>

          {/* RANK 4+ TABLE LIST */}
          <Card className="bg-[#FAF9F6] border-[#E4E1DA] shadow-none rounded-xl overflow-hidden mt-6">
            <CardHeader className="border-b border-[#E4E1DA] bg-[#F5F3EE] py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-[#1C1B1A]">Daftar Peringkat Anggota ({totalMembers} Siswa)</CardTitle>
                <CardDescription className="text-[10px] text-[#6B6862]">Peringkat #4 ke atas berdasarkan total akumulasi XP.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[#E4E1DA]">
              {rankings.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B6862] italic">
                  Belum ada data anggota tambahan pada peringkat ini.
                </div>
              ) : (
                rankings.map((m) => {
                  const level = getLevelTitle(m.xp)
                  const isMe = m.id === myMember?.id

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-3.5 px-4 text-xs transition-colors ${
                        isMe ? "bg-[#2B3A55]/10 font-semibold" : "hover:bg-[#F5F3EE]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <span className="w-6 font-mono font-bold text-[#6B6862] text-center">
                          #{m.rank}
                        </span>
                        <div className="size-9 rounded-full overflow-hidden border border-[#E4E1DA] bg-stone-200 flex items-center justify-center shrink-0">
                          {m.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatar_url} alt={m.nama_lengkap} className="size-full object-cover" />
                          ) : (
                            <User className="size-4 text-[#6B6862]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#1C1B1A] truncate flex items-center gap-2">
                            {m.nama_lengkap}
                            {isMe && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#2B3A55] text-white">Anda</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#6B6862] font-mono flex items-center gap-2 mt-0.5">
                            <span>Angkatan {m.angkatan || "-"}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.2 rounded border text-[9px] ${level.badgeColor}`}>
                              {level.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs">
                        <div className="text-right">
                          <div className="font-bold text-[#2B3A55] flex items-center gap-1 justify-end">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {m.xp} XP
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <div className="font-bold text-orange-600 flex items-center gap-1 justify-end">
                            <Flame className="size-3.5 fill-orange-500 text-orange-500" /> {m.streak_count}d
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
