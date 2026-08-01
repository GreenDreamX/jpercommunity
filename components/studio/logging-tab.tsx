"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Search, RefreshCw, Activity, Shield, User, Filter, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type ActivityLog = {
  id: string
  actor_id: string | null
  actor_name: string
  actor_role: string
  action: string
  details: string
  category: string
  created_at: string
}

interface LoggingTabProps {
  token: string
}

export function LoggingTab({ token }: LoggingTabProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("SEMUA")

  const categories = ["SEMUA", "ABSENSI", "NILAI", "MEMBER", "PROFIL", "SISTEM"]

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/studio/logs?category=${selectedCategory}`
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal mengambil log aktivitas.")
      }

      const data = await res.json()
      setLogs(data.logs ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }, [token, selectedCategory, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchLogs])

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "ABSENSI":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "NILAI":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "MEMBER":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "PROFIL":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "SISTEM":
        return "bg-zinc-100 text-zinc-700 border-zinc-300"
      default:
        return "bg-stone-100 text-stone-700 border-stone-300"
    }
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="size-5 text-[#B23A2E]" />
            Aktivitas &amp; Log Sistem
          </h2>
          <p className="text-xs text-[#6B6862]">
            Semua perubahan dan aksi dicatat secara otomatis: Siapa, Kapan, dan Apa yang dilakukan.
          </p>
        </div>

        <Button
          onClick={() => fetchLogs()}
          disabled={loading}
          variant="outline"
          className="h-9 px-3 text-xs font-semibold rounded-lg border-[#E4E1DA] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* SEARCH AND CATEGORY FILTERS */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
              <Input
                placeholder="Cari berdasarkan nama pelaku, detail aksi, atau kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-[#E4E1DA] text-xs h-9 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="size-3.5 text-[#6B6862] shrink-0 mr-1" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? "bg-[#2B3A55] text-white"
                      : "bg-[#E4E1DA]/40 text-[#6B6862] hover:bg-[#E4E1DA]/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-xs text-[#B23A2E] bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {/* LOG TIMELINE TABLE */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
        <CardHeader className="pb-3 border-b border-[#E4E1DA]">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Riwayat Aktivitas ({logs.length})</span>
            <span className="text-[10px] font-mono text-[#6B6862] font-normal">Diurutkan berdasarkan waktu terbaru</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-[#6B6862] font-mono flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin text-[#B23A2E]" />
              <span>Memuat log aktivitas...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6B6862] space-y-2">
              <FileText className="size-8 mx-auto text-[#6B6862]/40 stroke-[1.2]" />
              <div>Belum ada log aktivitas dicatat untuk filter ini.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono tracking-wider">
                    <th className="py-2.5 px-3 font-medium">Waktu</th>
                    <th className="py-2.5 px-3 font-medium">Pelaku</th>
                    <th className="py-2.5 px-3 font-medium">Kategori</th>
                    <th className="py-2.5 px-3 font-medium">Detail Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E1DA]/60">
                  {logs.map((log) => {
                    const dateObj = new Date(log.created_at)
                    return (
                      <tr key={log.id} className="hover:bg-[#E4E1DA]/20 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-[#6B6862] align-top">
                          <div className="font-semibold text-[#1C1B1A]">
                            {dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                          <div className="text-[10px] text-[#6B6862]/80">
                            {dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {log.actor_role === "admin" ? (
                              <Shield className="size-3.5 text-[#B23A2E]" />
                            ) : (
                              <User className="size-3.5 text-[#2B3A55]" />
                            )}
                            <span className="font-semibold text-[#1C1B1A]">{log.actor_name}</span>
                          </div>
                          <div className="text-[9px] font-mono text-[#6B6862] uppercase tracking-wider mt-0.5">
                            {log.actor_role}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase ${getCategoryBadgeClass(log.category)}`}>
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 align-top leading-relaxed">
                          <div className="text-xs font-medium text-[#1C1B1A]">
                            {log.details}
                          </div>
                          <div className="text-[10px] font-mono text-[#6B6862] mt-0.5">
                            Action: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">{log.action}</code>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
