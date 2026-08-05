"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import {
  BookOpen,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Video,
  ClipboardList,
  X,
  Check,
  AlertCircle,
  Loader2,
  Link2,
  Users,
  GraduationCap,
  Timer,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ─── Types ───────────────────────────────────────────────────

type Course = {
  id: string
  title: string
  description: string
  image_url: string
  is_locked: boolean
  is_hidden: boolean
  created_at: string
}

type CourseWeek = {
  id: string
  course_id: string
  week_number: number
  title: string
  pdf_url: string
  youtube_url: string
  notes_markdown: string
  is_locked: boolean
  is_hidden: boolean
  assignment_title: string | null
  assignment_due_at: string | null
  assignment_description: string | null
}

type Quiz = {
  id: string
  title: string
  is_locked: boolean
  is_hidden: boolean
  opened_at: string | null
  closed_at: string | null
  max_attempts: number
  min_score: number
  time_limit_minutes: number
}

type QuizQuestion = {
  question: string
  options: string[]
  answer: string
}

type MemberSearchResult = {
  id: string
  nama_lengkap: string
  email: string
  angkatan: string
}

const ANGKATAN_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"]

interface CourseManagementProps {
  token: string
}

// ─── Helper ──────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com") && u.pathname.includes("/embed/")) return url
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`
    }
  } catch {
    // not a URL
  }
  return null
}

// ─── Sub-components ───────────────────────────────────────────

function StatusBadge({ locked, hidden }: { locked: boolean; hidden: boolean }) {
  if (hidden) return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-700">
      <EyeOff className="size-2.5" /> Tersembunyi
    </span>
  )
  if (locked) return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono bg-red-50 border border-red-200 text-red-700">
      <Lock className="size-2.5" /> Terkunci
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
      <Check className="size-2.5" /> Aktif
    </span>
  )
}

// ─── File Upload Button ───────────────────────────────────────

function FileUploadButton({
  token,
  folder,
  accept,
  label,
  onUploaded,
  currentUrl,
}: {
  token: string
  folder: string
  accept: string
  label: string
  onUploaded: (url: string, name: string) => void
  currentUrl?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("folder", folder)
      const res = await fetch("/api/studio/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        const data = await res.json() as { message?: string }
        throw new Error(data.message ?? "Gagal upload.")
      }
      const data = await res.json() as { url: string; name: string }
      onUploaded(data.url, data.name)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload gagal.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] text-xs font-medium text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {uploading ? "Mengupload..." : label}
        </button>
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2B3A55] hover:underline"
          >
            <Link2 className="size-3" /> Lihat file
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ""
          }}
        />
      </div>
      {error && <p className="text-[10px] text-[#B23A2E]">{error}</p>}
    </div>
  )
}

// ─── Markdown Editor (split view) ────────────────────────────

function MarkdownEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  return (
    <div className="border border-[#E4E1DA] rounded-lg overflow-hidden">
      <div className="flex border-b border-[#E4E1DA] bg-[#F5F3EE]">
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${tab === "edit" ? "bg-[#FAF9F6] text-[#1C1B1A] border-b-2 border-[#2B3A55]" : "text-[#6B6862] hover:text-[#1C1B1A]"}`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${tab === "preview" ? "bg-[#FAF9F6] text-[#1C1B1A] border-b-2 border-[#2B3A55]" : "text-[#6B6862] hover:text-[#1C1B1A]"}`}
        >
          Preview
        </button>
      </div>
      {tab === "edit" ? (
        <textarea
          rows={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis catatan rangkuman dalam format Markdown...&#10;&#10;# Judul&#10;## Sub-judul&#10;**tebal**, *miring*, `kode`&#10;- Poin"
          className="w-full p-3 text-xs font-mono text-[#1C1B1A] bg-[#FAF9F6] resize-y focus:outline-none"
        />
      ) : (
        <div className="p-3 min-h-[120px] bg-[#FAF9F6] text-xs text-[#1C1B1A] prose prose-sm max-w-none prose-headings:text-[#1C1B1A] prose-headings:font-semibold prose-code:bg-[#E4E1DA]/50 prose-code:rounded prose-code:px-1 prose-code:font-mono">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <span className="text-[#6B6862] italic">Belum ada catatan. Tulis di tab Editor.</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Course Dialog ────────────────────────────────────────────

type CourseDialogProps = {
  open: boolean
  onClose: () => void
  token: string
  editing: Course | null
  onSaved: () => void
}

function CourseDialog({ open, onClose, token, editing, onSaved }: CourseDialogProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "angkatan" | "member">("detail")

  // Detail tab
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLocked, setIsLocked] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [saving, setSaving] = useState(false)

  // Angkatan tab
  const [allowedAngkatan, setAllowedAngkatan] = useState<string[]>([])
  const [loadingAccess, setLoadingAccess] = useState(false)

  // Member unlock tab
  const [memberSearch, setMemberSearch] = useState("")
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [unlockedMembers, setUnlockedMembers] = useState<Array<{ id: string; profile_id: string; profiles: MemberSearchResult }>>([])

  // Load existing access when editing
  useEffect(() => {
    if (!open) {
      setActiveTab("detail")
      return
    }
    if (editing) {
      setTitle(editing.title)
      setDesc(editing.description)
      setImageUrl(editing.image_url)
      setIsLocked(editing.is_locked)
      setIsHidden(editing.is_hidden)
      void loadAccess(editing.id)
    } else {
      setTitle("")
      setDesc("")
      setImageUrl("")
      setIsLocked(false)
      setIsHidden(false)
      setAllowedAngkatan([])
      setUnlockedMembers([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const loadAccess = async (courseId: string) => {
    setLoadingAccess(true)
    try {
      const res = await fetch(`/api/studio/course-access?course_id=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as {
          allowed_angkatan: string[]
          unlock_rows: Array<{ id: string; profile_id: string; profiles: MemberSearchResult }>
        }
        setAllowedAngkatan(data.allowed_angkatan ?? [])
        setUnlockedMembers(data.unlock_rows ?? [])
      }
    } finally {
      setLoadingAccess(false)
    }
  }

  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const url = editing ? `/api/studio/courses?id=${editing.id}` : "/api/studio/courses"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: desc.trim(), image_url: imageUrl.trim(), is_locked: isLocked, is_hidden: isHidden }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan.")
      const saved = await res.json() as { course: Course }
      if (!editing && saved.course) {
        // New course created — switch to angkatan tab for access setup
        setActiveTab("angkatan")
        void loadAccess(saved.course.id)
      }
      onSaved()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan kelas.")
    } finally {
      setSaving(false)
    }
  }

  const toggleAngkatan = async (ang: string) => {
    if (!editing) {
      alert("Simpan detail kelas terlebih dahulu sebelum mengatur akses angkatan.")
      return
    }
    const isSelected = allowedAngkatan.includes(ang)
    try {
      if (isSelected) {
        await fetch(`/api/studio/course-access?type=angkatan&course_id=${editing.id}&angkatan=${ang}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        setAllowedAngkatan((prev) => prev.filter((a) => a !== ang))
      } else {
        await fetch("/api/studio/course-access", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ course_id: editing.id, type: "angkatan", angkatan: ang }),
        })
        setAllowedAngkatan((prev) => [...prev, ang])
      }
    } catch {
      alert("Gagal memperbarui akses angkatan.")
    }
  }

  const searchMembers = useCallback(async (q: string) => {
    if (!q.trim()) { setMemberResults([]); return }
    setSearchingMembers(true)
    try {
      const res = await fetch(`/api/studio/members?search=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { members: MemberSearchResult[] }
        setMemberResults(data.members ?? [])
      }
    } finally {
      setSearchingMembers(false)
    }
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => void searchMembers(memberSearch), 300)
    return () => clearTimeout(t)
  }, [memberSearch, searchMembers])

  const addMemberUnlock = async (member: MemberSearchResult) => {
    if (!editing) { alert("Simpan kelas terlebih dahulu."); return }
    if (unlockedMembers.some((u) => u.profile_id === member.id)) return
    try {
      await fetch("/api/studio/course-access", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: editing.id, type: "profile", profile_id: member.id }),
      })
      setUnlockedMembers((prev) => [...prev, { id: member.id, profile_id: member.id, profiles: member }])
      setMemberSearch("")
      setMemberResults([])
    } catch {
      alert("Gagal menambahkan unlock member.")
    }
  }

  const removeMemberUnlock = async (profileId: string) => {
    if (!editing) return
    try {
      await fetch(`/api/studio/course-access?type=profile&course_id=${editing.id}&profile_id=${profileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setUnlockedMembers((prev) => prev.filter((u) => u.profile_id !== profileId))
    } catch {
      alert("Gagal menghapus unlock member.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Kelas" : "Buat Kelas Baru"}</DialogTitle>
          <DialogDescription>
            {editing ? `Mengedit: ${editing.title}` : "Isi detail kelas baru. Akses angkatan dapat diatur setelah menyimpan."}
          </DialogDescription>
        </DialogHeader>

        {/* Dialog Tabs */}
        <div className="flex border-b border-[#E4E1DA] mb-4">
          {(["detail", "angkatan", "member"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t
                  ? "border-[#2B3A55] text-[#1C1B1A]"
                  : "border-transparent text-[#6B6862] hover:text-[#1C1B1A]"
              }`}
            >
              {t === "detail" && <BookOpen className="size-3.5" />}
              {t === "angkatan" && <GraduationCap className="size-3.5" />}
              {t === "member" && <Users className="size-3.5" />}
              {t === "detail" ? "Detail Kelas" : t === "angkatan" ? "Akses Angkatan" : "Unlock Member"}
            </button>
          ))}
        </div>

        {/* Tab: Detail */}
        {activeTab === "detail" && (
          <form onSubmit={handleSaveDetail} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cd_title" className="text-xs font-semibold text-[#1C1B1A]">Nama Kelas</FieldLabel>
              <Input
                id="cd_title" required placeholder="Contoh: Nihongo N5 Dasar"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cd_desc" className="text-xs font-semibold text-[#1C1B1A]">Deskripsi</FieldLabel>
              <textarea
                id="cd_desc" rows={2} placeholder="Deskripsi singkat kelas..."
                value={desc} onChange={(e) => setDesc(e.target.value)}
                className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-2.5 rounded-lg text-[#1C1B1A] focus:outline-none resize-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cd_image" className="text-xs font-semibold text-[#1C1B1A]">URL Banner Gambar</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="cd_image" placeholder="https://... atau upload dari File Bank"
                  value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg flex-1"
                />
                <FileUploadButton
                  token={token} folder="images"
                  accept="image/jpeg,image/png,image/webp"
                  label="Upload"
                  onUploaded={(url) => setImageUrl(url)}
                  currentUrl={imageUrl || undefined}
                />
              </div>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="preview" className="mt-2 h-20 w-full object-cover rounded-lg border border-[#E4E1DA]" />
              )}
            </Field>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-xs text-[#6B6862] cursor-pointer">
                <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} className="rounded" />
                <Lock className="size-3.5" /> Kunci Kelas
              </label>
              <label className="flex items-center gap-2 text-xs text-[#6B6862] cursor-pointer">
                <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="rounded" />
                <EyeOff className="size-3.5" /> Sembunyikan
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E1DA]">
              <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs border-[#E4E1DA]">
                Batal
              </Button>
              <Button
                type="submit" disabled={saving || !title.trim()}
                className="h-9 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan & Lanjut"}
              </Button>
            </div>
          </form>
        )}

        {/* Tab: Akses Angkatan */}
        {activeTab === "angkatan" && (
          <div className="space-y-4">
            <div className="text-xs text-[#6B6862] bg-[#F5F3EE] rounded-lg p-3 border border-[#E4E1DA]">
              <AlertCircle className="size-3.5 inline mr-1.5 text-[#2B3A55]" />
              Jika tidak ada angkatan yang dipilih, <strong>semua angkatan</strong> dapat mengakses kelas ini.
              Pilih satu atau lebih angkatan untuk membatasi akses.
            </div>
            {loadingAccess ? (
              <div className="text-xs text-[#6B6862] font-mono text-center py-4">Memuat data akses...</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {ANGKATAN_OPTIONS.map((ang) => {
                  const selected = allowedAngkatan.includes(ang)
                  return (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => void toggleAngkatan(ang)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                        selected
                          ? "border-[#2B3A55] bg-[#2B3A55]/5 text-[#2B3A55]"
                          : "border-[#E4E1DA] text-[#6B6862] hover:border-[#2B3A55]/40"
                      }`}
                    >
                      <GraduationCap className={`size-4 ${selected ? "text-[#2B3A55]" : "text-[#6B6862]"}`} />
                      {ang}
                      {selected && <Check className="size-3 text-[#2B3A55]" />}
                    </button>
                  )
                })}
              </div>
            )}
            {allowedAngkatan.length > 0 && (
              <p className="text-[11px] text-[#6B6862] font-mono">
                Dipilih: {allowedAngkatan.sort().join(", ")}
              </p>
            )}
            <div className="flex justify-end pt-2 border-t border-[#E4E1DA]">
              <Button type="button" onClick={onClose} className="h-9 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none">
                Selesai
              </Button>
            </div>
          </div>
        )}

        {/* Tab: Unlock Member */}
        {activeTab === "member" && (
          <div className="space-y-4">
            <div className="text-xs text-[#6B6862] bg-[#F5F3EE] rounded-lg p-3 border border-[#E4E1DA]">
              <AlertCircle className="size-3.5 inline mr-1.5 text-[#2B3A55]" />
              Member yang di-unlock dapat mengakses kelas ini meskipun angkatannya tidak termasuk dalam daftar akses.
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#6B6862]" />
              <input
                type="text"
                placeholder="Cari nama atau email member..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-[#E4E1DA] rounded-lg text-xs bg-[#FAF9F6] focus:outline-none text-[#1C1B1A]"
              />
              {searchingMembers && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-[#6B6862]" />}
            </div>
            {/* Search results */}
            {memberResults.length > 0 && (
              <div className="border border-[#E4E1DA] rounded-lg divide-y divide-[#E4E1DA] max-h-40 overflow-y-auto">
                {memberResults.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#F5F3EE]">
                    <div>
                      <div className="text-xs font-medium text-[#1C1B1A]">{m.nama_lengkap}</div>
                      <div className="text-[10px] text-[#6B6862] font-mono">{m.angkatan} · {m.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void addMemberUnlock(m)}
                      disabled={unlockedMembers.some((u) => u.profile_id === m.id)}
                      className="text-[11px] px-2 py-0.5 rounded border border-[#2B3A55] text-[#2B3A55] hover:bg-[#2B3A55]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {unlockedMembers.some((u) => u.profile_id === m.id) ? "Sudah" : "Tambah"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Unlocked list */}
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B1A] mb-2">
                Member yang Di-unlock ({unlockedMembers.length})
              </p>
              {unlockedMembers.length === 0 ? (
                <div className="text-[11px] text-[#6B6862] italic p-3 border border-dashed border-[#E4E1DA] rounded-lg text-center">
                  Belum ada member yang di-unlock secara khusus.
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {unlockedMembers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2 border border-[#E4E1DA] rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-[#1C1B1A]">{u.profiles?.nama_lengkap ?? u.profile_id}</div>
                        <div className="text-[10px] text-[#6B6862] font-mono">{u.profiles?.angkatan} · {u.profiles?.email}</div>
                      </div>
                      <button type="button" onClick={() => void removeMemberUnlock(u.profile_id)} className="text-[#B23A2E] hover:opacity-80">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-[#E4E1DA]">
              <Button type="button" onClick={onClose} className="h-9 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none">
                Selesai
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Module Types ─────────────────────────────────────────────

type WeekModule = {
  id: string
  course_week_id: string
  type: "file" | "video" | "notes" | "quiz" | "assignment"
  title: string
  content: Record<string, any>
  is_locked: boolean
  is_hidden: boolean
  order_index: number
  created_at: string
}

type WeekDrawerProps = {
  week: CourseWeek
  token: string
  onWeekUpdated: (updated: Partial<CourseWeek>) => void
  onWeekDeleted: () => void
}

function ModuleCard({
  module,
  token,
  quizzes,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  module: WeekModule
  token: string
  quizzes: Quiz[]
  onUpdate: (updated: Partial<WeekModule>) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(module.title)
  const [content, setContent] = useState<Record<string, any>>(module.content || {})
  const [saving, setSaving] = useState(false)

  const saveModule = async (newContent?: Record<string, any>, newTitle?: string) => {
    setSaving(true)
    const payloadTitle = newTitle !== undefined ? newTitle : title
    const payloadContent = newContent !== undefined ? newContent : content
    try {
      const res = await fetch(`/api/studio/modules?id=${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: payloadTitle, content: payloadContent }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan modul.")
      onUpdate({ title: payloadTitle, content: payloadContent })
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan modul.")
    } finally {
      setSaving(false)
    }
  }

  const toggleLock = async () => {
    try {
      const res = await fetch(`/api/studio/modules?id=${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_locked: !module.is_locked }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ is_locked: !module.is_locked })
    } catch {
      alert("Gagal memperbarui status kunci modul.")
    }
  }

  const toggleHide = async () => {
    try {
      const res = await fetch(`/api/studio/modules?id=${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_hidden: !module.is_hidden }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ is_hidden: !module.is_hidden })
    } catch {
      alert("Gagal memperbarui status sembunyi modul.")
    }
  }

  const getModuleIcon = (t: WeekModule["type"]) => {
    switch (t) {
      case "file": return <FileText className="size-4 text-blue-600" />
      case "video": return <Video className="size-4 text-red-600" />
      case "notes": return <Edit3 className="size-4 text-emerald-600" />
      case "quiz": return <ClipboardList className="size-4 text-amber-600" />
      case "assignment": return <Upload className="size-4 text-purple-600" />
    }
  }

  const getModuleLabel = (t: WeekModule["type"]) => {
    switch (t) {
      case "file": return "File Dokumentasi / PDF"
      case "video": return "Video Pembelajaran"
      case "notes": return "Catatan Markdown"
      case "quiz": return "Kuis Sesi"
      case "assignment": return "Tugas Sesi"
    }
  }

  return (
    <div className={`border rounded-lg bg-[#FAF9F6] transition-all overflow-hidden ${module.is_hidden ? "opacity-60 border-amber-300" : module.is_locked ? "border-red-200" : "border-[#E4E1DA]"}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 bg-[#F5F3EE] border-b border-[#E4E1DA]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {getModuleIcon(module.type)}
          <span className="text-xs font-bold text-[#1C1B1A] truncate">{module.title || getModuleLabel(module.type)}</span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E4E1DA]/60 text-[#6B6862]">
            {module.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onMoveUp && onMoveDown && (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                title="Pindahkan ke atas"
                className="p-1 rounded border border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] disabled:opacity-30 disabled:hover:text-[#6B6862]"
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                title="Pindahkan ke bawah"
                className="p-1 rounded border border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] disabled:opacity-30 disabled:hover:text-[#6B6862]"
              >
                <ChevronDown className="size-3" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleLock}
            title={module.is_locked ? "Buka Kunci Modul" : "Kunci Modul"}
            className={`p-1 rounded border transition-colors ${module.is_locked ? "bg-red-50 border-red-200 text-red-700" : "border-[#E4E1DA] text-[#6B6862] hover:border-[#2B3A55]/40"}`}
          >
            {module.is_locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          </button>
          <button
            type="button"
            onClick={toggleHide}
            title={module.is_hidden ? "Tampilkan Modul" : "Sembunyikan Modul"}
            className={`p-1 rounded border transition-colors ${module.is_hidden ? "bg-amber-50 border-amber-200 text-amber-700" : "border-[#E4E1DA] text-[#6B6862] hover:border-[#2B3A55]/40"}`}
          >
            {module.is_hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="p-1 rounded border border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A]"
          >
            <Edit3 className="size-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded border border-transparent text-[#B23A2E] hover:bg-red-50"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {/* Card Content View / Edit */}
      <div className="p-3 text-xs space-y-3">
        {/* Title Editor */}
        {editing && (
          <Field>
            <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Judul Modul</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul PDF Hiragana Bab 1"
              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
            />
          </Field>
        )}

        {/* FILE MODULE */}
        {module.type === "file" && (
          <div className="space-y-2">
            <FileUploadButton
              token={token}
              folder="materials"
              accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Upload File Materi (Max 50MB)"
              currentUrl={content.url}
              onUploaded={(url, name) => {
                const updatedContent = { ...content, url, filename: name }
                setContent(updatedContent)
                void saveModule(updatedContent)
              }}
            />
            {content.url && (
              <div className="text-[10px] text-[#6B6862] font-mono truncate">
                File: {content.filename || content.url}
              </div>
            )}
          </div>
        )}

        {/* VIDEO MODULE */}
        {module.type === "video" && (
          <div className="space-y-2">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">URL Video YouTube</FieldLabel>
              <Input
                value={content.url || ""}
                onChange={(e) => setContent({ ...content, url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
              />
            </Field>
            {content.url && getYoutubeEmbedUrl(content.url) && (
              <div className="rounded-lg overflow-hidden border border-[#E4E1DA] aspect-video w-full max-w-sm">
                <iframe
                  src={getYoutubeEmbedUrl(content.url)!}
                  title="YouTube preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        )}

        {/* NOTES MODULE */}
        {module.type === "notes" && (
          <div className="space-y-2">
            <MarkdownEditor
              value={content.markdown || ""}
              onChange={(md) => setContent({ ...content, markdown: md })}
            />
          </div>
        )}

        {/* QUIZ MODULE */}
        {module.type === "quiz" && (
          <div className="space-y-2">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Pilih Kuis untuk Modul ini</FieldLabel>
              <select
                value={content.quiz_id || ""}
                onChange={(e) => {
                  const selectedQuiz = quizzes.find(q => q.id === e.target.value)
                  const updated = { ...content, quiz_id: e.target.value }
                  setContent(updated)
                  if (selectedQuiz && !title) setTitle(selectedQuiz.title)
                }}
                className="w-full h-9 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2.5 focus:outline-none"
              >
                <option value="">-- Pilih Kuis --</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>{q.title} ({q.time_limit_minutes > 0 ? `${q.time_limit_minutes} mnt` : "No limit"})</option>
                ))}
              </select>
            </Field>
            {quizzes.length === 0 && (
              <p className="text-[10px] text-[#6B6862] italic">Belum ada kuis dibuat di tab Kuis. Buat kuis terlebih dahulu.</p>
            )}
          </div>
        )}

        {/* ASSIGNMENT MODULE */}
        {module.type === "assignment" && (
          <div className="space-y-3">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Batas Waktu Pengumpulan (Due Date)</FieldLabel>
              <Input
                type="datetime-local"
                value={toDatetimeLocal(content.due_at || null)}
                onChange={(e) => setContent({ ...content, due_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Instruksi / Deskripsi Tugas</FieldLabel>
              <MarkdownEditor
                value={content.description || ""}
                onChange={(md) => setContent({ ...content, description: md })}
              />
            </Field>
            <p className="text-[10px] text-[#6B6862] bg-[#F5F3EE] p-2 rounded border border-[#E4E1DA]">
              Siswa dapat mengunggah file tugas langsung dari LMS dengan batas ukuran file maksimum <strong>5 MB</strong>.
            </p>
          </div>
        )}

        {/* Save button when editing or changing fields */}
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={() => void saveModule()}
            disabled={saving}
            className="h-7 px-3 text-[11px] bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none"
          >
            {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : <Check className="size-3 mr-1" />}
            {saving ? "Menyimpan..." : "Simpan Modul"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function WeekDrawer({ week, token, onWeekUpdated, onWeekDeleted }: WeekDrawerProps) {
  const [modules, setModules] = useState<WeekModule[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  // Module addition state
  const [addingType, setAddingType] = useState<WeekModule["type"] | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [modRes, quizRes] = await Promise.all([
        fetch(`/api/studio/modules?course_week_id=${week.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/studio/quizzes?course_week_id=${week.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (modRes.ok) {
        const data = await modRes.json()
        setModules(data.modules || [])
      }
      if (quizRes.ok) {
        const data = await quizRes.json()
        if (data.quiz) setQuizzes([data.quiz])
        else setQuizzes([])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [week.id, token])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const createModule = async (type: WeekModule["type"]) => {
    setCreating(true)
    let defaultContent: Record<string, any> = {}
    if (type === "file") defaultContent = { url: "", filename: "" }
    if (type === "video") defaultContent = { url: "", embed_url: "" }
    if (type === "notes") defaultContent = { markdown: "" }
    if (type === "quiz") defaultContent = { quiz_id: quizzes[0]?.id || "" }
    if (type === "assignment") defaultContent = { description: "", due_at: null, max_size_mb: 5 }

    const defaultTitle = newTitle.trim() || (type === "file" ? "Dokumen Materi" : type === "video" ? "Video Penjelasan" : type === "notes" ? "Catatan Rangkuman" : type === "quiz" ? "Kuis Sesi" : "Pengumpulan Tugas")

    try {
      const res = await fetch("/api/studio/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          course_week_id: week.id,
          type,
          title: defaultTitle,
          content: defaultContent,
          order_index: modules.length,
        }),
      })
      if (!res.ok) throw new Error("Gagal membuat modul.")
      const data = await res.json()
      if (data.module) {
        setModules((prev) => [...prev, data.module])
      }
      setAddingType(null)
      setNewTitle("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menambah modul.")
    } finally {
      setCreating(false)
    }
  }

  const deleteModule = async (id: string) => {
    if (!confirm("Hapus modul ini?")) return
    try {
      await fetch(`/api/studio/modules?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setModules((prev) => prev.filter((m) => m.id !== id))
    } catch {
      alert("Gagal menghapus modul.")
    }
  }

  const moveModule = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= modules.length) return

    const newModules = [...modules]
    const temp = newModules[index]
    newModules[index] = newModules[targetIndex]
    newModules[targetIndex] = temp

    newModules.forEach((m, idx) => {
      m.order_index = idx
    })

    setModules(newModules)

    try {
      await Promise.all([
        fetch(`/api/studio/modules?id=${newModules[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ order_index: newModules[index].order_index }),
        }),
        fetch(`/api/studio/modules?id=${newModules[targetIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ order_index: newModules[targetIndex].order_index }),
        }),
      ])
    } catch {
      alert("Gagal mengubah urutan modul.")
      void loadData()
    }
  }

  return (
    <div className="border-t border-[#E4E1DA] bg-[#F7F6F2] p-4 space-y-4">
      {/* Top action bar: Add module options */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E4E1DA]">
        <div className="text-xs font-bold text-[#1C1B1A] flex items-center gap-1.5">
          <BookOpen className="size-4 text-[#2B3A55]" />
          Daftar Modul Pembelajaran ({modules.length})
        </div>

        {/* Add module picker buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => createModule("file")}
            disabled={creating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-medium transition-colors"
          >
            <Plus className="size-3" /> + File PDF
          </button>
          <button
            type="button"
            onClick={() => createModule("video")}
            disabled={creating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-medium transition-colors"
          >
            <Plus className="size-3" /> + Video
          </button>
          <button
            type="button"
            onClick={() => createModule("notes")}
            disabled={creating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium transition-colors"
          >
            <Plus className="size-3" /> + Catatan
          </button>
          <button
            type="button"
            onClick={() => createModule("quiz")}
            disabled={creating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium transition-colors"
          >
            <Plus className="size-3" /> + Kuis
          </button>
          <button
            type="button"
            onClick={() => createModule("assignment")}
            disabled={creating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-medium transition-colors"
          >
            <Plus className="size-3" /> + Tugas
          </button>
        </div>
      </div>

      {/* Modules List */}
      {loading ? (
        <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat modul pertemuan...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-[#E4E1DA] rounded-lg">
          <p className="text-xs text-[#6B6862]">Belum ada modul di minggu ini.</p>
          <p className="text-[10px] text-[#6B6862]/70 mt-1">Pilih tombol &quot;+ Modul&quot; di atas untuk menambah materi, video, kuis, atau tugas seperlunya.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m, idx) => (
            <ModuleCard
              key={m.id}
              module={m}
              token={token}
              quizzes={quizzes}
              onUpdate={(updated) => setModules((prev) => prev.map((item) => (item.id === m.id ? { ...item, ...updated } : item)))}
              onDelete={() => void deleteModule(m.id)}
              onMoveUp={() => void moveModule(idx, "up")}
              onMoveDown={() => void moveModule(idx, "down")}
              isFirst={idx === 0}
              isLast={idx === modules.length - 1}
            />
          ))}
        </div>
      )}

      {/* Footer delete week action */}
      <div className="flex justify-end pt-2 border-t border-[#E4E1DA]">
        <button
          type="button"
          onClick={onWeekDeleted}
          className="inline-flex items-center gap-1 text-xs text-[#B23A2E] hover:underline"
        >
          <Trash2 className="size-3.5" /> Hapus Seluruh Pertemuan {week.week_number}
        </button>
      </div>
    </div>
  )
}

// ─── Week Accordion Row ───────────────────────────────────────

function WeekRow({
  week,
  token,
  onWeekUpdated,
  onWeekDeleted,
}: {
  week: CourseWeek
  token: string
  onWeekUpdated: (id: string, updated: Partial<CourseWeek>) => void
  onWeekDeleted: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const toggleLock = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/studio/weeks?id=${week.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_locked: !week.is_locked }),
      })
      onWeekUpdated(week.id, { is_locked: !week.is_locked })
    } catch {
      alert("Gagal memperbarui status kunci.")
    }
  }

  const toggleHide = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/studio/weeks?id=${week.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_hidden: !week.is_hidden }),
      })
      onWeekUpdated(week.id, { is_hidden: !week.is_hidden })
    } catch {
      alert("Gagal memperbarui status sembunyi.")
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Hapus Pertemuan ${week.week_number}: ${week.title}? Semua kuis dan tugas terkait akan ikut terhapus.`)) return
    try {
      await fetch(`/api/studio/weeks?id=${week.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      onWeekDeleted(week.id)
    } catch {
      alert("Gagal menghapus pertemuan.")
    }
  }

  return (
    <div className="border border-[#E4E1DA] rounded-lg overflow-hidden">
      {/* Row Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F5F3EE] transition-colors select-none"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#2B3A55]/8 text-[11px] font-bold font-mono text-[#2B3A55] flex-shrink-0">
          {week.week_number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#1C1B1A] truncate">{week.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {week.pdf_url && <span className="text-[10px] text-[#6B6862] flex items-center gap-0.5"><FileText className="size-2.5" /> PDF</span>}
            {week.youtube_url && <span className="text-[10px] text-[#6B6862] flex items-center gap-0.5"><Video className="size-2.5" /> Video</span>}
            {week.assignment_title && <span className="text-[10px] text-[#6B6862] flex items-center gap-0.5"><ClipboardList className="size-2.5" /> Tugas</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-auto" onClick={(e) => e.stopPropagation()}>
          <StatusBadge locked={week.is_locked} hidden={week.is_hidden} />
          <button onClick={toggleLock} title={week.is_locked ? "Buka Kunci" : "Kunci"} className={`p-1.5 rounded border transition-colors ${week.is_locked ? "bg-red-50 border-red-200 text-red-700" : "border-[#E4E1DA] text-[#6B6862] hover:border-[#2B3A55]/40"}`}>
            {week.is_locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          </button>
          <button onClick={toggleHide} title={week.is_hidden ? "Tampilkan" : "Sembunyikan"} className={`p-1.5 rounded border transition-colors ${week.is_hidden ? "bg-amber-50 border-amber-200 text-amber-700" : "border-[#E4E1DA] text-[#6B6862] hover:border-[#2B3A55]/40"}`}>
            {week.is_hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </button>
        </div>
        <div className="text-[#6B6862] ml-1">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </div>

      {/* Drawer Content */}
      {expanded && (
        <WeekDrawer
          week={week}
          token={token}
          onWeekUpdated={(updated) => onWeekUpdated(week.id, updated)}
          onWeekDeleted={handleDelete}
        />
      )}
    </div>
  )
}

// ─── Course Editor Panel ──────────────────────────────────────

function CourseEditorPanel({
  course,
  token,
  onClose,
}: {
  course: Course
  token: string
  onClose: () => void
}) {
  const [weeks, setWeeks] = useState<CourseWeek[]>([])
  const [loadingWeeks, setLoadingWeeks] = useState(true)
  const [addingWeek, setAddingWeek] = useState(false)
  const [newWeekTitle, setNewWeekTitle] = useState("")
  const [newWeekNum, setNewWeekNum] = useState("")
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    void fetchWeeks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id])

  const fetchWeeks = async () => {
    setLoadingWeeks(true)
    try {
      const res = await fetch(`/api/studio/weeks?course_id=${course.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { weeks: CourseWeek[] }
        setWeeks(data.weeks ?? [])
        // Default next week number
        if (data.weeks?.length > 0) {
          setNewWeekNum(String(Math.max(...data.weeks.map((w) => w.week_number)) + 1))
        } else {
          setNewWeekNum("1")
        }
      }
    } finally {
      setLoadingWeeks(false)
    }
  }

  const handleAddWeek = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeekTitle.trim() || !newWeekNum) return
    setSavingNew(true)
    try {
      const res = await fetch("/api/studio/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: course.id, week_number: parseInt(newWeekNum), title: newWeekTitle.trim() }),
      })
      if (!res.ok) throw new Error("Gagal membuat pertemuan.")
      setNewWeekTitle("")
      setAddingWeek(false)
      void fetchWeeks()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal membuat pertemuan.")
    } finally {
      setSavingNew(false)
    }
  }

  const handleWeekUpdated = (id: string, updated: Partial<CourseWeek>) => {
    setWeeks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)))
  }

  const handleWeekDeleted = (id: string) => {
    setWeeks((prev) => prev.filter((w) => w.id !== id))
  }

  return (
    <div className="border border-[#E4E1DA] rounded-lg bg-[#FAF9F6] overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E1DA] bg-[#F5F3EE]">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-[#2B3A55]" />
          <span className="text-sm font-bold text-[#1C1B1A]">{course.title}</span>
          <span className="text-[10px] text-[#6B6862] font-mono">— Silabus Mingguan</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddingWeek((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#2B3A55] text-[#2B3A55] text-xs font-medium hover:bg-[#2B3A55]/5 transition-colors"
          >
            <Plus className="size-3.5" /> Tambah Pertemuan
          </button>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-[#E4E1DA]/50 text-[#6B6862]">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Add week inline form */}
      {addingWeek && (
        <form onSubmit={handleAddWeek} className="flex items-end gap-3 px-4 py-3 border-b border-[#E4E1DA] bg-[#F7F6F2]">
          <Field className="w-24">
            <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Pertemuan Ke-</FieldLabel>
            <Input type="number" required placeholder="1" value={newWeekNum} onChange={(e) => setNewWeekNum(e.target.value)} className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg" />
          </Field>
          <Field className="flex-1">
            <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Judul Pertemuan</FieldLabel>
            <Input required placeholder="Contoh: Pengenalan Hiragana" value={newWeekTitle} onChange={(e) => setNewWeekTitle(e.target.value)} className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg" />
          </Field>
          <Button type="submit" disabled={savingNew} className="h-8 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none mb-0">
            {savingNew ? <Loader2 className="size-3.5 animate-spin" /> : "Simpan"}
          </Button>
          <button type="button" onClick={() => setAddingWeek(false)} className="h-8 px-2 text-[#6B6862] hover:text-[#1C1B1A]">
            <X className="size-3.5" />
          </button>
        </form>
      )}

      {/* Weeks list */}
      <div className="p-4 space-y-2">
        {loadingWeeks ? (
          <div className="text-center py-8 text-xs text-[#6B6862] font-mono">Memuat silabus...</div>
        ) : weeks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#E4E1DA] rounded-lg">
            <BookOpen className="size-8 text-[#E4E1DA] mx-auto mb-3" />
            <p className="text-xs text-[#6B6862]">Belum ada pertemuan. Klik &quot;Tambah Pertemuan&quot; untuk mulai.</p>
          </div>
        ) : (
          weeks.map((week) => (
            <WeekRow
              key={week.id}
              week={week}
              token={token}
              onWeekUpdated={handleWeekUpdated}
              onWeekDeleted={handleWeekDeleted}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Course Card ──────────────────────────────────────────────

function CourseCard({
  course,
  onEdit,
  onManageSilabus,
  onDelete,
  isActive,
}: {
  course: Course
  onEdit: () => void
  onManageSilabus: () => void
  onDelete: () => void
  isActive: boolean
}) {
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isActive ? "border-[#2B3A55] shadow-sm" : "border-[#E4E1DA]"}`}>
      {/* Banner image */}
      {course.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.image_url} alt={course.title} className="h-28 w-full object-cover" />
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-[#2B3A55]/8 to-[#2B3A55]/3 flex items-center justify-center">
          <BookOpen className="size-8 text-[#2B3A55]/30" />
        </div>
      )}
      <div className="p-3 bg-[#FAF9F6]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-[#1C1B1A] leading-snug truncate">{course.title}</h3>
            <p className="text-[10px] text-[#6B6862] mt-0.5 line-clamp-2">{course.description || "Tidak ada deskripsi."}</p>
          </div>
          <StatusBadge locked={course.is_locked} hidden={course.is_hidden} />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1 h-7 text-[11px] font-medium border border-[#E4E1DA] rounded-md text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors"
          >
            <Edit3 className="size-3" /> Edit
          </button>
          <button
            onClick={onManageSilabus}
            className={`flex-1 inline-flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded-md transition-colors ${
              isActive
                ? "bg-[#2B3A55] text-[#FAF9F6]"
                : "bg-[#2B3A55]/8 text-[#2B3A55] hover:bg-[#2B3A55]/15"
            }`}
          >
            <BookOpen className="size-3" /> {isActive ? "Sedang Diedit" : "Silabus"}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 h-7 w-7 flex items-center justify-center rounded-md border border-transparent hover:bg-red-50 hover:border-red-100 text-[#B23A2E] transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export function CourseManagement({ token }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Editor panel state
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true)
    try {
      const res = await fetch("/api/studio/courses", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Gagal mengambil daftar kelas.")
      const data = await res.json() as { courses: Course[] }
      setCourses(data.courses ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoadingCourses(false)
    }
  }, [token])

  useEffect(() => {
    void fetchCourses()
  }, [fetchCourses])

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Hapus kelas ini? Semua silabus, kuis, nilai, dan absensi terkait akan ikut terhapus.")) return
    try {
      await fetch(`/api/studio/courses?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      setCourses((prev) => prev.filter((c) => c.id !== id))
      if (activeCourse?.id === id) setActiveCourse(null)
    } catch {
      alert("Gagal menghapus kelas.")
    }
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {error && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E] flex items-center gap-2">
          <AlertCircle className="size-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1C1B1A]">Kelola Kelas</h2>
          <p className="text-xs text-[#6B6862] mt-0.5">{courses.length} kelas terdaftar</p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setDialogOpen(true) }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors"
        >
          <Plus className="size-4" /> Buat Kelas Baru
        </button>
      </div>

      {/* Course Grid */}
      {loadingCourses ? (
        <div className="text-center py-12 text-xs text-[#6B6862] font-mono">Memuat daftar kelas...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E4E1DA] rounded-lg">
          <BookOpen className="size-10 text-[#E4E1DA] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#6B6862]">Belum ada kelas.</p>
          <p className="text-xs text-[#6B6862]/70 mt-1">Klik &quot;Buat Kelas Baru&quot; untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isActive={activeCourse?.id === course.id}
              onEdit={() => { setEditingCourse(course); setDialogOpen(true) }}
              onManageSilabus={() => setActiveCourse((prev) => prev?.id === course.id ? null : course)}
              onDelete={() => void handleDeleteCourse(course.id)}
            />
          ))}
        </div>
      )}

      {/* Course Editor Panel */}
      {activeCourse && (
        <CourseEditorPanel
          key={activeCourse.id}
          course={activeCourse}
          token={token}
          onClose={() => setActiveCourse(null)}
        />
      )}

      {/* Create / Edit Dialog */}
      <CourseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        token={token}
        editing={editingCourse}
        onSaved={() => { void fetchCourses() }}
      />
    </div>
  )
}
