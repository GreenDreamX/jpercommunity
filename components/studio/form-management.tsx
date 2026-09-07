"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Star,
  RefreshCw,
  Edit3,
  Eye,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Loader2,
  Users,
  MessageSquareHeart,
  Settings2,
  ListFilter,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type QuestionType = "short_text" | "long_text" | "dropdown" | "single_choice" | "rating" | "file_upload"

export type QuestionItem = {
  id?: string
  question_text: string
  question_type: QuestionType
  options: string[]
  placeholder?: string
  is_required: boolean
  order_index: number
}

export type FormResponse = {
  id: string
  form_id: string
  respondent_name: string
  respondent_email?: string | null
  respondent_phone?: string | null
  answers: Record<string, unknown>
  submitted_at: string
}

export type StudioForm = {
  id: string
  slug: string
  title: string
  description?: string | null
  is_published: boolean
  created_at: string
  form_questions: QuestionItem[]
  form_responses: FormResponse[]
  response_count: number
}

interface FormManagementProps {
  token: string
}

export function FormManagement({ token }: FormManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"responses" | "builder">("responses")
  const [forms, setForms] = useState<StudioForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Editor State
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPublished, setFormPublished] = useState(true)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const fetchForms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/studio/forms", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.ok && Array.isArray(data.forms)) {
          setForms(data.forms)
          if (data.forms.length > 0 && !selectedFormId) {
            setSelectedFormId(data.forms[0].id)
          }
        }
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, selectedFormId])

  useEffect(() => {
    void fetchForms()
  }, [fetchForms])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Load Form into Builder Editor
  const handleEditForm = (form: StudioForm) => {
    setEditingFormId(form.id)
    setFormTitle(form.title)
    setFormSlug(form.slug)
    setFormDescription(form.description || "")
    setFormPublished(form.is_published)
    setQuestions(
      form.form_questions.map((q, idx) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        order_index: idx + 1,
      }))
    )
    setActiveSubTab("builder")
  }

  const handleNewForm = () => {
    setEditingFormId(null)
    setFormTitle("")
    setFormSlug("")
    setFormDescription("")
    setFormPublished(true)
    setQuestions([
      {
        question_text: "Kesan dan evaluasi Anda?",
        question_type: "long_text",
        options: [],
        placeholder: "Tuliskan kesan atau umpan balik...",
        is_required: true,
        order_index: 1,
      },
    ])
    setActiveSubTab("builder")
  }

  // Question Modules Handler
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: `Pertanyaan Baru #${prev.length + 1}`,
        question_type: "short_text",
        options: [],
        placeholder: "Ketik jawaban singkat...",
        is_required: true,
        order_index: prev.length + 1,
      },
    ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) return
    const newQuestions = [...questions]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp
    setQuestions(newQuestions)
  }

  const handleUpdateQuestion = (index: number, field: keyof QuestionItem, value: unknown) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      const currentOpts = next[qIndex].options || []
      next[qIndex].options = [...currentOpts, `Opsi ${currentOpts.length + 1}`]
      return next
    })
  }

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev]
      const currentOpts = [...(next[qIndex].options || [])]
      currentOpts[optIndex] = val
      next[qIndex].options = currentOpts
      return next
    })
  }

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      next[qIndex].options = next[qIndex].options.filter((_, i) => i !== optIndex)
      return next
    })
  }

  // Save Form Handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle || !formSlug) {
      showToast("⚠️ Judul Form dan Slug wajib diisi.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFormId || undefined,
          title: formTitle,
          slug: formSlug,
          description: formDescription,
          is_published: formPublished,
          questions,
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        showToast("✨ Formulir berhasil disimpan ke Supabase!")
        void fetchForms()
        setActiveSubTab("responses")
      } else {
        showToast(`⚠️ ${data.message || "Gagal menyimpan formulir."}`)
      }
    } catch {
      showToast("⚠️ Terjadi kesalahan koneksi.")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedForm = forms.find((f) => f.id === selectedFormId) || forms[0]

  return (
    <div className="space-y-6">
      {/* HEADER & TOAST */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E4E1DA] pb-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <FileText className="size-6 text-emerald-600" /> Formulir & Evaluation Builder (GForm)
          </h1>
          <p className="text-xs text-[#6B6862]">
            Kelola formulir evaluasi, buat modul pertanyaan dinamis, dan tinjau respon umpan balik siswa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchForms()}
            className="h-9 text-xs border-[#E4E1DA] font-semibold"
          >
            <RefreshCw className={`size-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleNewForm}
            className="h-9 text-xs bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 font-bold"
          >
            <Plus className="size-3.5 mr-1" /> Buat Form Baru
          </Button>
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center justify-between"
          >
            <span>{toastMsg}</span>
            <span className="text-[10px] font-mono bg-emerald-200 px-2 py-0.5 rounded">Notifikasi</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E4E1DA] pb-2">
        <Button
          type="button"
          variant={activeSubTab === "responses" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("responses")}
          className={`h-9 text-xs font-bold rounded-lg ${activeSubTab === "responses" ? "bg-[#2B3A55] text-white" : "text-[#6B6862]"}`}
        >
          <MessageSquareHeart className="size-4 mr-1.5" /> Respon & Umpan Balik Siswa ({forms.reduce((acc, f) => acc + f.response_count, 0)})
        </Button>

        <Button
          type="button"
          variant={activeSubTab === "builder" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("builder")}
          className={`h-9 text-xs font-bold rounded-lg ${activeSubTab === "builder" ? "bg-[#2B3A55] text-white" : "text-[#6B6862]"}`}
        >
          <Settings2 className="size-4 mr-1.5" /> Form Builder (Modul GForm)
        </Button>
      </div>

      {/* SUB-TAB 1: RESPONSES VIEW */}
      {activeSubTab === "responses" && (
        <div className="space-y-6">
          {forms.length === 0 ? (
            <Card className="border-[#E4E1DA] bg-white p-8 text-center space-y-3">
              <FileText className="size-10 text-[#6B6862]/40 mx-auto" />
              <div className="text-sm font-bold text-[#1C1B1A]">Belum Ada Formulir Terdaftar</div>
              <p className="text-xs text-[#6B6862]">Klik tombol "Buat Form Baru" di atas untuk membuat formulir dinamis pertama Anda.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SIDEBAR: FORMS SELECTOR */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#6B6862] flex items-center gap-1.5">
                  <ListFilter className="size-3.5" /> Pilih Formulir ({forms.length})
                </div>

                <div className="space-y-2">
                  {forms.map((f) => (
                    <Card
                      key={f.id}
                      onClick={() => setSelectedFormId(f.id)}
                      className={`p-4 cursor-pointer transition-all border ${
                        selectedFormId === f.id ? "border-[#2B3A55] bg-[#FAF9F6] shadow-xs" : "border-[#E4E1DA] bg-white hover:border-[#6B6862]/40"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 px-2 py-0.5 rounded">
                            /{f.slug}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.is_published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                            {f.is_published ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#1C1B1A] line-clamp-1">{f.title}</div>
                        <div className="text-[11px] text-[#6B6862] flex items-center justify-between">
                          <span>{f.form_questions.length} Pertanyaan</span>
                          <span className="font-bold text-[#2B3A55]">{f.response_count} Respon</span>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-[#E4E1DA] flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleEditForm(f)
                          }}
                          className="h-6 text-[10px] font-bold text-slate-700 hover:text-[#B23A2E]"
                        >
                          <Edit3 className="size-3 mr-1" /> Edit Form
                        </Button>

                        <a
                          href={`https://forms.jper.my.id/${f.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-[10px] font-bold text-[#2B3A55] hover:underline inline-flex items-center gap-1"
                        >
                          Buka Link <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* MAIN CONTENT: RESPONSES LIST & CARDS */}
              <div className="lg:col-span-2 space-y-4">
                {selectedForm && (
                  <Card className="border-[#E4E1DA] bg-white p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E4E1DA] pb-3 gap-2">
                      <div>
                        <div className="font-mono text-xs text-[#B23A2E] font-bold">forms.jper.my.id/{selectedForm.slug}</div>
                        <h2 className="text-base font-bold text-[#1C1B1A]">{selectedForm.title}</h2>
                      </div>
                      <span className="bg-[#2B3A55] text-white text-xs px-3 py-1 font-mono rounded-md font-bold">
                        {selectedForm.response_count} Total Respon
                      </span>
                    </div>

                    {selectedForm.form_responses.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#6B6862] space-y-1">
                        <MessageSquareHeart className="size-6 text-[#6B6862]/40 mx-auto" />
                        <div>Belum ada siswa yang mendaftar/mengirim respon untuk formulir ini.</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedForm.form_responses.map((resp, rIdx) => (
                          <div key={resp.id || rIdx} className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E4E1DA]/80 pb-2 gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#1C1B1A]">{resp.respondent_name}</span>
                                {resp.respondent_email && (
                                  <span className="text-[#6B6862] font-mono text-[11px]">({resp.respondent_email})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#6B6862] font-mono">
                                {new Date(resp.submitted_at).toLocaleString("id-ID")}
                              </div>
                            </div>

                            {/* ANSWERS BREAKDOWN */}
                            <div className="space-y-2">
                              {selectedForm.form_questions.map((q) => {
                                const ans = resp.answers[q.id || ""] || resp.answers[q.question_text] || "-"
                                return (
                                  <div key={q.id || q.question_text} className="text-xs space-y-0.5">
                                    <div className="font-bold text-[#2B3A55]">{q.question_text}</div>
                                    <div className="text-[#1C1B1A] pl-2 border-l-2 border-[#B23A2E]/30 bg-white p-2 rounded-md">
                                      {q.question_type === "rating" ? (
                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                          {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                              key={s}
                                              className={`size-3.5 ${
                                                s <= Number(ans) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                              }`}
                                            />
                                          ))}
                                          <span className="ml-1 text-[#1C1B1A]">({String(ans)} / 5)</span>
                                        </div>
                                      ) : (
                                        <span>{String(ans)}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: GFORM BUILDER EDITOR */}
      {activeSubTab === "builder" && (
        <form onSubmit={handleSaveForm} className="space-y-6 max-w-4xl">
          {/* FORM META CONFIG */}
          <Card className="border-[#E4E1DA] bg-white p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
              <h2 className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                <Settings2 className="size-4 text-emerald-600" />{" "}
                {editingFormId ? "Edit Konfigurasi Formulir" : "Buat Formulir Dinamis Baru"}
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#6B6862]">Status Publish:</label>
                <button
                  type="button"
                  onClick={() => setFormPublished(!formPublished)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    formPublished ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-slate-100 border-slate-300 text-slate-700"
                  }`}
                >
                  {formPublished ? "Published (Aktif)" : "Draft (Nonaktif)"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#1C1B1A]">Judul Formulir *</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Form Evaluasi Presensi & Kelas Mingguan"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-10 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C1B1A]">Slug URL (forms.jper.my.id/...) *</label>
                <Input
                  type="text"
                  required
                  placeholder="feedback"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-10 font-mono font-bold text-[#B23A2E]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1B1A]">Deskripsi Formulir</label>
              <textarea
                placeholder="Tuliskan petunjuk atau informasi pengisian form untuk siswa..."
                value={formDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-xs p-3 min-h-[70px] text-[#1C1B1A] focus:outline-none focus:border-[#2B3A55]"
              />
            </div>
          </Card>

          {/* QUESTION MODULES LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                <Sparkles className="size-4 text-[#B23A2E]" /> Modul Pertanyaan ({questions.length})
              </h3>

              <Button
                type="button"
                onClick={handleAddQuestion}
                className="h-8 text-xs bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 font-bold rounded-xl"
              >
                <Plus className="size-3.5 mr-1" /> Tambah Pertanyaan
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={idx} className="border-[#E4E1DA] bg-white p-5 rounded-2xl shadow-xs space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-2 text-xs">
                    <span className="font-mono font-bold text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 px-2.5 py-0.5 rounded-md">
                      Modul #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, "up")}
                        className="h-7 w-7 p-0"
                      >
                        <MoveUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, "down")}
                        className="h-7 w-7 p-0"
                      >
                        <MoveDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#6B6862]">Teks Pertanyaan</label>
                      <Input
                        type="text"
                        required
                        value={q.question_text}
                        onChange={(e) => handleUpdateQuestion(idx, "question_text", e.target.value)}
                        placeholder="Contoh: Kesan & pesan sesi latihan ini?"
                        className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-9 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#6B6862]">Jenis Input Modul</label>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleUpdateQuestion(idx, "question_type", e.target.value as QuestionType)}
                        className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-xs h-9 px-2 font-bold text-[#1C1B1A] focus:outline-none"
                      >
                        <option value="short_text">Isian Singkat</option>
                        <option value="long_text">Paragraf / Isian Panjang</option>
                        <option value="dropdown">Dropdown Menu</option>
                        <option value="single_choice">Pilihan Ganda (Radio)</option>
                        <option value="rating">Skala Rating (1-5 Bintang)</option>
                        <option value="file_upload">Unggah Berkas / Dokumen</option>
                      </select>
                    </div>
                  </div>

                  {/* DYNAMIC OPTIONS EDITOR FOR DROPDOWN / SINGLE CHOICE */}
                  {(q.question_type === "dropdown" || q.question_type === "single_choice") && (
                    <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#2B3A55]">
                        <span>Daftar Pilihan / Opsi ({q.options?.length || 0})</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(idx)}
                          className="h-6 text-[10px] font-bold border-[#E4E1DA]"
                        >
                          + Tambah Opsi
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-[#6B6862]">{oIdx + 1}.</span>
                            <Input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                              placeholder={`Pilihan ${oIdx + 1}`}
                              className="bg-white border-[#E4E1DA] text-xs h-8 flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOption(idx, oIdx)}
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#E4E1DA]/60 text-xs">
                    <Input
                      type="text"
                      value={q.placeholder || ""}
                      onChange={(e) => handleUpdateQuestion(idx, "placeholder", e.target.value)}
                      placeholder="Placeholder petunjuk (opsional)..."
                      className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-8 max-w-xs"
                    />

                    <label className="flex items-center gap-2 font-bold text-[#1C1B1A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.is_required}
                        onChange={(e) => handleUpdateQuestion(idx, "is_required", e.target.checked)}
                        className="rounded border-gray-300 text-[#B23A2E] focus:ring-[#B23A2E]"
                      />
                      Wajib Diisi (Required)
                    </label>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E1DA]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveSubTab("responses")}
              className="h-10 text-xs font-bold border-[#E4E1DA]"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-10 text-xs bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 font-bold rounded-xl shadow-xs px-6"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Menyimpan...
                </span>
              ) : (
                "Simpan Formulir ke Supabase ✨"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
