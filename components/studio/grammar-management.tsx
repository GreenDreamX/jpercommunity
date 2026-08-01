"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit2, Trash2, RefreshCw, Bookmark, Layers, Save, X, AlertTriangle, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type GrammarItem = {
  id: string
  title: string
  romaji: string | null
  meaning: string
  meaning_id: string | null
  explanation: string | null
  jlpt_level: string | null
  structure: string | null
  example_ja: string | null
  example_id: string | null
  pitch: string | null
  category: string | null
}

interface GrammarManagementProps {
  token: string
}

export function GrammarManagement({ token }: GrammarManagementProps) {
  const [items, setItems] = useState<GrammarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLevel, setActiveLevel] = useState("all")

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<GrammarItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<GrammarItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    romaji: "",
    meaning: "",
    meaning_id: "",
    explanation: "",
    jlpt_level: "N5",
    structure: "",
    example_ja: "",
    example_id: "",
    pitch: "［0］ 平板 (Heiban)",
    category: "Struktur Dasar",
  })

  const levels = [
    { id: "all", label: "Semua Level" },
    { id: "N5", label: "JLPT N5" },
    { id: "N4", label: "JLPT N4" },
    { id: "N3", label: "JLPT N3" },
    { id: "N2", label: "JLPT N2" },
    { id: "N1", label: "JLPT N1" },
  ]

  const fetchGrammar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/studio/grammar?limit=200"
      const params = new URLSearchParams()
      if (activeLevel !== "all") {
        params.append("level", activeLevel)
      }
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim())
      }
      if (params.toString()) {
        url += `&${params.toString()}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error("Gagal mengambil daftar tata bahasa dari database Studio.")
      }

      const data = await res.json()
      setItems(data.items ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
    } finally {
      setLoading(false)
    }
  }, [token, activeLevel, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchGrammar()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchGrammar])

  const openAddModal = () => {
    setFormData({
      title: "",
      romaji: "",
      meaning: "",
      meaning_id: "",
      explanation: "",
      jlpt_level: "N5",
      structure: "",
      example_ja: "",
      example_id: "",
      pitch: "［0］ 平板 (Heiban)",
      category: "Struktur Dasar",
    })
    setShowAddModal(true)
  }

  const openEditModal = (item: GrammarItem) => {
    setEditItem(item)
    setFormData({
      title: item.title,
      romaji: item.romaji || "",
      meaning: item.meaning || "",
      meaning_id: item.meaning_id || "",
      explanation: item.explanation || "",
      jlpt_level: item.jlpt_level || "N5",
      structure: item.structure || "",
      example_ja: item.example_ja || "",
      example_id: item.example_id || "",
      pitch: item.pitch || "［0］ 平板 (Heiban)",
      category: item.category || "Struktur Dasar",
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.meaning.trim()) {
      alert("Judul Pola dan Arti wajib diisi!")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/studio/grammar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal menambah tata bahasa.")
      }

      setShowAddModal(false)
      void fetchGrammar()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menambah tata bahasa.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/studio/grammar?id=${editItem.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal memperbarui tata bahasa.")
      }

      setEditItem(null)
      void fetchGrammar()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui tata bahasa.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/studio/grammar?id=${deleteItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal menghapus tata bahasa.")
      }

      setDeleteItem(null)
      void fetchGrammar()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus tata bahasa.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <Bookmark className="size-5 text-[#B23A2E]" />
            Manajemen Tata Bahasa / Grammar (Studio Admin)
          </h2>
          <p className="text-xs text-[#6B6862]">Panel manajemen CRUD untuk membuat, mengedit, dan menghapus pola tata bahasa, rumus/struktur, penjelasan, dan contoh kalimat.</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-[#B23A2E] hover:bg-[#B23A2E]/90 text-white text-xs h-9 rounded-lg font-semibold shrink-0"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Tata Bahasa Baru
        </Button>
      </div>

      {/* Control Panel: Filters & Search */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E4E1DA] pb-3">
          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setActiveLevel(lvl.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeLevel === lvl.id
                    ? "bg-[#B23A2E] text-white shadow-sm"
                    : "text-[#6B6862] hover:bg-[#E4E1DA]/40"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari pola (Judul, Romaji, Arti, Rumus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg focus-visible:ring-[#B23A2E]"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs font-mono text-[#6B6862] gap-2">
            <RefreshCw className="size-4 animate-spin text-[#B23A2E]" />
            Memuat data tata bahasa dari Studio...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-4 text-xs text-[#B23A2E]">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#6B6862] italic">
            Tidak ada tata bahasa yang ditemukan. Klik "Tambah Tata Bahasa Baru" untuk membuat entri pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E1DA] bg-[#E4E1DA]/20 text-[#6B6862] font-mono text-[10px] uppercase">
                  <th className="p-3">Pola Kalimat</th>
                  <th className="p-3">Level JLPT</th>
                  <th className="p-3">Rumus / Structure</th>
                  <th className="p-3">Arti / Penjelasan</th>
                  <th className="p-3">Contoh Kalimat</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DA]/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#E4E1DA]/10 transition-colors">
                    <td className="p-3 font-medium">
                      <div className="text-sm font-bold text-[#B23A2E]">{item.title}</div>
                      {item.romaji && (
                        <div className="text-[10px] text-[#6B6862] font-mono">({item.romaji})</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#B23A2E]/10 text-[#B23A2E] border border-[#B23A2E]/20 px-2 py-0.5 rounded-full">
                        <Award className="size-2.5" />
                        {item.jlpt_level || "N5"}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs font-mono text-[11px] font-semibold text-[#2B3A55] leading-relaxed">
                      {item.structure || "-"}
                    </td>
                    <td className="p-3 max-w-xs leading-snug text-[#1C1B1A]">
                      <div className="font-semibold">{item.meaning}</div>
                      {item.explanation && (
                        <div className="text-[10px] text-[#6B6862] line-clamp-2 mt-0.5">{item.explanation}</div>
                      )}
                    </td>
                    <td className="p-3 max-w-xs leading-snug">
                      {item.example_ja ? (
                        <div>
                          <div className="text-[11px] font-medium text-[#1C1B1A]">例: {item.example_ja}</div>
                          {item.example_id && (
                            <div className="text-[10px] text-[#6B6862] italic">Arti: {item.example_id}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#6B6862] italic">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-7 w-7 p-0 text-[#2B3A55] hover:bg-[#2B3A55]/10 rounded-md"
                          title="Edit Tata Bahasa"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteItem(item)}
                          className="h-7 w-7 p-0 text-[#B23A2E] hover:bg-[#B23A2E]/10 rounded-md"
                          title="Hapus Tata Bahasa"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE & EDIT MODAL DIALOG */}
      {(showAddModal || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
              <h3 className="text-base font-bold text-[#1C1B1A] flex items-center gap-2">
                <Bookmark className="size-4 text-[#B23A2E]" />
                {editItem ? "Edit Tata Bahasa" : "Tambah Tata Bahasa Baru"}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditItem(null) }}
                className="text-[#6B6862] hover:text-[#1C1B1A]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={editItem ? handleUpdate : handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Judul Pola (Japanese) *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: ～てください"
                    required
                    className="h-8 border-[#E4E1DA] text-xs font-semibold text-[#B23A2E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Romaji</label>
                  <Input
                    value={formData.romaji}
                    onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
                    placeholder="Contoh: ... te kudasai"
                    className="h-8 border-[#E4E1DA] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Level JLPT</label>
                  <select
                    value={formData.jlpt_level}
                    onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                    className="w-full h-8 px-2 border border-[#E4E1DA] bg-white rounded-md text-xs font-semibold text-[#1C1B1A]"
                  >
                    <option value="N5">JLPT N5</option>
                    <option value="N4">JLPT N4</option>
                    <option value="N3">JLPT N3</option>
                    <option value="N2">JLPT N2</option>
                    <option value="N1">JLPT N1</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Kategori Grammar</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Contoh: Permintaan / Partikel"
                    className="h-8 border-[#E4E1DA] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Rumus / Structure *</label>
                <Input
                  value={formData.structure}
                  onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                  placeholder="Contoh: [Verba Bentuk -Te] + ください"
                  required
                  className="h-8 border-[#E4E1DA] text-xs font-mono text-[#2B3A55] font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Pitch / Intonasi Label</label>
                <Input
                  value={formData.pitch}
                  onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                  placeholder="Contoh: ［2］ 中高 (Nakadaka)"
                  className="h-8 border-[#E4E1DA] text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Arti Ringkas (Indonesian/English) *</label>
                <Input
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  placeholder="Contoh: Tolong... / Silakan..."
                  required
                  className="h-8 border-[#E4E1DA] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Penjelasan Penggunaan (Explanation)</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Contoh: Digunakan untuk meminta orang lain melakukan sesuatu secara sopan."
                  rows={2}
                  className="w-full p-2 border border-[#E4E1DA] rounded-md text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Contoh Kalimat (Japanese)</label>
                <Input
                  value={formData.example_ja}
                  onChange={(e) => setFormData({ ...formData, example_ja: e.target.value })}
                  placeholder="Contoh: ゆっくり話してください。"
                  className="h-8 border-[#E4E1DA] text-xs font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Arti Contoh Kalimat (Indonesian)</label>
                <Input
                  value={formData.example_id}
                  onChange={(e) => setFormData({ ...formData, example_id: e.target.value })}
                  placeholder="Contoh: Tolong bicaralah dengan pelan."
                  className="h-8 border-[#E4E1DA] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E1DA]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowAddModal(false); setEditItem(null) }}
                  className="border-[#E4E1DA] text-xs h-9 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#B23A2E] hover:bg-[#B23A2E]/90 text-white text-xs h-9 rounded-lg font-semibold"
                >
                  {submitting ? (
                    <RefreshCw className="size-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="size-4 mr-1.5" />
                  )}
                  {editItem ? "Simpan Perubahan" : "Tambah Tata Bahasa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#B23A2E]/10 rounded-full text-[#B23A2E]">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-[#1C1B1A]">Hapus Tata Bahasa?</h3>
            </div>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Apakah Anda yakin ingin menghapus pola <strong className="text-[#B23A2E]">{deleteItem.title}</strong> dari database?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteItem(null)}
                className="border-[#E4E1DA] text-xs h-9 rounded-lg"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={submitting}
                onClick={handleDelete}
                className="bg-[#B23A2E] hover:bg-[#B23A2E]/90 text-white text-xs h-9 rounded-lg font-semibold border-none"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
