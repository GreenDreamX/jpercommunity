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
  GraduationCap,
  Search,
  Headphones,
  Sparkles,
  ExternalLink,
  Radio,
  Layers,
  HelpCircle,
  Clock,
  CalendarClock,
  Play,
  Volume2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

type MemberSearchResult = {
  id: string
  nama_lengkap: string
  email: string
  angkatan: string
}

type ModuleType =
  | "file"
  | "video"
  | "notes"
  | "quiz"
  | "assignment"
  | "flashcard"
  | "audio"
  | "grammar"
  | "external_link"
  | "live_session"

type WeekModule = {
  id: string
  course_week_id: string
  type: ModuleType
  title: string
  content: Record<string, any>
  is_locked: boolean
  is_hidden: boolean
  order_index: number
  created_at: string
}

const ANGKATAN_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"]

interface CourseManagementProps {
  token: string
}

// ─── Helper Functions ────────────────────────────────────────

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

// ─── Status Badge Component ──────────────────────────────────

function StatusBadge({ locked, hidden }: { locked: boolean; hidden: boolean }) {
  if (hidden) return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-700 font-medium">
      <EyeOff className="size-3" /> Tersembunyi
    </span>
  )
  if (locked) return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-red-50 border border-red-200 text-red-700 font-medium">
      <Lock className="size-3" /> Terkunci
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
      <Check className="size-3" /> Aktif
    </span>
  )
}

