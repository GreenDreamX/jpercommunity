"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  Copy, Trash2, Search, Plus, Filter, FileText, Image as ImageIcon,
  Link as LinkIcon, Archive, Folder, Grid, List, Download, HardDrive,
  ExternalLink, UploadCloud, CheckCircle2, AlertCircle, FileCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type FileItem = {
  id: string
  title: string
  file_url: string
  file_size: number | null
  file_type: string | null
  category: "document" | "image" | "syllabus" | "archive" | "other"
  created_at: string
}

interface FileBankTabProps {
  token: string
}

export function FileBankTab({ token }: FileBankTabProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Layout & Filter states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // File Upload states
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Clipboard copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/studio/file-bank", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? "Gagal mengambil berkas.")
      }
      const data = await res.json()
      setFiles(data.files ?? [])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchFiles()
  }, [fetchFiles])

  // Handle actual file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // 1. Upload to Supabase Storage API
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "materials")

      const uploadRes = await fetch("/api/studio/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadRes.ok) {
        const payload = await uploadRes.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal mengunggah file ke storage.")
      }

      const uploadData = await uploadRes.json()
      const fileUrl = uploadData.url
      const fileSize = uploadData.size
      const fileType = file.type

      // Determine category based on MIME type or name
      let category: FileItem["category"] = "other"
      if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("document") || fileType.includes("text")) {
        category = "document"
      } else if (fileType.includes("image")) {
        category = "image"
      } else if (fileType.includes("zip") || fileType.includes("tar") || fileType.includes("rar")) {
        category = "archive"
      } else if (file.name.toLowerCase().includes("silabus") || file.name.toLowerCase().includes("kurikulum") || file.name.toLowerCase().includes("modul")) {
        category = "syllabus"
      }

      // 2. Save metadata to File Bank database
      const dbRes = await fetch("/api/studio/file-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: file.name,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          category,
        }),
      })

      if (!dbRes.ok) {
        throw new Error("Gagal mendaftarkan file ke database bank berkas.")
      }

      setSuccessMsg(`File "${file.name}" berhasil diunggah!`)
      await fetchFiles()
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas arsip ini dari cloud?")) return

    try {
      const res = await fetch(`/api/studio/file-bank?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menghapus berkas.")
      }

      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.")
    }
  }

  // Handle Copy Link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // File size formatting
  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return "-"
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "document": return <FileText className="size-8 text-blue-500" />
      case "image": return <ImageIcon className="size-8 text-emerald-500" />
      case "syllabus": return <Folder className="size-8 text-amber-500" />
      case "archive": return <Archive className="size-8 text-purple-500" />
      default: return <LinkIcon className="size-8 text-[#6B6862]" />
    }
  }

  const getCategoryMiniIcon = (cat: string) => {
    switch (cat) {
      case "document": return <FileText className="size-3.5 text-blue-500" />
      case "image": return <ImageIcon className="size-3.5 text-emerald-500" />
      case "syllabus": return <Folder className="size-3.5 text-amber-500" />
      case "archive": return <Archive className="size-3.5 text-purple-500" />
      default: return <LinkIcon className="size-3.5 text-[#6B6862]" />
    }
  }

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || 
                          (f.file_type && f.file_type.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = selectedCategory === "all" ? true : f.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Calculate storage metrics (limit 1GB = 1,073,741,824 Bytes)
  const storageLimitBytes = 1073741824
  const totalStorageUsed = files.reduce((acc, f) => acc + (f.file_size || 0), 0)
  const storageUsedPercentage = Math.min((totalStorageUsed / storageLimitBytes) * 100, 100)

  // Recent Uploads (first 3)
  const recentFiles = files.slice(0, 3)

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr] text-[#1C1B1A]">
      {/* DRIVE SIDEBAR */}
      <aside className="space-y-6">
        {/* Real file upload button */}
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold border-none shadow-sm"
          >
            {uploading ? (
              <>
                <UploadCloud className="size-4 animate-bounce" />
                Mengunggah...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Upload File Baru
              </>
            )}
          </Button>
        </div>

        {/* Categories Menu */}
        <div className="space-y-1 bg-[#FAF9F6] border border-[#E4E1DA] p-2 rounded-xl">
          {[
            { value: "all", label: "Semua File", icon: <HardDrive className="size-4" /> },
            { value: "document", label: "Dokumen & PDF", icon: <FileText className="size-4 text-blue-500" /> },
            { value: "image", label: "Gambar & Media", icon: <ImageIcon className="size-4 text-emerald-500" /> },
            { value: "syllabus", label: "Silabus & Modul", icon: <Folder className="size-4 text-amber-500" /> },
            { value: "archive", label: "Arsip Kompresi", icon: <Archive className="size-4 text-purple-500" /> },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.value
                  ? "bg-[#2B3A55]/10 text-[#2B3A55]"
                  : "text-[#6B6862] hover:text-[#1C1B1A] hover:bg-[#E4E1DA]/30"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Storage Bar Indicator */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] mb-2">
            <HardDrive className="size-4 text-[#2B3A55]" />
            <span>Penyimpanan Cloud</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E4E1DA] overflow-hidden mb-1.5">
            <div
              style={{ width: `${storageUsedPercentage}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            />
          </div>
          <div className="text-[10px] font-mono text-[#6B6862] flex justify-between">
            <span>{formatBytes(totalStorageUsed)}</span>
            <span>dari 1 GB</span>
          </div>
        </Card>
      </aside>

      {/* DRIVE MAIN PANELS */}
      <main className="space-y-6">
        {error && (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3.5 text-xs text-[#B23A2E] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* DRIVE HEADER SEARCH & VIEW TOGGLE */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-[#E4E1DA] pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari file, tipe, atau format..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 p-0 rounded-lg border-[#E4E1DA] ${viewMode === "grid" ? "bg-[#2B3A55]/10 border-[#2B3A55]/30 text-[#2B3A55]" : "bg-white"}`}
            >
              <Grid className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 p-0 rounded-lg border-[#E4E1DA] ${viewMode === "list" ? "bg-[#2B3A55]/10 border-[#2B3A55]/30 text-[#2B3A55]" : "bg-white"}`}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* DRIVE QUICK ACCESS SECTION (only if search is empty) */}
        {!search && selectedCategory === "all" && recentFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6862]">Baru Diunggah (Quick Access)</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {recentFiles.map((file) => (
                <Card
                  key={file.id}
                  className="border border-[#E4E1DA] bg-[#FAF9F6] hover:border-[#2B3A55]/40 hover:shadow-sm transition-all rounded-xl p-3 flex flex-col justify-between h-28 cursor-pointer group"
                  onClick={() => window.open(file.file_url, "_blank")}
                >
                  <div className="flex items-start justify-between">
                    {getCategoryIcon(file.category)}
                    <span className="text-[9px] font-mono text-[#6B6862] bg-[#E4E1DA]/40 px-2 py-0.5 rounded-full">
                      {formatBytes(file.file_size)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-[#1C1B1A] truncate group-hover:text-blue-600 transition-colors" title={file.title}>
                      {file.title}
                    </div>
                    <div className="text-[9px] text-[#6B6862] font-mono">
                      {new Date(file.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* DRIVE MAIN WORKSPACE GRID/LIST */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6862]">
            {selectedCategory === "all" ? "Semua Berkas" : `Kategori: ${selectedCategory}`}
          </h3>

          {loading ? (
            <div className="text-center py-20 text-xs font-mono text-[#6B6862]">Memuat penyimpanan Drive...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-20 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-xl bg-[#FAF9F6]/50">
              Tidak ada file yang tersimpan. Gunakan "+ Upload" untuk menyimpan dokumen.
            </div>
          ) : viewMode === "grid" ? (
            /* DRIVE GRID VIEW */
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className="border border-[#E4E1DA] bg-[#FAF9F6] hover:border-[#2B3A55]/40 hover:shadow-sm transition-all rounded-xl overflow-hidden flex flex-col justify-between h-36"
                >
                  {/* File preview icon area */}
                  <div className="flex-1 bg-[#E4E1DA]/20 flex items-center justify-center relative group">
                    {getCategoryIcon(file.category)}
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-[#1C1B1A]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white rounded-full text-blue-600 hover:bg-stone-100 transition-colors"
                        title="Buka Berkas"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                      <button
                        onClick={() => handleCopyLink(file.file_url, file.id)}
                        className="p-1.5 bg-white rounded-full text-emerald-600 hover:bg-stone-100 transition-colors"
                        title="Salin Link"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 bg-white rounded-full text-red-600 hover:bg-stone-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  {/* File info footer */}
                  <div className="p-2.5 border-t border-[#E4E1DA] space-y-0.5 bg-white">
                    <div className="text-[11px] font-bold text-[#1C1B1A] truncate" title={file.title}>
                      {file.title}
                    </div>
                    <div className="text-[9px] font-mono text-[#6B6862] flex justify-between items-center">
                      <span>{formatBytes(file.file_size)}</span>
                      {copiedId === file.id && <span className="text-emerald-600 font-semibold">Link Copied!</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* DRIVE LIST VIEW (TABLE) */
            <div className="overflow-hidden border border-[#E4E1DA] bg-[#FAF9F6] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono bg-[#E4E1DA]/20">
                    <th className="p-3 font-medium">Nama File</th>
                    <th className="p-3 font-medium">Kategori</th>
                    <th className="p-3 font-medium">Ukuran</th>
                    <th className="p-3 font-medium">Diunggah</th>
                    <th className="p-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b border-[#E4E1DA]/50 last:border-none hover:bg-stone-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getCategoryMiniIcon(file.category)}
                          <span className="font-semibold text-[#1C1B1A] truncate max-w-xs sm:max-w-md block" title={file.title}>
                            {file.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[#6B6862] border border-[#E4E1DA]/50">
                          {file.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[#6B6862]">
                        {formatBytes(file.file_size)}
                      </td>
                      <td className="p-3 text-[#6B6862] font-mono">
                        {new Date(file.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 px-2 bg-[#FAF9F6] border border-[#E4E1DA] hover:bg-stone-100 rounded-lg items-center gap-1 text-[10px] font-semibold transition-colors"
                        >
                          <ExternalLink className="size-3" /> Buka
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(file.file_url, file.id)}
                          className="h-7 px-2 border-[#E4E1DA] bg-[#FAF9F6] text-[10px] rounded-lg"
                        >
                          {copiedId === file.id ? "Link Copied!" : "Salin Link"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          className="h-7 px-2 bg-[#B23A2E] text-[#FAF9F6] hover:bg-[#B23A2E]/90 rounded-lg border-none"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
