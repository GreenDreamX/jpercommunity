"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Search, UserCheck, Trash2, Edit3, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Member = {
  id: string
  nama_lengkap: string
  email: string
  nomor_telepon: string
  role: "student" | "alumni" | "admin" | "bendahara" | "pembina" | "ketua_komunitas" | "ketua_angkatan"
  angkatan: string
  alasan_ikut: string
  created_at: string
  avatar_url?: string | null
  cover_url?: string | null
  bio?: string | null
  quote?: string | null
  nickname?: string | null
  hobby?: string | null
  favorite_anime?: string | null
  japanese_level?: string | null
  learning_interest?: string | null
  dream?: string | null
  badge_label?: string | null
  instagram_username?: string | null
  github_username?: string | null
  twitter_username?: string | null
  linkedin_username?: string | null
  discord_username?: string | null
  telegram_username?: string | null
  student_academic_info?: Array<{
    nisn: string
    nis: string
    asal_sekolah: string
    kelas: string
    jurusan?: string
  }>
}

interface MemberManagementProps {
  token: string
}

export function MemberManagement({ token }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [angkatanFilter, setAngkatanFilter] = useState("all")
  const [limit, setLimit] = useState(30)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Member["role"]>("student")
  const [editCohort, setEditCohort] = useState("")
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [updating, setUpdating] = useState(false)

  const fetchMembers = useCallback(async () => {
    setTimeout(() => {
      setLoading(true)
    }, 0)
    try {
      const res = await fetch("/api/studio/members", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Gagal mengambil data anggota.")
      }
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 0)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMembers()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchMembers])

  // Handle toggle edit mode
  const handleStartEdit = (member: Member) => {
    setEditingId(member.id)
    setEditRole(member.role)
    setEditCohort(member.angkatan || "")
    setEditName(member.nama_lengkap)
    setEditPhone(member.nomor_telepon || "")
  }

  // Handle Save Update
  const handleSaveUpdate = async (id: string) => {
    if (!editName.trim()) {
      alert("Nama tidak boleh kosong.")
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/studio/members?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editRole,
          angkatan: editCohort.trim(),
          nama_lengkap: editName.trim(),
          nomor_telepon: editPhone.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error("Gagal menyimpan perubahan.")
      }

      const data = await res.json()
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data.profile } : m))
      )
      setEditingId(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setUpdating(false)
    }
  }

  // Handle Kick Member
  const handleKickMember = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin mengeluarkan anggota ini? Semua data akademis dan profile akan dihapus.")) return

    try {
      const res = await fetch(`/api/studio/members?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error("Gagal mengeluarkan anggota.")
      }

      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.")
    }
  }

  const uniqueCohorts = Array.from(new Set(members.map(m => m.angkatan).filter(Boolean))).sort()

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" ? true : m.role === roleFilter
    const matchesAngkatan = angkatanFilter === "all" ? true : m.angkatan === angkatanFilter
    return matchesSearch && matchesRole && matchesAngkatan
  })

  const totalItems = filteredMembers.length
  const totalPages = Math.ceil(totalItems / limit)
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * limit, currentPage * limit)
  const startIndex = (currentPage - 1) * limit

  return (
    <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg text-[#1C1B1A]">
      <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
          <UserCheck className="size-5 text-[#2B3A55]" />
          Manajemen Anggota Komunitas
        </CardTitle>
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-[#6B6862]" />
            <Input
              placeholder="Cari nama / email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 w-full sm:w-42 rounded-lg"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="border border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 px-2 rounded-lg text-[#1C1B1A]"
          >
            <option value="all">Semua Peran</option>
            <option value="student">Siswa</option>
            <option value="alumni">Alumni</option>
            <option value="admin">Pengurus / Admin</option>
          </select>
          <select
            value={angkatanFilter}
            onChange={(e) => {
              setAngkatanFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="border border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 px-2 rounded-lg text-[#1C1B1A]"
          >
            <option value="all">Semua Angkatan</option>
            {uniqueCohorts.map(cohort => (
              <option key={cohort} value={cohort}>Angkatan {cohort}</option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="border border-[#E4E1DA] bg-[#FAF9F6] text-[11px] h-8 px-2 rounded-lg text-[#1C1B1A] font-semibold focus:outline-none"
          >
            <option value={30}>30 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E] mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-xs text-[#6B6862] font-mono">Memuat daftar anggota...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
            Tidak ada anggota yang cocok dengan filter pencarian.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                  <th className="py-2 font-medium">Nama Lengkap & Kontak</th>
                  <th className="py-2 font-medium">Peran</th>
                  <th className="py-2 font-medium">Angkatan</th>
                  <th className="py-2 font-medium">Detail Akademis</th>
                  <th className="py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => {
                  const isEditing = editingId === member.id
                  const academic = member.student_academic_info?.[0]
                  
                  return (
                    <tr key={member.id} className="border-b border-[#E4E1DA]/50 hover:bg-[#E4E1DA]/10 transition-colors">
                      <td className="py-3 pr-2">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-7 rounded-md max-w-[150px]"
                            />
                            <Input
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-7 rounded-md max-w-[150px] font-mono"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full overflow-hidden bg-[#2B3A55] text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.nama_lengkap} className="size-full object-cover" />
                              ) : (
                                member.nama_lengkap.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1C1B1A] flex items-center gap-1">
                                {member.nama_lengkap}
                                {member.nickname && <span className="text-[10px] text-[#2B3A55] font-mono">(@{member.nickname})</span>}
                              </div>
                              <div className="text-[10px] text-[#6B6862] font-mono">{member.email}</div>
                              <div className="text-[10px] text-[#6B6862] font-mono">{member.nomor_telepon || "-"}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-7 px-1 rounded-md text-[#1C1B1A]"
                          >
                            <option value="student">student</option>
                            <option value="alumni">alumni</option>
                            <option value="admin">admin</option>
                            <option value="bendahara">bendahara</option>
                            <option value="pembina">pembina</option>
                            <option value="ketua_komunitas">ketua_komunitas</option>
                            <option value="ketua_angkatan">ketua_angkatan</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                            member.role === "admin" || member.role === "pembina" || member.role === "ketua_komunitas"
                              ? "bg-[#2B3A55]/10 text-[#2B3A55]"
                              : member.role === "bendahara"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : member.role === "ketua_angkatan"
                              ? "bg-amber-500/10 text-amber-800"
                              : member.role === "alumni"
                              ? "bg-[#E4E1DA] text-[#6B6862]"
                              : "bg-[#B23A2E]/10 text-[#B23A2E]"
                          }`}>
                            {member.role.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono">
                        {isEditing ? (
                          <Input
                            value={editCohort}
                            onChange={(e) => setEditCohort(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-7 rounded-md w-16"
                          />
                        ) : (
                          member.angkatan || "-"
                        )}
                      </td>
                      <td className="py-3">
                        {academic ? (
                          <div className="font-mono text-[10px] text-[#6B6862] space-y-0.5">
                            <div>NISN: {academic.nisn} | NIS: {academic.nis}</div>
                            {academic.kelas && <div>Kelas: {academic.kelas}</div>}
                            {academic.asal_sekolah && <div className="truncate max-w-[150px]">Asal: {academic.asal_sekolah}</div>}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#6B6862]">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              disabled={updating}
                              onClick={() => handleSaveUpdate(member.id)}
                              className="h-7 px-2 bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 rounded-md border-none"
                            >
                              <Save className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="h-7 px-2 border-[#E4E1DA] bg-[#FAF9F6] rounded-md"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(member)}
                              className="h-7 px-2 border-[#E4E1DA] bg-[#FAF9F6] rounded-md text-[10px]"
                            >
                              <Edit3 className="size-3 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleKickMember(member.id)}
                              className="h-7 px-2 bg-[#B23A2E] text-[#FAF9F6] hover:bg-[#B23A2E]/90 rounded-md border-none"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA] mt-4 text-[11px]">
            <div className="text-[#6B6862]">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + limit, totalItems)} dari {totalItems} anggota
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
              >
                Sebelumnya
              </Button>
              <span className="font-mono text-[10px] text-[#1C1B1A]">
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
              >
                Berikutnya
              </Button>
            </div>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