// ─── File Upload Button Component ────────────────────────────

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
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E4E1DA] bg-[#FAF9F6] text-xs font-medium text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin text-[#2B3A55]" /> : <Upload className="size-3.5 text-[#2B3A55]" />}
          {uploading ? "Mengupload..." : label}
        </button>
        {currentUrl && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2B3A55] hover:underline font-mono"
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

// ─── Markdown Editor ─────────────────────────────────────────

function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
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
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Tulis catatan rangkuman dalam format Markdown...\n\n# Judul\n- Poin\n**tebal**"}
          className="w-full p-3 text-xs font-mono text-[#1C1B1A] bg-[#FAF9F6] resize-y focus:outline-none"
        />
      ) : (
        <div className="p-3 min-h-[100px] bg-[#FAF9F6] text-xs text-[#1C1B1A] prose prose-sm max-w-none prose-headings:text-[#1C1B1A] prose-headings:font-semibold">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <span className="text-[#6B6862] italic">Belum ada konten Markdown.</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Course Dialog Component ─────────────────────────────────

type CourseDialogProps = {
  open: boolean
  onClose: () => void
  token: string
  editing: Course | null
  onSaved: () => void
}

function CourseDialog({ open, onClose, token, editing, onSaved }: CourseDialogProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "angkatan" | "member">("detail")

  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLocked, setIsLocked] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [saving, setSaving] = useState(false)

  const [allowedAngkatan, setAllowedAngkatan] = useState<string[]>([])
  const [loadingAccess, setLoadingAccess] = useState(false)

  const [memberSearch, setMemberSearch] = useState("")
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [unlockedMembers, setUnlockedMembers] = useState<Array<{ id: string; profile_id: string; profiles: MemberSearchResult }>>([])

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

  const searchMembers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMemberResults([])
      return
    }
    setSearchingMembers(true)
    try {
      const res = await fetch(`/api/studio/members?search=${encodeURIComponent(query)}&limit=5`, {
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
    const timer = setTimeout(() => {
      if (memberSearch) void searchMembers(memberSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch, searchMembers])

  const addMemberUnlock = async (m: MemberSearchResult) => {
    if (!editing) return
    try {
      const res = await fetch("/api/studio/course-access", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: editing.id, type: "unlock_member", profile_id: m.id }),
      })
      if (res.ok) {
        setUnlockedMembers((prev) => [...prev, { id: Date.now().toString(), profile_id: m.id, profiles: m }])
        setMemberSearch("")
        setMemberResults([])
      }
    } catch {
      alert("Gagal menambahkan unlock member.")
    }
  }

  const removeMemberUnlock = async (profileId: string) => {
    if (!editing) return
    try {
      await fetch(`/api/studio/course-access?type=unlock_member&course_id=${editing.id}&profile_id=${profileId}`, {
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
      <DialogContent className="max-w-lg bg-[#FAF9F6] border-[#E4E1DA]">
        <DialogHeader>
          <DialogTitle className="text-[#1C1B1A] font-bold text-base">
            {editing ? `Edit Kelas: ${editing.title}` : "Buat Kelas Baru"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B6862]">
            Kelola detail kelas, batasan angkatan, atau buka kunci individual member.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E4E1DA] mb-4 bg-[#F5F3EE] rounded-t-lg">
          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
              activeTab === "detail" ? "bg-[#FAF9F6] text-[#2B3A55] border-b-2 border-[#2B3A55]" : "text-[#6B6862]"
            }`}
          >
            1. Detail Kelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("angkatan")}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
              activeTab === "angkatan" ? "bg-[#FAF9F6] text-[#2B3A55] border-b-2 border-[#2B3A55]" : "text-[#6B6862]"
            }`}
          >
            2. Akses Angkatan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("member")}
            className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
              activeTab === "member" ? "bg-[#FAF9F6] text-[#2B3A55] border-b-2 border-[#2B3A55]" : "text-[#6B6862]"
            }`}
          >
            3. Unlock Member
          </button>
        </div>

        {/* Tab: Detail Kelas */}
        {activeTab === "detail" && (
          <form onSubmit={handleSaveDetail} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cd_title" className="text-xs font-semibold text-[#1C1B1A]">Judul Kelas</FieldLabel>
              <Input
                id="cd_title" required placeholder="Contoh: Bahasa Jepang Dasar (N5)"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cd_desc" className="text-xs font-semibold text-[#1C1B1A]">Deskripsi Kelas</FieldLabel>
              <textarea
                id="cd_desc" rows={3} placeholder="Deskripsi singkat kelas..."
                value={desc} onChange={(e) => setDesc(e.target.value)}
                className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-2.5 rounded-lg text-[#1C1B1A] focus:outline-none resize-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cd_image" className="text-xs font-semibold text-[#1C1B1A]">URL Banner Gambar</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="cd_image" placeholder="https://... atau upload dari device"
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
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-[#1C1B1A] font-medium cursor-pointer">
                <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} className="rounded text-[#2B3A55]" />
                <Lock className="size-3.5 text-red-600" /> Kunci Seluruh Kelas
              </label>
              <label className="flex items-center gap-2 text-xs text-[#1C1B1A] font-medium cursor-pointer">
                <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} className="rounded text-[#2B3A55]" />
                <EyeOff className="size-3.5 text-amber-600" /> Sembunyikan dari Siswa
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E1DA]">
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
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B1A] mb-2">
                Member yang Di-unlock Khusus ({unlockedMembers.length})
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

// ─── Module Card Component for Admin Studio ──────────────────

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

  const getModuleConfig = (t: ModuleType) => {
    switch (t) {
      case "file": return { icon: <FileText className="size-4 text-blue-600" />, label: "Dokumen PDF / File", color: "bg-blue-50 text-blue-700 border-blue-200" }
      case "video": return { icon: <Video className="size-4 text-red-600" />, label: "Video YouTube", color: "bg-red-50 text-red-700 border-red-200" }
      case "notes": return { icon: <Edit3 className="size-4 text-emerald-600" />, label: "Catatan Markdown", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      case "quiz": return { icon: <ClipboardList className="size-4 text-amber-600" />, label: "Kuis Sesi", color: "bg-amber-50 text-amber-700 border-amber-200" }
      case "assignment": return { icon: <Upload className="size-4 text-purple-600" />, label: "Tugas Pengumpulan", color: "bg-purple-50 text-purple-700 border-purple-200" }
      case "flashcard": return { icon: <Layers className="size-4 text-indigo-600" />, label: "Flashcard Kotoba", color: "bg-indigo-50 text-indigo-700 border-indigo-200" }
      case "audio": return { icon: <Headphones className="size-4 text-cyan-600" />, label: "Choukai Audio", color: "bg-cyan-50 text-cyan-700 border-cyan-200" }
      case "grammar": return { icon: <Sparkles className="size-4 text-[#2B3A55]" />, label: "Bunpou Grammar", color: "bg-slate-100 text-[#2B3A55] border-slate-300" }
      case "external_link": return { icon: <ExternalLink className="size-4 text-teal-600" />, label: "Embed / Link Media", color: "bg-teal-50 text-teal-700 border-teal-200" }
      case "live_session": return { icon: <Radio className="size-4 text-rose-600" />, label: "Live Session Daring", color: "bg-rose-50 text-rose-700 border-rose-200" }
    }
  }

  const config = getModuleConfig(module.type)

  return (
    <div className={`border rounded-lg bg-[#FAF9F6] transition-all overflow-hidden ${module.is_hidden ? "opacity-60 border-amber-300" : module.is_locked ? "border-red-200" : "border-[#E4E1DA]"}`}>
      {/* Module Header Bar */}
      <div className="flex items-center justify-between p-3 bg-[#F5F3EE] border-b border-[#E4E1DA]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {config.icon}
          <span className="text-xs font-bold text-[#1C1B1A] truncate">{module.title || config.label}</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${config.color}`}>
            {module.type}
          </span>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5">
          {onMoveUp && onMoveDown && (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                title="Pindahkan ke atas"
                className="p-1 rounded border border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] hover:bg-[#E4E1DA]/40 disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                title="Pindahkan ke bawah"
                className="p-1 rounded border border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] hover:bg-[#E4E1DA]/40 disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </>
          )}

          {/* Quick Lock & Hide Toggle */}
          <button
            type="button"
            onClick={toggleLock}
            title={module.is_locked ? "Buka Kunci Modul" : "Kunci Modul"}
            className={`p-1.5 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
              module.is_locked ? "bg-red-50 border-red-200 text-red-700" : "border-[#E4E1DA] text-[#6B6862] hover:bg-[#E4E1DA]/40"
            }`}
          >
            {module.is_locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
          </button>

          <button
            type="button"
            onClick={toggleHide}
            title={module.is_hidden ? "Tampilkan Modul ke Siswa" : "Sembunyikan Modul dari Siswa"}
            className={`p-1.5 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
              module.is_hidden ? "bg-amber-50 border-amber-200 text-amber-700" : "border-[#E4E1DA] text-[#6B6862] hover:bg-[#E4E1DA]/40"
            }`}
          >
            {module.is_hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`p-1.5 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
              editing ? "bg-[#2B3A55] text-white border-[#2B3A55]" : "border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] hover:bg-[#E4E1DA]/40"
            }`}
          >
            <Edit3 className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Hapus Modul"
            className="p-1.5 rounded border border-transparent text-[#B23A2E] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Module Editor & Form Controls */}
      <div className="p-3 text-xs space-y-3">
        {/* Title Editor */}
        <Field>
          <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Judul Modul</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul modul..."
            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
          />
        </Field>

        {/* 1. FILE MODULE */}
        {module.type === "file" && (
          <div className="space-y-2">
            <FileUploadButton
              token={token}
              folder="materials"
              accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Upload File PDF / Dokumentasi"
              currentUrl={content.url}
              onUploaded={(url, name) => {
                const updated = { ...content, url, filename: name }
                setContent(updated)
                void saveModule(updated)
              }}
            />
            {content.url && (
              <div className="text-[10px] text-[#6B6862] font-mono truncate">
                File: {content.filename || content.url}
              </div>
            )}
          </div>
        )}

        {/* 2. VIDEO MODULE */}
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

        {/* 3. NOTES MODULE */}
        {module.type === "notes" && (
          <MarkdownEditor
            value={content.markdown || ""}
            onChange={(md) => setContent({ ...content, markdown: md })}
          />
        )}

        {/* 4. QUIZ MODULE */}
        {module.type === "quiz" && (
          <div className="space-y-2">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Pilih Kuis untuk Modul Ini</FieldLabel>
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
                  <option key={q.id} value={q.id}>{q.title} ({q.time_limit_minutes > 0 ? `${q.time_limit_minutes} mnt` : "Tanpa Batas Waktu"})</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* 5. ASSIGNMENT MODULE */}
        {module.type === "assignment" && (
          <div className="space-y-3">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Batas Waktu Pengumpulan (Due Datetime)</FieldLabel>
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
          </div>
        )}

        {/* 6. FLASHCARD MODULE */}
        {module.type === "flashcard" && (
          <div className="space-y-3 bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Judul Set / Dek Flashcard</FieldLabel>
              <Input
                value={content.deck_title || ""}
                onChange={(e) => setContent({ ...content, deck_title: e.target.value })}
                placeholder="Contoh: Kosakata Bab 1 (Kotoba Meishi)"
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
              />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#1C1B1A]">Daftar Kartu ({(content.cards || []).length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentCards = content.cards || []
                    setContent({
                      ...content,
                      cards: [...currentCards, { word: "", kana: "", romaji: "", meaning: "", example: "" }],
                    })
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2B3A55] hover:underline"
                >
                  <Plus className="size-3" /> Tambah Kartu
                </button>
              </div>
              {(content.cards || []).map((card: any, idx: number) => (
                <div key={idx} className="p-2 border border-[#E4E1DA] rounded-lg bg-[#FAF9F6] space-y-2 relative">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Kata (Kanji/Kana) *"
                      value={card.word || ""}
                      onChange={(e) => {
                        const updated = [...content.cards]
                        updated[idx].word = e.target.value
                        setContent({ ...content, cards: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white font-medium"
                    />
                    <input
                      placeholder="Arti Bahasa Indonesia *"
                      value={card.meaning || ""}
                      onChange={(e) => {
                        const updated = [...content.cards]
                        updated[idx].meaning = e.target.value
                        setContent({ ...content, cards: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Cara baca (Kana / Hiragana)"
                      value={card.kana || ""}
                      onChange={(e) => {
                        const updated = [...content.cards]
                        updated[idx].kana = e.target.value
                        setContent({ ...content, cards: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white font-mono"
                    />
                    <input
                      placeholder="Romaji"
                      value={card.romaji || ""}
                      onChange={(e) => {
                        const updated = [...content.cards]
                        updated[idx].romaji = e.target.value
                        setContent({ ...content, cards: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white font-mono"
                    />
                  </div>
                  <input
                    placeholder="Contoh kalimat (Opsional)"
                    value={card.example || ""}
                    onChange={(e) => {
                      const updated = [...content.cards]
                      updated[idx].example = e.target.value
                      setContent({ ...content, cards: updated })
                    }}
                    className="w-full p-1.5 border border-[#E4E1DA] rounded text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = content.cards.filter((_: any, i: number) => i !== idx)
                      setContent({ ...content, cards: updated })
                    }}
                    className="absolute top-1 right-1 text-[#B23A2E] hover:opacity-80 p-1"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. AUDIO MODULE */}
        {module.type === "audio" && (
          <div className="space-y-3 bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
            <FileUploadButton
              token={token}
              folder="audio"
              accept="audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/ogg"
              label="Upload File Audio Choukai (MP3/WAV)"
              currentUrl={content.audio_url}
              onUploaded={(url, name) => {
                const updated = { ...content, audio_url: url, filename: name }
                setContent(updated)
                void saveModule(updated)
              }}
            />
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">atau Input URL Audio Streaming</FieldLabel>
              <Input
                value={content.audio_url || ""}
                onChange={(e) => setContent({ ...content, audio_url: e.target.value })}
                placeholder="https://.../listening.mp3"
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono"
              />
            </Field>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Transkrip Bahasa Jepang (Jepang / Kana)</FieldLabel>
              <textarea
                rows={3}
                value={content.transcript || ""}
                onChange={(e) => setContent({ ...content, transcript: e.target.value })}
                placeholder="Tulis transkrip percakapan bahasa Jepang di sini..."
                className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-2 rounded-lg font-mono"
              />
            </Field>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Terjemahan Bahasa Indonesia</FieldLabel>
              <textarea
                rows={3}
                value={content.translation || ""}
                onChange={(e) => setContent({ ...content, translation: e.target.value })}
                placeholder="Tulis terjemahan bahasa Indonesia di sini..."
                className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-2 rounded-lg"
              />
            </Field>
          </div>
        )}

        {/* 8. GRAMMAR MODULE */}
        {module.type === "grammar" && (
          <div className="space-y-3 bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
            <div className="grid grid-cols-3 gap-2">
              <Field className="col-span-2">
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Pola Tata Bahasa (Pattern) *</FieldLabel>
                <Input
                  value={content.pattern || ""}
                  onChange={(e) => setContent({ ...content, pattern: e.target.value })}
                  placeholder="Contoh: ～てから (Te kara)"
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-bold"
                />
              </Field>
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Level JLPT</FieldLabel>
                <select
                  value={content.jlpt_level || "N5"}
                  onChange={(e) => setContent({ ...content, jlpt_level: e.target.value })}
                  className="w-full h-8 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2"
                >
                  <option value="N5">JLPT N5</option>
                  <option value="N4">JLPT N4</option>
                  <option value="N3">JLPT N3</option>
                  <option value="N2">JLPT N2</option>
                  <option value="N1">JLPT N1</option>
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Makna / Penggunaan Bahasa Indonesia *</FieldLabel>
              <Input
                value={content.meaning || ""}
                onChange={(e) => setContent({ ...content, meaning: e.target.value })}
                placeholder="Contoh: Setelah melakukan (tindakan A), kemudian (tindakan B)"
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Rumus / Formulasi Pembentukan</FieldLabel>
              <Input
                value={content.formula || ""}
                onChange={(e) => setContent({ ...content, formula: e.target.value })}
                placeholder="Contoh: Kata Kerja Bentuk-Te + から"
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono text-[#2B3A55]"
              />
            </Field>

            {/* Example Sentences */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#1C1B1A]">Contoh Kalimat ({(content.examples || []).length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentEx = content.examples || []
                    setContent({
                      ...content,
                      examples: [...currentEx, { japanese: "", romaji: "", meaning: "" }],
                    })
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2B3A55] hover:underline"
                >
                  <Plus className="size-3" /> Tambah Contoh
                </button>
              </div>
              {(content.examples || []).map((ex: any, idx: number) => (
                <div key={idx} className="p-2 border border-[#E4E1DA] rounded-lg bg-[#FAF9F6] space-y-1.5 relative">
                  <input
                    placeholder="Kalimat Bahasa Jepang *"
                    value={ex.japanese || ""}
                    onChange={(e) => {
                      const updated = [...content.examples]
                      updated[idx].japanese = e.target.value
                      setContent({ ...content, examples: updated })
                    }}
                    className="w-full p-1.5 border border-[#E4E1DA] rounded text-xs bg-white font-medium"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Romaji"
                      value={ex.romaji || ""}
                      onChange={(e) => {
                        const updated = [...content.examples]
                        updated[idx].romaji = e.target.value
                        setContent({ ...content, examples: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white font-mono"
                    />
                    <input
                      placeholder="Terjemahan Indonesia"
                      value={ex.meaning || ""}
                      onChange={(e) => {
                        const updated = [...content.examples]
                        updated[idx].meaning = e.target.value
                        setContent({ ...content, examples: updated })
                      }}
                      className="p-1.5 border border-[#E4E1DA] rounded text-xs bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = content.examples.filter((_: any, i: number) => i !== idx)
                      setContent({ ...content, examples: updated })
                    }}
                    className="absolute top-1 right-1 text-[#B23A2E] hover:opacity-80 p-1"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. EXTERNAL LINK MODULE */}
        {module.type === "external_link" && (
          <div className="space-y-3 bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">URL Tautan / Embed Web *</FieldLabel>
              <Input
                value={content.url || ""}
                onChange={(e) => setContent({ ...content, url: e.target.value })}
                placeholder="https://quizlet.com/..."
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Platform / Sumber</FieldLabel>
                <select
                  value={content.platform || "Quizlet"}
                  onChange={(e) => setContent({ ...content, platform: e.target.value })}
                  className="w-full h-8 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2"
                >
                  <option value="Quizlet">Quizlet</option>
                  <option value="Canva">Canva Presentation</option>
                  <option value="Jisho">Jisho Dictionary</option>
                  <option value="Google Docs">Google Docs / Sheets</option>
                  <option value="Website">Website Eksternal</option>
                </select>
              </Field>
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Teks Tombol Aksi</FieldLabel>
                <Input
                  value={content.button_text || ""}
                  onChange={(e) => setContent({ ...content, button_text: e.target.value })}
                  placeholder="Buka Materi di Quizlet"
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#1C1B1A] font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={content.is_embed === true}
                onChange={(e) => setContent({ ...content, is_embed: e.target.checked })}
                className="rounded text-[#2B3A55]"
              />
              Tampilkan langsung di LMS sebagai Web Embed (IFrame)
            </label>
          </div>
        )}

        {/* 10. LIVE SESSION MODULE */}
        {module.type === "live_session" && (
          <div className="space-y-3 bg-[#F5F3EE] p-3 rounded-lg border border-[#E4E1DA]">
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Platform Daring</FieldLabel>
                <select
                  value={content.platform || "Google Meet"}
                  onChange={(e) => setContent({ ...content, platform: e.target.value })}
                  className="w-full h-8 border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs px-2"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom Meeting</option>
                  <option value="Discord">Discord Voice Channel</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </Field>
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Kode / Passcode Ruangan</FieldLabel>
                <Input
                  value={content.passcode || ""}
                  onChange={(e) => setContent({ ...content, passcode: e.target.value })}
                  placeholder="Contoh: 123456"
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Link Utama Pertemuan Daring *</FieldLabel>
              <Input
                value={content.meeting_url || ""}
                onChange={(e) => setContent({ ...content, meeting_url: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono text-blue-700"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Waktu Mulai *</FieldLabel>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocal(content.start_time || null)}
                  onChange={(e) => setContent({ ...content, start_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                />
              </Field>
              <Field>
                <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Waktu Selesai</FieldLabel>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocal(content.end_time || null)}
                  onChange={(e) => setContent({ ...content, end_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                  className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Catatan / Instruksi Sesi Live</FieldLabel>
              <Input
                value={content.notes || ""}
                onChange={(e) => setContent({ ...content, notes: e.target.value })}
                placeholder="Contoh: Harap hadir 5 menit sebelum sesi dimulai."
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg"
              />
            </Field>
            <Field>
              <FieldLabel className="text-[11px] font-semibold text-[#1C1B1A]">Link Rekaman Sesi (Setelah Kelas Selesai)</FieldLabel>
              <Input
                value={content.recording_url || ""}
                onChange={(e) => setContent({ ...content, recording_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg font-mono"
              />
            </Field>
          </div>
        )}

        {/* Save Button Bar */}
        <div className="flex justify-end pt-2 border-t border-[#E4E1DA]">
          <Button
            type="button"
            onClick={() => void saveModule()}
            disabled={saving}
            className="h-8 px-4 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Check className="size-3.5 mr-1.5" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan Modul"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Module Picker Dialog (Grid Chooser for 10 Module Types) ─

function ModulePickerModal({
  open,
  onClose,
  onSelectType,
}: {
  open: boolean
  onClose: () => void
  onSelectType: (type: ModuleType) => void
}) {
  const options: Array<{ type: ModuleType; title: string; desc: string; icon: React.ReactNode; color: string }> = [
    { type: "file", title: "Dokumen PDF / File", desc: "Unggah materi PDF, dokumen Word, atau slide presentasi.", icon: <FileText className="size-5 text-blue-600" />, color: "bg-blue-50 hover:bg-blue-100/70 border-blue-200" },
    { type: "video", title: "Video Pembelajaran", desc: "Embed penjelaskan video YouTube interaktif.", icon: <Video className="size-5 text-red-600" />, color: "bg-red-50 hover:bg-red-100/70 border-red-200" },
    { type: "notes", title: "Catatan Rangkuman", desc: "Teks terstruktur dalam format Markdown.", icon: <Edit3 className="size-5 text-emerald-600" />, color: "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200" },
    { type: "quiz", title: "Kuis Sesi", desc: "Tautkan kuis penilaian interaktif dari tab Kuis.", icon: <ClipboardList className="size-5 text-amber-600" />, color: "bg-amber-50 hover:bg-amber-100/70 border-amber-200" },
    { type: "assignment", title: "Pengumpulan Tugas", desc: "Slot pengunggahan dokumen tugas siswa.", icon: <Upload className="size-5 text-purple-600" />, color: "bg-purple-50 hover:bg-purple-100/70 border-purple-200" },
    { type: "flashcard", title: "Flashcard Kotoba", desc: "Kartu kosakata & kanji membalik 3D interaktif.", icon: <Layers className="size-5 text-indigo-600" />, color: "bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200" },
    { type: "audio", title: "Choukai Audio", desc: "Latihan mendengar audio dengan transkrip percakapan.", icon: <Headphones className="size-5 text-cyan-600" />, color: "bg-cyan-50 hover:bg-cyan-100/70 border-cyan-200" },
    { type: "grammar", title: "Bunpou Grammar", desc: "Kartu penjelasan tata bahasa Jepang & contoh kalimat.", icon: <Sparkles className="size-5 text-[#2B3A55]" />, color: "bg-slate-100 hover:bg-slate-200 border-slate-300" },
    { type: "external_link", title: "Embed / Resource", desc: "Tautan atau embed Quizlet, Canva, Jisho, & web lain.", icon: <ExternalLink className="size-5 text-teal-600" />, color: "bg-teal-50 hover:bg-teal-100/70 border-teal-200" },
    { type: "live_session", title: "Live Session Daring", desc: "Jadwal tatap muka online Zoom / Meet / Discord.", icon: <Radio className="size-5 text-rose-600" />, color: "bg-rose-50 hover:bg-rose-100/70 border-rose-200" },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl bg-[#FAF9F6] border-[#E4E1DA]">
        <DialogHeader>
          <DialogTitle className="text-[#1C1B1A] font-bold text-base flex items-center gap-2">
            <Plus className="size-4 text-[#2B3A55]" /> Pilih Tipe Modul Pembelajaran
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B6862]">
            Pilih jenis materi atau aktivitas yang ingin ditambahkan ke pertemuan ini.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {options.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                onSelectType(opt.type)
                onClose()
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${opt.color}`}
            >
              <div className="p-2 rounded-lg bg-white/80 border border-black/5 shadow-xs flex-shrink-0">
                {opt.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1C1B1A]">{opt.title}</div>
                <div className="text-[10px] text-[#6B6862] mt-0.5 leading-snug">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Week Drawer Component ───────────────────────────────────

