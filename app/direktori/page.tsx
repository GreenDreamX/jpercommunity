"use client"

import React, { useEffect, useState } from "react"
import { Search, ArrowLeft, Users, GraduationCap, MessageCircle, Send } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Inline brand SVG icons (not available in lucide-react)
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

type Member = {
  id: string
  nama_lengkap: string
  email: string
  role: "student" | "alumni" | "admin"
  angkatan: string | null
  avatar_url: string | null
  bio: string | null
  quote: string | null
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

// Generate initials from full name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function DirektoriPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopyDiscord = (username: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(username)
      setCopiedText(`Username Discord ${username} disalin!`)
      setTimeout(() => setCopiedText(null), 2500)
    }
  }
  
  // Filter States
  const [search, setSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedCohort, setSelectedCohort] = useState<string>("all")

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/directory")
        if (!res.ok) {
          throw new Error("Gagal memuat direktori.")
        }
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

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
                          (member.bio && member.bio.toLowerCase().includes(search.toLowerCase()))

    const matchesRole = selectedRole === "all" ? true : member.role === selectedRole
    
    let matchesCohort = true
    if (selectedCohort !== "all") {
      if (selectedCohort === "alumni_range") {
        matchesCohort = member.role === "alumni" || (member.angkatan !== null && parseInt(member.angkatan) <= 2023)
      } else if (selectedCohort === "2027_2028") {
        matchesCohort = member.angkatan === "2027" || member.angkatan === "2028"
      } else {
        matchesCohort = member.angkatan === selectedCohort
      }
    }

    return matchesSearch && matchesRole && matchesCohort
  })

  // Count helpers for summary
  const studentCount = members.filter(m => m.role === "student").length
  const alumniCount = members.filter(m => m.role === "alumni").length

  return (
    <div className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] font-sans pb-16">
      {/* Navbar */}
      <header className="border-b border-[#E4E1DA] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-medium text-[#6B6862] hover:text-[#1C1B1A] transition-colors">
            <ArrowLeft className="size-3.5" />
            Kembali
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] font-mono text-[10px] font-semibold tracking-[0.18em] text-[#2B3A55]">
              JP
            </div>
            <span className="text-xs font-semibold tracking-tight text-[#1C1B1A]">JPER Community</span>
          </div>
          <Link href="/login">
            <Button size="sm" variant="outline" className="rounded-lg text-xs font-medium px-3 h-8 border-[#E4E1DA]">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Page Header — clean, flat, no gradient hero */}
      <section className="border-b border-[#E4E1DA] bg-[#FAF9F6]">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.24em] text-[#6B6862]">Direktori</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#1C1B1A] md:text-4xl">
            Anggota & Alumni JPER Community
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B6862]">
            Profil seluruh anggota aktif dan alumni JPER Community SMKN 1 Majalaya.
          </p>
          
          {/* Summary stats */}
          <div className="mt-6 flex gap-6">
            <div className="text-sm">
              <span className="font-semibold text-[#1C1B1A]">{members.length}</span>
              <span className="text-[#6B6862] ml-1">total anggota</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-[#1C1B1A]">{studentCount}</span>
              <span className="text-[#6B6862] ml-1">siswa aktif</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-[#1C1B1A]">{alumniCount}</span>
              <span className="text-[#6B6862] ml-1">alumni</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <main className="max-w-6xl mx-auto px-6 mt-6 space-y-6">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[#6B6862]" />
            <Input
              placeholder="Cari nama atau bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-[#6B6862] shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-[#E4E1DA] bg-white text-xs h-9 px-3 rounded-lg text-[#1C1B1A] focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              <option value="student">Siswa Aktif</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Pengurus / Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-3.5 text-[#6B6862] shrink-0" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full border border-[#E4E1DA] bg-white text-xs h-9 px-3 rounded-lg text-[#1C1B1A] focus:outline-none"
            >
              <option value="all">Semua Angkatan</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2026">Angkatan 2026</option>
              <option value="2027_2028">Angkatan 2027–2028</option>
              <option value="alumni_range">Alumni (2019–2023)</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="text-center py-20 text-xs text-[#6B6862]">Memuat direktori...</div>
        ) : error ? (
          <div className="text-center py-20 text-xs text-[#B23A2E]">{error}</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
            Tidak ada anggota yang ditemukan dengan kata kunci atau filter ini.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const academic = member.student_academic_info?.[0]
              const hasAvatar = member.avatar_url && member.avatar_url.trim() !== ""

              return (
                <Card key={member.id} className="border border-[#E4E1DA] bg-white rounded-lg overflow-hidden flex flex-col justify-between transition-colors hover:border-[#2B3A55]/20">
                  <div className="p-5 space-y-3">
                    {/* Top row: avatar + name block */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar — initials fallback or real photo */}
                      <div className="size-11 rounded-full overflow-hidden bg-[#2B3A55] text-white flex items-center justify-center shrink-0 text-sm font-semibold">
                        {hasAvatar ? (
                          <img src={member.avatar_url!} alt={member.nama_lengkap} className="size-full object-cover" />
                        ) : (
                          getInitials(member.nama_lengkap)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-[#1C1B1A] leading-tight truncate">
                          {member.nama_lengkap}
                        </h4>

                        {/* Role + Angkatan */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`text-[10px] font-medium ${
                            member.role === "admin"
                              ? "text-[#B23A2E]"
                              : member.role === "alumni"
                              ? "text-amber-700"
                              : "text-[#2B3A55]"
                          }`}>
                            {member.role === "admin" ? "Admin" : member.role === "alumni" ? "Alumni" : "Siswa aktif"}
                          </span>
                          {member.angkatan && (
                            <>
                              <span className="text-[#E4E1DA]">·</span>
                              <span className="text-[10px] text-[#6B6862]">
                                Angkatan {member.angkatan}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Class/School info */}
                        {member.role === "student" && academic && (
                          <>
                            {(academic.kelas || academic.jurusan) && (
                              <div className="text-[10px] font-mono text-[#6B6862] mt-0.5">
                                {academic.kelas}{academic.jurusan ? ` · ${academic.jurusan}` : ""}
                              </div>
                            )}
                            {academic.asal_sekolah && ["2026", "2027", "2028"].includes(member.angkatan || "") && (
                              <div className="text-[10px] font-mono text-[#6B6862] mt-0.5">
                                Asal: {academic.asal_sekolah}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-[#6B6862] leading-relaxed line-clamp-2">
                      {member.bio || "Bio belum diisi."}
                    </p>

                    {/* Quote */}
                    {member.quote && (
                      <div className="border-l-2 border-[#B23A2E] pl-3 py-1">
                        <p className="text-[11px] font-mono text-[#1C1B1A]/80 italic leading-relaxed line-clamp-2">
                          &ldquo;{member.quote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Social links footer */}
                  <div className="px-5 py-3 border-t border-[#E4E1DA] flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {/* WhatsApp */}
                      {member.nomor_telepon && (
                        <a
                          href={`https://wa.me/${member.nomor_telepon.replace(/[^\d]/g, "").replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      )}

                      {/* Instagram */}
                      {member.instagram_username && (
                        <a
                          href={`https://instagram.com/${member.instagram_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-[#B23A2E] hover:bg-red-50 transition-colors"
                          title={`@${member.instagram_username}`}
                        >
                          <InstagramIcon className="size-3.5" />
                        </a>
                      )}

                      {/* GitHub */}
                      {member.github_username && (
                        <a
                          href={`https://github.com/${member.github_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100 transition-colors"
                          title={`@${member.github_username}`}
                        >
                          <GithubIcon className="size-3.5" />
                        </a>
                      )}

                      {/* Twitter/X */}
                      {member.twitter_username && (
                        <a
                          href={`https://x.com/${member.twitter_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-sky-500 hover:bg-sky-50 transition-colors"
                          title={`@${member.twitter_username}`}
                        >
                          <TwitterIcon className="size-3.5" />
                        </a>
                      )}

                      {/* LinkedIn */}
                      {member.linkedin_username && (
                        <a
                          href={`https://linkedin.com/in/${member.linkedin_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title={`@${member.linkedin_username}`}
                        >
                          <LinkedinIcon className="size-3.5" />
                        </a>
                      )}

                      {/* Telegram */}
                      {member.telegram_username && (
                        <a
                          href={`https://t.me/${member.telegram_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title={`@${member.telegram_username}`}
                        >
                          <Send className="size-3.5" />
                        </a>
                      )}

                      {/* Discord */}
                      {member.discord_username && (
                        <button
                          type="button"
                          onClick={() => handleCopyDiscord(member.discord_username!)}
                          className="p-1.5 rounded-md text-[#6B6862] hover:text-[#5865F2] hover:bg-indigo-50 transition-colors cursor-pointer"
                          title={`Salin Discord: ${member.discord_username}`}
                        >
                          <DiscordIcon className="size-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="text-[9px] font-mono text-[#E4E1DA]">
                      #{member.id.substring(0, 4)}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Copied toast */}
      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C1B1A] text-[#FAF9F6] text-[11px] font-mono px-3.5 py-2 rounded-lg shadow-lg border border-white/10">
          {copiedText}
        </div>
      )}
    </div>
  )
}
