"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Copy, Trash2, Search, Plus, Filter, FileText, Image as ImageIcon, Link as LinkIcon, Archive, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

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
  
  // Form states
  const [title, setTitle] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [category, setCategory] = useState<FileItem["category"]>("document")
  const [fileSize, setFileSize] = useState("")
  const [fileType, setFileType] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Search & Filter states
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // Clipboard copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchFiles = useCallback(async () => {
    setTimeout(() => {
      setLoading(true)
    }, 0)
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
      setTimeout(() => {
        setLoading(false)
      }, 0)
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchFiles()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchFiles])

  // Handle mock file upload simulation
  const handleSimulateUpload = () => {
    if (!title) {
      alert("Masukkan judul file terlebih dahulu.")
      return
    }
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    let ext = ".pdf"
    let mime = "application/pdf"
    
    if (category === "image") {
      ext = ".jpg"
      mime = "image/jpeg"
    } else if (category === "archive") {
      ext = ".zip"
      mime = "application/zip"
    }
    
    const randomId = Math.floor(Math.random() * 10000)
    const simulatedUrl = `https://ufehqkmxqcqcmwkftqqf.supabase.co/storage/v1/object/public/archives/${cleanTitle}_${randomId}${ext}`
    
    setFileUrl(simulatedUrl)
    setFileType(mime)
    setFileSize((Math.floor(Math.random() * 5000000) + 100000).toString()) // 100KB - 5.1MB
  }

  // Handle manual submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !fileUrl.trim()) return

    setSubmitting(true)
    setSuccessMsg(null)
    setError(null)

    try {
      const res = await fetch("/api/studio/file-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          file_url: fileUrl.trim(),
          file_size: fileSize ? parseInt(fileSize) : null,
          file_type: fileType || null,
          category,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menyimpan berkas.")
      }

      setTitle("")
      setFileUrl("")
      setFileSize("")
      setFileType("")
      setCategory("document")
      setSuccessMsg("Berkas berhasil disimpan ke File Bank!")
      
      // Reload list
      await fetchFiles()
      
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan berkas.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas arsip ini?")) return

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

  // Formatting utils
  const formatBytes = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return "-"
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "document": return <FileText className="size-4 text-blue-600" />
      case "image": return <ImageIcon className="size-4 text-emerald-600" />
      case "syllabus": return <Folder className="size-4 text-amber-600" />
      case "archive": return <Archive className="size-4 text-purple-600" />
      default: return <LinkIcon className="size-4 text-[#6B6862]" />
    }
  }

  // Search and Filtered lists
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || 
                          (f.file_type && f.file_type.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = selectedCategory === "all" ? true : f.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT COLUMN: FILE LIST */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
          <CardHeader className="pb-3 border-b border-[#E4E1DA]">
            <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
              <Folder className="size-5 text-[#2B3A55]" />
              Arsip Berkas Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
                <Input
                  placeholder="Cari arsip..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-[#6B6862]" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A] focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="document">Dokumen / PDF</option>
                  <option value="image">Gambar / Foto</option>
                  <option value="syllabus">Silabus / Modul</option>
                  <option value="archive">Arsip / ZIP</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-xs text-[#6B6862] font-mono">Memuat bank file...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B6862] border border-dashed border-[#E4E1DA] rounded-lg">
                Tidak ada dokumen yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                      <th className="py-2 font-medium">Judul Arsip</th>
                      <th className="py-2 font-medium">Kategori</th>
                      <th className="py-2 font-medium">Ukuran</th>
                      <th className="py-2 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="border-b border-[#E4E1DA]/50 hover:bg-[#E4E1DA]/10 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-[#1C1B1A]">{file.title}</div>
                          <div className="text-[10px] text-[#6B6862] font-mono truncate max-w-[200px] sm:max-w-[300px]">
                            {file.file_url}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 capitalize font-mono text-[10px]">
                            {getCategoryIcon(file.category)}
                            {file.category}
                          </div>
                        </td>
                        <td className="py-3 font-mono text-[#6B6862]">
                          {formatBytes(file.file_size)}
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(file.file_url, file.id)}
                            className="h-7 px-2 border-[#E4E1DA] bg-[#FAF9F6] text-[10px] rounded-lg"
                          >
                            <Copy className="size-3 mr-1" />
                            {copiedId === file.id ? "Copied!" : "Copy Link"}
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
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: UPLOAD / ADD FILE */}
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg h-fit">
          <CardHeader className="pb-3 border-b border-[#E4E1DA]">
            <CardTitle className="text-lg font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
              <Plus className="size-5 text-[#2B3A55]" />
              Tambah Arsip Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMsg && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E]">
                  {error}
                </div>
              )}

              <FieldGroup className="space-y-3">
                <Field>
                  <FieldLabel htmlFor="title" className="text-xs font-semibold text-[#1C1B1A]">Judul Berkas / Arsip</FieldLabel>
                  <Input
                    id="title"
                    placeholder="Contoh: Silabus Bahasa Jepang N5"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="category" className="text-xs font-semibold text-[#1C1B1A]">Kategori Arsip</FieldLabel>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FileItem["category"])}
                    disabled={submitting}
                    className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-3 rounded-lg text-[#1C1B1A] focus:outline-none"
                  >
                    <option value="document">Dokumen / PDF</option>
                    <option value="image">Gambar / Foto</option>
                    <option value="syllabus">Silabus / Modul</option>
                    <option value="archive">Arsip / ZIP</option>
                    <option value="other">Lainnya</option>
                  </select>
                </Field>

                <Field>
                  <div className="flex justify-between items-center mb-1">
                    <FieldLabel htmlFor="file_url" className="text-xs font-semibold text-[#1C1B1A]">URL Berkas</FieldLabel>
                    <button
                      type="button"
                      onClick={handleSimulateUpload}
                      disabled={submitting}
                      className="text-[10px] text-blue-600 hover:underline font-mono"
                    >
                      Simulasikan Upload Storage
                    </button>
                  </div>
                  <Input
                    id="file_url"
                    placeholder="https://example.com/file.pdf"
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    disabled={submitting}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="file_size" className="text-xs font-semibold text-[#1C1B1A]">Ukuran (Bytes)</FieldLabel>
                    <Input
                      id="file_size"
                      placeholder="1024"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      disabled={submitting}
                      className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="file_type" className="text-xs font-semibold text-[#1C1B1A]">Tipe (MIME)</FieldLabel>
                    <Input
                      id="file_type"
                      placeholder="application/pdf"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      disabled={submitting}
                      className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono"
                    />
                  </Field>
                </div>
              </FieldGroup>

              <Button
                type="submit"
                disabled={submitting || !title || !fileUrl}
                className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 w-full h-9 text-xs font-semibold rounded-lg shadow-none border-none mt-2"
              >
                {submitting ? "Menyimpan..." : "Simpan Berkas"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