function WeekDrawer({
  week,
  token,
  onWeekUpdated,
  onWeekDeleted,
}: {
  week: CourseWeek
  token: string
  onWeekUpdated: (updated: Partial<CourseWeek>) => void
  onWeekDeleted: () => void
}) {
  const [modules, setModules] = useState<WeekModule[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const [pickerOpen, setPickerOpen] = useState(false)
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

  const createModule = async (type: ModuleType) => {
    setCreating(true)
    let defaultContent: Record<string, any> = {}
    let defaultTitle = ""

    switch (type) {
      case "file":
        defaultContent = { url: "", filename: "" }
        defaultTitle = "Dokumen PDF Materi"
        break
      case "video":
        defaultContent = { url: "", embed_url: "" }
        defaultTitle = "Video Penjelasan YouTube"
        break
      case "notes":
        defaultContent = { markdown: "# Rangkuman Materi\n\n- Poin utama..." }
        defaultTitle = "Catatan Rangkuman"
        break
      case "quiz":
        defaultContent = { quiz_id: quizzes[0]?.id || "" }
        defaultTitle = "Kuis Penilaian Sesi"
        break
      case "assignment":
        defaultContent = { description: "", due_at: null, max_size_mb: 5 }
        defaultTitle = "Pengumpulan Tugas Sesi"
        break
      case "flashcard":
        defaultContent = {
          deck_title: "Kotoba Kosakata Minggu Ini",
          cards: [
            { word: "日本語", kana: "にほんご", romaji: "nihongo", meaning: "Bahasa Jepang", example: "日本語を勉強します。" },
          ],
        }
        defaultTitle = "Dek Flashcard Kotoba"
        break
      case "audio":
        defaultContent = { audio_url: "", filename: "", transcript: "", translation: "" }
        defaultTitle = "Audio Choukai Practice"
        break
      case "grammar":
        defaultContent = {
          pattern: "～てから",
          jlpt_level: "N5",
          meaning: "Setelah melakukan tindakan A, kemudian B",
          formula: "Kata Kerja Bentuk-Te + から",
          examples: [{ japanese: "ご飯を食べてから、学校へ行きます。", romaji: "Gohan wo tabete kara, gakkou e ikimasu.", meaning: "Setelah makan nasi, saya pergi ke sekolah." }],
        }
        defaultTitle = "Tata Bahasa Bunpou"
        break
      case "external_link":
        defaultContent = { url: "https://quizlet.com", platform: "Quizlet", button_text: "Buka di Quizlet", is_embed: false }
        defaultTitle = "Tautan / Embed Quizlet"
        break
      case "live_session":
        defaultContent = {
          platform: "Google Meet",
          meeting_url: "",
          start_time: new Date().toISOString(),
          notes: "Harap bersiap 5 menit sebelum sesi dimulai.",
        }
        defaultTitle = "Sesi Live Daring"
        break
    }

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

    setModules(newModules)

    await Promise.all([
      fetch(`/api/studio/modules?id=${newModules[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_index: index }),
      }),
      fetch(`/api/studio/modules?id=${newModules[targetIndex].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_index: targetIndex }),
      }),
    ])
  }

  return (
    <div className="p-4 bg-[#FAF9F6] border-t border-[#E4E1DA] space-y-4">
      {/* Header bar within week drawer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-bold text-[#1C1B1A]">Modul Pembelajaran Pertemuan {week.week_number}</h4>
          <p className="text-[10px] text-[#6B6862]">Kelola urutan, kunci, atau sembunyikan modul per individu.</p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={creating}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors shadow-xs"
        >
          {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          + Tambah Modul Baru
        </button>
      </div>

      {/* Modules List */}
      {loading ? (
        <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat modul...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-[#E4E1DA] rounded-lg bg-[#FAF9F6]">
          <Layers className="size-8 text-[#E4E1DA] mx-auto mb-2" />
          <p className="text-xs text-[#6B6862] font-medium">Belum ada modul di pertemuan ini.</p>
          <p className="text-[10px] text-[#6B6862]/70 mt-0.5">Klik &quot;+ Tambah Modul Baru&quot; untuk memilih dari 10 tipe modul.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m, idx) => (
            <ModuleCard
              key={m.id}
              module={m}
              token={token}
              quizzes={quizzes}
              onUpdate={(updated) => setModules((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...updated } : x)))}
              onDelete={() => void deleteModule(m.id)}
              onMoveUp={() => void moveModule(idx, "up")}
              onMoveDown={() => void moveModule(idx, "down")}
              isFirst={idx === 0}
              isLast={idx === modules.length - 1}
            />
          ))}
        </div>
      )}

      {/* Delete whole week action */}
      <div className="flex justify-end pt-2 border-t border-[#E4E1DA]">
        <button
          type="button"
          onClick={onWeekDeleted}
          className="inline-flex items-center gap-1 text-xs text-[#B23A2E] hover:underline font-medium"
        >
          <Trash2 className="size-3.5" /> Hapus Seluruh Pertemuan {week.week_number}
        </button>
      </div>

      {/* Grid Picker Modal for 10 Module Types */}
      <ModulePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectType={(t) => void createModule(t)}
      />
    </div>
  )
}

