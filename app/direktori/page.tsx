"use client"

import React, { useEffect, useState } from "react"
import { Search, ArrowLeft, Users, GraduationCap, MessageCircle, Send, Sparkles, Heart, BookOpen, Award, Shield, Star, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Brand Social Icons
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
)
const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" className={props.className}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.53-2a75.58,75.58,0,0,0,73,0c.81.69,1.65,1.39,2.53,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129,54.65,122.64,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
)

const PRESET_COVERS: Record<string, string> = {
  "gradient:sunset_sakura": "bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]",
  "gradient:fuji_snow": "bg-gradient-to-r from-[#2F80ED] to-[#56CCF2]",
  "gradient:kyoto_bamboo": "bg-gradient-to-r from-[#11998e] to-[#38ef7d]",
  "gradient:tokyo_neon": "bg-gradient-to-br from-[#8A2387] via-[#E94057] to-[#F27121]",
  "gradient:dark_torii": "bg-gradient-to-r from-[#1F1C2C] to-[#928DAB]",
}

type Member = {
  id: string
  nama_lengkap: string
  email: string
  role: "student" | "alumni" | "admin" | "pembina" | "ketua_komunitas" | "bendahara" | "ketua_angkatan"
  angkatan: string | null
  avatar_url: string | null
  cover_url?: string | null
  card_border?: string | null
  avatar_border?: string | null
  badge_label?: string | null
  bio: string | null
  quote: string | null
  nickname?: string | null
  hobby?: string | null
  favorite_anime?: string | null
  japanese_level?: string | null
  learning_interest?: string | null
  dream?: string | null
  instagram_username: string | null
  github_username: string | null
  nomor_telepon?: string | null
  twitter_username?: string | null
  linkedin_username?: string | null
  discord_username?: string | null
  telegram_username?: string | null
  student_academic_info?: Array<{
    jurusan: string | null
    kelas: string | null
    asal_sekolah: string | null
  }>
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function getCohortBadge(role?: string | null, angkatan?: string | null): { label: string; color: string } {
  const isStaff = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"].includes(role ?? "")
  if (isStaff) {
    const labels: Record<string, string> = {
      admin: "PENGURUS / ADMIN",
      pembina: "PEMBINA",
      ketua_komunitas: "KETUA KOMUNITAS",
      ketua_angkatan: "KETUA ANGKATAN",
      bendahara: "BENDAHARA",
    }
    return { label: `${labels[role!] ?? "PENGURUS"}${angkatan ? ` — ${angkatan}` : ""}`, color: "bg-[#2B3A55]/10 text-[#2B3A55] border-[#2B3A55]/20" }
  }
  if (!angkatan) return { label: role === "alumni" ? "ALUMNI JPER" : "SISWA AKTIF", color: "bg-[#B23A2E]/10 text-[#B23A2E] border-[#B23A2E]/20" }
  const year = parseInt(angkatan, 10)
  if (role === "alumni" || (!isNaN(year) && year <= 2023)) return { label: `ALUMNI ${angkatan}`, color: "bg-amber-500/10 text-amber-800 border-amber-500/20" }
  return { label: `ANGKATAN ${angkatan}`, color: "bg-[#B23A2E]/10 text-[#B23A2E] border-[#B23A2E]/20" }
}

function getCardBorderClass(border?: string | null) {
  switch (border) {
    case "red_flame": return "ring-1 ring-[#B23A2E]/30 shadow-[0_4px_32px_rgba(178,58,46,0.10)]"
    case "gold_vip": return "ring-1 ring-[#D4AF37]/40 shadow-[0_4px_32px_rgba(212,175,55,0.13)]"
    case "deep_ocean": return "ring-1 ring-[#2B3A55]/30 shadow-[0_4px_32px_rgba(43,58,85,0.10)]"
    case "neon_green": return "ring-1 ring-emerald-500/30 shadow-[0_4px_32px_rgba(16,185,129,0.08)]"
    default: return "ring-1 ring-[#E4E1DA]"
  }
}

function getAvatarBorderClass(border?: string | null) {
  switch (border) {
    case "double_gold": return "ring-[3px] ring-amber-400 ring-offset-2 ring-offset-white shadow-[0_0_14px_rgba(245,158,11,0.35)]"
    case "neon_green": return "ring-[3px] ring-emerald-400 ring-offset-2 ring-offset-white"
    case "soft_red_glow": return "ring-[3px] ring-white ring-offset-2 ring-offset-[#B23A2E]/60 shadow-[0_0_18px_rgba(178,58,46,0.4)]"
    default: return "ring-[3px] ring-white ring-offset-1 ring-offset-white/30"
  }
}

export default function DirektoriPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedCohort, setSelectedCohort] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const handleCopyDiscord = (username: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(username)
      setCopiedText(`Discord @${username} disalin!`)
      setTimeout(() => setCopiedText(null), 2500)
    }
  }

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/directory")
        if (!res.ok) throw new Error("Gagal memuat direktori.")
        const data = await res.json()
        setMembers(data.members || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
      } finally {
        setLoading(false)
      }
    }
    void fetchMembers()
  }, [])

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      (m.nickname && m.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (m.bio && m.bio.toLowerCase().includes(search.toLowerCase())) ||
      (m.hobby && m.hobby.toLowerCase().includes(search.toLowerCase()))
    const isStaff = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"].includes(m.role)
    const roleKey = isStaff ? "staff" : m.role
    const matchesRole = selectedRole === "all" ? true : roleKey === selectedRole
    let matchesCohort = true
    if (selectedCohort !== "all") {
      if (selectedCohort === "alumni_range") {
        matchesCohort = m.role === "alumni" || (m.angkatan !== null && parseInt(m.angkatan) <= 2023)
      } else if (selectedCohort === "2027_2028") {
        matchesCohort = m.angkatan === "2027" || m.angkatan === "2028"
      } else {
        matchesCohort = m.angkatan === selectedCohort
      }
    }
    return matchesSearch && matchesRole && matchesCohort
  })

  const studentCount = members.filter(m => m.role === "student" && (!m.angkatan || parseInt(m.angkatan) > 2023)).length
  const alumniCount = members.filter(m => m.role === "alumni" || (m.angkatan !== null && parseInt(m.angkatan) <= 2023)).length
  const staffCount = members.filter(m => ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"].includes(m.role)).length

  return (
    <div className="min-h-svh bg-[#F5F4F0] text-[#1C1B1A] font-sans">

      {/* ── STICKY NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-medium text-[#6B6862] hover:text-[#1C1B1A] transition-colors">
            <ArrowLeft className="size-3.5" />
            Kembali
          </Link>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/image/J-PER.png" alt="JPER Community" className="size-7 object-contain" />
            <span className="font-mono text-sm font-bold tracking-wider text-[#1C1B1A]">JPER Community</span>
          </Link>

          <Link href="/login">
            <Button size="sm" variant="outline" className="rounded-full text-xs font-semibold px-4 h-8 border-[#E4E1DA] text-[#1C1B1A] hover:bg-[#1C1B1A] hover:text-white transition-all">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden border-b border-black/8 bg-white">
        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #1C1B1A 0, #1C1B1A 1px, transparent 0, transparent 50%), repeating-linear-gradient(180deg, #1C1B1A 0, #1C1B1A 1px, transparent 0, transparent 50%)", backgroundSize: "40px 40px" }}
        />

        <div className="relative max-w-6xl mx-auto px-5 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="space-y-4">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5">
                <img src="/image/J-PER.png" alt="JPER" className="size-6 object-contain" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-[#6B6862]">
                  JPER Community · SMKN 1 Majalaya
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1C1B1A] leading-[1.05]">
                Direktori<br />
                <span className="text-[#B23A2E]">Anggota & Alumni</span>
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-[#6B6862]">
                Profil seluruh anggota aktif, pengurus, dan alumni JPER Community lengkap dengan kustomisasi kartu personal.
              </p>
            </div>

            {/* Stats cards */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-2xl border border-[#E4E1DA] bg-[#FAF9F6] px-5 py-4 text-center min-w-[80px]">
                <div className="text-2xl font-extrabold font-mono text-[#1C1B1A]">{members.length}</div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider mt-0.5">Total</div>
              </div>
              <div className="rounded-2xl border border-[#E4E1DA] bg-[#FAF9F6] px-5 py-4 text-center min-w-[80px]">
                <div className="text-2xl font-extrabold font-mono text-[#B23A2E]">{studentCount}</div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider mt-0.5">Siswa</div>
              </div>
              <div className="rounded-2xl border border-[#E4E1DA] bg-[#FAF9F6] px-5 py-4 text-center min-w-[80px]">
                <div className="text-2xl font-extrabold font-mono text-amber-600">{alumniCount}</div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider mt-0.5">Alumni</div>
              </div>
              <div className="rounded-2xl border border-[#E4E1DA] bg-[#FAF9F6] px-5 py-4 text-center min-w-[80px]">
                <div className="text-2xl font-extrabold font-mono text-[#2B3A55]">{staffCount}</div>
                <div className="text-[10px] font-mono text-[#6B6862] uppercase tracking-wider mt-0.5">Pengurus</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="sticky top-14 z-40 bg-white/90 backdrop-blur-xl border-b border-black/8">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#6B6862]" />
            <Input
              placeholder="Cari nama, nickname, bio, hobi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-xl focus:ring-0 focus:border-[#B23A2E]/40"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-xl border transition-all ${showFilters ? "bg-[#1C1B1A] text-white border-[#1C1B1A]" : "bg-[#FAF9F6] text-[#1C1B1A] border-[#E4E1DA] hover:border-[#1C1B1A]/30"}`}
          >
            <Filter className="size-3.5" />
            Filter
          </button>
        </div>
        {showFilters && (
          <div className="max-w-6xl mx-auto px-5 pb-3 flex flex-wrap gap-2 items-center">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A] focus:outline-none focus:border-[#B23A2E]/40"
            >
              <option value="all">Semua Kategori</option>
              <option value="student">Siswa Aktif</option>
              <option value="alumni">Alumni</option>
              <option value="staff">Pengurus</option>
            </select>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A] focus:outline-none focus:border-[#B23A2E]/40"
            >
              <option value="all">Semua Angkatan</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2026">Angkatan 2026</option>
              <option value="2027_2028">Angkatan 2027–2028</option>
              <option value="alumni_range">Alumni (2019–2023)</option>
            </select>
            {(selectedRole !== "all" || selectedCohort !== "all" || search) && (
              <button
                onClick={() => { setSelectedRole("all"); setSelectedCohort("all"); setSearch("") }}
                className="text-[10px] font-mono text-[#B23A2E] hover:underline"
              >
                Reset filter
              </button>
            )}
            <span className="text-[10px] font-mono text-[#6B6862] ml-auto">
              {filteredMembers.length} dari {members.length} anggota
            </span>
          </div>
        )}
      </div>

      {/* ── MEMBER GRID ── */}
      <main className="max-w-6xl mx-auto px-5 py-10 pb-20">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white ring-1 ring-[#E4E1DA] overflow-hidden animate-pulse">
                <div className="h-28 bg-[#E4E1DA]" />
                <div className="px-5 pt-0 pb-5 space-y-3">
                  <div className="flex -mt-7 mb-3">
                    <div className="size-14 rounded-full bg-[#D0CEC9]" />
                  </div>
                  <div className="h-3 bg-[#E4E1DA] rounded w-2/3" />
                  <div className="h-2.5 bg-[#E4E1DA] rounded w-1/2" />
                  <div className="h-2 bg-[#E4E1DA] rounded w-full" />
                  <div className="h-2 bg-[#E4E1DA] rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-xs text-[#B23A2E] bg-[#B23A2E]/5 rounded-2xl border border-[#B23A2E]/20">{error}</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-4xl">🔍</div>
            <div className="text-sm font-semibold text-[#1C1B1A]">Tidak ada anggota ditemukan</div>
            <div className="text-xs text-[#6B6862]">Coba kata kunci atau filter yang berbeda.</div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const academic = member.student_academic_info?.[0]
              const hasAvatar = member.avatar_url && member.avatar_url.trim() !== ""
              const coverVal = member.cover_url || "gradient:sunset_sakura"
              const isGradient = coverVal.startsWith("gradient:")
              const gradientClass = PRESET_COVERS[coverVal] || "bg-gradient-to-r from-[#1F1C2C] to-[#928DAB]"
              const badge = getCohortBadge(member.role, member.angkatan)
              const isStaff = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"].includes(member.role)

              return (
                <article
                  key={member.id}
                  className={`group relative rounded-2xl bg-white overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${getCardBorderClass(member.card_border)}`}
                >
                  {/* ── COVER BANNER ── */}
                  <div className="relative h-28 w-full overflow-hidden">
                    {isGradient ? (
                      <div className={`w-full h-full ${gradientClass}`} />
                    ) : (
                      <img src={coverVal} alt="" className="w-full h-full object-cover" />
                    )}

                    {/* Subtle bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent" />

                    {/* Badge label (custom) */}
                    {member.badge_label && (
                      <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                        ★ {member.badge_label}
                      </div>
                    )}

                    {/* JPER watermark top-left */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <img src="/image/J-PER.png" alt="JPER" className="size-3 object-contain opacity-90" />
                      <span className="text-[8px] font-mono font-bold text-white/80 tracking-wider">JPER</span>
                    </div>
                  </div>

                  {/* ── CARD BODY ── */}
                  <div className="flex-1 flex flex-col px-5 pb-0">
                    {/* Avatar row */}
                    <div className="relative z-10 flex items-end justify-between -mt-9 mb-3">
                      <div className={`size-16 rounded-full overflow-hidden bg-gradient-to-br from-[#2B3A55] to-[#1C1B1A] text-white flex items-center justify-center shrink-0 shadow-lg ${getAvatarBorderClass(member.avatar_border)}`}>
                        {hasAvatar ? (
                          <img src={member.avatar_url!} alt={member.nama_lengkap} className="size-full object-cover" />
                        ) : (
                          <span className="text-base font-extrabold tracking-tight">{getInitials(member.nama_lengkap)}</span>
                        )}
                      </div>

                      {/* Cohort / role badge */}
                      <div className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badge.color}`}>
                        {badge.label}
                      </div>
                    </div>

                    {/* Name & Nickname */}
                    <div className="mb-2.5">
                      <h3 className="font-extrabold text-[15px] text-[#1C1B1A] leading-tight flex items-center gap-1.5">
                        {member.nama_lengkap}
                        {isStaff && <Shield className="size-3.5 text-[#2B3A55] shrink-0" />}
                      </h3>
                      {member.nickname && (
                        <div className="text-[11px] font-mono text-[#B23A2E] font-semibold mt-0.5">@{member.nickname}</div>
                      )}
                    </div>

                    {/* Academic info pill */}
                    {academic && (academic.kelas || academic.jurusan || academic.asal_sekolah) && (
                      <div className="text-[10px] font-mono text-[#6B6862] bg-[#F5F4F0] border border-[#E4E1DA] px-2.5 py-1.5 rounded-lg space-y-0.5 mb-2.5">
                        {academic.kelas && <div>Kelas: <span className="font-bold text-[#1C1B1A]">{academic.kelas}</span></div>}
                        {academic.jurusan && <div>Jurusan: <span className="font-bold text-[#1C1B1A]">{academic.jurusan}</span></div>}
                        {academic.asal_sekolah && <div>Sekolah: <span className="font-bold text-[#1C1B1A]">{academic.asal_sekolah}</span></div>}
                      </div>
                    )}

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-[12px] text-[#6B6862] leading-relaxed line-clamp-2 mb-2.5">
                        {member.bio}
                      </p>
                    )}

                    {/* Quote */}
                    {member.quote && (
                      <div className="border-l-[3px] border-[#B23A2E] pl-3 py-0.5 bg-[#FAF9F6] rounded-r-lg mb-2.5">
                        <p className="text-[11px] font-mono text-[#1C1B1A]/75 italic leading-relaxed line-clamp-2">
                          &ldquo;{member.quote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Interest / Hobby Pills */}
                    {(member.hobby || member.favorite_anime || member.japanese_level || member.learning_interest || member.dream) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {member.hobby && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Sparkles className="size-2.5" />{member.hobby}
                          </span>
                        )}
                        {member.favorite_anime && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            <Heart className="size-2.5" />{member.favorite_anime}
                          </span>
                        )}
                        {member.japanese_level && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-500/10 text-sky-700 border border-sky-500/20 px-2 py-0.5 rounded-full">
                            <Award className="size-2.5" />{member.japanese_level}
                          </span>
                        )}
                        {member.learning_interest && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <BookOpen className="size-2.5" />{member.learning_interest}
                          </span>
                        )}
                        {member.dream && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            <Star className="size-2.5" />Impian: {member.dream}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── SOCIAL FOOTER ── */}
                  <div className="px-5 py-3 border-t border-[#F0EDE8] bg-[#FAF9F6] flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-0.5">
                      {member.nomor_telepon && (
                        <a href={`https://wa.me/${member.nomor_telepon.replace(/[^\d]/g, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="WhatsApp">
                          <MessageCircle className="size-3.5" />
                        </a>
                      )}
                      {member.instagram_username && (
                        <a href={`https://instagram.com/${member.instagram_username}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-[#E4405F] hover:bg-rose-50 transition-colors" title={`@${member.instagram_username}`}>
                          <InstagramIcon className="size-3.5" />
                        </a>
                      )}
                      {member.github_username && (
                        <a href={`https://github.com/${member.github_username}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100 transition-colors" title={`@${member.github_username}`}>
                          <GithubIcon className="size-3.5" />
                        </a>
                      )}
                      {member.twitter_username && (
                        <a href={`https://x.com/${member.twitter_username}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-sky-500 hover:bg-sky-50 transition-colors" title={`@${member.twitter_username}`}>
                          <TwitterIcon className="size-3.5" />
                        </a>
                      )}
                      {member.linkedin_username && (
                        <a href={`https://linkedin.com/in/${member.linkedin_username}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-blue-700 hover:bg-blue-50 transition-colors" title={`@${member.linkedin_username}`}>
                          <LinkedinIcon className="size-3.5" />
                        </a>
                      )}
                      {member.telegram_username && (
                        <a href={`https://t.me/${member.telegram_username}`} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-sky-600 hover:bg-sky-50 transition-colors" title={`@${member.telegram_username}`}>
                          <Send className="size-3.5" />
                        </a>
                      )}
                      {member.discord_username && (
                        <button type="button" onClick={() => handleCopyDiscord(member.discord_username!)}
                          className="p-1.5 rounded-lg text-[#6B6862] hover:text-[#5865F2] hover:bg-indigo-50 transition-colors cursor-pointer" title={`Discord: ${member.discord_username}`}>
                          <DiscordIcon className="size-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="text-[9px] font-mono text-[#C5C2BB] select-none">
                      #{member.id.substring(0, 6)}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E4E1DA] bg-white">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/image/J-PER.png" alt="JPER" className="size-6 object-contain" />
            <span className="text-xs font-mono font-bold text-[#1C1B1A]">JPER Community</span>
            <span className="text-[10px] font-mono text-[#6B6862]">· SMKN 1 Majalaya</span>
          </div>
          <div className="text-[10px] font-mono text-[#6B6862]">
            {members.length} anggota terdaftar · jper.my.id
          </div>
        </div>
      </footer>

      {/* ── DISCORD COPY TOAST ── */}
      {copiedText && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1C1B1A] text-[#FAF9F6] text-[11px] font-mono px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <DiscordIcon className="size-3.5 text-[#5865F2]" />
          {copiedText}
        </div>
      )}
    </div>
  )
}
