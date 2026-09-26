"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Trophy, Award, Flame, Star, Crown, User, Loader2, Filter } from "lucide-react"
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
  if (xp >= 1000) return { title: "師範 (Shihan)", label: "Grandmaster Scholar", badgeClass: "bg-purple-600 text-white border-black" }
  if (xp >= 500) return { title: "達人 (Tatsujin)", label: "Master Scholar", badgeClass: "bg-indigo-600 text-white border-black" }
  if (xp >= 200) return { title: "学徒 (Gakuto)", label: "Dedicated Apprentice", badgeClass: "bg-[#E60012] text-white border-black" }
  return { title: "初心者 (Shoshinsha)", label: "Novice Learner", badgeClass: "bg-zinc-800 text-[#FFC700] border-black" }
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
    <div className="space-y-6 text-black">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block bg-black text-[#FFC700] px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider -skew-x-6 border border-black shadow-[2px_2px_0px_#E60012]">
              順位表 • LEADERBOARD
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            Papan Peringkat & Podium Juara
          </h2>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Kompetisi positif anggota JPER Community berdasarkan Poin XP & Streak Belajar.
          </p>
        </div>

        {/* Filter Angkatan */}
        <div className="flex items-center gap-2 bg-zinc-50 p-2 border-2 border-black shadow-[3px_3px_0px_#111]">
          <Filter className="size-4 text-black" />
          <span className="text-xs font-black uppercase text-black">Angkatan:</span>
          <select
            value={angkatanFilter}
            onChange={(e) => setAngkatanFilter(e.target.value)}
            className="bg-white text-xs font-black text-black border border-black px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Angkatan</option>
            <option value="2026">Angkatan 2026</option>
            <option value="2025">Angkatan 2025</option>
            <option value="2024">Angkatan 2024</option>
            <option value="2023">Alumni (2019-2023)</option>
          </select>
        </div>
      </div>

      {/* MY RANK SUMMARY CARD */}
      {myMember && (
        <div className="p-5 border-2 border-black bg-black text-white flex items-center justify-between flex-wrap gap-4 shadow-[6px_6px_0px_#E60012]">
          <div className="flex items-center gap-4">
            <div className="size-14 border-2 border-black bg-[#FFC700] text-black flex items-center justify-center font-mono font-black text-xl shadow-[3px_3px_0px_#fff]">
              #{myMember.rank}
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase text-[#FFC700]">PERINGKAT ANDA SAAT INI</span>
              <div className="text-base font-black uppercase text-white">{myMember.nama_lengkap}</div>
              <div className="text-xs font-mono font-bold text-zinc-300 mt-0.5">
                {getLevelTitle(myMember.xp).title} • {getLevelTitle(myMember.xp).label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-[10px] font-mono font-black uppercase text-zinc-400">TOTAL XP</div>
              <div className="text-lg font-mono font-black text-[#FFC700] flex items-center justify-end gap-1">
                <Star className="size-4 fill-[#FFC700] text-[#FFC700]" /> {myMember.xp} XP
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono font-black uppercase text-zinc-400">STREAK HARIAN</div>
              <div className="text-lg font-mono font-black text-[#E60012] flex items-center justify-end gap-1">
                <Flame className="size-4 fill-[#E60012] text-[#E60012]" /> {myMember.streak_count} Hari
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="border-2 border-black bg-white p-12 text-center text-xs font-mono font-black text-zinc-600 shadow-[4px_4px_0px_#111]">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#E60012]" />
          Memuat papan peringkat...
        </div>
      ) : (
        <>
          {/* PODIUM 1, 2, 3 VISUAL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            {/* RANK 2 (PERAK) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className="order-2 md:order-1">
              {rank2 ? (
                <div className="border-2 border-black bg-white p-5 text-center space-y-3 shadow-[6px_6px_0px_#111] relative">
                  <div className="absolute top-0 right-0 bg-zinc-300 text-black border-l-2 border-b-2 border-black text-[10px] font-mono font-black px-2.5 py-1">
                    RANK 2 • 🥈
                  </div>
                  <div className="relative inline-block mt-2">
                    <div className="size-20 border-2 border-black mx-auto bg-zinc-100 flex items-center justify-center shadow-[3px_3px_0px_#111] overflow-hidden">
                      {rank2.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank2.avatar_url} alt={rank2.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-10 text-zinc-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-black truncate">{rank2.nama_lengkap}</h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-500 mt-0.5">Angkatan {rank2.angkatan || "-"}</p>
                  </div>
                  <div className="pt-3 border-t-2 border-black flex justify-center gap-4 text-xs font-mono font-black">
                    <span className="text-black flex items-center gap-1">
                      <Star className="size-4 fill-[#FFC700] text-black" /> {rank2.xp} XP
                    </span>
                    <span className="text-[#E60012] flex items-center gap-1">
                      <Flame className="size-4 fill-[#E60012] text-[#E60012]" /> {rank2.streak_count}d
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-black border-dashed bg-white p-8 text-center text-xs font-bold text-zinc-400">
                  Belum Ada Juara 2
                </div>
              )}
            </motion.div>

            {/* RANK 1 (EMAS - MAIN PODIUM) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="order-1 md:order-2">
              {rank1 ? (
                <div className="border-2 border-black bg-[#FFC700] p-6 text-center space-y-3 shadow-[8px_8px_0px_#111] transform md:-translate-y-4 relative">
                  <div className="absolute top-0 right-0 bg-black text-[#FFC700] border-l-2 border-b-2 border-black text-[10px] font-mono font-black px-3 py-1 flex items-center gap-1">
                    <Crown className="size-3.5 fill-[#FFC700]" /> JUARA 1
                  </div>
                  <div className="relative inline-block mt-3">
                    <div className="size-24 border-2 border-black mx-auto bg-white flex items-center justify-center shadow-[4px_4px_0px_#111] overflow-hidden">
                      {rank1.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank1.avatar_url} alt={rank1.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-12 text-black" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-black truncate">{rank1.nama_lengkap}</h3>
                    <p className="text-xs font-mono font-black text-black mt-0.5">Angkatan {rank1.angkatan || "-"}</p>
                    <span className="inline-block mt-2 px-3 py-0.5 text-[10px] font-mono font-black uppercase bg-black text-white border border-black -skew-x-6">
                      {getLevelTitle(rank1.xp).title}
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-black flex justify-center gap-4 text-xs font-mono font-black">
                    <span className="text-black flex items-center gap-1">
                      <Star className="size-4 fill-black text-black" /> {rank1.xp} XP
                    </span>
                    <span className="text-[#E60012] flex items-center gap-1">
                      <Flame className="size-4 fill-[#E60012] text-[#E60012]" /> {rank1.streak_count} Hari
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-black border-dashed bg-white p-8 text-center text-xs font-bold text-zinc-400">
                  Belum Ada Juara 1
                </div>
              )}
            </motion.div>

            {/* RANK 3 (PERUNGGU) */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }} className="order-3">
              {rank3 ? (
                <div className="border-2 border-black bg-white p-5 text-center space-y-3 shadow-[6px_6px_0px_#111] relative">
                  <div className="absolute top-0 right-0 bg-amber-800 text-white border-l-2 border-b-2 border-black text-[10px] font-mono font-black px-2.5 py-1">
                    RANK 3 • 🥉
                  </div>
                  <div className="relative inline-block mt-2">
                    <div className="size-20 border-2 border-black mx-auto bg-amber-50 flex items-center justify-center shadow-[3px_3px_0px_#111] overflow-hidden">
                      {rank3.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rank3.avatar_url} alt={rank3.nama_lengkap} className="size-full object-cover" />
                      ) : (
                        <User className="size-10 text-amber-900" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-black truncate">{rank3.nama_lengkap}</h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-500 mt-0.5">Angkatan {rank3.angkatan || "-"}</p>
                  </div>
                  <div className="pt-3 border-t-2 border-black flex justify-center gap-4 text-xs font-mono font-black">
                    <span className="text-black flex items-center gap-1">
                      <Star className="size-4 fill-[#FFC700] text-black" /> {rank3.xp} XP
                    </span>
                    <span className="text-[#E60012] flex items-center gap-1">
                      <Flame className="size-4 fill-[#E60012] text-[#E60012]" /> {rank3.streak_count}d
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-black border-dashed bg-white p-8 text-center text-xs font-bold text-zinc-400">
                  Belum Ada Juara 3
                </div>
              )}
            </motion.div>
          </div>

          {/* RANK 4+ TABLE LIST */}
          <Card className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] rounded-none overflow-hidden mt-6">
            <CardHeader className="border-b-2 border-black bg-[#FAF9F5] p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight text-black">
                  Daftar Peringkat Siswa ({totalMembers} Member)
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-zinc-600">
                  Peringkat #4 ke atas berdasarkan total akumulasi XP.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y-2 divide-black overflow-x-auto no-scrollbar">
              {rankings.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-zinc-500 italic">
                  Belum ada data anggota tambahan pada peringkat ini.
                </div>
              ) : (
                rankings.map((m) => {
                  const level = getLevelTitle(m.xp)
                  const isMe = m.id === myMember?.id

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-4 text-xs transition-colors min-w-[500px] ${
                        isMe ? "bg-amber-100/80 font-black" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="w-8 font-mono font-black text-black text-sm text-center">
                          #{m.rank}
                        </span>
                        <div className="size-10 border-2 border-black bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111]">
                          {m.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatar_url} alt={m.nama_lengkap} className="size-full object-cover" />
                          ) : (
                            <User className="size-5 text-black" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-black text-sm truncate flex items-center gap-2">
                            {m.nama_lengkap}
                            {isMe && (
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 bg-[#E60012] text-white border border-black -skew-x-6">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono font-bold flex items-center gap-2 mt-0.5">
                            <span>Angkatan {m.angkatan || "-"}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 border text-[9px] font-black -skew-x-6 ${level.badgeClass}`}>
                              {level.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-xs font-black">
                        <div className="text-right">
                          <div className="text-black flex items-center gap-1 justify-end text-sm">
                            <Star className="size-4 fill-[#FFC700] text-black" /> {m.xp} XP
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          <div className="text-[#E60012] flex items-center gap-1 justify-end text-sm">
                            <Flame className="size-4 fill-[#E60012] text-[#E60012]" /> {m.streak_count}d
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