// ─── Week Row Component ──────────────────────────────────────

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
    <div className={`border rounded-lg overflow-hidden transition-all ${week.is_hidden ? "border-amber-300 bg-amber-50/20" : week.is_locked ? "border-red-200" : "border-[#E4E1DA]"}`}>
      {/* Week Accordion Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-[#F5F3EE] transition-colors select-none bg-[#FAF9F6]"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2B3A55] text-white text-xs font-bold font-mono shadow-xs flex-shrink-0">
          {week.week_number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#1C1B1A] truncate">{week.title}</div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#6B6862] font-mono">
            <span>Pertemuan Ke-{week.week_number}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
          <StatusBadge locked={week.is_locked} hidden={week.is_hidden} />
          
          <button
            onClick={toggleLock}
            title={week.is_locked ? "Buka Kunci Pertemuan" : "Kunci Pertemuan"}
            className={`p-1.5 rounded border transition-colors ${week.is_locked ? "bg-red-50 border-red-200 text-red-700" : "border-[#E4E1DA] text-[#6B6862] hover:bg-[#E4E1DA]/40"}`}
          >
            {week.is_locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
          </button>

          <button
            onClick={toggleHide}
            title={week.is_hidden ? "Tampilkan Pertemuan" : "Sembunyikan Pertemuan"}
            className={`p-1.5 rounded border transition-colors ${week.is_hidden ? "bg-amber-50 border-amber-200 text-amber-700" : "border-[#E4E1DA] text-[#6B6862] hover:bg-[#E4E1DA]/40"}`}
          >
            {week.is_hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>

        <div className="text-[#6B6862] ml-1">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </div>

      {/* Expanded Week Drawer */}
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

