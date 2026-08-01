"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit2, Trash2, RefreshCw, BookOpen, Layers, Volume2, Save, X, AlertTriangle, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type DictionaryItem = {
  id: string
  term: string
  reading: string | null
  romaji: string | null
  pos: string | null
  meaning: string
  meaning_id: string | null
  pitch: string | null
  pitch_position: number | null
  example_ja: string | null
  example_id: string | null
  category: string | null
  frequency: number | null
}

interface DictionaryManagementProps {
  token: string
}

export function DictionaryManagement({ token }: DictionaryManagementProps) {
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [editItem, setEditItem] = useState<DictionaryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<DictionaryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    term: "",
    reading: "",
    romaji: "",
    pos: "JLPT N5",
    meaning: "",
    meaning_id: "",
    pitch: "［0］ 平板 (Heiban)",
    pitch_position: 0,
    example_ja: "",
    example_id: "",
    category: "JLPT N5",
  })

  const categories = [
    { id: "all", label: "Semua Kata" },
    { id: "N5", label: "JLPT N5" },
    { id: "N4", label: "JLPT N4" },
    { id: "N3", label: "JLPT N3" },
    { id: "N2", label: "JLPT N2" },
    { id: "N1", label: "JLPT N1" },
  ]

  const fetchDictionary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/studio/dictionary?limit=200"
      const params = new URLSearchParams()
      if (activeCategory !== "all") {
        params.append("category", activeCategory)
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
        throw new Error("Gagal mengambil daftar kosakata dari database Studio.")
      }

      const data = await res.json()
      setItems(data.items ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
    } finally {
      setLoading(false)
    }
  }, [token, activeCategory, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDictionary()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchDictionary])

  const openAddModal = () => {
    setFormData({
      term: "",
      reading: "",
      romaji: "",
      pos: "JLPT N5",
      meaning: "",
      meaning_id: "",
      pitch: "［0］ 平板 (Heiban)",
      pitch_position: 0,
      example_ja: "",
      example_id: "",
      category: "JLPT N5",
    })
    setShowAddModal(true)
  }

  const openEditModal = (item: DictionaryItem) => {
    setEditItem(item)
    setFormData({
      term: item.term,
      reading: item.reading || "",
      romaji: item.romaji || "",
      pos: item.pos || "JLPT N5",
      meaning: item.meaning || "",
      meaning_id: item.meaning_id || "",
      pitch: item.pitch || "［0］ 平板 (Heiban)",
      pitch_position: item.pitch_position || 0,
      example_ja: item.example_ja || "",
      example_id: item.example_id || "",
      category: item.category || "JLPT N5",
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.term.trim() || !formData.meaning.trim()) {
      alert("Kanji/Term dan Arti wajib diisi!")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/studio/dictionary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal menambah kosakata.")
      }

      setShowAddModal(false)
      void fetchDictionary()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menambah kosakata.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/studio/dictionary?id=${editItem.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal memperbarui kosakata.")
      }

      setEditItem(null)
      void fetchDictionary()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui kosakata.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/studio/dictionary?id=${deleteItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.message || "Gagal menghapus kosakata.")
      }

      setDeleteItem(null)
      void fetchDictionary()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kosakata.")
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
            <BookOpen className="size-5 text-[#2B3A55]" />
            Manajemen Kamus & Kosakata (Studio Admin)
          </h2>
          <p className="text-xs text-[#6B6862]">Panel manajemen CRUD untuk menambah, mengedit, dan menghapus kosakata, cara baca, pitch accent, dan contoh kalimat.</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-[#2B3A55] hover:bg-[#2B3A55]/90 text-white text-xs h-9 rounded-lg font-semibold shrink-0"
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Kosakata Baru
        </Button>
      </div>

      {/* Control Panel: Filters & Search */}
      <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E4E1DA] pb-3">
          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[#2B3A55] text-white shadow-sm"
                    : "text-[#6B6862] hover:bg-[#E4E1DA]/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari kata (Kanji, Hiragana, Romaji, Arti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg focus-visible:ring-[#2B3A55]"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs font-mono text-[#6B6862] gap-2">
            <RefreshCw className="size-4 animate-spin text-[#2B3A55]" />
            Memuat data kosakata dari Studio...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-4 text-xs text-[#B23A2E]">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#6B6862] italic">
            Tidak ada kosakata yang ditemukan. Klik "Tambah Kosakata Baru" untuk membuat entri pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E1DA] bg-[#E4E1DA]/20 text-[#6B6862] font-mono text-[10px] uppercase">
                  <th className="p-3">Kosakata / Reading</th>
                  <th className="p-3">Level / POS</th>
                  <th className="p-3">Pitch Accent</th>
                  <th className="p-3">Arti / Terjemahan</th>
                  <th className="p-3">Contoh Kalimat</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DA]/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#E4E1DA]/10 transition-colors">
                    <td className="p-3 font-medium">
                      <div className="text-sm font-bold text-[#1C1B1A]">{item.term}</div>
                      {item.reading && item.reading !== item.term && (
                        <div className="text-[11px] text-[#6B6862] font-mono">({item.reading})</div>
                      )}
                      {item.romaji && (
                        <div className="text-[10px] text-[#2B3A55]/80 font-mono">{item.romaji}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#2B3A55]/10 text-[#2B3A55] border border-[#2B3A55]/20 px-2 py-0.5 rounded-full">
                        <Award className="size-2.5" />
                        {item.category || item.pos || "JLPT N5"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-emerald-700">
                      {item.pitch || "［0］ 平板 (Heiban)"}
                    </td>
                    <td className="p-3 max-w-xs leading-snug text-[#1C1B1A]">
                      <div className="font-semibold">{item.meaning}</div>
                      {item.meaning_id && item.meaning_id !== item.meaning && (
                        <div className="text-[10px] text-[#6B6862] line-clamp-2 mt-0.5">{item.meaning_id}</div>
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
                          title="Edit Kosakata"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteItem(item)}
                          className="h-7 w-7 p-0 text-[#B23A2E] hover:bg-[#B23A2E]/10 rounded-md"
                          title="Hapus Kosakata"
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
                <BookOpen className="size-4 text-[#2B3A55]" />
                {editItem ? "Edit Kosakata" : "Tambah Kosakata Baru"}
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
                  <label className="font-semibold text-[#1C1B1A]">Kanji / Term *</label>
                  <Input
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="Contoh: 先生"
                    required
                    className="h-8 border-[#E4E1DA] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Reading (Hiragana/Katakana)</label>
                  <Input
                    value={formData.reading}
                    onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                    placeholder="Contoh: せんせい"
                    className="h-8 border-[#E4E1DA] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">Romaji</label>
                  <Input
                    value={formData.romaji}
                    onChange={(e) => setFormData({ ...formData, romaji: e.target.value })}
                    placeholder="Contoh: sensei"
                    className="h-8 border-[#E4E1DA] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#1C1B1A]">JLPT Level / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, pos: e.target.value })}
                    className="w-full h-8 px-2 border border-[#E4E1DA] bg-white rounded-md text-xs font-semibold text-[#1C1B1A]"
                  >
                    <option value="JLPT N5">JLPT N5</option>
                    <option value="JLPT N4">JLPT N4</option>
                    <option value="JLPT N3">JLPT N3</option>
                    <option value="JLPT N2">JLPT N2</option>
                    <option value="JLPT N1">JLPT N1</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Pitch Accent Label</label>
                <Input
                  value={formData.pitch}
                  onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                  placeholder="Contoh: ［3］ 中高 (Nakadaka)"
                  className="h-8 border-[#E4E1DA] text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Arti Ringkas *</label>
                <Input
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  placeholder="Contoh: Guru / Pengajar"
                  required
                  className="h-8 border-[#E4E1DA] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Penjelasan Arti Detail (Indonesian)</label>
                <textarea
                  value={formData.meaning_id}
                  onChange={(e) => setFormData({ ...formData, meaning_id: e.target.value })}
                  placeholder="Contoh: Guru, pengajar, atau sebutan hormat untuk dokter."
                  rows={2}
                  className="w-full p-2 border border-[#E4E1DA] rounded-md text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Contoh Kalimat (Japanese)</label>
                <Input
                  value={formData.example_ja}
                  onChange={(e) => setFormData({ ...formData, example_ja: e.target.value })}
                  placeholder="Contoh: 日本語の先生は親切です。"
                  className="h-8 border-[#E4E1DA] text-xs font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1C1B1A]">Arti Contoh Kalimat (Indonesian)</label>
                <Input
                  value={formData.example_id}
                  onChange={(e) => setFormData({ ...formData, example_id: e.target.value })}
                  placeholder="Contoh: Guru bahasa Jepang sangat ramah."
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
                  className="bg-[#2B3A55] hover:bg-[#2B3A55]/90 text-white text-xs h-9 rounded-lg font-semibold"
                >
                  {submitting ? (
                    <RefreshCw className="size-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="size-4 mr-1.5" />
                  )}
                  {editItem ? "Simpan Perubahan" : "Tambah Kosakata"}
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
              <h3 className="text-base font-bold text-[#1C1B1A]">Hapus Kosakata?</h3>
            </div>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Apakah Anda yakin ingin menghapus kata <strong className="text-[#1C1B1A]">{deleteItem.term} ({deleteItem.reading})</strong> dari database?
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