// ─── Course Editor Panel ─────────────────────────────────────

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
    <div className="border border-[#E4E1DA] rounded-xl bg-[#FAF9F6] overflow-hidden shadow-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E4E1DA] bg-[#F5F3EE]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#2B3A55] text-white">
            <BookOpen className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1C1B1A]">{course.title}</div>
            <div className="text-[10px] text-[#6B6862] font-mono">Manajemen Silabus & Modul Pertemuan</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddingWeek((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#2B3A55] bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors shadow-xs"
          >
            <Plus className="size-3.5" /> + Tambah Pertemuan
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
            <Input required placeholder="Contoh: Pertemuan 1 - Pengenalan Hiragana" value={newWeekTitle} onChange={(e) => setNewWeekTitle(e.target.value)} className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-8 rounded-lg" />
          </Field>
          <Button type="submit" disabled={savingNew} className="h-8 text-xs bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/90 border-none shadow-none mb-0">
            {savingNew ? <Loader2 className="size-3.5 animate-spin" /> : "Simpan Pertemuan"}
          </Button>
          <button type="button" onClick={() => setAddingWeek(false)} className="h-8 px-2 text-[#6B6862] hover:text-[#1C1B1A]">
            <X className="size-3.5" />
          </button>
        </form>
      )}

      {/* Weeks list */}
      <div className="p-4 space-y-2.5">
        {loadingWeeks ? (
          <div className="text-center py-8 text-xs text-[#6B6862] font-mono">Memuat silabus pertemuan...</div>
        ) : weeks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#E4E1DA] rounded-lg">
            <BookOpen className="size-8 text-[#E4E1DA] mx-auto mb-3" />
            <p className="text-xs text-[#6B6862] font-medium">Belum ada pertemuan di kelas ini.</p>
            <p className="text-[10px] text-[#6B6862]/70 mt-1">Klik &quot;+ Tambah Pertemuan&quot; di kanan atas untuk memulai.</p>
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

// ─── Course Card Component ───────────────────────────────────

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
    <div className={`border rounded-xl overflow-hidden transition-all bg-[#FAF9F6] flex flex-col justify-between ${isActive ? "border-[#2B3A55] ring-2 ring-[#2B3A55]/20 shadow-md" : "border-[#E4E1DA] hover:border-[#2B3A55]/40"}`}>
      <div>
        {/* Banner image */}
        {course.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.image_url} alt={course.title} className="h-32 w-full object-cover" />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-[#2B3A55]/10 to-[#2B3A55]/5 flex items-center justify-center">
            <BookOpen className="size-10 text-[#2B3A55]/30" />
          </div>
        )}
        <div className="p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-[#1C1B1A] leading-snug line-clamp-1">{course.title}</h3>
            <StatusBadge locked={course.is_locked} hidden={course.is_hidden} />
          </div>
          <p className="text-[10px] text-[#6B6862] line-clamp-2 leading-relaxed">{course.description || "Tidak ada deskripsi."}</p>
        </div>
      </div>

      <div className="p-3.5 pt-0 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 text-[11px] font-medium border border-[#E4E1DA] rounded-lg text-[#1C1B1A] hover:bg-[#E4E1DA]/40 transition-colors"
        >
          <Edit3 className="size-3" /> Edit Detail
        </button>
        <button
          onClick={onManageSilabus}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold rounded-lg transition-colors ${
            isActive
              ? "bg-[#2B3A55] text-[#FAF9F6]"
              : "bg-[#2B3A55]/10 text-[#2B3A55] hover:bg-[#2B3A55]/20"
          }`}
        >
          <BookOpen className="size-3" /> {isActive ? "Tutup Silabus" : "Buka Silabus"}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 h-8 w-8 flex items-center justify-center rounded-lg border border-transparent hover:bg-red-50 hover:border-red-200 text-[#B23A2E] transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main CourseManagement Component ──────────────────────────

export function CourseManagement({ token }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

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

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1C1B1A]">Manajemen Kelas & Silabus</h2>
          <p className="text-xs text-[#6B6862] mt-0.5">{courses.length} kelas aktif terdaftar</p>
        </div>
        <button
          onClick={() => { setEditingCourse(null); setDialogOpen(true) }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#2B3A55] text-[#FAF9F6] text-xs font-semibold hover:bg-[#2B3A55]/90 transition-colors shadow-xs"
        >
          <Plus className="size-4" /> + Buat Kelas Baru
        </button>
      </div>

      {/* Course Grid */}
      {loadingCourses ? (
        <div className="text-center py-12 text-xs text-[#6B6862] font-mono">Memuat daftar kelas...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E4E1DA] rounded-xl bg-[#FAF9F6]">
          <BookOpen className="size-10 text-[#E4E1DA] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#6B6862]">Belum ada kelas yang dibuat.</p>
          <p className="text-xs text-[#6B6862]/70 mt-1">Klik &quot;+ Buat Kelas Baru&quot; di atas untuk memulai.</p>
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

      {/* Course Editor Panel (Silabus & Modul) */}
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
